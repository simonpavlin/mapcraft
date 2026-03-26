# MapCraft — Building Generation Skill

## Overview
This skill describes how to create 3D buildings using the MapCraft MCP server for planning and `building-utils.js` for 3D generation.

## Step 0: Start a project & prepare templates

**Always** begin with `create_project` to start fresh. Then create folders:
1. **Floor folders** — one per floor (folder nodes, no spatial data)
2. **Templates folder** — reusable components (doors, windows, furniture groups)

```
create_project("Rodinný dům")
place_object(path="rodinny_dum", id="prizemi", name="Přízemí")           // folder
place_object(path="rodinny_dum", id="sablony", name="Šablony")          // folder
```

### Design reusable templates first
Before placing anything in the main plan, design reusable components in the templates folder.
Composite templates (door, window) use a parent WITHOUT char as bounding-box container,
with children for each part. Simple templates (furniture) use char directly.

```
// Door template — composite: parent = bounding box, children = parts
place_object(path="rodinny_dum/sablony", id="dvere_80", name="Dveře 80cm",
  x=0, y=0, width=0.8, height=1, tags=["door","template"])          // NO char — container
place_object(path="rodinny_dum/sablony/dvere_80", id="body", name="Dveře 80cm",
  x=0, y=0, width=0.8, height=0.2, char="D", tags=["door"])        // visible panel
place_object(path="rodinny_dum/sablony/dvere_80", id="clr", name="Průchod",
  x=0, y=0.2, width=0.8, height=0.8, char="_", tags=["clearance"]) // clearance zone

// Window template — composite
place_object(path="rodinny_dum/sablony", id="okno_150", name="Okno 150cm",
  x=0, y=0, width=1.5, height=0.7, tags=["window","template"],
  metadata={"sill_height":0.9,"win_height":1.5})                    // NO char — container
place_object(path="rodinny_dum/sablony/okno_150", id="body", name="Okno 150cm",
  x=0, y=0, width=1.5, height=0.1, char="o", tags=["window"])      // visible glass
place_object(path="rodinny_dum/sablony/okno_150", id="clr", name="Volný prostor",
  x=0, y=0.1, width=1.5, height=0.6, char="_", tags=["clearance"]) // furniture-free zone

// Furniture: armchair — simple, char directly on object
place_object(path="rodinny_dum/sablony", id="kreslo", name="Křeslo",
  x=0, y=0, width=0.8, height=0.9, char="K", tags=["furniture","template"], rotation=0)
```

### Stamp templates to actual locations
Use `stamp_object` to copy templates with position and rotation:
```
stamp_object(source="rodinny_dum/sablony/dvere_80", target="rodinny_dum/prizemi", id="d_obyvak", x=5, y=3, rotation=0)
stamp_object(source="rodinny_dum/sablony/dvere_80", target="rodinny_dum/prizemi", id="d_loznice", x=8, y=3, rotation=90)
stamp_object(source="rodinny_dum/sablony/kreslo", target="rodinny_dum/prizemi/obyvak", id="kreslo1", x=2, y=3, rotation=180)
```

### Rotation
- 0° = facing north (↑), 90° = east (→), 180° = south (↓), 270° = west (←)
- Rotation arrows are visible in the UI floorplan view
- Use for furniture direction: chair facing table, sofa facing TV
- When stamping at 90° or 270°, width/height are automatically swapped

## Step 1: Plan in MCP

Use MCP tools to plan the building layout. All coordinates in **meters**.
Plan in layers — don't try to specify everything at once:

1. **Templates** — design reusable doors, windows, furniture with clearance zones
2. **Rooms** — place rooms, verify with check_collision
3. **Doors & windows** — stamp templates or place directly on wall boundaries
4. **Clearance zones** — included in templates, or add manually with tag `clearance`
5. **Furniture** — stamp templates or place directly, check_collision against clearance zones
6. **Wall details** (optional) — use wall containers for pictures, shelves, outlets on specific walls
7. **3D generation** — only now write Three.js code

### Hierarchy — unified node model
Everything is a **node**. Two kinds:
- **Folder** (no x,y,width,height,char) — purely organizational (floors, template groups)
- **Spatial** (has position and dimensions) — rooms, doors, furniture, etc.

#### Best practice: simple vs. composite objects

**Simple object** — single shape (table, chair, wall segment). Use spatial node directly:
```
stul (spatial 1.2×0.8m, char="S", tags=["furniture"])
```

**Composite object** — multiple parts that form one unit (door + clearance, swing + safety zone).
Create a spatial parent WITHOUT char as a bounding-box container, put parts as children WITH char:
```
dvere_80 (spatial 0.8×1m, NO char, tags=["door","template"])   ← container, defines bounds
  ├── body (spatial 0.8×0.2m, char="D")                        ← visible door panel
  └── clr (spatial 0.8×0.8m, tags=["clearance"])               ← clearance zone
```
This way all parts fit within parent bounds, and the parent serves as a transform group — like an empty GameObject in Unity.

**Room / space** — a spatial area that contains other objects. Parent HAS char and defines the space:
```
obyvak (spatial 10×8m, char="O", tags=["room"])   ← IS the rectangle + container
  ├── stul (spatial 1.2×0.8m, char="S")
  └── pohovka (spatial 2.2×0.8m, char="c")
```
Room bounds define where children (furniture) can be placed. Children must fit within parent bounds.

#### When to use which pattern
- **Room, building, floor area** → spatial WITH char (the parent IS the shape)
- **Door, window, swing, bench** → spatial WITHOUT char (parent = bounding box, children = parts)
- **Table, chair, rug** → spatial WITH char, no children needed

```
Projekt (folder)
  sablony/               (folder — templates)
    dvere_80/            (spatial NO char — composite: body + clearance as children)
    okno_150/            (spatial NO char — composite: glass + clearance as children)
    kreslo               (spatial WITH char — simple object)
  prizemi/               (folder — ground floor)
    obyvak/              (spatial WITH char — room, children = furniture)
    kuchyne/             (spatial WITH char — room)
    d_obyvak_kuchyne     (stamped from template)
  patro/                 (folder — upper floor)
    loznice/             (spatial — bedroom)
    koupelna/            (spatial — bathroom)
```

### Place rooms first, then doors/windows, then furniture
```
place_objects(path="rodinny_dum/prizemi", objects=[
  // Rooms — spatial nodes
  { id: "obyvak", name: "Obývák", x: 0, y: 3, width: 10, height: 8, char: "O", tags: ["room"] },
  { id: "vstup",  name: "Vstup",  x: 4, y: 0, width: 4,  height: 3, char: "E", tags: ["structural"] },
  // Doors — ON the wall line, can overlap rooms
  { id: "d_vstup_obyvak", name: "Dveře vstup→obývák", x: 5, y: 3, width: 1.2, height: 0.2, char: "D", tags: ["door"], metadata: {"style":"open"} },
  // Windows — ON the wall line
  { id: "w_jih", name: "Okno jih", x: 3, y: 11, width: 2.5, height: 0.1, char: "o", tags: ["window"], metadata: {"sill_height":0.4,"win_height":2.2} },
  // Furniture — inside rooms
  { id: "pohovka", name: "Pohovka", x: 6, y: 5, width: 2.2, height: 0.8, char: "c", tags: ["furniture"] },
])
```

### Verify after placement
- `check_collision(path="rodinny_dum/prizemi", exclude_tags=["door","window","furniture"])` — rooms must not overlap
- `get_ascii(path="rodinny_dum/prizemi")` — visual check that furniture doesn't block doors

### Additional tools
- `duplicate_object` — deep copy any node with all children
- `find_objects` — search by name or tags across the tree
- `rename_object` — change an object's ID
- `move_object` — reposition or reparent to different parent

### Clearance zones — verify walkability
After placing doors, add clearance objects to reserve space for walking. Then verify furniture doesn't block them.

```
// Reserve space in front of door
place_object(path="rodinny_dum/prizemi/obyvak", id="clr_door1",
  x=3.2, y=0, width=1.6, height=1.5, char=" ", tags=["clearance"])

// Reserve corridor through room
place_object(path="rodinny_dum/prizemi/obyvak", id="clr_corridor",
  x=3.2, y=1.5, width=1.6, height=3, char=" ", tags=["clearance"])
```

After placing furniture, check that clearance zones are free:
```
check_collision(path="obyvak", x=3.2, y=0, width=1.6, height=4.5,
  exclude_tags=["door","window","clearance"])
→ should return only flat objects (rugs) — anything else is blocking the path
```

### Wall containers — detail wall surfaces
To plan what goes on a specific wall (pictures, shelves, outlets, switches), create
a container for that wall. Its children use wall-local coordinates: x = position along
wall, y = height from floor.

```
place_object(path="obyvak", id="stena_zapad",
  x=0, y=0, width=0.1, height=6,
  char=".", tags=["wall"],
  metadata={"wall_height": 2.8, "description": "West wall with fireplace"})

place_objects(path="obyvak/stena_zapad", objects=[
  { id: "obraz1", x: 1.0, y: 1.4, width: 0.8, height: 0.6, char: "#", tags: ["decor"] },
  { id: "police", x: 3.0, y: 1.8, width: 1.5, height: 0.3, char: "=", tags: ["furniture"] },
  { id: "zasuvka", x: 4.5, y: 0.3, width: 0.1, height: 0.1, char: ".", tags: ["electrical"] },
])
```

Then view the wall layout:
```
get_ascii(path="obyvak/stena_zapad")
→ shows wall as 2D surface (width along wall × height)
→ check_collision works too — detects overlapping pictures etc.
```

This does NOT require any MCP changes — it's a convention using existing containers.
Wall containers appear as thin strips in the room plan view, which is fine.

## Step 2: Generate 3D using building-utils.js

Import utilities:
```js
import { wallWithOpenings, addWindow, addDoor, addFloor, addCeiling, addFlatRoof, MAT, box, plane } from './building-utils.js';
```

### Walls with openings (doors & windows)

**This is the key function.** Instead of manually splitting walls into segments, describe the wall and its openings:

```js
// South wall of obývák — 10m long, 3m high, with a panorama window and a sliding door
wallWithOpenings(group, {
  axis: 'x',           // wall runs along X axis
  x: 0, z: 11,         // wall position (from MCP: y=11 → z=11)
  length: 10,           // wall length
  height: 3,            // wall height
  material: MAT.wallOuter,
  openings: [
    { start: 3, end: 5.5, bottom: 0.4, top: 2.6 },   // window: from MCP w_jih
    { start: 7, end: 9 },                               // door: full height opening
  ]
});
```

The function uses 2D grid subtraction — it splits the wall face into cells based on opening boundaries,
then generates solid segments only for cells NOT inside any opening. This correctly handles:
- Doors (bottom=0, top=doorHeight) — lintel auto-generated above
- Windows (bottom=sill, top=sill+winHeight) — parapet below + lintel above
- Multiple openings at different heights on the same wall
- Door NEXT TO a window with different heights
- Any number of openings

**IMPORTANT for doors:** Always specify `top` explicitly (e.g. top: 2.1 for a standard door).
If omitted, top defaults to wall height = no lintel above the door.

### Add visual glass and door panels

After `wallWithOpenings` creates the holes, add the visual elements:

```js
// Window glass + frame (centered at x=4.25 along the wall)
addWindow(group, {
  axis: 'x', x: 0, z: 11,
  at: 4.25,              // center position along wall
  width: 2.5,            // from MCP metadata
  sillHeight: 0.4,       // from MCP metadata
  winHeight: 2.2,        // from MCP metadata
});

// Door panel
addDoor(group, {
  axis: 'x', x: 0, z: 11,
  at: 8,                 // center position along wall
  width: 2,
  material: MAT.door,
});
```

### Coordinate mapping: MCP → 3D
- MCP plan-x → 3D x (directly)
- MCP plan-y → 3D z (directly)
- Door/window at MCP `y=0` → on wall at `z=0` (north wall)
- Door/window at MCP `y=maxY` → on wall at `z=maxY` (south wall)
- Door/window at MCP `x=0` → on wall at `x=0` (west wall), axis='z'
- Door/window at MCP `x=maxX` → on wall at `x=maxX` (east wall), axis='z'

### MCP references in code — ALWAYS use this pattern
Every room and furniture block MUST reference its MCP path and use relative coordinates.
This makes it trivial to move rooms later — just change the origin constants.

```js
function furnishLoznice(g) {
  // mcp:loznice (0, 4.5) 3.5×5
  const lx = 0, lz = 4.5;                          // ← room origin from MCP
  // mcp:loznice/postel (0.8, 0.5) 2×2.2
  g.add(p(box(2, 0.35, 2.2, bed), lx + 0.8 + 1, 0.275, lz + 0.5 + 1.1));
  // mcp:loznice/stolek_l (0.2, 0.8) 0.45×0.4
  g.add(p(box(0.45, 0.4, 0.4, wood), lx + 0.2 + 0.225, 0.2, lz + 0.8 + 0.2));
  // mcp:loznice/komoda (0.3, 3.5) 1.2×0.5
  g.add(p(box(1.2, 0.7, 0.5, wood), lx + 0.3 + 0.6, 0.35, lz + 3.5 + 0.25));
}
```

Rules:
- Each room function starts with `const rx = ..., rz = ...;` from MCP room position
- Each furniture line has `// mcp:path (x, y) WxH` comment
- Furniture positions are `rx + mcpLocalX`, `rz + mcpLocalY`
- To move a room: update MCP, then change ONLY `rx, rz` in code — furniture follows
- Walls reference MCP door/window objects: `// mcp:d_loz (3.5, 6)` in wall opening comments

### Stairs — build manually with boxes

There is no stair helper function. Build stairs manually using `box()` in a loop:

```js
// Straight flight: 20 steps, 0.18m rise each, 0.28m deep, 1.2m wide
const steps = 20, stepH = 0.18, stepD = 0.28, stepW = 1.2;
for (let i = 0; i < steps; i++) {
  const step = box(stepW, stepH, stepD, MAT.stairs);
  step.position.set(x + stepW / 2, i * stepH + stepH / 2, z + i * stepD + stepD / 2);
  group.add(step);
}
```

### Floor, ceiling, roof
```js
addFloor(group, 0, 0, 12, 12, 0);              // ground floor
addFloor(group, 0, 0, 12, 12, 3);              // 2nd floor
addCeiling(group, 0, 0, 12, 12, 3, 0);         // ground floor ceiling
addCeiling(group, 0, 0, 12, 12, 3, 3);         // 2nd floor ceiling
addFlatRoof(group, 0, 0, 12, 12, 6);           // roof at top
```

## Use export_json for data-driven 3D code

Instead of manually reading ASCII and typing positions by hand, use `export_json` to get the
full data tree and reference it when writing 3D code.

### Pattern: extract doors/windows for wallWithOpenings
Call `export_json`, then for each wall find all doors and windows that sit on it.
Convert their positions to `openings` array automatically instead of hand-coding each one.

Example workflow:
1. Call `export_json` → get full JSON tree
2. For the north wall of "lod" (z=2, length=15):
   - Find all doors/windows in lod where y=0 (on north boundary)
   - w_north1 at x=3, width=1.5, metadata sill=2, win_height=4 → opening {start:3, end:4.5, bottom:2, top:6}
   - w_north2 at x=7, width=1.5 → opening {start:7, end:8.5, bottom:2, top:6}
   - Write wallWithOpenings with these openings — no manual guessing

### Pattern: extract furniture positions
Instead of `// mcp:loznice/postel (1, 0.3) 1.8×2.2` copied by hand:
- Read postel from export JSON: x=1, y=0.3, width=1.8, height=2.2
- Use directly: `g.add(p(box(1.8, 0.35, 2.2, bed), rx + 1 + 0.9, 0.275, rz + 0.3 + 1.1))`

### When to use export_json
- Before writing walls → extract all doors/windows per wall
- Before writing furniture → extract positions from MCP instead of guessing
- After moving rooms with update_object → re-export to get updated positions
- NOT needed for simple layouts where you remember the positions

## 3D boxes with openings — `boxWithOpenings`

**NEVER place a box inside another box to create a hole/recess.** The inner box is invisible
because the outer geometry occludes it. Always use `boxWithOpenings` to cut openings into solid objects.

```js
import { boxWithOpenings } from './building-utils.js';

// Fireplace — stone block with open front
boxWithOpenings(group, {
  x: 0, y: 0.15, z: 2,
  width: 0.8, height: 1.2, depth: 2,
  material: stoneMat,
  openings: [
    { face: 'front', start: 0.55, end: 1.45, bottom: 0, top: 0.9 }  // firebox opening
  ]
});

// Floor with stairwell hole
boxWithOpenings(group, {
  x: 0, y: 3, z: 0,
  width: 12, height: 0.15, depth: 12,
  material: floorMat,
  openings: [
    { face: 'top', start: 8.5, end: 11.5, bottom: 0.5, top: 5.5 }  // stairwell hole
  ]
});

// Cabinet with door opening
boxWithOpenings(group, {
  x: 2, y: 0, z: 0,
  width: 1.2, height: 1.8, depth: 0.5,
  material: woodMat,
  openings: [
    { face: 'front', start: 0.1, end: 1.1, bottom: 0.5, top: 1.7 }  // glass door area
  ]
});
```

Face coordinate systems:
- **front** (z=min) / **back** (z=max): start/end along X, bottom/top along Y
- **left** (x=min) / **right** (x=max): start/end along Z, bottom/top along Y
- **top** (y=max) / **bottom** (y=min): start/end along X, bottom/top along Z

### When to use boxWithOpenings vs wallWithOpenings
- **wallWithOpenings** — thin walls (doors, windows). Already handles 2D grid subtraction.
- **boxWithOpenings** — thick/solid objects with cutouts (fireplaces, floors with holes, cabinets, arches).

## Common mistakes to avoid
1. **Furniture blocking doors** — always plan furniture in MCP first, verify with get_ascii
2. **Forgetting wall openings** — every door/window needs a matching opening in wallWithOpenings
3. **Stairs not connecting floors** — plan entry/exit in MCP with exact positions, use manual box() loops with explicit startY/endY matching floor heights
4. **Window not visible from outside** — use wallWithOpenings to create the hole, then addWindow for glass
5. **Overlapping rooms on same floor** — verify with check_collision after placing rooms
6. **Skipping verification** — after each batch of rooms, call check_collision. After furniture, call get_ascii(recursive=true). Skipping these leads to overlaps and blocked doors found only in 3D.
7. **Box inside box for holes** — NEVER place a smaller box inside a larger box to create a recess (fireplace opening, cabinet door, etc). The inner box is invisible. Use `boxWithOpenings` instead.
