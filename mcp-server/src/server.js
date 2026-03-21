import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { MapStore } from './store.js';

const store = new MapStore();

const server = new McpServer({
  name: 'mapcraft',
  version: '0.3.0',
});

// ──────────────────────────────────────────────
// TOOL: get_guide
// ──────────────────────────────────────────────

server.tool(
  'get_guide',
  'Get the MapCraft usage guide — read this first',
  {},
  async () => ok(`
# MapCraft — Spatial Object Planner

## Core concept
A hierarchical spatial database. All coordinates are in METERS (real-world scale).
Objects are placed into spaces using (x, y, width, height) in meters.
Objects can contain sub-objects — zoom in to design interiors.

## Coordinate system
- x = horizontal (left to right), y = vertical (top to bottom) on the plan view
- These map directly to 3D: plan-x → 3D x, plan-y → 3D z
- Use the SAME scale you'd use in the 3D viewer (meters)

## Workflow
1. init_space — create root space with size in meters
2. place_object — place buildings, roads, etc. with real meter coordinates
3. get_ascii — view the plan (auto-scales to fit terminal, shows scale info)
4. zoom into an object by placing sub-objects inside it (coordinates relative to parent)
5. Repeat: rooms → furniture → details

## ASCII view
get_ascii auto-scales to max 60×30 cells by default. You can set max_cols/max_rows.
A large 200m space at 60 cols → each cell ≈ 3.3m. Zoom into a 10m room → each cell ≈ 0.17m.
This keeps token usage low regardless of world size.

## Tips
- Place structural elements first (walls, stairs), then furniture
- Use check_collision before placing to avoid overlaps
- Object coordinates are RELATIVE to their parent
- Tags help categorize: "building", "room", "furniture", "structural", "door", "outdoor"
`)
);

// ──────────────────────────────────────────────
// TOOL: init_space
// ──────────────────────────────────────────────

server.tool(
  'init_space',
  'Initialize root space. All dimensions in METERS. Clears existing data.',
  {
    name: z.string().describe('Name of the space'),
    width: z.number().min(1).max(10000).describe('Width in meters'),
    height: z.number().min(1).max(10000).describe('Height in meters'),
    description: z.string().optional(),
  },
  async ({ name, width, height, description }) => {
    store.initSpace(name, width, height, description || '');
    return ok(`Space "${name}" initialized: ${width}m × ${height}m`);
  }
);

// ──────────────────────────────────────────────
// TOOL: place_object
// ──────────────────────────────────────────────

server.tool(
  'place_object',
  'Place an object into a space. ALL dimensions in METERS, relative to parent. Objects can be containers (have inner space for sub-objects) or leaves.',
  {
    path: z.string().optional().describe('Parent path (e.g. "building_a/floor_1"). "/" = root'),
    id: z.string().describe('Unique ID within parent'),
    name: z.string().describe('Display name'),
    x: z.number().min(0).describe('X position in meters (relative to parent)'),
    y: z.number().min(0).describe('Y position in meters (relative to parent)'),
    width: z.number().min(0.01).describe('Width in meters'),
    height: z.number().min(0.01).describe('Height in meters'),
    char: z.string().max(1).describe('ASCII character for visualization'),
    is_container: z.boolean().optional().describe('If true, this object can hold sub-objects (default: false)'),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ path, id, name, x, y, width, height, char, is_container, description, tags }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err(`Parent "${path}" not found`);

    if (x + width > parent.width + 0.01 || y + height > parent.height + 0.01) {
      return err(`Object (${x},${y}) ${width}×${height}m exceeds parent bounds ${parent.width}×${parent.height}m`);
    }

    const collisions = store.findCollisions(parent, x, y, width, height);
    if (collisions.length > 0) {
      return err(`Collision with: ${collisions.map(c => `"${c.name}" (${c.id})`).join(', ')}`);
    }

    if (parent.children[id]) {
      return err(`"${id}" already exists. Remove first or pick different id.`);
    }

    parent.children[id] = {
      id, name,
      x, y, width, height,
      char: char || '#',
      description: description || '',
      tags: tags || [],
      children: is_container ? {} : undefined,
    };

    store.save();
    const type = is_container ? 'container' : 'leaf';
    return ok(`Placed "${name}" [${char}] at (${x}, ${y}) ${width}×${height}m (${type})`);
  }
);

// ──────────────────────────────────────────────
// TOOL: remove_object
// ──────────────────────────────────────────────

server.tool(
  'remove_object',
  'Remove an object and all its children by path',
  {
    path: z.string().describe('Full path (e.g. "building_a/floor_1/kitchen")'),
  },
  async ({ path }) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return err('Cannot remove root. Use init_space.');
    const parentPath = parts.slice(0, -1).join('/') || '/';
    const childId = parts[parts.length - 1];
    const parent = store.resolve(parentPath);
    if (!parent) return err(`Parent not found`);
    if (!parent.children[childId]) return err(`"${childId}" not found`);
    delete parent.children[childId];
    store.save();
    return ok(`Removed "${childId}"`);
  }
);

// ──────────────────────────────────────────────
// TOOL: move_object
// ──────────────────────────────────────────────

server.tool(
  'move_object',
  'Move an object to new position within same parent',
  {
    path: z.string(),
    new_x: z.number().min(0),
    new_y: z.number().min(0),
  },
  async ({ path, new_x, new_y }) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return err('Cannot move root');
    const parentPath = parts.slice(0, -1).join('/') || '/';
    const childId = parts[parts.length - 1];
    const parent = store.resolve(parentPath);
    if (!parent) return err('Parent not found');
    const obj = parent.children[childId];
    if (!obj) return err('Object not found');
    if (new_x + obj.width > parent.width || new_y + obj.height > parent.height) return err('Out of bounds');
    const collisions = store.findCollisions(parent, new_x, new_y, obj.width, obj.height, childId);
    if (collisions.length > 0) return err(`Collision: ${collisions.map(c => c.id).join(', ')}`);
    obj.x = new_x;
    obj.y = new_y;
    store.save();
    return ok(`Moved to (${new_x}, ${new_y})`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_objects
// ──────────────────────────────────────────────

server.tool(
  'get_objects',
  'List objects in a space (one level)',
  {
    path: z.string().optional(),
  },
  async ({ path }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');
    const children = Object.values(node.children || {});
    if (children.length === 0) return ok(`"${node.name}" (${node.width}m × ${node.height}m) — empty`);
    const lines = [`"${node.name}" — ${node.width}m × ${node.height}m, ${children.length} objects:\n`];
    for (const c of children) {
      const container = c.children ? `[container, ${Object.keys(c.children).length} children]` : '[leaf]';
      const tags = c.tags?.length > 0 ? ` tags:[${c.tags.join(',')}]` : '';
      lines.push(`  [${c.char}] ${c.id} "${c.name}" at (${c.x},${c.y}) ${c.width}×${c.height}m ${container}${tags}`);
    }
    return ok(lines.join('\n'));
  }
);

// ──────────────────────────────────────────────
// TOOL: check_collision
// ──────────────────────────────────────────────

server.tool(
  'check_collision',
  'Check if a rectangular area (in meters) collides with existing objects',
  {
    path: z.string().optional(),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(0.01),
    height: z.number().min(0.01),
  },
  async ({ path, x, y, width, height }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err('Not found');
    if (x + width > parent.width || y + height > parent.height) return err('Exceeds bounds');
    const collisions = store.findCollisions(parent, x, y, width, height);
    if (collisions.length === 0) return ok(`Area (${x},${y}) ${width}×${height}m is FREE`);
    return ok(`COLLISION with: ${collisions.map(c => `[${c.char}] "${c.name}" at (${c.x},${c.y}) ${c.width}×${c.height}m`).join(', ')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_ascii
// ──────────────────────────────────────────────

server.tool(
  'get_ascii',
  'ASCII visualization of a space. Auto-scales to fit max_cols × max_rows. Each cell represents N meters depending on zoom level.',
  {
    path: z.string().optional().describe('Path to visualize. "/" = root'),
    max_cols: z.number().int().min(10).max(120).optional().describe('Max columns (default: 60)'),
    max_rows: z.number().int().min(5).max(60).optional().describe('Max rows (default: 30)'),
  },
  async ({ path, max_cols, max_rows }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');

    const { ascii, legend, scaleInfo } = store.renderAscii(node, max_cols || 60, max_rows || 30);

    const lines = [`=== ${node.name} ===`, scaleInfo, ''];

    for (let r = 0; r < ascii.length; r++) {
      lines.push(ascii[r]);
    }

    if (legend.length > 0) {
      lines.push('');
      for (const l of legend) {
        lines.push(`[${l.char}] ${l.id} — "${l.name}"`);
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
  'Detailed info about an object',
  {
    path: z.string(),
  },
  async ({ path }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');
    const children = Object.values(node.children || {});
    const lines = [
      `Name: ${node.name}`,
      `Position: (${node.x}, ${node.y})`,
      `Size: ${node.width}m × ${node.height}m`,
      `Char: [${node.char}]`,
      `Type: ${node.children ? 'container' : 'leaf'}`,
      `Description: ${node.description || '(none)'}`,
      `Tags: ${(node.tags || []).join(', ') || '(none)'}`,
      `Children: ${children.length}`,
    ];
    return ok(lines.join('\n'));
  }
);

// ──────────────────────────────────────────────
// TOOL: update_object
// ──────────────────────────────────────────────

server.tool(
  'update_object',
  'Update properties of an existing object (name, description, char, tags)',
  {
    path: z.string(),
    name: z.string().optional(),
    char: z.string().max(1).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ path, name, char, description, tags }) => {
    const node = store.resolve(path);
    if (!node || node === store.root) return err('Not found or cannot update root');
    if (name !== undefined) node.name = name;
    if (char !== undefined) node.char = char;
    if (description !== undefined) node.description = description;
    if (tags !== undefined) node.tags = tags;
    store.save();
    return ok(`Updated "${node.name}"`);
  }
);

// ──────────────────────────────────────────────
// TOOL: export_json
// ──────────────────────────────────────────────

server.tool(
  'export_json',
  'Export entire map as JSON',
  {},
  async () => ok(JSON.stringify(store.exportJSON(), null, 2))
);

// ──────────────────────────────────────────────

function ok(text) { return { content: [{ type: 'text', text }] }; }
function err(text) { return { content: [{ type: 'text', text: `ERROR: ${text}` }], isError: true }; }

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MapCraft MCP v0.3 running');
}

main().catch(console.error);
