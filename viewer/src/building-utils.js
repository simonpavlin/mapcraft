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
  group.add(pos(box(w, 0.15, d, material), x + w / 2, y + 0.075, z + d / 2));
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
// STAIRS — U-turn
// ════════════════════════════════════════════════

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
  const stepW = width - 0.4;
  const isSouthNorth = direction === 'south' || direction === 'north';
  const flightLen = (isSouthNorth ? depth : width) / 2 - margin;
  const stepD = flightLen / stepsPerFlight;
  const cx = x + width / 2;
  const cz = z + depth / 2;
  const goPositive = direction === 'south' || direction === 'east';

  for (let flight = 0; flight < 2; flight++) {
    const baseY = y + flight * floorHeight / 2;
    const reverse = flight === 1;

    for (let s = 0; s < stepsPerFlight; s++) {
      const sy = baseY + s * stepH + stepH / 2;
      const offset = margin + s * stepD;

      const step = box(
        isSouthNorth ? stepW : stepD,
        stepH,
        isSouthNorth ? stepD : stepW,
        material
      );

      if (isSouthNorth) {
        const forward = goPositive !== reverse;
        const sz = forward ? (z + offset + stepD / 2) : (z + depth - offset - stepD / 2);
        step.position.set(cx, sy, sz);
      } else {
        const forward = goPositive !== reverse;
        const sx2 = forward ? (x + offset + stepD / 2) : (x + width - offset - stepD / 2);
        step.position.set(sx2, sy, cz);
      }
      group.add(step);
    }

    // Landing after first flight
    if (flight === 0) {
      const landing = box(stepW, 0.15, isSouthNorth ? flightLen * 0.4 : stepW, material);
      const landY = y + floorHeight / 2;
      if (isSouthNorth) {
        const lz = goPositive ? (z + depth - flightLen * 0.2 - margin) : (z + flightLen * 0.2 + margin);
        landing.position.set(cx, landY, lz);
      } else {
        const lx = goPositive ? (x + width - flightLen * 0.2 - margin) : (x + flightLen * 0.2 + margin);
        landing.position.set(lx, landY, cz);
      }
      group.add(landing);
    }
  }

  // Railings
  for (const side of [-1, 1]) {
    const rOff = side * (stepW / 2 + 0.05);
    for (let s = 0; s <= stepsPerFlight; s += 3) {
      const postY = y + s * stepH + 0.45;
      const offset = margin + s * stepD;
      const p = box(0.04, 0.9, 0.04, railMaterial);
      if (isSouthNorth) {
        const pz = goPositive ? (z + offset) : (z + depth - offset);
        p.position.set(cx + rOff, postY, pz);
      } else {
        const px2 = goPositive ? (x + offset) : (x + width - offset);
        p.position.set(px2, postY, cz + rOff);
      }
      group.add(p);
    }
  }
}

// ════════════════════════════════════════════════
// FLAT ROOF
// ════════════════════════════════════════════════

export function addFlatRoof(group, x, z, w, d, y, overhang = 0.3, material = MAT.roof) {
  group.add(pos(box(w + overhang * 2, 0.25, d + overhang * 2, material), x + w / 2, y + 0.125, z + d / 2));
}
