import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { writeFileSync } from 'fs';
import { resolve as pathResolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MapStore, normalizeId } from './store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const store = new MapStore();

const server = new McpServer({
  name: 'mapcraft',
  version: '0.7.0',
});

// ── Activity log — shared with UI server ──────
const ACTIVITY_FILE = pathResolve(__dirname, '../../data/activity.json');
const MAX_ACTIVITY = 50;
let activityLog = [];

function logActivity(tool, args, status) {
  const entry = {
    tool,
    path: args?.path || null,
    args: summarizeArgs(args),
    status, // 'start' | 'done' | 'error'
    ts: Date.now(),
  };
  activityLog.push(entry);
  if (activityLog.length > MAX_ACTIVITY) activityLog = activityLog.slice(-MAX_ACTIVITY);
  try { writeFileSync(ACTIVITY_FILE, JSON.stringify(activityLog)); } catch {}
}

function summarizeArgs(args) {
  if (!args) return {};
  const s = {};
  for (const [k, v] of Object.entries(args)) {
    if (k === 'objects' && Array.isArray(v)) {
      s[k] = v.map(o => o.id || o.name).filter(Boolean);
    } else if (k === 'metadata' || (typeof v === 'object' && v !== null)) {
      continue; // skip large objects
    } else {
      s[k] = v;
    }
  }
  return s;
}

const _origTool = server.tool.bind(server);
server.tool = function(name, desc, schema, handler) {
  _origTool(name, desc, schema, async (args) => {
    logActivity(name, args, 'start');
    try {
      const result = await handler(args);
      logActivity(name, args, 'done');
      return result;
    } catch (e) {
      logActivity(name, args, 'error');
      throw e;
    }
  });
};

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
- **Folder node** — no spatial data (x,y,width,height,char). Purely organizational (categories, template groups).
- **Spatial node** — has position, dimensions, char. Children coordinates are relative to parent.

## Getting Started
1. create_project("Rodinný dům") → creates project
2. place_object(path="rodinny_dum", id="sablony", name="Šablony") → folder for templates
3. place_object(path="rodinny_dum", id="budova", name="Budova", x=0, y=0, width=12, height=10, char="B") → building envelope
4. place_object(path="rodinny_dum/budova", id="prizemi", name="Přízemí", x=0, y=0, width=12, height=10, char="1", z=0, height_3d=3) → ground floor
5. place_object(path="rodinny_dum/budova/prizemi", id="obyvak", name="Obývák", x=0, y=0, width=5, height=4, char="O", tags=["room"]) → room
6. Use remove_object to delete any node

## Hierarchy example
\`\`\`
Projekt (folder)
├─ Budova           (spatial 0,0 12×10m — building envelope)
│  ├─ Přízemí       (spatial 0,0 12×10m, z=0, height_3d=3)
│  │  ├─ Obývák     (spatial 0,0 5×4m)
│  │  │  ├─ Pohovka (spatial 1,1 2×1m)
│  │  │  └─ Okno    (spatial 0,2 1.5×0.2m)
│  │  ├─ Kuchyně    (spatial 5,0 3.5×4m)
│  │  └─ d_obyvak   (spatial 5,2 0.8×0.2m — door)
│  └─ 1. Patro      (spatial 0,0 12×10m, z=3, height_3d=3)
│     └─ ...
└─ Šablony          (folder)
   ├─ Dveře 80      (spatial template)
   └─ Okno 150      (spatial template)
\`\`\`

## Multi-story buildings
Floors are regular spatial nodes — NOT folders. Each floor is a spatial container with the same x,y,width,height as the building, stacked using z:
- Ground floor: z=0, height_3d=3
- First floor: z=3, height_3d=3
- Second floor: z=6, height_3d=3
Use front/side projection views to verify vertical stacking.

## Rotation
All objects support rotation (0°, 90°, 180°, 270°).
- 0° = facing north (↑), 90° = facing east (→), 180° = facing south (↓), 270° = facing west (←)
- Set rotation when placing: place_object(..., rotation: 90)
- When stamping a template, you can override rotation

## Templates & Stamps — reusable objects
1. Create a "templates" folder: place_object(path="projekt", id="sablony", name="Šablony")
2. Design reusable objects there (with clearance zones, sub-objects, etc.)
3. Use stamp_object to place a reference to a template at the actual location
4. One template → many instances at different positions/rotations
5. Stamps are references, not copies — changing the template updates all instances

Example:
  place_object(path="projekt", id="sablony", name="Šablony")
  place_object(path="projekt/sablony", id="dvere_80", name="Dveře 80cm", x=0, y=0, width=0.8, height=0.2, char="D", tags=["door","template"])
  place_object(path="projekt/sablony/dvere_80", id="clr", name="Průchod", x=0, y=0.2, width=0.8, height=0.8, char="_", tags=["clearance"])
  stamp_object(source="projekt/sablony/dvere_80", target="projekt/prizemi", id="d1", x=5, y=3, rotation=0)

## Coordinate system
x = left→right, y = top→bottom on plan. Maps to 3D: plan-x → 3D x, plan-y → 3D z.

## Projection views
get_ascii supports projection parameter:
- plan (default) — top-down view (x × y)
- front — from south (x × z) — objects need z + height_3d
- side — from east (y × z)

## Walls are IMPLICIT — rooms touch edge-to-edge
- Room dimensions represent INTERIOR space, not including walls
- Adjacent rooms share a boundary — the wall is generated in 3D on that boundary line
- Do NOT leave gaps between rooms for walls — rooms touch directly

## Where to place doors vs windows
- **Windows** → INSIDE the room container they belong to
- **Doors** → at the floor level (parent of rooms, sibling of rooms)

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
- check_collision — find collisions between children of a node (pairwise). Use tags to filter.
- check_connectivity — verify all parts of a composite object are physically connected in 3D
- define_rules — set validation rules (no_collide, must_collide, must_touch)
- validate — check space against defined rules
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
    return ok(`Project "${name}" created (path: "${id}")`);
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
      metadata: z.string().optional().describe('JSON string, e.g. {"style":"sliding"}'),
      rotation: z.number().optional().describe('0/90/180/270 degrees'),
      z: z.number().optional().describe('Vertical position (meters above ground)'),
      height_3d: z.number().min(0.01).optional().describe('Vertical height (meters)'),
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
      const result = buildNode(o);
      if (result.error) {
        results.push(`ERR "${o.id}" — ${result.error}`);
        continue;
      }

      parent.children[o.id] = result.node;

      if (o.x !== undefined) {
        const rot = o.rotation || 0;
        const arrows = { 0: '', 90: ' →', 180: ' ↓', 270: ' ←' };
        const metaStr = o.metadata ? ' {…}' : '';
        results.push(`· [${o.char || '#'}] ${o.id} at (${o.x},${o.y ?? 0}) ${result.w}×${result.h}m${arrows[rot] || ''}${metaStr}`);
      } else {
        results.push(`+ folder ${o.id} "${o.name}"`);
      }
    }

    store.save();
    return ok(`Placed ${results.length} objects:\n${results.join('\n')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: stamp_objects (batch)
// ──────────────────────────────────────────────

server.tool(
  'stamp_objects',
  'Stamp multiple templates at once (batch). All stamps go to the same target parent. Saves tokens by avoiding multiple round-trips.',
  {
    source: z.string().describe('Path to the template object to reference (shared for all stamps)'),
    target: z.string().describe('Path to the parent where all stamps will be placed'),
    stamps: z.array(z.object({
      id: z.string().describe('ID for the new stamp'),
      x: z.number(),
      y: z.number(),
      rotation: z.number().optional().describe('Rotation: 0 (↑), 90 (→), 180 (↓), 270 (←). Default: 0'),
    })).describe('Array of stamps to place'),
  },
  async ({ source, target, stamps }) => {
    const results = [];
    const arrows = { 0: '↑', 90: '→', 180: '↓', 270: '←' };
    for (const s of stamps) {
      const rot = s.rotation || 0;
      if (![0, 90, 180, 270].includes(rot)) {
        results.push(`ERR "${s.id}" — rotation must be 0, 90, 180, or 270`);
        continue;
      }
      const result = store.stampObject(source, target, s.id, s.x, s.y, rot);
      if (result.error) {
        results.push(`ERR "${s.id}" — ${result.error}`);
      } else {
        results.push(`· ${s.id} at (${s.x},${s.y}) ${arrows[rot]} ${rot}°`);
      }
    }
    return ok(`Stamped ${results.length}× from "${source}":\n${results.join('\n')}`);
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
    metadata: z.string().optional().describe('Merged with existing metadata as JSON string. Set key to null to delete it.'),
    rotation: z.number().optional().describe('Rotation: 0, 90, 180, or 270'),
    z: z.number().optional().describe('Vertical position in meters (height above ground). For stacking floors and front/side projection.'),
    height_3d: z.number().optional().describe('Vertical height in meters (e.g. ceiling height). For multi-story buildings and front/side projection.'),
    clear_z: z.boolean().optional().describe('Set to true to remove z'),
    clear_height_3d: z.boolean().optional().describe('Set to true to remove height_3d'),
  },
  async ({ path, x, y, width, height, shape, name, char, description, tags, metadata, rotation, z: zPos, height_3d, clear_z, clear_height_3d }) => {
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
    if (zPos !== undefined) node.z = zPos;
    if (height_3d !== undefined) node.height_3d = height_3d;
    if (clear_z) node.z = undefined;
    if (clear_height_3d) node.height_3d = undefined;

    store.save();
    const pos = node.x !== undefined
      ? (node.width !== undefined ? `(${node.x},${node.y}) ${node.width}×${node.height}m` : `(${node.x},${node.y}) auto-bounds`)
      : '(folder)';
    return ok(`Updated "${node.name}" → ${pos}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_objects
// ──────────────────────────────────────────────

server.tool(
  'get_objects',
  'List children of a node. Optionally filter by tag. Use recursive=true to show all descendants. Stamps are resolved from their templates. Output is compact (no metadata — use get_info for details).',
  {
    path: z.string().optional(),
    tag: z.string().optional().describe('Filter: only show objects with this tag'),
    recursive: z.boolean().optional().describe('Show all descendants, not just direct children'),
  },
  async ({ path, tag, recursive }) => {
    const raw = store.resolve(path || '/');
    if (!raw) return err('Not found');
    const node = store.resolveNode(raw);
    const bounds = store.getEffectiveBounds(node);

    const collectChildren = (parent, prefix, depth) => {
      let children = Object.values(store.getChildren(parent));
      if (tag) children = children.filter(c => (c.tags || []).includes(tag));
      const items = [];
      for (const c of children) {
        const indent = '  '.repeat(depth);
        const isSpatial = c.x !== undefined;
        const childCount = Object.keys(c.children || {}).length;
        const container = childCount > 0 ? `[+${childCount}]` : '';
        const tags = c.tags?.length ? ` [${c.tags.join(',')}]` : '';

        if (isSpatial) {
          const dims = c.width !== undefined ? `${c.width}×${c.height}m` : 'auto';
          items.push(`${indent}[${c.char || '?'}] ${prefix}${c.id} "${c.name}" (${c.x},${c.y}) ${dims}${container}${tags}`);
        } else {
          items.push(`${indent}📁 ${prefix}${c.id} "${c.name}"${container}${tags}`);
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
  'Check all children of a node for collisions between each other. Returns pairs of overlapping objects. Use tags to limit which objects to check (e.g. ["house"] checks only houses against each other, ["house","road"] checks houses vs roads and houses vs houses etc.).',
  {
    path: z.string().optional(),
    tags: z.array(z.string()).optional().describe('Only check objects that have at least one of these tags. Omit to check all spatial children.'),
  },
  async ({ path, tags }) => {
    const parent = store.resolve(path || '/');
    if (!parent) return err('Not found');
    if (parent.x === undefined) return err('Cannot check collision on a folder node — use a spatial parent (room, space)');

    const pairs = store.findCollisions(parent, tags);

    if (pairs.length === 0) return ok('No collisions found.');
    const fmt = c => `[${c.char||'?'}] "${c.name}" (${c.x},${c.y}) ${c.width}×${c.height}m`;
    const lines = pairs.map(([a, b]) => `${fmt(a)}  ↔  ${fmt(b)}`);
    return ok(`${pairs.length} collision(s):\n${lines.join('\n')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: check_connectivity
// ──────────────────────────────────────────────

server.tool(
  'check_connectivity',
  'Check if all spatial children of a node form one connected object in 3D space (touching/overlapping). Uses x,y,width,height + z,height_3d for 3D adjacency.',
  {
    path: z.string().describe('Path to parent node'),
    exclude_tags: z.array(z.string()).optional().describe('Ignore objects with these tags'),
  },
  async ({ path, exclude_tags }) => {
    const node = store.resolve(path || '/');
    if (!node) return err('Not found');

    const { groups, count } = store.findConnectedGroups(node, exclude_tags);
    if (count === 0) return ok('No spatial children to check.');
    if (count === 1) {
      const names = groups[0].map(b => `[${b.char||'?'}] ${b.name}`).join(', ');
      return ok(`All connected (${groups[0].length} objects): ${names}`);
    }

    let msg = `DISCONNECTED — ${count} separate groups:\n`;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const names = g.map(b => `[${b.char||'?'}] ${b.name} (${b.x},${b.y} ${b.w}×${b.h}m, elev=${b.ez} h3d=${b.eh})`).join(', ');
      msg += `  Group ${i + 1}: ${names}\n`;
    }
    return ok(msg.trim());
  }
);

// ──────────────────────────────────────────────
// TOOL: define_rules
// ──────────────────────────────────────────────

server.tool(
  'define_rules',
  `Define validation rules for a project/space. Rules are stored in metadata and checked by validate tool.
Rule types:
- no_collide(a, b) — objects with tag A must not overlap objects with tag B (symmetric)
- must_collide(a, b) — every object with tag A must overlap at least one object with tag B (directional: A must be in B, not B must have A)
- must_touch(a, b) — every object with tag A must touch (share edge/overlap) at least one object with tag B (directional)
- no_touch(a, b) — objects with tag A must not touch objects with tag B — no shared edges, no overlap (symmetric)`,
  {
    path: z.string().describe('Project or space path'),
    rules: z.array(z.object({
      type: z.enum(['no_collide', 'must_collide', 'must_touch', 'no_touch', 'must_contain']),
      a: z.string().describe('Subject tag — "every object with this tag..."'),
      b: z.string().describe('Target tag — "...must/must not [verb] an object with this tag"'),
    })).describe('Array of rules'),
  },
  async ({ path, rules }) => {
    const node = store.resolve(path);
    if (!node) return err('Not found');
    if (!node.metadata) node.metadata = {};
    node.metadata._rules = rules;
    store.save();
    return ok(`Defined ${rules.length} rules on "${node.name}":\n${rules.map(r => `  ${r.a} ${r.type} ${r.b}`).join('\n')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: validate
// ──────────────────────────────────────────────

server.tool(
  'validate',
  'Validate a space against defined rules. Checks all children recursively against rules defined on ancestor nodes.',
  {
    path: z.string().describe('Path to validate'),
  },
  async ({ path }) => {
    const node = store.resolve(path);
    if (!node) return err('Not found');

    // Collect rules from this node and ancestors
    const rules = [];
    const parts = path.split('/').filter(Boolean);
    let p = '/';
    const root = store.resolve('/');
    if (root?.metadata?._rules) rules.push(...root.metadata._rules);
    for (const part of parts) {
      p = p === '/' ? part : `${p}/${part}`;
      const n = store.resolve(p);
      if (n?.metadata?._rules) rules.push(...n.metadata._rules);
    }

    if (rules.length === 0) return ok('No rules defined. Use define_rules first.');

    const violations = store.validate(node, rules);
    if (violations.length === 0) return ok(`All ${rules.length} rules passed ✓`);
    return ok(`${violations.length} violations found:\n${violations.map(v => `  ✗ ${v}`).join('\n')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: validate_custom
// ──────────────────────────────────────────────

server.tool(
  'validate_custom',
  'Validate a space against custom rules (not stored on the project). Useful for independent verification — a verifier agent can define its own rules without seeing the planner\'s rules. Same rule types as define_rules.',
  {
    path: z.string().describe('Path to validate'),
    rules: z.array(z.object({
      type: z.enum(['no_collide', 'must_collide', 'must_touch', 'no_touch', 'must_contain']),
      a: z.string().describe('Subject tag'),
      b: z.string().describe('Target tag'),
    })).describe('Array of rules to check'),
  },
  async ({ path, rules }) => {
    const node = store.resolve(path);
    if (!node) return err('Not found');
    if (!rules || rules.length === 0) return err('No rules provided');

    const violations = store.validate(node, rules);
    if (violations.length === 0) return ok(`All ${rules.length} custom rules passed ✓`);
    return ok(`${violations.length} violations found:\n${violations.map(v => `  ✗ ${v}`).join('\n')}`);
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
    const raw = store.resolve(path || '/');
    if (!raw) return err('Not found');
    const node = store.resolveNode(raw);
    if (node.x === undefined) return err('Cannot render ASCII for a folder node — folders have no shared coordinate space. Navigate into a spatial child (room, space) instead.');

    const proj = projection || 'plan';

    // Tag filtering — create filtered copy (don't mutate original)
    let renderNode = node;
    if (tag && node.children) {
      renderNode = { ...node, children: {} };
      for (const [k, v] of Object.entries(store.getChildren(node))) {
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
  'Detailed info about a single node including metadata. Stamps are resolved from their templates.',
  { path: z.string() },
  async ({ path }) => {
    const raw = store.resolve(path || '/');
    if (!raw) return err('Not found');
    const node = store.resolveNode(raw);
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
      lines.push(`Size: ${node.width !== undefined ? `${node.width}m × ${node.height}m` : 'auto (from children)'}`);
      lines.push(`Rotation: ${rot}° ${arrows[rot] || ''}`);
      if (node.char) lines.push(`Char: [${node.char}]`);
      if (node.z !== undefined) lines.push(`Z: ${node.z}m`);
      if (node.height_3d !== undefined) lines.push(`Height 3D: ${node.height_3d}m`);
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
  'Export map as compact JSON to a file. Strips empty fields, uses short keys. Returns file path + summary. Read the file to process.',
  {
    path: z.string().optional().describe('Path to export from (default: root)'),
    tag: z.string().optional().describe('Only include objects with this tag (recursive filter)'),
    file: z.string().describe('File path to write JSON to'),
  },
  async ({ path, tag, file }) => {
    const result = store.exportJSON(path, tag);
    if (!result) return err('Path not found');

    // Compact format: strip empty fields, short keys
    // Stamps export as references: { ref: "template/path", x, y, r }
    const compact = (node) => {
      // Stamp → compact reference
      if ((node.tags || []).includes('stamp') && node.metadata?._template) {
        const o = { ref: node.metadata._template };
        if (node.x !== undefined) { o.x = node.x; o.y = node.y ?? 0; }
        if (node.rotation) o.r = node.rotation;
        return o;
      }
      const o = {};
      if (node.name) o.n = node.name;
      if (node.x !== undefined) { o.x = node.x; o.y = node.y ?? 0; o.w = node.width; o.h = node.height; }
      if (node.rotation) o.r = node.rotation;
      if (node.z !== undefined) o.z = node.z;
      if (node.height_3d !== undefined) o.h3 = node.height_3d;
      if (node.tags?.length) o.t = node.tags;
      if (node.metadata && Object.keys(node.metadata).length) o.m = node.metadata;
      if (node.shape) o.sh = node.shape;
      const kids = Object.entries(node.children || {});
      if (kids.length) {
        o.c = {};
        for (const [k, v] of kids) o.c[k] = compact(v);
      }
      return o;
    };

    const data = compact(result);
    const json = JSON.stringify(data);
    const abs = pathResolve(file);
    writeFileSync(abs, json, 'utf-8');
    const countNodes = (n) => 1 + Object.values(n.children || {}).reduce((s, c) => s + countNodes(c), 0);
    const nodes = countNodes(result);
    return ok(`Exported to ${abs} (${nodes} nodes, ${json.length} bytes).\nKey map: n=name, x/y/w/h=position+size, r=rotation, z=vertical position, h3=height_3d, t=tags, m=metadata, sh=shape, c=children, ref=stamp template reference`);
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
// TOOL: find_gaps
// ──────────────────────────────────────────────

server.tool(
  'find_gaps',
  `Find uncovered rectangular areas (gaps) inside a spatial parent. Sweeps a grid of all object edges and returns rectangles not covered by any matching object. Each gap includes neighboring objects and their side (north/south/east/west).`,
  {
    path: z.string().describe('Path to spatial parent'),
    tags: z.array(z.string()).optional().describe('Only consider objects with these tags as "coverage". Gaps are areas not covered by any object with a matching tag.'),
  },
  async ({ path, tags }) => {
    const node = store.resolve(path);
    if (!node) return err('Not found');
    if (node.x === undefined || node.width === undefined) return err('Cannot find gaps in a folder node — use a spatial parent');
    const gaps = store.findGapsInParent(node, tags);
    if (gaps.length === 0) return ok('No gaps found — full coverage ✓');
    const lines = gaps.map(g => {
      const nbrs = g.neighbors.length > 0
        ? g.neighbors.map(n => `"${n.name}" (${n.side})`).join(', ')
        : 'none';
      return `  (${g.x}, ${g.y}) ${g.w}×${g.h}m — neighbors: ${nbrs}`;
    });
    return ok(`${gaps.length} gap(s) found:\n${lines.join('\n')}`);
  }
);

// ──────────────────────────────────────────────
// TOOL: get_tags
// ──────────────────────────────────────────────

server.tool(
  'get_tags',
  'Get all unique tags used within a path (recursive). Shows count per tag. Useful for understanding what tag vocabulary exists.',
  { path: z.string().optional() },
  async ({ path }) => {
    const node = path ? store.resolve(path) : store.root;
    if (!node) return err('Path not found');

    const tagCounts = {};
    function walk(n) {
      const tags = n.tags || [];
      for (const t of tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
      const children = n.children ? store.getChildren(n) : {};
      for (const child of Object.values(children)) {
        walk(child);
      }
    }
    walk(node);

    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return ok('No tags found.');
    const lines = sorted.map(([tag, count]) => `  ${tag} (${count})`);
    return ok(`${sorted.length} unique tags in "${node.name || path || 'root'}":\n${lines.join('\n')}`);
  }
);

// ──────────────────────────────────────────────

function ok(text) { return { content: [{ type: 'text', text }] }; }
function err(text) { return { content: [{ type: 'text', text: `ERROR: ${text}` }], isError: true }; }

/**
 * Build a node object from input data. Returns { node, error }.
 * Spatial node if o.x is defined, folder node otherwise.
 */
function buildNode(o) {
  const meta = parseMeta(o.metadata);
  if (meta === null) return { error: 'Invalid metadata JSON' };
  const rot = o.rotation || 0;
  if (rot && ![0, 90, 180, 270].includes(rot)) return { error: 'Rotation must be 0, 90, 180, or 270' };

  if (o.x !== undefined) {
    const parsedShape = parseShape(o.shape);
    let w = o.width, h = o.height;
    if (parsedShape) {
      const bbox = shapeBBox(parsedShape);
      w = w || bbox.w;
      h = h || bbox.h;
    }
    // width/height optional — auto-calculated from children via getEffectiveBounds
    return {
      node: {
        id: o.id, name: o.name,
        x: o.x, y: o.y ?? 0,
        width: w || undefined, height: h || undefined,
        char: o.char || (w ? '#' : undefined),
        shape: parsedShape || undefined,
        description: o.description || '',
        tags: o.tags || [],
        metadata: meta,
        rotation: rot,
        children: {},
        z: o.z ?? undefined,
        height_3d: o.height_3d ?? undefined,
      },
      parsedShape, w, h,
    };
  }

  return {
    node: {
      id: o.id, name: o.name,
      description: o.description || '',
      tags: o.tags || [],
      metadata: meta,
      children: {},
    },
  };
}

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
