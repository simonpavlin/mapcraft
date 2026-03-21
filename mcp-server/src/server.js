import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { MapStore } from './store.js';

const store = new MapStore();

const server = new McpServer({
  name: 'mapcraft',
  version: '0.2.0',
});

// ──────────────────────────────────────────────
// RESOURCE: usage guide
// ──────────────────────────────────────────────

server.tool(
  'get_guide',
  'Get the MapCraft usage guide — read this first before using any other tools',
  {},
  async () => ({
    content: [{
      type: 'text',
      text: `
# MapCraft — Architecture-First Map Builder

## Philosophy
Work like an architect: top-down, layer by layer.
1. **init_space** — create the root space (your "site plan"), define its grid size
2. **place_object** — place buildings, roads, parks on the site plan
3. **zoom_into** — enter a building to design its interior
4. **place_object** — inside the building, place floors (floor_0, floor_1, ...)
5. **zoom_into** — enter a floor to lay out rooms
6. **place_object** — place rooms (kitchen, bedroom, bathroom, hallway, stairwell)
7. **zoom_into** — enter a room to place furniture
8. **place_object** — place table, chairs, bed, sink, etc.

## Grid System
Every space has a 2D grid (width × height cells). Objects occupy rectangular areas.
Each object has an ASCII character for visualization. Use get_ascii to see the layout.

## Floors / Levels
Floors are just objects inside a building. Give them names like "floor_0", "floor_1".
Each floor has its own grid where you place rooms and corridors.

## ASCII Characters
Pick meaningful characters: '#' for walls, '.' for floor, 'T' for table, 'B' for bed,
'S' for stairs, 'K' for kitchen counter, 'D' for door, 'W' for window, etc.

## Collision Checking
Use check_collision before placing to verify the area is free.
Use get_objects to see what's already placed in the current space.

## Workflow Tips
- Always check the current state with get_ascii before placing new objects
- Use check_collision to verify placement before committing
- Name objects descriptively (e.g. "north_stairwell", "master_bedroom")
- Work floor by floor, room by room
- Place structural elements first (walls, stairs), then furniture
`,
    }],
  })
);

// ──────────────────────────────────────────────
// TOOL: init_space
// ──────────────────────────────────────────────

server.tool(
  'init_space',
  'Initialize the root space (site plan). This clears any existing data. Define the grid size and a name.',
  {
    name: z.string().describe('Name of the space (e.g. "city_block", "campus")'),
    width: z.number().int().min(1).max(500).describe('Grid width in cells'),
    height: z.number().int().min(1).max(500).describe('Grid height in cells'),
    cell_size: z.number().optional().describe('Real-world size of each cell in meters (default: 1)'),
    description: z.string().optional().describe('Description of the space'),
  },
  async ({ name, width, height, cell_size, description }) => {
    store.initSpace(name, width, height, cell_size || 1, description || '');
    return ok(`Space "${name}" initialized (${width}×${height} grid, ${cell_size || 1}m/cell)`);
  }
);

// ──────────────────────────────────────────────
// TOOL: place_object
// ──────────────────────────────────────────────

server.tool(
  'place_object',
  'Place a named object into the current space (or into a specific parent via path). Objects occupy a rectangular area on the grid. They can later be zoomed into to add sub-objects. Always run check_collision first.',
  {
    path: z.string().optional().describe('Path to parent object (e.g. "building_a/floor_1"). Empty or "/" = root space'),
    id: z.string().describe('Unique ID for this object within its parent (e.g. "building_a", "floor_2", "kitchen")'),
    name: z.string().describe('Display name (e.g. "Main Building", "2nd Floor", "Kitchen")'),
    x: z.number().int().min(0).describe('Left column on parent grid'),
    y: z.number().int().min(0).describe('Top row on parent grid'),
    width: z.number().int().min(1).describe('Width in cells'),
    height: z.number().int().min(1).describe('Height in cells'),
    char: z.string().max(1).describe('ASCII character to represent this object on the grid (e.g. "#", "B", "T")'),
    inner_width: z.number().int().min(1).max(500).optional().describe('Grid width for the inside of this object (if it should be zoomable). Omit for leaf objects like furniture.'),
    inner_height: z.number().int().min(1).max(500).optional().describe('Grid height for the inside of this object (if it should be zoomable). Omit for leaf objects like furniture.'),
    inner_cell_size: z.number().optional().describe('Cell size in meters for inner grid (default: parent cell_size / 2)'),
    description: z.string().optional().describe('Description of the object'),
    tags: z.array(z.string()).optional().describe('Tags for categorization (e.g. ["structural", "furniture", "room"])'),
  },
  async ({ path, id, name, x, y, width, height, char, inner_width, inner_height, inner_cell_size, description, tags }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err(`Parent path "${path}" not found`);

    // Bounds check
    if (x + width > parent.grid.width || y + height > parent.grid.height) {
      return err(`Object (${x},${y} ${width}×${height}) exceeds parent grid (${parent.grid.width}×${parent.grid.height})`);
    }

    // Collision check
    const collisions = store.findCollisions(parent, x, y, width, height);
    if (collisions.length > 0) {
      const names = collisions.map(c => `"${c.name}" (${c.id})`).join(', ');
      return err(`Collision with: ${names}. Use check_collision first or choose a different position.`);
    }

    if (parent.children[id]) {
      return err(`Object "${id}" already exists in this space. Use remove_object first or pick a different id.`);
    }

    const obj = {
      id,
      name,
      x, y, width, height,
      char: char || '#',
      description: description || '',
      tags: tags || [],
      children: {},
      grid: null,
    };

    if (inner_width && inner_height) {
      obj.grid = {
        width: inner_width,
        height: inner_height,
        cell_size: inner_cell_size || (parent.grid.cell_size / 2),
      };
    }

    parent.children[id] = obj;
    store.save();

    const zoomable = obj.grid ? ` (zoomable: ${inner_width}×${inner_height} inner grid)` : ' (leaf object)';
    return ok(`Placed "${name}" [${char}] at (${x},${y}) size ${width}×${height}${zoomable}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: remove_object
// ──────────────────────────────────────────────

server.tool(
  'remove_object',
  'Remove an object (and all its children) by path',
  {
    path: z.string().describe('Full path to the object (e.g. "building_a/floor_1/kitchen")'),
  },
  async ({ path }) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return err('Cannot remove root space. Use init_space to reset.');

    const parentPath = parts.slice(0, -1).join('/') || '/';
    const childId = parts[parts.length - 1];

    const parent = store.resolve(parentPath);
    if (!parent) return err(`Parent "${parentPath}" not found`);
    if (!parent.children[childId]) return err(`Object "${childId}" not found in "${parentPath}"`);

    const removed = parent.children[childId];
    delete parent.children[childId];
    store.save();

    const childCount = countDescendants(removed);
    return ok(`Removed "${removed.name}" (${childId})${childCount > 0 ? ` and ${childCount} sub-objects` : ''}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: move_object
// ──────────────────────────────────────────────

server.tool(
  'move_object',
  'Move an existing object to a new position within the same parent',
  {
    path: z.string().describe('Full path to the object (e.g. "building_a/floor_1/table")'),
    new_x: z.number().int().min(0).describe('New left column'),
    new_y: z.number().int().min(0).describe('New top row'),
  },
  async ({ path, new_x, new_y }) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return err('Cannot move root');

    const parentPath = parts.slice(0, -1).join('/') || '/';
    const childId = parts[parts.length - 1];

    const parent = store.resolve(parentPath);
    if (!parent) return err(`Parent "${parentPath}" not found`);
    const obj = parent.children[childId];
    if (!obj) return err(`Object "${childId}" not found`);

    if (new_x + obj.width > parent.grid.width || new_y + obj.height > parent.grid.height) {
      return err(`New position out of bounds`);
    }

    const collisions = store.findCollisions(parent, new_x, new_y, obj.width, obj.height, childId);
    if (collisions.length > 0) {
      return err(`Collision with: ${collisions.map(c => c.id).join(', ')}`);
    }

    obj.x = new_x;
    obj.y = new_y;
    store.save();
    return ok(`Moved "${obj.name}" to (${new_x}, ${new_y})`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_objects
// ──────────────────────────────────────────────

server.tool(
  'get_objects',
  'List all objects in a space or inside a specific object (one level deep)',
  {
    path: z.string().optional().describe('Path to inspect (e.g. "building_a/floor_1"). "/" or empty = root'),
  },
  async ({ path }) => {
    const node = store.resolve(path || '/');
    if (!node) return err(`Path "${path}" not found`);

    const grid = node.grid;
    const children = Object.values(node.children);

    if (children.length === 0) {
      return ok(`"${node.name}" (${grid.width}×${grid.height} grid, ${grid.cell_size}m/cell) — empty, no objects placed yet`);
    }

    const lines = [
      `"${node.name}" — ${grid.width}×${grid.height} grid, ${grid.cell_size}m/cell`,
      `${children.length} object(s):`,
      '',
    ];

    for (const c of children) {
      const zoomable = c.grid ? `[zoomable ${c.grid.width}×${c.grid.height}]` : '[leaf]';
      const tags = c.tags.length > 0 ? ` tags:[${c.tags.join(',')}]` : '';
      lines.push(`  [${c.char}] ${c.id} "${c.name}" at (${c.x},${c.y}) ${c.width}×${c.height} ${zoomable}${tags}`);
      if (c.description) lines.push(`      ${c.description}`);
    }

    return ok(lines.join('\n'));
  }
);

// ──────────────────────────────────────────────
// TOOL: check_collision
// ──────────────────────────────────────────────

server.tool(
  'check_collision',
  'Check if a rectangular area collides with any existing objects in a space. Use before place_object.',
  {
    path: z.string().optional().describe('Path to parent space. "/" or empty = root'),
    x: z.number().int().min(0).describe('Left column'),
    y: z.number().int().min(0).describe('Top row'),
    width: z.number().int().min(1).describe('Width in cells'),
    height: z.number().int().min(1).describe('Height in cells'),
  },
  async ({ path, x, y, width, height }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err(`Path "${path}" not found`);

    if (x + width > parent.grid.width || y + height > parent.grid.height) {
      return err(`Area (${x},${y} ${width}×${height}) exceeds grid bounds (${parent.grid.width}×${parent.grid.height})`);
    }

    const collisions = store.findCollisions(parent, x, y, width, height);

    if (collisions.length === 0) {
      return ok(`Area (${x},${y}) ${width}×${height} is FREE — no collisions`);
    }

    const lines = [`COLLISION — ${collisions.length} object(s) overlap:`];
    for (const c of collisions) {
      lines.push(`  [${c.char}] "${c.name}" (${c.id}) at (${c.x},${c.y}) ${c.width}×${c.height}`);
    }
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ──────────────────────────────────────────────
// TOOL: get_ascii
// ──────────────────────────────────────────────

server.tool(
  'get_ascii',
  'Get an ASCII grid visualization of a space or object interior. Shows placed objects as their ASCII characters, empty cells as "."',
  {
    path: z.string().optional().describe('Path to visualize. "/" or empty = root'),
    show_legend: z.boolean().optional().describe('Show legend below the grid (default: true)'),
  },
  async ({ path, show_legend }) => {
    const node = store.resolve(path || '/');
    if (!node) return err(`Path "${path}" not found`);

    const grid = node.grid;
    if (!grid) return err(`"${node.name}" is a leaf object — no inner grid to visualize`);

    const { ascii, legend } = store.renderAscii(node);

    const lines = [
      `=== ${node.name} === (${grid.width}×${grid.height}, ${grid.cell_size}m/cell)`,
      '',
    ];

    // Column numbers header
    if (grid.width <= 80) {
      const tens = Array.from({ length: grid.width }, (_, i) => i >= 10 ? Math.floor(i / 10).toString() : ' ').join('');
      const ones = Array.from({ length: grid.width }, (_, i) => (i % 10).toString()).join('');
      lines.push('    ' + tens);
      lines.push('    ' + ones);
    }

    for (let row = 0; row < grid.height; row++) {
      const rowLabel = row.toString().padStart(3, ' ');
      lines.push(`${rowLabel} ${ascii[row]}`);
    }

    if (show_legend !== false && legend.length > 0) {
      lines.push('');
      lines.push('Legend:');
      for (const entry of legend) {
        lines.push(`  [${entry.char}] ${entry.id} — "${entry.name}"`);
      }
    }

    return ok(lines.join('\n'));
  }
);

// ──────────────────────────────────────────────
// TOOL: get_info
// ──────────────────────────────────────────────

server.tool(
  'get_info',
  'Get detailed info about a specific object, including its path, size, tags, description, and children summary',
  {
    path: z.string().describe('Path to the object (e.g. "building_a/floor_1")'),
  },
  async ({ path }) => {
    const node = store.resolve(path || '/');
    if (!node) return err(`Path "${path}" not found`);

    const children = Object.values(node.children);
    const lines = [
      `Name: ${node.name}`,
      `Path: ${path || '/'}`,
      `Position: (${node.x ?? '-'}, ${node.y ?? '-'})`,
      `Size: ${node.width ?? '-'}×${node.height ?? '-'} cells`,
      `Char: [${node.char ?? '-'}]`,
      `Description: ${node.description || '(none)'}`,
      `Tags: ${(node.tags || []).join(', ') || '(none)'}`,
    ];

    if (node.grid) {
      lines.push(`Inner grid: ${node.grid.width}×${node.grid.height} (${node.grid.cell_size}m/cell)`);
      lines.push(`Children: ${children.length}`);
      if (children.length > 0) {
        for (const c of children) {
          lines.push(`  - ${c.id} "${c.name}" [${c.char}]`);
        }
      }
    } else {
      lines.push('Leaf object (no inner grid)');
    }

    const desc = countDescendants(node);
    if (desc > 0) lines.push(`Total descendants: ${desc}`);

    return ok(lines.join('\n'));
  }
);

// ──────────────────────────────────────────────
// TOOL: update_object
// ──────────────────────────────────────────────

server.tool(
  'update_object',
  'Update properties of an existing object (name, description, char, tags). Does not change position or size — use move_object for that.',
  {
    path: z.string().describe('Path to the object'),
    name: z.string().optional().describe('New display name'),
    char: z.string().max(1).optional().describe('New ASCII character'),
    description: z.string().optional().describe('New description'),
    tags: z.array(z.string()).optional().describe('New tags (replaces existing)'),
  },
  async ({ path, name, char, description, tags }) => {
    const node = store.resolve(path);
    if (!node) return err(`Path "${path}" not found`);
    if (node === store.root) return err('Cannot update root via this tool. Use init_space.');

    if (name !== undefined) node.name = name;
    if (char !== undefined) node.char = char;
    if (description !== undefined) node.description = description;
    if (tags !== undefined) node.tags = tags;

    store.save();
    return ok(`Updated "${node.name}" at ${path}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: export_json
// ──────────────────────────────────────────────

server.tool(
  'export_json',
  'Export the entire map data as JSON (for use by the 3D viewer or other tools)',
  {},
  async () => {
    const data = store.exportJSON();
    return ok(JSON.stringify(data, null, 2));
  }
);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function ok(text) {
  return { content: [{ type: 'text', text }] };
}

function err(text) {
  return { content: [{ type: 'text', text: `ERROR: ${text}` }], isError: true };
}

function countDescendants(node) {
  let count = 0;
  for (const child of Object.values(node.children || {})) {
    count += 1 + countDescendants(child);
  }
  return count;
}

// ──────────────────────────────────────────────
// Start
// ──────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MapCraft MCP server v0.2 running on stdio');
}

main().catch(console.error);
