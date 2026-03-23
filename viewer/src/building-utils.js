import * as THREE from 'three';

const DS = THREE.FrontSide;

// ════════════════════════════════════════════════
// MATERIALS — shared default palette
// ════════════════════════════════════════════════

export const MAT = {
  wallOuter: new THREE.MeshLambertMaterial({ color: 0xe0d8c8, side: DS }),
  wallInner: new THREE.MeshLambertMaterial({ color: 0xf5f2ec, side: DS }),
  wallBathroom: new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS }),
  wallAccent: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS }),
  floor: new THREE.MeshLambertMaterial({ color: 0xc4a06a, side: DS }),
  floorDark: new THREE.MeshLambertMaterial({ color: 0x907050, side: DS }),
  floorBath: new THREE.MeshLambertMaterial({ color: 0xc8c8d0, side: DS }),
  floorTerrace: new THREE.MeshLambertMaterial({ color: 0xb09070, side: DS }),
  ceiling: new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS }),
  roof: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  window: new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.35, transparent: true, side: DS }),
  windowFrame: new THREE.MeshLambertMaterial({ color: 0x222222, side: DS }),
  door: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS }),
  doorEntrance: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  stairs: new THREE.MeshLambertMaterial({ color: 0x888888, side: DS }),
  stairRail: new THREE.MeshLambertMaterial({ color: 0x444444, side: DS }),
};

// ════════════════════════════════════════════════
// PRIMITIVES
// ════════════════════════════════════════════════

export function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

export function plane(w, h, mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat.clone());
  m.material.polygonOffset = true;
  m.material.polygonOffsetFactor = -1;
  m.material.polygonOffsetUnits = -1;
  return m;
}

// ════════════════════════════════════════════════
// WALL WITH OPENINGS — 2D grid subtraction approach
// ════════════════════════════════════════════════

/**
 * Build a wall with holes for doors and windows.
 * Works by dividing the wall face into a 2D grid (length × height)
 * and subtracting openings, then generating minimal box segments.
 *
 * @param {THREE.Group} group
 * @param {object} opts
 * @param {string} opts.axis - 'x' (wall along X, thin in Z) or 'z' (wall along Z, thin in X)
 * @param {number} opts.x - wall position X
 * @param {number} opts.z - wall position Z
 * @param {number} opts.length - wall length along axis
 * @param {number} opts.height - wall height
 * @param {number} opts.y - floor Y offset (default 0)
 * @param {number} opts.thickness - wall thickness (default 0.15)
 * @param {THREE.Material} opts.material
 * @param {Array} opts.openings - array of opening specs:
 *   { start, end, bottom?, top? }
 *   start/end = position along wall (0..length)
 *   bottom = bottom of hole from floor (default 0 = floor level)
 *   top = top of hole from floor (default = wall height = full cut)
 *
 * Handles any combination: doors (bottom=0), windows (bottom=sill),
 * multiple openings at different heights on the same wall, overlapping ranges, etc.
 */
export function wallWithOpenings(group, opts) {
  const {
    axis, x, z, length, height,
    y = 0, thickness = 0.15,
    material = MAT.wallOuter,
    openings = []
  } = opts;

  if (openings.length === 0) {
    addWallSeg(group, axis, x, z, 0, length, 0, height, y, thickness, material);
    return;
  }

  // Collect all unique horizontal split points
  const hSplits = new Set([0, length]);
  // Collect all unique vertical split points
  const vSplits = new Set([0, height]);

  for (const op of openings) {
    const s = Math.max(0, op.start);
    const e = Math.min(length, op.end);
    const b = Math.max(0, op.bottom ?? 0);
    const t = Math.min(height, op.top ?? height);
    hSplits.add(s);
    hSplits.add(e);
    vSplits.add(b);
    vSplits.add(t);
  }

  const hs = [...hSplits].sort((a, b) => a - b);
  const vs = [...vSplits].sort((a, b) => a - b);

  // For each cell in the grid, check if it's inside any opening
  for (let hi = 0; hi < hs.length - 1; hi++) {
    for (let vi = 0; vi < vs.length - 1; vi++) {
      const cellLeft = hs[hi];
      const cellRight = hs[hi + 1];
      const cellBottom = vs[vi];
      const cellTop = vs[vi + 1];

      const cellW = cellRight - cellLeft;
      const cellH = cellTop - cellBottom;
      if (cellW <= 0.001 || cellH <= 0.001) continue;

      // Check if this cell is inside any opening
      let isOpen = false;
      for (const op of openings) {
        const os = Math.max(0, op.start);
        const oe = Math.min(length, op.end);
        const ob = Math.max(0, op.bottom ?? 0);
        const ot = Math.min(height, op.top ?? height);

        if (cellLeft >= os && cellRight <= oe && cellBottom >= ob && cellTop <= ot) {
          isOpen = true;
          break;
        }
      }

      if (!isOpen) {
        addWallSeg(group, axis, x, z, cellLeft, cellW, cellBottom, cellH, y, thickness, material);
      }
    }
  }
}

function addWallSeg(group, axis, wx, wz, offset, segLen, segBottom, segH, floorY, thickness, material) {
  if (segLen <= 0.001 || segH <= 0.001) return;

  if (axis === 'x') {
    // Wall runs along X, thin in Z
    const w = box(segLen, segH, thickness, material);
    w.position.set(wx + offset + segLen / 2, floorY + segBottom + segH / 2, wz);
    group.add(w);
  } else {
    // Wall runs along Z, thin in X
    const w = box(thickness, segH, segLen, material);
    w.position.set(wx, floorY + segBottom + segH / 2, wz + offset + segLen / 2);
    group.add(w);
  }
}

// ════════════════════════════════════════════════
// WINDOW — glass + frame on wall surface
// ════════════════════════════════════════════════

/**
 * @param {object} opts
 * @param {string} opts.axis - 'x' or 'z'
 * @param {number} opts.x, opts.z - wall position
 * @param {number} opts.at - center position along wall
 * @param {number} opts.width - window width
 * @param {number} opts.sillHeight - bottom from floor
 * @param {number} opts.winHeight - glass height
 * @param {number} opts.y - floor Y offset (default 0)
 */
export function addWindow(group, opts) {
  const {
    axis, x, z, at, width: w, sillHeight, winHeight: h,
    y = 0,
    glassMat = MAT.window,
    frameMat = MAT.windowFrame,
  } = opts;

  const fy = y + sillHeight;
  const off = 0.08;

  if (axis === 'x') {
    const glass = plane(w, h, glassMat);
    glass.position.set(x + at, fy + h / 2, z + off);
    group.add(glass);
    frameBox(group, x + at, fy, z + off, w, h, 'x', frameMat);
  } else {
    const glass = plane(w, h, glassMat);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(x + off, fy + h / 2, z + at);
    group.add(glass);
    frameBox(group, x + off, fy, z + at, w, h, 'z', frameMat);
  }
}

function frameBox(group, cx, cy, cz, w, h, axis, mat) {
  if (axis === 'x') {
    group.add(pos(box(w + 0.04, 0.03, 0.05, mat), cx, cy + h, cz));
    group.add(pos(box(w + 0.04, 0.03, 0.05, mat), cx, cy, cz));
    group.add(pos(box(0.03, h, 0.05, mat), cx - w / 2, cy + h / 2, cz));
    group.add(pos(box(0.03, h, 0.05, mat), cx + w / 2, cy + h / 2, cz));
  } else {
    group.add(pos(box(0.05, 0.03, w + 0.04, mat), cx, cy + h, cz));
    group.add(pos(box(0.05, 0.03, w + 0.04, mat), cx, cy, cz));
    group.add(pos(box(0.05, h, 0.03, mat), cx, cy + h / 2, cz - w / 2));
    group.add(pos(box(0.05, h, 0.03, mat), cx, cy + h / 2, cz + w / 2));
  }
}

function pos(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// ════════════════════════════════════════════════
// DOOR — panel in opening
// ════════════════════════════════════════════════

/**
 * @param {object} opts
 * @param {string} opts.axis - 'x' or 'z'
 * @param {number} opts.x, opts.z - wall position
 * @param {number} opts.at - center along wall
 * @param {number} opts.width - door width
 * @param {number} opts.doorHeight - (default 2.1)
 * @param {number} opts.y - floor Y offset (default 0)
 */
export function addDoor(group, opts) {
  const {
    axis, x, z, at, width: w,
    doorHeight = 2.1, y = 0,
    material = MAT.door,
  } = opts;

  if (axis === 'x') {
    group.add(pos(box(w, doorHeight, 0.06, material), x + at, y + doorHeight / 2, z));
  } else {
    group.add(pos(box(0.06, doorHeight, w, material), x, y + doorHeight / 2, z + at));
  }
}

// ════════════════════════════════════════════════
// FLOOR & CEILING
// ════════════════════════════════════════════════

export function addFloor(group, x, z, w, d, y = 0, material = MAT.floor) {
  // Floor slab top at y+0.13 — leaves gap so objects at y+0.15 don't z-fight
  group.add(pos(box(w, 0.13, d, material), x + w / 2, y + 0.065, z + d / 2));
}

export function addCeiling(group, x, z, w, d, floorHeight, y = 0, material = MAT.ceiling) {
  const c = plane(w, d, material);
  c.rotation.x = Math.PI / 2;
  // Offset down enough so beams/objects at floorHeight don't z-fight
  c.position.set(x + w / 2, y + floorHeight - 0.03, z + d / 2);
  group.add(c);
}

export function addFloorOverlay(group, x, z, w, d, y = 0, material = MAT.floorDark) {
  const f = plane(w, d, material);
  f.rotation.x = -Math.PI / 2;
  f.position.set(x + w / 2, y + 0.16, z + d / 2);
  group.add(f);
}

// ════════════════════════════════════════════════
// STAIR FLIGHT — single straight run of steps
// ════════════════════════════════════════════════

/**
 * Build a single flight of stairs from point A to point B.
 * Steps are generated between (startX, startZ) at startY and (endX, endZ) at endY.
 *
 * @param {THREE.Group} group
 * @param {object} opts
 * @param {number} opts.startX, opts.startZ - bottom of flight (3D x, z)
 * @param {number} opts.endX, opts.endZ - top of flight (3D x, z)
 * @param {number} opts.startY - Y at bottom (floor level)
 * @param {number} opts.endY - Y at top
 * @param {number} opts.width - step width (perpendicular to direction)
 * @param {number} opts.steps - number of steps (default: auto from height)
 */
export function addStairFlight(group, opts) {
  const {
    startX, startZ, endX, endZ,
    startY, endY, width,
    steps: stepsOpt,
    material = MAT.stairs,
    railMaterial = MAT.stairRail,
  } = opts;

  const rise = endY - startY;
  const dx = endX - startX;
  const dz = endZ - startZ;
  const runLen = Math.sqrt(dx * dx + dz * dz);
  const steps = stepsOpt || Math.max(3, Math.round(rise / 0.18)); // ~18cm per step
  const stepH = rise / steps;
  const stepD = runLen / steps;

  // Direction unit vector
  const dirX = dx / runLen;
  const dirZ = dz / runLen;
  // Perpendicular (for width)
  const perpX = -dirZ;
  const perpZ = dirX;

  for (let s = 0; s < steps; s++) {
    const cx = startX + dirX * (s + 0.5) * stepD;
    const cz = startZ + dirZ * (s + 0.5) * stepD;
    const cy = startY + s * stepH + stepH / 2;

    // Step is a box: width along perpendicular, depth along direction
    const stepMesh = box(width, stepH, stepD, material);
    // Rotate to face the direction
    stepMesh.rotation.y = -Math.atan2(dirX, dirZ);
    stepMesh.position.set(cx, cy, cz);
    group.add(stepMesh);
  }

  // Railings on both sides
  for (const side of [-1, 1]) {
    const rOff = side * (width / 2 + 0.05);
    for (let s = 0; s <= steps; s += Math.max(1, Math.floor(steps / 5))) {
      const rx = startX + dirX * s * stepD + perpX * rOff;
      const rz = startZ + dirZ * s * stepD + perpZ * rOff;
      const ry = startY + s * stepH;
      const p = box(0.04, 0.9, 0.04, railMaterial);
      p.position.set(rx, ry + 0.45, rz);
      group.add(p);
    }
  }
}

/**
 * Build a landing platform.
 *
 * @param {number} opts.x, opts.z - center position
 * @param {number} opts.y - height
 * @param {number} opts.width, opts.depth - platform size
 */
export function addStairLanding(group, opts) {
  const { x, z, y, width, depth, material = MAT.stairs } = opts;
  group.add(pos(box(width, 0.15, depth, material), x, y, z));
}

/**
 * Convenience: build a U-turn staircase from entry/exit points.
 * Entry and exit are on the SAME side. Stairs go away, turn on landing, come back.
 *
 * @param {object} opts
 * @param {number} opts.x, opts.z - stairwell origin (top-left corner)
 * @param {number} opts.width - stairwell width (along the entry side)
 * @param {number} opts.depth - stairwell depth (perpendicular to entry)
 * @param {number} opts.entryY - Y at entry (lower floor)
 * @param {number} opts.exitY - Y at exit (upper floor)
 * @param {string} opts.entrySide - 'north'|'south'|'east'|'west' — which side has entry/exit
 * @param {number} opts.entryX - entry position along the entry side (relative to stairwell origin along that side)
 * @param {number} opts.exitX - exit position along the entry side
 * @param {number} opts.flightWidth - width of each flight (default: width/2 - 0.2)
 */
export function addUTurnStairs(group, opts) {
  const {
    x, z, width, depth,
    entryY, exitY,
    entrySide = 'north',
    flightWidth: fw,
    material = MAT.stairs,
    railMaterial = MAT.stairRail,
  } = opts;

  const midY = (entryY + exitY) / 2;
  const flightW = fw || (width / 2 - 0.15);

  // Compute start/end/landing positions based on entry side
  let f1Start, f1End, f2Start, f2End, landCenter;

  if (entrySide === 'north') {
    // Entry at z=z (north), flights go south then back north
    f1Start = { x: x + width * 0.25, z: z + 0.3 };
    f1End = { x: x + width * 0.25, z: z + depth - 0.5 };
    landCenter = { x: x + width / 2, z: z + depth - 0.5 };
    f2Start = { x: x + width * 0.75, z: z + depth - 0.5 };
    f2End = { x: x + width * 0.75, z: z + 0.3 };
  } else if (entrySide === 'south') {
    f1Start = { x: x + width * 0.25, z: z + depth - 0.3 };
    f1End = { x: x + width * 0.25, z: z + 0.5 };
    landCenter = { x: x + width / 2, z: z + 0.5 };
    f2Start = { x: x + width * 0.75, z: z + 0.5 };
    f2End = { x: x + width * 0.75, z: z + depth - 0.3 };
  } else if (entrySide === 'west') {
    f1Start = { x: x + 0.3, z: z + depth * 0.25 };
    f1End = { x: x + width - 0.5, z: z + depth * 0.25 };
    landCenter = { x: x + width - 0.5, z: z + depth / 2 };
    f2Start = { x: x + width - 0.5, z: z + depth * 0.75 };
    f2End = { x: x + 0.3, z: z + depth * 0.75 };
  } else { // east
    f1Start = { x: x + width - 0.3, z: z + depth * 0.25 };
    f1End = { x: x + 0.5, z: z + depth * 0.25 };
    landCenter = { x: x + 0.5, z: z + depth / 2 };
    f2Start = { x: x + 0.5, z: z + depth * 0.75 };
    f2End = { x: x + width - 0.3, z: z + depth * 0.75 };
  }

  // Flight 1: entry → landing
  addStairFlight(group, {
    startX: f1Start.x, startZ: f1Start.z, startY: entryY,
    endX: f1End.x, endZ: f1End.z, endY: midY,
    width: flightW, material, railMaterial,
  });

  // Landing
  const landW = (entrySide === 'north' || entrySide === 'south') ? width - 0.4 : depth * 0.3;
  const landD = (entrySide === 'north' || entrySide === 'south') ? depth * 0.3 : depth - 0.4;
  addStairLanding(group, {
    x: landCenter.x, z: landCenter.z, y: midY,
    width: landW, depth: landD, material,
  });

  // Flight 2: landing → exit
  addStairFlight(group, {
    startX: f2Start.x, startZ: f2Start.z, startY: midY,
    endX: f2End.x, endZ: f2End.z, endY: exitY,
    width: flightW, material, railMaterial,
  });
}

// ════════════════════════════════════════════════
// BOX WITH OPENINGS — 3D generalization of wallWithOpenings
// ════════════════════════════════════════════════

/**
 * Build a 3D box with rectangular openings cut out of any face.
 * Each face is treated as a 2D grid (like wallWithOpenings) and
 * only solid segments are generated. This replaces the broken
 * pattern of placing a smaller box inside a larger one (which
 * is invisible in Three.js because the outer box occludes it).
 *
 * Use cases: fireplace with open front, floor with stairwell hole,
 * cabinet with door opening, any solid with cutouts.
 *
 * @param {THREE.Group} group
 * @param {object} opts
 * @param {number} opts.x - box origin X (left)
 * @param {number} opts.y - box origin Y (bottom)
 * @param {number} opts.z - box origin Z (front)
 * @param {number} opts.width - size along X
 * @param {number} opts.height - size along Y
 * @param {number} opts.depth - size along Z
 * @param {THREE.Material} opts.material
 * @param {Array} opts.openings - array of opening specs:
 *   {
 *     face: 'front'|'back'|'left'|'right'|'top'|'bottom',
 *     start: number,   // position along face width (0 = left/front edge)
 *     end: number,     // end position along face width
 *     bottom: number,  // position along face height from bottom (default 0)
 *     top: number,     // end position along face height (default = face height)
 *   }
 *
 * Face coordinate systems:
 *   front  (z=min): width=X(0..w),  height=Y(0..h)
 *   back   (z=max): width=X(0..w),  height=Y(0..h)
 *   left   (x=min): width=Z(0..d),  height=Y(0..h)
 *   right  (x=max): width=Z(0..d),  height=Y(0..h)
 *   top    (y=max): width=X(0..w),  height=Z(0..d)
 *   bottom (y=min): width=X(0..w),  height=Z(0..d)
 */
export function boxWithOpenings(group, opts) {
  const {
    x, y, z,
    width: W, height: H, depth: D,
    material = MAT.wallOuter,
    openings = []
  } = opts;

  // Group openings by face
  const faceOpenings = { front: [], back: [], left: [], right: [], top: [], bottom: [] };
  for (const op of openings) {
    if (faceOpenings[op.face]) faceOpenings[op.face].push(op);
  }

  // Face definitions: [faceWidth, faceHeight, buildSegment function]
  const faces = {
    front:  { fw: W, fh: H, build: (s, e, b, t) => _seg(group, x+s+(e-s)/2, y+b+(t-b)/2, z,           e-s, t-b, 0.001, material) },
    back:   { fw: W, fh: H, build: (s, e, b, t) => _seg(group, x+s+(e-s)/2, y+b+(t-b)/2, z+D,         e-s, t-b, 0.001, material) },
    left:   { fw: D, fh: H, build: (s, e, b, t) => _seg(group, x,           y+b+(t-b)/2, z+s+(e-s)/2, 0.001, t-b, e-s, material) },
    right:  { fw: D, fh: H, build: (s, e, b, t) => _seg(group, x+W,         y+b+(t-b)/2, z+s+(e-s)/2, 0.001, t-b, e-s, material) },
    top:    { fw: W, fh: D, build: (s, e, b, t) => _seg(group, x+s+(e-s)/2, y+H,         z+b+(t-b)/2, e-s, 0.001, t-b, material) },
    bottom: { fw: W, fh: D, build: (s, e, b, t) => _seg(group, x+s+(e-s)/2, y,           z+b+(t-b)/2, e-s, 0.001, t-b, material) },
  };

  for (const [faceName, { fw, fh, build }] of Object.entries(faces)) {
    const ops = faceOpenings[faceName];
    _buildFaceWithOpenings(fw, fh, ops, build);
  }
}

function _buildFaceWithOpenings(faceW, faceH, openings, buildSeg) {
  if (openings.length === 0) {
    buildSeg(0, faceW, 0, faceH);
    return;
  }

  const hSplits = new Set([0, faceW]);
  const vSplits = new Set([0, faceH]);

  for (const op of openings) {
    const s = Math.max(0, op.start);
    const e = Math.min(faceW, op.end);
    const b = Math.max(0, op.bottom ?? 0);
    const t = Math.min(faceH, op.top ?? faceH);
    hSplits.add(s); hSplits.add(e);
    vSplits.add(b); vSplits.add(t);
  }

  const hs = [...hSplits].sort((a, b) => a - b);
  const vs = [...vSplits].sort((a, b) => a - b);

  for (let hi = 0; hi < hs.length - 1; hi++) {
    for (let vi = 0; vi < vs.length - 1; vi++) {
      const cL = hs[hi], cR = hs[hi + 1];
      const cB = vs[vi], cT = vs[vi + 1];
      if (cR - cL <= 0.001 || cT - cB <= 0.001) continue;

      let isOpen = false;
      for (const op of openings) {
        const os = Math.max(0, op.start);
        const oe = Math.min(faceW, op.end);
        const ob = Math.max(0, op.bottom ?? 0);
        const ot = Math.min(faceH, op.top ?? faceH);
        if (cL >= os && cR <= oe && cB >= ob && cT <= ot) {
          isOpen = true;
          break;
        }
      }

      if (!isOpen) buildSeg(cL, cR, cB, cT);
    }
  }
}

function _seg(group, cx, cy, cz, w, h, d, material) {
  if (w <= 0.001 && d <= 0.001) return;
  // For face segments, one dimension is ~0 — use plane instead of box for efficiency
  if (w <= 0.001) {
    const p = plane(d, h, material);
    p.rotation.y = Math.PI / 2;
    p.position.set(cx, cy, cz);
    group.add(p);
  } else if (d <= 0.001) {
    const p = plane(w, h, material);
    p.position.set(cx, cy, cz);
    group.add(p);
  } else if (h <= 0.001) {
    const p = plane(w, d, material);
    p.rotation.x = Math.PI / 2;
    p.position.set(cx, cy, cz);
    group.add(p);
  } else {
    const b = box(w, h, d, material);
    b.position.set(cx, cy, cz);
    group.add(b);
  }
}

// ════════════════════════════════════════════════
// FLAT ROOF
// ════════════════════════════════════════════════

export function addFlatRoof(group, x, z, w, d, y, overhang = 0.3, material = MAT.roof) {
  group.add(pos(box(w + overhang * 2, 0.25, d + overhang * 2, material), x + w / 2, y + 0.125, z + d / 2));
}
