# MapCraft — Building Generation Skill

## Overview
This skill describes how to create 3D buildings using the MapCraft MCP server for planning and `building-utils.js` for 3D generation.

## Step 1: Plan in MCP

Use MCP tools to plan the building layout. All coordinates in **meters**.

### Structure hierarchy
```
root/
  building/              (container)
    prizemi/             (container, same position as patro)
      rooms, doors, windows, furniture
    patro/               (container, same position as prizemi)
      rooms, doors, windows, furniture
    garaz/               (container, adjacent)
```

### Place rooms first, then doors/windows, then furniture
```
place_objects(path="building/prizemi", objects=[
  // Rooms
  { id: "obyvak", name: "Obývák", x: 0, y: 3, width: 10, height: 8, char: "O", is_container: true, tags: ["room"] },
  { id: "vstup",  name: "Vstup",  x: 4, y: 0, width: 4,  height: 3, char: "E", tags: ["structural"] },
  // Doors — ON the wall line, can overlap rooms
  { id: "d_vstup_obyvak", name: "Dveře vstup→obývák", x: 5, y: 3, width: 1.2, height: 0.2, char: "D", tags: ["door"], metadata: "{\"style\":\"open\"}" },
  // Windows — ON the wall line (y=0 or y=max or x=0 or x=max)
  { id: "w_jih", name: "Okno jih", x: 3, y: 11, width: 2.5, height: 0.1, char: "o", tags: ["window"], metadata: "{\"sill_height\":0.4,\"win_height\":2.2}" },
  // Furniture — inside rooms
  { id: "pohovka", name: "Pohovka", x: 6, y: 5, width: 2.2, height: 0.8, char: "c", tags: ["furniture"] },
])
```

### Verify after placement
- `check_collision(path="building/prizemi", exclude_tags=["door","window","furniture"])` — rooms must not overlap
- `get_ascii(path="building/prizemi")` — visual check that furniture doesn't block doors

## Step 2: Generate 3D using building-utils.js

Import utilities:
```js
import { wallWithOpenings, addWindow, addDoor, addFloor, addCeiling, addStairs, addFlatRoof, MAT, box, plane } from './building-utils.js';
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

### Stairs
```js
addStairs(group, {
  x: 8.5, z: 0.5,       // from MCP position
  width: 2.5, depth: 4,  // from MCP size
  floorHeight: 3,
  direction: 'south',    // from MCP metadata
});
```

### Floor, ceiling, roof
```js
addFloor(group, 0, 0, 12, 12, 0);              // ground floor
addFloor(group, 0, 0, 12, 12, 3);              // 2nd floor
addCeiling(group, 0, 0, 12, 12, 3, 0);         // ground floor ceiling
addCeiling(group, 0, 0, 12, 12, 3, 3);         // 2nd floor ceiling
addFlatRoof(group, 0, 0, 12, 12, 6);           // roof at top
```

## Common mistakes to avoid
1. **Furniture blocking doors** — always plan furniture in MCP first, verify with get_ascii
2. **Forgetting wall openings** — every door/window needs a matching opening in wallWithOpenings
3. **Stairs direction wrong** — always set direction in MCP metadata, use it in addStairs
4. **Window not visible from outside** — use wallWithOpenings to create the hole, then addWindow for glass
5. **Overlapping rooms on same floor** — verify with check_collision after placing rooms
