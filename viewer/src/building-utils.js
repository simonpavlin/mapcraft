import * as THREE from 'three';

const DS = THREE.DoubleSide;

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
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

// ════════════════════════════════════════════════
// WALL WITH OPENINGS
// ════════════════════════════════════════════════

/**
 * Build a wall along one axis with holes for doors/windows.
 *
 * @param {THREE.Group} group - parent group
 * @param {object} opts
 * @param {string} opts.axis - 'x' (wall runs along X, face Z) or 'z' (wall runs along Z, face X)
 * @param {number} opts.x - wall X position
 * @param {number} opts.z - wall Z position
 * @param {number} opts.length - total wall length (along the axis)
 * @param {number} opts.height - wall height
 * @param {number} opts.y - floor Y offset (default 0)
 * @param {number} opts.thickness - wall thickness (default 0.15)
 * @param {THREE.Material} opts.material - wall material
 * @param {Array} opts.openings - array of {start, end, bottom?, top?}
 *   start/end = position along the wall (0..length)
 *   bottom = bottom of opening from floor (default 0)
 *   top = top of opening from floor (default height)
 *
 * Example - wall along Z axis at x=10, 8m long, 3m high, with a door at 2-3m and a window at 5-6.5m:
 *   wallWithOpenings(group, {
 *     axis: 'z', x: 10, z: 0, length: 8, height: 3,
 *     material: MAT.wallOuter,
 *     openings: [
 *       { start: 2, end: 3 },                    // door: full height opening
 *       { start: 5, end: 6.5, bottom: 0.8, top: 2.2 }  // window: partial height
 *     ]
 *   });
 */
export function wallWithOpenings(group, opts) {
  const {
    axis, x, z, length, height,
    y = 0, thickness = 0.15,
    material = MAT.wallOuter,
    openings = []
  } = opts;

  // Sort openings by start position
  const sorted = [...openings].sort((a, b) => a.start - b.start);

  // Build solid segments between openings (full height parts)
  let cursor = 0;
  for (const op of sorted) {
    const start = Math.max(0, op.start);
    const end = Math.min(length, op.end);
    if (start < 0 || end > length || start >= end) continue;

    // Solid wall before this opening
    if (cursor < start) {
      addWallSegment(group, axis, x, z, cursor, start - cursor, height, 0, y, thickness, material);
    }

    const opBottom = op.bottom ?? 0;
    const opTop = op.top ?? height;

    // Wall below opening (e.g. below window sill)
    if (opBottom > 0) {
      addWallSegment(group, axis, x, z, start, end - start, opBottom, 0, y, thickness, material);
    }

    // Wall above opening (e.g. above window/door)
    if (opTop < height) {
      addWallSegment(group, axis, x, z, start, end - start, height - opTop, opTop, y, thickness, material);
    }

    cursor = end;
  }

  // Solid wall after last opening
  if (cursor < length) {
    addWallSegment(group, axis, x, z, cursor, length - cursor, height, 0, y, thickness, material);
  }
}

function addWallSegment(group, axis, wx, wz, offset, segLen, segH, segBottom, floorY, thickness, material) {
  if (segLen <= 0 || segH <= 0) return;

  if (axis === 'z') {
    // Wall runs along Z, thin in X
    const w = box(thickness, segH, segLen, material);
    w.position.set(wx, floorY + segBottom + segH / 2, wz + offset + segLen / 2);
    group.add(w);
  } else {
    // Wall runs along X, thin in Z
    const w = box(segLen, segH, thickness, material);
    w.position.set(wx + offset + segLen / 2, floorY + segBottom + segH / 2, wz);
    group.add(w);
  }
}

// ════════════════════════════════════════════════
// WINDOW
// ════════════════════════════════════════════════

/**
 * Add a window (glass + frame) on a wall surface.
 * Place this AFTER wallWithOpenings — the wall already has the hole,
 * this adds the visual glass and frame.
 *
 * @param {THREE.Group} group
 * @param {object} opts
 * @param {string} opts.axis - 'x' or 'z' (which wall face)
 * @param {number} opts.x - wall X position
 * @param {number} opts.z - wall Z position
 * @param {number} opts.at - position along the wall where window CENTER is
 * @param {number} opts.width - window width
 * @param {number} opts.sillHeight - bottom of glass from floor
 * @param {number} opts.winHeight - height of glass
 * @param {number} opts.y - floor Y offset (default 0)
 * @param {THREE.Material} opts.glassMat - glass material (default MAT.window)
 * @param {THREE.Material} opts.frameMat - frame material (default MAT.windowFrame)
 */
export function addWindow(group, opts) {
  const {
    axis, x, z, at, width: w, sillHeight, winHeight: h,
    y = 0,
    glassMat = MAT.window,
    frameMat = MAT.windowFrame,
  } = opts;

  const fy = y + sillHeight;

  if (axis === 'x') {
    // Window on a wall that runs along X (face is in Z direction)
    const off = 0.08;
    const glass = plane(w, h, glassMat);
    glass.position.set(x + at, fy + h / 2, z + off);
    group.add(glass);
    // Frame
    addFrameX(group, x + at, fy, z + off, w, h, frameMat);
  } else {
    // Window on a wall that runs along Z (face is in X direction)
    const off = 0.08;
    const glass = plane(w, h, glassMat);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(x + off, fy + h / 2, z + at);
    group.add(glass);
    addFrameZ(group, x + off, fy, z + at, w, h, frameMat);
  }
}

function addFrameX(group, cx, cy, cz, w, h, mat) {
  const t = box(w + 0.04, 0.03, 0.05, mat); t.position.set(cx, cy + h, cz); group.add(t);
  const b = box(w + 0.04, 0.03, 0.05, mat); b.position.set(cx, cy, cz); group.add(b);
  const l = box(0.03, h, 0.05, mat); l.position.set(cx - w / 2, cy + h / 2, cz); group.add(l);
  const r = box(0.03, h, 0.05, mat); r.position.set(cx + w / 2, cy + h / 2, cz); group.add(r);
}

function addFrameZ(group, cx, cy, cz, w, h, mat) {
  const t = box(0.05, 0.03, w + 0.04, mat); t.position.set(cx, cy + h, cz); group.add(t);
  const b = box(0.05, 0.03, w + 0.04, mat); b.position.set(cx, cy, cz); group.add(b);
  const l = box(0.05, h, 0.03, mat); l.position.set(cx, cy + h / 2, cz - w / 2); group.add(l);
  const r = box(0.05, h, 0.03, mat); r.position.set(cx, cy + h / 2, cz + w / 2); group.add(r);
}

// ════════════════════════════════════════════════
// DOOR
// ════════════════════════════════════════════════

/**
 * Add a door panel inside a wall opening.
 * The wall should already have an opening at this position.
 *
 * @param {THREE.Group} group
 * @param {object} opts
 * @param {string} opts.axis - 'x' or 'z'
 * @param {number} opts.x - wall X position
 * @param {number} opts.z - wall Z position
 * @param {number} opts.at - position along wall where door CENTER is
 * @param {number} opts.width - door width
 * @param {number} opts.doorHeight - door height (default 2.1)
 * @param {number} opts.y - floor Y offset (default 0)
 * @param {THREE.Material} opts.material - door material (default MAT.door)
 */
export function addDoor(group, opts) {
  const {
    axis, x, z, at, width: w,
    doorHeight = 2.1, y = 0,
    material = MAT.door,
  } = opts;

  if (axis === 'x') {
    const d = box(w, doorHeight, 0.06, material);
    d.position.set(x + at, y + doorHeight / 2, z);
    group.add(d);
  } else {
    const d = box(0.06, doorHeight, w, material);
    d.position.set(x, y + doorHeight / 2, z + at);
    group.add(d);
  }
}

// ════════════════════════════════════════════════
// FLOOR & CEILING
// ════════════════════════════════════════════════

export function addFloor(group, x, z, w, d, y = 0, material = MAT.floor) {
  const f = box(w, 0.15, d, material);
  f.position.set(x + w / 2, y + 0.075, z + d / 2);
  group.add(f);
}

export function addCeiling(group, x, z, w, d, floorHeight, y = 0, material = MAT.ceiling) {
  const c = plane(w, d, material);
  c.rotation.x = Math.PI / 2;
  c.position.set(x + w / 2, y + floorHeight - 0.01, z + d / 2);
  group.add(c);
}

export function addFloorOverlay(group, x, z, w, d, y = 0, material = MAT.floorDark) {
  const f = plane(w, d, material);
  f.rotation.x = -Math.PI / 2;
  f.position.set(x + w / 2, y + 0.16, z + d / 2);
  group.add(f);
}

// ════════════════════════════════════════════════
// STAIRS
// ════════════════════════════════════════════════

/**
 * Build a U-turn staircase.
 *
 * @param {THREE.Group} group
 * @param {object} opts
 * @param {number} opts.x - stairwell X origin
 * @param {number} opts.z - stairwell Z origin
 * @param {number} opts.width - stairwell width (along X)
 * @param {number} opts.depth - stairwell depth (along Z)
 * @param {number} opts.floorHeight - height to climb
 * @param {number} opts.y - starting Y (default 0)
 * @param {string} opts.direction - 'south'|'north'|'east'|'west' — direction of first flight
 * @param {number} opts.stepsPerFlight - steps per flight (default 10)
 */
export function addStairs(group, opts) {
  const {
    x, z, width, depth, floorHeight,
    y = 0, direction = 'south',
    stepsPerFlight = 10,
    material = MAT.stairs,
    railMaterial = MAT.stairRail,
  } = opts;

  const stepH = floorHeight / (stepsPerFlight * 2);
  const margin = 0.2;
  const stepW = width - 0.4; // leave space for rails

  // Determine flight axis based on direction
  const isSouthNorth = direction === 'south' || direction === 'north';
  const flightLen = (isSouthNorth ? depth : width) / 2 - margin;
  const stepD = flightLen / stepsPerFlight;

  const cx = x + width / 2;
  const cz = z + depth / 2;

  const goPositive = direction === 'south' || direction === 'east';

  for (let s = 0; s < stepsPerFlight; s++) {
    const sy = y + s * stepH + stepH / 2;
    const offset = margin + s * stepD;

    const step = box(
      isSouthNorth ? stepW : stepD,
      stepH,
      isSouthNorth ? stepD : stepW,
      material
    );

    if (isSouthNorth) {
      const sz = goPositive ? (z + offset + stepD / 2) : (z + depth - offset - stepD / 2);
      step.position.set(cx, sy, sz);
    } else {
      const sx = goPositive ? (x + offset + stepD / 2) : (x + width - offset - stepD / 2);
      step.position.set(sx, sy, cz);
    }
    group.add(step);
  }

  // Landing
  const landH = 0.15;
  const landing = box(stepW, landH, isSouthNorth ? flightLen * 0.5 : stepW, material);
  const landY = y + floorHeight / 2;
  if (isSouthNorth) {
    const lz = goPositive ? (z + depth - flightLen * 0.25 - margin) : (z + flightLen * 0.25 + margin);
    landing.position.set(cx, landY, lz);
  } else {
    const lx = goPositive ? (x + width - flightLen * 0.25 - margin) : (x + flightLen * 0.25 + margin);
    landing.position.set(lx, landY, cz);
  }
  group.add(landing);

  // Second flight (return)
  for (let s = 0; s < stepsPerFlight; s++) {
    const sy = y + floorHeight / 2 + s * stepH + stepH / 2;
    const offset = margin + s * stepD;

    const step = box(
      isSouthNorth ? stepW : stepD,
      stepH,
      isSouthNorth ? stepD : stepW,
      material
    );

    if (isSouthNorth) {
      const sz = goPositive ? (z + depth - offset - stepD / 2) : (z + offset + stepD / 2);
      step.position.set(cx, sy, sz);
    } else {
      const sx = goPositive ? (x + width - offset - stepD / 2) : (x + offset + stepD / 2);
      step.position.set(sx, sy, cz);
    }
    group.add(step);
  }

  // Railing posts
  for (const side of [-1, 1]) {
    const rOffset = side * (stepW / 2 + 0.05);
    for (let s = 0; s <= stepsPerFlight; s += 3) {
      const postY = y + s * stepH + 0.45;
      const offset = margin + s * stepD;
      const post = box(0.04, 0.9, 0.04, railMaterial);
      if (isSouthNorth) {
        const pz = goPositive ? (z + offset + stepD / 2) : (z + depth - offset - stepD / 2);
        post.position.set(cx + rOffset, postY, pz);
      } else {
        const px = goPositive ? (x + offset + stepD / 2) : (x + width - offset - stepD / 2);
        post.position.set(px, postY, cz + rOffset);
      }
      group.add(post);
    }
  }
}

// ════════════════════════════════════════════════
// FLAT ROOF
// ════════════════════════════════════════════════

export function addFlatRoof(group, x, z, w, d, y, overhang = 0.3, material = MAT.roof) {
  const r = box(w + overhang * 2, 0.25, d + overhang * 2, material);
  r.position.set(x + w / 2, y + 0.125, z + d / 2);
  group.add(r);
}
