import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { MapStore, normalizeId } from './store.js';

const store = new MapStore();

const server = new McpServer({
  name: 'mapcraft',
  version: '0.7.0',
});

// ──────────────────────────────────────────────
// TOOL: get_guide
// ──────────────────────────────────────────────

server.tool(
  'get_guide',
  'Get the MapCraft usage guide',
  {},
  async () => ok(`
# MapCraft v0.7 — Spatial Object Planner

## Core concept
Hierarchical spatial database with unified node model. All coordinates in METERS.
Every node can have children. Objects can overlap freely — collision is advisory only.

## Unified Node Model
Everything is a **node**. Two kinds:
- **Folder node** — no spatial data (x,y,width,height,char). Purely organizational (floors, categories, template groups).
- **Spatial node** — has position, dimensions, char. Children coordinates are relative to parent.

## Getting Started
1. create_project("Rodinný dům") → creates project
2. place_object(path="rodinny_dum", id="prizemi", name="Přízemí") → folder for ground floor
3. place_object(path="rodinny_dum", id="sablony", name="Šablony") → folder for templates
4. place_object(path="rodinny_dum/prizemi", id="obyvak", name="Obývák", x=0, y=0, width=5, height=4, char="O", tags=["room"]) → spatial room
5. Use remove_object to delete any node

## Hierarchy example
\`\`\`
Projekt (folder)
├─ Přízemí          (folder)
│  ├─ Obývák        (spatial 0,0 5×4m)
│  │  ├─ Pohovka    (spatial 1,1 2×1m)
│  │  └─ Okno       (spatial 0,2 1.5×0.2m)
│  ├─ Kuchyně       (spatial 5,0 3.5×4m)
│  └─ d_obyvak      (spatial 5,2 0.8×0.2m — door)
├─ 2. Patro         (folder)
│  └─ ...
└─ Šablony          (folder)
   ├─ Dveře 80      (spatial template)
   └─ Okno 150      (spatial template)
\`\`\`

## Rotation
All objects support rotation (0°, 90°, 180°, 270°).
- 0° = facing north (↑), 90° = facing east (→), 180° = facing south (↓), 270° = facing west (←)
- Set rotation when placing: place_object(..., rotation: 90)
- When stamping a template, you can override rotation

## Templates & Stamps — reusable objects
1. Create a "templates" folder: place_object(path="projekt", id="sablony", name="Šablony")
2. Design reusable objects there (with clearance zones, sub-objects, etc.)
3. Use stamp_object to copy a template to the actual location
4. One template → many instances at different positions/rotations

Example:
  place_object(path="projekt", id="sablony", name="Šablony")
  place_object(path="projekt/sablony", id="dvere_80", name="Dveře 80cm", x=0, y=0, width=0.8, height=0.2, char="D", tags=["door","template"])
  place_object(path="projekt/sablony/dvere_80", id="clr", name="Průchod", x=0, y=0.2, width=0.8, height=0.8, char="_", tags=["clearance"])
  stamp_object(source="projekt/sablony/dvere_80", target="projekt/prizemi", id="d1", x=5, y=3, rotation=0)

## Coordinate system
x = left→right, y = top→bottom on plan. Maps to 3D: plan-x → 3D x, plan-y → 3D z.

## Projection views
get_ascii and check_collision support projection parameter:
- plan (default) — top-down view (x × y)
- front — from south (x × elevation) — objects need elevation + height_3d
- side — from east (y × elevation)

## Walls are IMPLICIT — rooms touch edge-to-edge
- Room dimensions represent INTERIOR space, not including walls
- Adjacent rooms share a boundary — the wall is generated in 3D on that boundary line
- Do NOT leave gaps between rooms for walls — rooms touch directly

## Where to place doors vs windows
- **Windows** → INSIDE the room container they belong to
- **Doors** → at the FLOOR/APARTMENT level (parent of rooms)

## Metadata
Every object can carry arbitrary key-value metadata for 3D generation:
- Pass as JSON object: metadata={ style: "sliding", connects: ["obyvak", "terasa"] }
- Or as JSON string: metadata='{"style": "sliding"}'

## Other tools
- duplicate_object — deep copy any node
- find_objects — search by name/tags across the tree
- rename_object — change an object's ID
- move_object — reposition or reparent
- update_object — modify properties
- check_collision — advisory overlap check
- get_ascii — ASCII visualization
- get_info — detailed object info
- export_json — export as JSON
`)
);

// ──────────────────────────────────────────────
// TOOL: create_project
// ──────────────────────────────────────────────

server.tool(
  'create_project',
  'Create a new project. Does NOT delete existing projects — adds alongside them.',
  {
    name: z.string().describe('Project name'),
    description: z.string().optional(),
  },
  async ({ name, description }) => {
    const id = store.createProject(name, description || '');
    return ok(`Project "${name}" created (id: "${id}"). Use path="${id}/..." to add folders and objects inside.`);
  }
);

server.tool(
  'delete_project',
  'Delete a project and all its contents.',
  {
    id: z.string().describe('Project ID to delete'),
  },
  async ({ id }) => {
    if (store.deleteProject(id)) return ok(`Project "${id}" deleted.`);
    return err(`Project "${id}" not found.`);
  }
);

// ──────────────────────────────────────────────
// TOOL: clear_all
// ──────────────────────────────────────────────

server.tool(
  'clear_all',
  'Remove ALL data. Use with caution.',
  {},
  async () => {
    store.clearAll();
    return ok('All data cleared.');
  }
);

// ──────────────────────────────────────────────
// TOOL: stamp_object
// ──────────────────────────────────────────────

server.tool(
  'stamp_object',
  'Copy a template object (with all children) to a target location. Supports rotation.',
  {
    source: z.string().describe('Path to the template object to copy'),
    target: z.string().describe('Path to the parent where the copy will be placed'),
    id: z.string().describe('ID for the new copy'),
    x: z.number().min(0),
    y: z.number().min(0),
    rotation: z.number().optional().describe('Rotation: 0 (↑), 90 (→), 180 (↓), 270 (←). Default: 0'),
  },
  async ({ source, target, id, x, y, rotation }) => {
    const rot = rotation || 0;
    if (![0, 90, 180, 270].includes(rot)) return err('Rotation must be 0, 90, 180, or 270');
    const result = store.stampObject(source, target, id, x, y, rot);
    if (result.error) return err(result.error);
    const arrows = { 0: '↑', 90: '→', 180: '↓', 270: '←' };
    return ok(`Stamped "${result.name}" as "${id}" at (${x},${y}) ${arrows[rot]} ${rot}° (from template: ${source})`);
  }
);

// ──────────────────────────────────────────────
// TOOL: place_object
// ──────────────────────────────────────────────

server.tool(
  'place_object',
  'Place a node. Without spatial params (x,y,width,height,char) creates a folder. With spatial params creates a spatial object. All children-capable.',
  {
    path: z.string().optional().describe('Parent path. "/" = root'),
    id: z.string().describe('Unique ID within parent'),
    name: z.string(),
    x: z.number().optional().describe('X position in meters (omit for folder node)'),
    y: z.number().optional().describe('Y position in meters (omit for folder node)'),
    width: z.number().min(0.01).optional().describe('Width in meters. Auto-calculated from shape if shape is provided.'),
    height: z.number().min(0.01).optional().describe('Height in meters. Auto-calculated from shape if shape is provided.'),
    char: z.string().max(1).optional().describe('Single character for ASCII visualization (omit for folder node)'),
    shape: z.string().optional().describe('Polygon shape as JSON: [[x1,y1],[x2,y2],...] — relative to (x,y)'),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.union([z.string(), z.record(z.unknown())]).optional().describe('Key-value data for 3D generation (JSON string or object)'),
    rotation: z.number().optional().describe('Rotation: 0 (↑), 90 (→), 180 (↓), 270 (←). Default: 0'),
    elevation: z.number().optional().describe('Height above floor (meters). For front/side projection.'),
    height_3d: z.number().min(0.01).optional().describe('Vertical height (meters). For front/side projection.'),
  },
  async ({ path, id, name, x, y, width, height, char, shape, description, tags, metadata, rotation, elevation, height_3d }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err(`Parent "${path}" not found`);
    if (!parent.children) return err(`Parent "${path}" cannot hold children`);

    if (parent.children[id]) {
      return err(`"${id}" already exists. Remove first or pick different id.`);
    }

    const meta = parseMeta(metadata);
    if (meta === null) return err('Invalid metadata JSON');
    const rot = rotation || 0;
    if (rot && ![0, 90, 180, 270].includes(rot)) return err('Rotation must be 0, 90, 180, or 270');

    const isSpatial = x !== undefined;

    if (isSpatial) {
      const parsedShape = parseShape(shape);
      let w = width, h = height;
      if (parsedShape) {
        const bbox = shapeBBox(parsedShape);
        w = w || bbox.w;
        h = h || bbox.h;
      }
      if (!w || !h) return err('width and height required (or provide shape)');

      parent.children[id] = {
        id, name,
        x, y: y ?? 0, width: w, height: h,
        char: char || '#',
        shape: parsedShape || undefined,
        description: description || '',
        tags: tags || [],
        metadata: meta,
        rotation: rot,
        children: {},
        elevation: elevation ?? undefined,
        height_3d: height_3d ?? undefined,
      };

      store.save();
      const arrows = { 0: '', 90: ' →', 180: ' ↓', 270: ' ←' };
      return ok(`Placed "${name}" [${char || '#'}] at (${x},${y ?? 0}) ${w}×${h}m${arrows[rot] || ''}${metadata ? ' +metadata' : ''}${parsedShape ? ' shape:' + parsedShape.length + 'pts' : ''}`);
    } else {
      // Folder node
      parent.children[id] = {
        id, name,
        description: description || '',
        tags: tags || [],
        metadata: meta,
        children: {},
      };

      store.save();
      return ok(`Created folder "${name}" (id: "${id}"). Use path="${(path && path !== '/' ? path + '/' : '') + id}" to add children.`);
    }
  }
);

// ──────────────────────────────────────────────
// TOOL: place_objects (batch)
// ──────────────────────────────────────────────

server.tool(
  'place_objects',
  'Place multiple objects at once (batch). Saves tokens by avoiding multiple round-trips.',
  {
    path: z.string().optional().describe('Parent path for ALL objects. "/" = root'),
    objects: z.array(z.object({
      id: z.string(),
      name: z.string(),
      x: z.number().optional(),
      y: z.number().optional(),
      width: z.number().min(0.01).optional(),
      height: z.number().min(0.01).optional(),
      char: z.string().max(1).optional(),
      shape: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      metadata: z.union([z.string(), z.record(z.unknown())]).optional(),
      rotation: z.number().optional().describe('0/90/180/270 degrees'),
      elevation: z.number().optional(),
      height_3d: z.number().min(0.01).optional(),
    })).describe('Array of objects to place'),
  },
  async ({ path, objects }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err(`Parent "${path}" not found`);

    const results = [];
    for (const o of objects) {
      if (parent.children[o.id]) {
        results.push(`ERR "${o.id}" — already exists`);
        continue;
      }
      const rot = o.rotation || 0;
      const meta = parseMeta(o.metadata);
      const isSpatial = o.x !== undefined;

      if (isSpatial) {
        const parsedShape = parseShape(o.shape);
        let w = o.width, h = o.height;
        if (parsedShape) {
          const bbox = shapeBBox(parsedShape);
          w = w || bbox.w;
          h = h || bbox.h;
        }
        if (!w || !h) {
          results.push(`ERR "${o.id}" — width and height required`);
          continue;
        }

        parent.children[o.id] = {
          id: o.id, name: o.name,
          x: o.x, y: o.y ?? 0, width: w, height: h,
          char: o.char || '#',
          shape: parsedShape || undefined,
          description: o.description || '',
          tags: o.tags || [],
          metadata: meta || {},
          rotation: rot,
          children: {},
          elevation: o.elevation ?? undefined,
          height_3d: o.height_3d ?? undefined,
        };
        const arrows = { 0: '', 90: ' →', 180: ' ↓', 270: ' ←' };
        const metaStr = o.metadata ? ' {…}' : '';
        results.push(`· [${o.char || '#'}] ${o.id} at (${o.x},${o.y ?? 0}) ${w}×${h}m${arrows[rot] || ''}${metaStr}`);
      } else {
        parent.children[o.id] = {
          id: o.id, name: o.name,
          description: o.description || '',
          tags: o.tags || [],
          metadata: meta || {},
          children: {},
        };
        results.push(`+ folder ${o.id} "${o.name}"`);
      }
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
  'Remove a node and all its children',
  { path: z.string() },
  async ({ path }) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return err('Cannot remove root.');
    if (store.removeNode(path)) return ok(`Removed "${parts[parts.length - 1]}"`);
    return err('Not found');
  }
);

// ──────────────────────────────────────────────
// TOOL: move_object
// ──────────────────────────────────────────────

server.tool(
  'move_object',
  'Move an object to a new position. Optionally reparent to a different parent.',
  {
    path: z.string(),
    new_x: z.number().optional(),
    new_y: z.number().optional(),
    new_parent: z.string().optional().describe('Path to new parent (for reparenting). Omit to stay in same parent.'),
  },
  async ({ path, new_x, new_y, new_parent }) => {
    if (new_parent) {
      const result = store.reparentNode(path, new_parent, new_x, new_y);
      if (result.error) return err(result.error);
      return ok(`Moved "${result.name}" to parent "${new_parent}" at (${new_x ?? '?'}, ${new_y ?? '?'})`);
    }

    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return err('Cannot move root');
    const node = store.resolve(path);
    if (!node) return err('Not found');
    if (new_x !== undefined) node.x = new_x;
    if (new_y !== undefined) node.y = new_y;
    store.save();
    return ok(`Moved "${node.name}" to (${node.x}, ${node.y})`);
  }
);

// ──────────────────────────────────────────────
// TOOL: update_object
// ──────────────────────────────────────────────

server.tool(
  'update_object',
  'Update properties of an existing object. Only provided fields are changed.',
  {
    path: z.string(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().min(0.01).optional(),
    height: z.number().min(0.01).optional(),
    shape: z.string().optional().describe('Polygon shape as JSON. Set to "null" to remove.'),
    name: z.string().optional(),
    char: z.string().max(1).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.union([z.string(), z.record(z.unknown())]).optional().describe('Merged with existing metadata. Set key to null to delete it.'),
    rotation: z.number().optional().describe('Rotation: 0, 90, 180, or 270'),
    elevation: z.number().optional().describe('Height above floor (meters).'),
    height_3d: z.number().optional().describe('Vertical height (meters).'),
    clear_elevation: z.boolean().optional().describe('Set to true to remove elevation'),
    clear_height_3d: z.boolean().optional().describe('Set to true to remove height_3d'),
  },
  async ({ path, x, y, width, height, shape, name, char, description, tags, metadata, rotation, elevation, height_3d, clear_elevation, clear_height_3d }) => {
    const node = store.resolve(path);
    if (!node || node === store.root) return err('Not found or root');

    // Validate rotation
    if (rotation !== undefined && ![0, 90, 180, 270].includes(rotation)) {
      return err('Rotation must be 0, 90, 180, or 270');
    }

    if (x !== undefined) node.x = x;
    if (y !== undefined) node.y = y;
    if (shape !== undefined) {
      if (shape === 'null' || shape === '') { node.shape = undefined; }
      else {
        const parsed = parseShape(shape);
        if (parsed) { node.shape = parsed; const bb = shapeBBox(parsed); node.width = bb.w; node.height = bb.h; }
      }
    }
    if (width !== undefined) node.width = width;
    if (height !== undefined) node.height = height;
    if (name !== undefined) node.name = name;
    if (char !== undefined) node.char = char;
    if (description !== undefined) node.description = description;
    if (tags !== undefined) node.tags = tags;
    if (metadata !== undefined) {
      const meta = parseMeta(metadata);
      if (meta === null) return err('Invalid metadata JSON');
      // Allow deleting keys by setting them to null
      const merged = { ...(node.metadata || {}), ...meta };
      for (const [k, v] of Object.entries(merged)) {
        if (v === null) delete merged[k];
      }
      node.metadata = merged;
    }
    if (rotation !== undefined) node.rotation = rotation;
    if (elevation !== undefined) node.elevation = elevation;
    if (height_3d !== undefined) node.height_3d = height_3d;
    if (clear_elevation) node.elevation = undefined;
    if (clear_height_3d) node.height_3d = undefined;

    store.save();
    const pos = node.x !== undefined ? `(${node.x},${node.y}) ${node.width}×${node.height}m` : '(folder)';
    return ok(`Updated "${node.name}" → ${pos}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_objects
// ──────────────────────────────────────────────

server.tool(
  'get_objects',
  'List children of a node. Optionally filter by tag. Use recursive=true to show all descendants.',
  {
    path: z.string().optional(),
    tag: z.string().optional().describe('Filter: only show objects with this tag'),
    recursive: z.boolean().optional().describe('Show all descendants, not just direct children'),
  },
  async ({ path, tag, recursive }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');
    const bounds = store.getEffectiveBounds(node);

    const collectChildren = (parent, prefix, depth) => {
      let children = Object.values(parent.children || {});
      if (tag) children = children.filter(c => (c.tags || []).includes(tag));
      const items = [];
      for (const c of children) {
        const indent = '  '.repeat(depth);
        const isSpatial = c.x !== undefined;
        const container = c.children ? `[+${Object.keys(c.children).length}]` : '';
        const tags = c.tags?.length ? ` [${c.tags.join(',')}]` : '';
        const meta = c.metadata && Object.keys(c.metadata).length ? ` {${Object.entries(c.metadata).map(([k,v]) => `${k}:${JSON.stringify(v)}`).join(', ')}}` : '';
        const rotArrows = { 0: '', 90: ' →', 180: ' ↓', 270: ' ←' };
        const rotStr = c.rotation ? (rotArrows[c.rotation] || ` ${c.rotation}°`) : '';

        if (isSpatial) {
          items.push(`${indent}[${c.char}] ${prefix}${c.id} "${c.name}" (${c.x},${c.y}) ${c.width}×${c.height}m${rotStr}${container}${tags}${meta}`);
        } else {
          items.push(`${indent}📁 ${prefix}${c.id} "${c.name}"${container}${tags}${meta}`);
        }

        if (recursive && c.children) {
          items.push(...collectChildren(c, prefix + c.id + '/', depth + 1));
        }
      }
      return items;
    };

    const lines = collectChildren(node, '', 0);
    if (lines.length === 0) return ok(`"${node.name}" (${bounds.w}m × ${bounds.h}m) — ${tag ? 'no objects with tag "' + tag + '"' : 'empty'}`);
    return ok(`"${node.name}" — ${bounds.w}m × ${bounds.h}m:\n\n${lines.join('\n')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: check_collision
// ──────────────────────────────────────────────

server.tool(
  'check_collision',
  'Advisory check: does a rectangle overlap with existing objects?',
  {
    path: z.string().optional(),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(0.01),
    height: z.number().min(0.01),
    exclude_tags: z.array(z.string()).optional().describe('Ignore objects with these tags'),
    exclude_id: z.string().optional().describe('Ignore object with this ID (useful when checking moved object)'),
    projection: z.enum(['plan', 'front', 'side']).optional().describe('plan (default), front (x × elevation), side (y × elevation)'),
  },
  async ({ path, x, y, width, height, exclude_tags, exclude_id, projection }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err('Not found');
    if (parent.x === undefined) return err('Cannot check collision on a folder node — use a spatial parent (room, space)');

    const proj = projection || 'plan';
    let collisions;

    if (proj === 'plan') {
      collisions = store.findCollisions(parent, x, y, width, height, exclude_id);
    } else {
      collisions = store.findCollisionsProjected(parent, x, y, width, height, proj);
    }

    if (exclude_tags?.length) {
      collisions = collisions.filter(c => !(c.tags || []).some(t => exclude_tags.includes(t)));
    }
    if (collisions.length === 0) return ok(`Area (${x},${y}) ${width}×${height}m is FREE (${proj})`);
    const fmt = proj === 'plan'
      ? c => `[${c.char}] "${c.name}" (${c.x},${c.y}) ${c.width}×${c.height}m`
      : c => `[${c.char}] "${c.name}" (${c.px},${c.py}) ${c.pw}×${c.ph}m`;
    return ok(`Overlaps with: ${collisions.map(fmt).join(', ')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_ascii
// ──────────────────────────────────────────────

server.tool(
  'get_ascii',
  'ASCII visualization. Auto-scales to fit. Use recursive=true for nested objects. Supports plan/front/side projection.',
  {
    path: z.string().optional(),
    max_cols: z.number().int().min(10).max(120).optional(),
    max_rows: z.number().int().min(5).max(60).optional(),
    recursive: z.boolean().optional().describe('Show all nested objects. Default: false.'),
    tag: z.string().optional().describe('Only show objects with this tag'),
    projection: z.enum(['plan', 'front', 'side']).optional().describe('View projection: plan (default), front, side'),
  },
  async ({ path, max_cols, max_rows, recursive, tag, projection }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');
    if (node.x === undefined) return err('Cannot render ASCII for a folder node — folders have no shared coordinate space. Navigate into a spatial child (room, space) instead.');

    const proj = projection || 'plan';

    // Tag filtering — create filtered copy (don't mutate original)
    let renderNode = node;
    if (tag && node.children) {
      renderNode = { ...node, children: {} };
      for (const [k, v] of Object.entries(node.children)) {
        if ((v.tags || []).includes(tag)) renderNode.children[k] = v;
      }
    }

    const { ascii, legend, scaleInfo } = store.renderAscii(renderNode, max_cols || 60, max_rows || 30, recursive || false, proj);

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
  'Detailed info about a node including metadata',
  { path: z.string() },
  async ({ path }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');
    const children = Object.values(node.children || {});
    const meta = node.metadata && Object.keys(node.metadata).length
      ? Object.entries(node.metadata).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')
      : '  (none)';
    const arrows = { 0: '↑', 90: '→', 180: '↓', 270: '←' };
    const rot = node.rotation || 0;
    const isSpatial = node.x !== undefined;
    const lines = [
      `Name: ${node.name}`,
      `Type: ${isSpatial ? 'spatial' : 'folder'}`,
    ];
    if (isSpatial) {
      lines.push(`Position: (${node.x}, ${node.y})`);
      lines.push(`Size: ${node.width}m × ${node.height}m`);
      lines.push(`Rotation: ${rot}° ${arrows[rot] || ''}`);
      lines.push(`Char: [${node.char}]`);
    }
    lines.push(`Description: ${node.description || '(none)'}`);
    lines.push(`Tags: ${(node.tags || []).join(', ') || '(none)'}`);
    lines.push(`Metadata:\n${meta}`);
    lines.push(`Children: ${children.length}`);
    return ok(lines.join('\n'));
  }
);

// ──────────────────────────────────────────────
// TOOL: export_json
// ──────────────────────────────────────────────

server.tool(
  'export_json',
  'Export map as JSON. Optionally filter by path and/or tag.',
  {
    path: z.string().optional().describe('Path to export from (default: root)'),
    tag: z.string().optional().describe('Only include objects with this tag (recursive filter)'),
  },
  async ({ path, tag }) => {
    const result = store.exportJSON(path, tag);
    if (!result) return err('Path not found');
    return ok(JSON.stringify(result, null, 2));
  }
);

// ──────────────────────────────────────────────
// TOOL: duplicate_object
// ──────────────────────────────────────────────

server.tool(
  'duplicate_object',
  'Deep copy a node (with all children) to the same or different parent.',
  {
    source: z.string().describe('Path to the object to copy'),
    new_id: z.string().describe('ID for the copy'),
    target: z.string().optional().describe('Path to target parent (default: same parent as source)'),
  },
  async ({ source, new_id, target }) => {
    const result = store.duplicateNode(source, new_id, target);
    if (result.error) return err(result.error);
    return ok(`Duplicated "${result.name}" as "${result.id}"${target ? ' into "' + target + '"' : ''}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: find_objects
// ──────────────────────────────────────────────

server.tool(
  'find_objects',
  'Search for objects by name, tags, or metadata across the tree.',
  {
    path: z.string().optional().describe('Search scope (default: entire tree)'),
    name: z.string().optional().describe('Substring match on object name (case-insensitive)'),
    tags: z.array(z.string()).optional().describe('Objects must have ALL of these tags'),
    metadata_key: z.string().optional().describe('Objects must have this metadata key'),
  },
  async ({ path, name, tags, metadata_key }) => {
    const results = store.findObjects(path, { name, tags, metadata_key });
    if (results.length === 0) return ok('No objects found matching criteria.');
    const lines = results.map(r => {
      const type = r.isSpatial ? '·' : '📁';
      const tagsStr = r.tags.length ? ` [${r.tags.join(',')}]` : '';
      return `${type} ${r.path} "${r.name}"${tagsStr}`;
    });
    return ok(`Found ${results.length} objects:\n${lines.join('\n')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: rename_object
// ──────────────────────────────────────────────

server.tool(
  'rename_object',
  'Change the ID of an object. Updates the key in the parent.',
  {
    path: z.string().describe('Path to the object'),
    new_id: z.string().describe('New ID'),
  },
  async ({ path, new_id }) => {
    const result = store.renameNode(path, new_id);
    if (result.error) return err(result.error);
    return ok(`Renamed to "${new_id}" ("${result.name}")`);
  }
);

// ──────────────────────────────────────────────

function ok(text) { return { content: [{ type: 'text', text }] }; }
function err(text) { return { content: [{ type: 'text', text: `ERROR: ${text}` }], isError: true }; }

function parseMeta(s) {
  if (s === undefined || s === null) return {};
  if (typeof s === 'object' && !Array.isArray(s)) return s;
  if (typeof s === 'string') {
    try { return JSON.parse(s); }
    catch { return null; } // Return null to signal error
  }
  return {};
}

function parseShape(s) {
  if (!s) return null;
  if (Array.isArray(s)) {
    if (s.length >= 3 && s.every(p => Array.isArray(p) && p.length === 2)) return s;
    return null;
  }
  if (typeof s === 'string') {
    try {
      const arr = JSON.parse(s);
      return parseShape(arr);
    } catch { return null; }
  }
  if (typeof s === 'object') {
    const keys = Object.keys(s);
    if (keys.length >= 3) {
      const arr = keys.sort((a,b) => Number(a) - Number(b)).map(k => {
        const v = s[k];
        if (Array.isArray(v)) return v;
        if (typeof v === 'object') return [v[0] ?? v.x ?? 0, v[1] ?? v.y ?? 0];
        return null;
      }).filter(Boolean);
      if (arr.length >= 3 && arr.every(p => p.length === 2)) return arr;
    }
    return null;
  }
  return null;
}

function shapeBBox(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of points) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  return { w: maxX - minX, h: maxY - minY };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MapCraft MCP v0.7 running');
}

main().catch(console.error);
