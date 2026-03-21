import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { MapStore } from './store.js';

const store = new MapStore();

const server = new McpServer({
  name: 'mapcraft',
  version: '0.4.0',
});

// ──────────────────────────────────────────────
// TOOL: get_guide
// ──────────────────────────────────────────────

server.tool(
  'get_guide',
  'Get the MapCraft usage guide',
  {},
  async () => ok(`
# MapCraft v0.4 — Spatial Object Planner

## Core concept
Hierarchical spatial database. All coordinates in METERS.
Objects can overlap freely — collision is advisory only (use check_collision when needed).

## Coordinate system
x = left→right, y = top→bottom on plan. Maps to 3D: plan-x → 3D x, plan-y → 3D z.

## Overlapping is OK
- Multiple floors at the same position? Fine — name them "prizemi", "patro_2", etc.
- Door on the boundary of a room? Fine — doors are just markers.
- Carpet under a table? Fine — they coexist.
- Use check_collision only when you WANT to verify (e.g. "will these two rooms fit side by side?").

## Metadata
Every object can carry arbitrary key-value metadata for 3D generation:
- Doors: { style: "sliding", connects: ["obyvak", "terasa"] }
- Windows: { sill_height: 0.8, win_height: 1.5, type: "panorama" }
- Furniture: { material: "wood", color: "#8a7050" }
- Stairs: see Stairs section below

## Workflow — plan EVERYTHING before generating 3D
1. init_space — root space in meters
2. place_object / place_objects — buildings, floors, rooms (overlaps allowed)
3. **VERIFY rooms**: check_collision(exclude_tags=["door","window","furniture"]) to catch room overlaps
4. Place doors and windows ON wall lines (as markers with metadata)
5. **Place furniture** in MCP too — at least major pieces (counters, tables, beds, sofas, appliances). This is your spatial memory — if you skip this and place furniture only in 3D code, you WILL put a fridge in front of a door or a bed blocking a window.
6. **VERIFY furniture vs doors/windows**: visually check get_ascii or floorplan to ensure no furniture blocks doorways or covers windows
7. Only THEN generate 3D code, using MCP positions directly

## Collision verification rules
- Rooms ("room" tag) must NOT overlap with other rooms on the same floor
- Structural elements ("structural" — stairs, hallways) must NOT overlap with rooms
- Doors, windows, furniture CAN overlap with anything — they are markers/contents
- After each batch of room placements, verify with: check_collision(exclude_tags=["door","window","furniture"])

## Where to place doors vs windows
- **Windows** → INSIDE the room container they belong to. You need to see them when planning furniture.
- **Doors** → at the FLOOR/APARTMENT level (parent of rooms). Doors sit between two rooms, they don't belong to either one.

This way:
- get_ascii on a room shows windows + furniture → you can verify TV is not in front of a window
- get_ascii on the floor/apartment shows rooms + doors → you can verify all rooms are accessible
- No duplication needed

Example:
  byt/
    d_chodba_obyvak  (door between chodba and obyvak — at apartment level)
    d_chodba_loznice (door — at apartment level)
    obyvak/          (container)
      w_south        (window — inside room, relative coords)
      w_west         (window — inside room)
      pohovka        (furniture — you SEE it's not blocking the window!)
      tv             (furniture)
    loznice/         (container)
      w_north        (window — inside room)
      postel         (furniture)

## Furniture placement rules
- Furniture must NOT block doors — check that no furniture rectangle overlaps a door rectangle
- Furniture must NOT cover windows — leave wall-adjacent space clear where windows are
- Place at least: kitchen counter+appliances, tables, beds, sofas, desks, wardrobes
- Small items (chairs, lamps, decorations) can be added directly in 3D code
- ALWAYS run get_ascii on each room to verify layout — you should see doors, windows AND furniture together

## Stairs — plan entry and exit points explicitly
Stairs are the hardest element to get right. DO NOT just place a box with "direction: south".
Instead, plan stairs as a CONTAINER with explicit entry/exit points:

### How to plan stairs in MCP:
Place a container for the stairwell, then inside it place:
1. **entry** — where the player enters from the lower floor (a door-like marker)
2. **exit** — where the player exits onto the upper floor (a door-like marker)
3. Optionally: **landing** — the mid-point turn platform

Example for a U-turn stairwell (3×5m, going up from north to south and back):
\`\`\`
place_objects(path="building/prizemi/schody", objects=[
  { id: "entry", x: 0.5, y: 0, width: 2, height: 0.3, char: "E",
    tags: ["stair_entry"], metadata: {"side": "north", "floor_y": 0} },
  { id: "flight1", x: 0.3, y: 0.5, width: 2.4, height: 2, char: "|",
    tags: ["stair_flight"], metadata: {"direction": "south", "rise": 1.5} },
  { id: "landing", x: 0.3, y: 2.8, width: 2.4, height: 1, char: "_",
    tags: ["stair_landing"], metadata: {"floor_y": 1.5} },
  { id: "flight2", x: 0.3, y: 2.5, width: 2.4, height: 2, char: "|",
    tags: ["stair_flight"], metadata: {"direction": "north", "rise": 1.5} },
  { id: "exit", x: 0.5, y: 0, width: 2, height: 0.3, char: "X",
    tags: ["stair_exit"], metadata: {"side": "north", "floor_y": 3.0} }
])
\`\`\`

### Key rules:
- Entry and exit positions must match door positions on the stairwell walls
- Entry is at the lower floor level, exit at the upper floor level
- Both entry and exit should be accessible from the hallway/corridor
- For U-turn stairs: entry and exit are on the SAME side (player goes down, turns, comes back)
- For straight stairs: entry and exit are on OPPOSITE sides
- The 3D generator reads entry/exit positions and builds flights between them

### 3D generation reads these markers to:
- Build flight 1 from entry toward landing
- Build landing platform
- Build flight 2 from landing toward exit
- Place railings along flights
- Ensure the stair geometry actually connects the two floor levels

## 3D code conventions
- In 3D code, ALWAYS reference MCP objects with comments: // mcp:path (x, y) WxH
- Use relative coordinates per room: const rx = mcpRoomX, rz = mcpRoomY; then rx + localX
- This makes rooms movable — change MCP + update rx,rz → furniture follows automatically

## 3D generation notes for doors and windows
- Doors and windows require REAL OPENINGS in walls (for player walkthrough / visibility)
- In 3D: use wallWithOpenings() to create holes, then addWindow/addDoor for visuals
- Door metadata should include: style (hinged/sliding/open), direction, connects
- Window metadata should include: sill_height, win_height, type (fixed/panorama)
- Always place doors/windows ON the wall line (x or y matching the wall position)
`)
);

// ──────────────────────────────────────────────
// TOOL: init_space
// ──────────────────────────────────────────────

server.tool(
  'init_space',
  'Initialize root space in METERS. Clears existing data.',
  {
    name: z.string(),
    width: z.number().min(1).max(10000),
    height: z.number().min(1).max(10000),
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
  'Place an object. All dimensions in METERS relative to parent. Overlaps are allowed — no collision enforcement. Use metadata for 3D-relevant properties (direction, style, material, etc).',
  {
    path: z.string().optional().describe('Parent path. "/" = root'),
    id: z.string().describe('Unique ID within parent'),
    name: z.string(),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(0.01),
    height: z.number().min(0.01),
    char: z.string().max(1),
    is_container: z.boolean().optional().describe('Can hold sub-objects (default: false)'),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.string().optional().describe('JSON string of key-value data for 3D generation, e.g. {"direction":"south","style":"sliding"}'),
  },
  async ({ path, id, name, x, y, width, height, char, is_container, description, tags, metadata }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err(`Parent "${path}" not found`);

    if (parent.children[id]) {
      return err(`"${id}" already exists. Remove first or pick different id.`);
    }

    const meta = parseMeta(metadata);

    parent.children[id] = {
      id, name,
      x, y, width, height,
      char: char || '#',
      description: description || '',
      tags: tags || [],
      metadata: meta,
      children: is_container ? {} : undefined,
    };

    store.save();
    const type = is_container ? 'container' : 'leaf';
    return ok(`Placed "${name}" [${char}] at (${x},${y}) ${width}×${height}m (${type})${metadata ? ' +metadata' : ''}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: remove_object
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// TOOL: place_objects (batch)
// ──────────────────────────────────────────────

server.tool(
  'place_objects',
  'Place multiple objects at once (batch). Same params as place_object but as an array. Saves tokens by avoiding multiple round-trips.',
  {
    path: z.string().optional().describe('Parent path for ALL objects. "/" = root'),
    objects: z.array(z.object({
      id: z.string(),
      name: z.string(),
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().min(0.01),
      height: z.number().min(0.01),
      char: z.string().max(1),
      is_container: z.boolean().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      metadata: z.string().optional(),
    })).describe('Array of objects to place'),
  },
  async ({ path, objects }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err(`Parent "${path}" not found`);

    const results = [];
    for (const o of objects) {
      if (parent.children[o.id]) {
        results.push(`SKIP "${o.id}" — already exists`);
        continue;
      }
      parent.children[o.id] = {
        id: o.id, name: o.name,
        x: o.x, y: o.y, width: o.width, height: o.height,
        char: o.char || '#',
        description: o.description || '',
        tags: o.tags || [],
        metadata: parseMeta(o.metadata),
        children: o.is_container ? {} : undefined,
      };
      const type = o.is_container ? '+' : '·';
      const meta = o.metadata ? ' {…}' : '';
      results.push(`${type} [${o.char}] ${o.id} at (${o.x},${o.y}) ${o.width}×${o.height}m${meta}`);
    }

    store.save();
    return ok(`Placed ${results.length} objects:\n${results.join('\n')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: remove_object
// ──────────────────────────────────────────────

server.tool(
  'remove_object',
  'Remove an object and all its children',
  { path: z.string() },
  async ({ path }) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return err('Cannot remove root. Use init_space.');
    const parentPath = parts.slice(0, -1).join('/') || '/';
    const childId = parts[parts.length - 1];
    const parent = store.resolve(parentPath);
    if (!parent) return err('Parent not found');
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
    if (!obj) return err('Not found');
    obj.x = new_x;
    obj.y = new_y;
    store.save();
    return ok(`Moved "${obj.name}" to (${new_x}, ${new_y})`);
  }
);

// ──────────────────────────────────────────────
// TOOL: update_object
// ──────────────────────────────────────────────

server.tool(
  'update_object',
  'Update ANY properties of an existing object — position, size, name, char, tags, metadata. Only provided fields are changed. Children are preserved.',
  {
    path: z.string(),
    x: z.number().min(0).optional(),
    y: z.number().min(0).optional(),
    width: z.number().min(0.01).optional(),
    height: z.number().min(0.01).optional(),
    name: z.string().optional(),
    char: z.string().max(1).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.string().optional().describe('Merged with existing metadata'),
  },
  async ({ path, x, y, width, height, name, char, description, tags, metadata }) => {
    const node = store.resolve(path);
    if (!node || node === store.root) return err('Not found or root');
    if (x !== undefined) node.x = x;
    if (y !== undefined) node.y = y;
    if (width !== undefined) node.width = width;
    if (height !== undefined) node.height = height;
    if (name !== undefined) node.name = name;
    if (char !== undefined) node.char = char;
    if (description !== undefined) node.description = description;
    if (tags !== undefined) node.tags = tags;
    if (metadata) node.metadata = { ...(node.metadata || {}), ...parseMeta(metadata) };
    store.save();
    const pos = `(${node.x},${node.y}) ${node.width}×${node.height}m`;
    return ok(`Updated "${node.name}" → ${pos}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_objects
// ──────────────────────────────────────────────

server.tool(
  'get_objects',
  'List objects in a space. Optionally filter by tag.',
  {
    path: z.string().optional(),
    tag: z.string().optional().describe('Filter: only show objects with this tag'),
  },
  async ({ path, tag }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');
    let children = Object.values(node.children || {});
    if (tag) children = children.filter(c => (c.tags || []).includes(tag));
    if (children.length === 0) return ok(`"${node.name}" (${node.width}m × ${node.height}m) — ${tag ? 'no objects with tag "' + tag + '"' : 'empty'}`);
    const lines = [`"${node.name}" — ${node.width}m × ${node.height}m, ${children.length} objects:\n`];
    for (const c of children) {
      const container = c.children ? `[+${Object.keys(c.children).length}]` : '';
      const tags = c.tags?.length ? ` [${c.tags.join(',')}]` : '';
      const meta = c.metadata && Object.keys(c.metadata).length ? ` {${Object.entries(c.metadata).map(([k,v]) => `${k}:${JSON.stringify(v)}`).join(', ')}}` : '';
      lines.push(`  [${c.char}] ${c.id} "${c.name}" (${c.x},${c.y}) ${c.width}×${c.height}m${container}${tags}${meta}`);
    }
    return ok(lines.join('\n'));
  }
);

// ──────────────────────────────────────────────
// TOOL: check_collision
// ──────────────────────────────────────────────

server.tool(
  'check_collision',
  'Advisory check: does a rectangle overlap with existing objects? Does NOT block placement.',
  {
    path: z.string().optional(),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(0.01),
    height: z.number().min(0.01),
    exclude_tags: z.array(z.string()).optional().describe('Ignore objects with these tags (e.g. ["door","window"])'),
  },
  async ({ path, x, y, width, height, exclude_tags }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err('Not found');
    let collisions = store.findCollisions(parent, x, y, width, height);
    if (exclude_tags?.length) {
      collisions = collisions.filter(c => !(c.tags || []).some(t => exclude_tags.includes(t)));
    }
    if (collisions.length === 0) return ok(`Area (${x},${y}) ${width}×${height}m is FREE`);
    return ok(`Overlaps with: ${collisions.map(c => `[${c.char}] "${c.name}" (${c.x},${c.y}) ${c.width}×${c.height}m`).join(', ')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_ascii
// ──────────────────────────────────────────────

server.tool(
  'get_ascii',
  'ASCII visualization. Auto-scales to fit. Use recursive=true to show all nested objects (windows, furniture inside rooms).',
  {
    path: z.string().optional(),
    max_cols: z.number().int().min(10).max(120).optional(),
    max_rows: z.number().int().min(5).max(60).optional(),
    recursive: z.boolean().optional().describe('Show all nested objects (children of children, etc). Default: false — only direct children.'),
    tag: z.string().optional().describe('Only show objects with this tag'),
  },
  async ({ path, max_cols, max_rows, recursive, tag }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');

    // If tag filter, temporarily filter children
    let originalChildren;
    if (tag && node.children) {
      originalChildren = node.children;
      const filtered = {};
      for (const [k, v] of Object.entries(node.children)) {
        if ((v.tags || []).includes(tag)) filtered[k] = v;
      }
      node.children = filtered;
    }

    const { ascii, legend, scaleInfo } = store.renderAscii(node, max_cols || 60, max_rows || 30, recursive || false);

    if (originalChildren) node.children = originalChildren;

    const lines = [`=== ${node.name} ===`, scaleInfo, ''];
    for (const row of ascii) lines.push(row);
    if (legend.length > 0) {
      lines.push('');
      for (const l of legend) lines.push(`[${l.char}] ${l.id} — "${l.name}"`);
    }
    return ok(lines.join('\n'));
  }
);

// ──────────────────────────────────────────────
// TOOL: get_info
// ──────────────────────────────────────────────

server.tool(
  'get_info',
  'Detailed info about an object including metadata',
  { path: z.string() },
  async ({ path }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');
    const children = Object.values(node.children || {});
    const meta = node.metadata && Object.keys(node.metadata).length
      ? Object.entries(node.metadata).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')
      : '  (none)';
    return ok([
      `Name: ${node.name}`,
      `Position: (${node.x}, ${node.y})`,
      `Size: ${node.width}m × ${node.height}m`,
      `Char: [${node.char}]`,
      `Type: ${node.children ? 'container' : 'leaf'}`,
      `Description: ${node.description || '(none)'}`,
      `Tags: ${(node.tags || []).join(', ') || '(none)'}`,
      `Metadata:\n${meta}`,
      `Children: ${children.length}`,
    ].join('\n'));
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
function parseMeta(s) {
  if (!s) return {};
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch { return {}; }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MapCraft MCP v0.4 running');
}

main().catch(console.error);
