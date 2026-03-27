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
  windowFrameWhite: new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: DS }),
  sillOuter: new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: DS }),
  sillInner: new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS }),
  curtain: new THREE.MeshLambertMaterial({ color: 0xe8dcc8, side: THREE.DoubleSide }),
  sheer: new THREE.MeshLambertMaterial({ color: 0xf8f4ee, opacity: 0.2, transparent: true, side: THREE.DoubleSide }),
  curtainRod: new THREE.MeshLambertMaterial({ color: 0xdddddd, side: DS }),
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

  const mat = material.clone();
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = 1;
  mat.polygonOffsetUnits = 1;

  if (axis === 'x') {
    // Wall runs along X, thin in Z
    const w = box(segLen, segH, thickness, mat);
    w.position.set(wx + offset + segLen / 2, floorY + segBottom + segH / 2, wz);
    group.add(w);
  } else {
    // Wall runs along Z, thin in X
    const w = box(thickness, segH, segLen, mat);
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
    panes = null,       // '2_leaf_ventilacka', '1_leaf_ventilacka', '3_leaf', null
    hasSill = true,
    hasCurtains = true,
    interiorSide = 1,   // +1 = interior at +z/+x from wall, -1 = interior at -z/-x
  } = opts;

  const fm = MAT.windowFrameWhite;
  const gm = MAT.window;
  const frameW = 0.04;
  const frameD = 0.06;
  const fy = y + sillHeight;
  const s = interiorSide; // shorthand: +1 or -1
  const off = 0.08 * s;   // glass offset from wall center (toward interior)

  // Place a box (already axis-aware via alignedBox)
  function addBox(mesh, along, up, depth) {
    if (axis === 'x') {
      mesh.position.set(x + along, up, z + depth);
    } else {
      mesh.position.set(x + depth, up, z + along);
    }
    group.add(mesh);
  }

  // Place a plane/cylinder (needs rotation for axis='z')
  function addPlane(mesh, along, up, depth) {
    if (axis === 'x') {
      mesh.position.set(x + along, up, z + depth);
    } else {
      mesh.position.set(x + depth, up, z + along);
      mesh.rotation.y = (mesh.rotation.y || 0) + Math.PI / 2;
    }
    group.add(mesh);
  }

  function alignedBox(bw, bh, bd, mat) {
    return axis === 'x' ? box(bw, bh, bd, mat) : box(bd, bh, bw, mat);
  }

  // ── OUTER FRAME ──
  addBox(alignedBox(w + 0.04, frameW, frameD, fm), at, fy + h + frameW / 2, off);
  addBox(alignedBox(w + 0.04, frameW, frameD, fm), at, fy - frameW / 2, off);
  addBox(alignedBox(frameW, h + frameW * 2, frameD, fm), at - w / 2, fy + h / 2, off);
  addBox(alignedBox(frameW, h + frameW * 2, frameD, fm), at + w / 2, fy + h / 2, off);

  // ── PANES ──
  const innerW = w - frameW * 2;
  const innerH = h - frameW * 2;
  const leafFrame = 0.03;

  if (panes === '2_leaf_ventilacka') {
    addBox(alignedBox(0.05, h, frameD, fm), at, fy + h / 2, off);
    const leafW = (innerW - 0.05) / 2;
    const ventH = innerH * 0.25;
    const mainH = innerH - ventH - leafFrame;

    // Left leaf frame edges
    addBox(alignedBox(leafFrame, innerH, 0.03, fm), at - innerW / 2 + leafFrame / 2, fy + frameW + innerH / 2, off);
    addBox(alignedBox(leafFrame, innerH, 0.03, fm), at - 0.025 - leafFrame / 2, fy + frameW + innerH / 2, off);
    // Ventilačka divider
    addBox(alignedBox(leafW, leafFrame, 0.03, fm), at - innerW / 4 - 0.025, fy + frameW + mainH + leafFrame / 2, off);
    // Main glass (left)
    addPlane(plane(leafW - leafFrame * 2, mainH, gm), at - innerW / 4 - 0.025, fy + frameW + mainH / 2, off);
    // Ventilačka glass
    addPlane(plane(leafW - leafFrame * 2, ventH - leafFrame, gm), at - innerW / 4 - 0.025, fy + frameW + mainH + leafFrame + (ventH - leafFrame) / 2, off);

    // Right leaf frame edges
    addBox(alignedBox(leafFrame, innerH, 0.03, fm), at + 0.025 + leafFrame / 2, fy + frameW + innerH / 2, off);
    addBox(alignedBox(leafFrame, innerH, 0.03, fm), at + innerW / 2 - leafFrame / 2, fy + frameW + innerH / 2, off);
    // Right leaf glass
    addPlane(plane(leafW - leafFrame * 2, innerH - leafFrame * 2, gm), at + innerW / 4 + 0.025, fy + frameW + innerH / 2, off);
    // Handle
    addBox(alignedBox(0.01, 0.08, 0.025, fm), at - 0.06, fy + h * 0.45, off + 0.04);

  } else if (panes === '1_leaf_ventilacka') {
    const ventH = innerH * 0.25;
    const mainH = innerH - ventH - leafFrame;
    addBox(alignedBox(innerW, leafFrame, 0.03, fm), at, fy + frameW + mainH + leafFrame / 2, off);
    addPlane(plane(innerW - leafFrame * 2, mainH, gm), at, fy + frameW + mainH / 2, off);
    addPlane(plane(innerW - leafFrame * 2, ventH - leafFrame, gm), at, fy + frameW + mainH + leafFrame + (ventH - leafFrame) / 2, off);
    addBox(alignedBox(0.01, 0.08, 0.025, fm), at + innerW / 2 - 0.06, fy + h * 0.45, off + 0.04);

  } else if (panes === '3_leaf') {
    const postW = 0.05;
    const leafW = (innerW - postW * 2) / 3;
    addBox(alignedBox(postW, h, frameD, fm), at - leafW / 2 - postW / 2, fy + h / 2, off);
    addBox(alignedBox(postW, h, frameD, fm), at + leafW / 2 + postW / 2, fy + h / 2, off);
    for (let i = -1; i <= 1; i++) {
      addPlane(plane(leafW - leafFrame * 2, innerH - leafFrame * 2, gm), at + i * (leafW + postW), fy + frameW + innerH / 2, off);
    }

  } else {
    addPlane(plane(innerW, innerH, gm), at, fy + frameW + innerH / 2, off);
  }

  // ── SILL / PARAPET ──
  if (hasSill) {
    // Outer sill: opposite side from interior
    addBox(alignedBox(w + 0.06, 0.02, 0.2, MAT.sillOuter), at, fy - 0.01, -0.05 * s);
    // Inner sill: same side as interior
    addBox(alignedBox(w, 0.02, 0.15, MAT.sillInner), at, fy - 0.01, off + 0.1 * s);
  }

  // ── CURTAINS (always on interior side) ──
  if (hasCurtains) {
    const curtainH = h + sillHeight * 0.3;
    const rodLen = w + 0.2;
    const rodY = fy + h + 0.12;
    const curtainOff = off + 0.15 * s;

    // Curtain rod (geometry pre-rotated, no mesh rotation needed)
    const rodGeom = new THREE.CylinderGeometry(0.009, 0.009, rodLen, 6);
    if (axis === 'x') rodGeom.rotateZ(Math.PI / 2);
    else rodGeom.rotateX(Math.PI / 2);
    addBox(new THREE.Mesh(rodGeom, MAT.curtainRod), at, rodY, curtainOff);

    // Rod finials (sphere = symmetric, no rotation needed)
    for (const side of [-1, 1]) {
      addBox(new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), MAT.curtainRod), at + side * rodLen / 2, rodY, curtainOff);
    }

    // Rod brackets
    for (const bx of [at - w / 2 + 0.05, at + w / 2 - 0.05]) {
      addBox(alignedBox(0.02, 0.04, 0.03, MAT.curtainRod), bx, rodY + 0.02, curtainOff);
    }

    // Curtains (gathered to sides)
    const curtainW = w * 0.22;
    addPlane(plane(curtainW, curtainH, MAT.curtain), at - w / 2 - 0.02 + curtainW / 2, fy + h - curtainH / 2 + 0.05, curtainOff + 0.01);
    addPlane(plane(curtainW, curtainH, MAT.curtain), at + w / 2 + 0.02 - curtainW / 2, fy + h - curtainH / 2 + 0.05, curtainOff + 0.01);

    // Sheer
    addPlane(plane(w, h + 0.05, MAT.sheer), at, fy + h / 2, curtainOff - 0.02);
  }
}

// Legacy simple frame (kept for non-window uses)
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
    frameMat = MAT.windowFrame,
  } = opts;

  const frameW = 0.04;
  const frameD = 0.08;

  if (axis === 'x') {
    // Door panel
    group.add(pos(box(w, doorHeight, 0.05, material), x + at, y + doorHeight / 2, z));
    // Frame — left, right, top (zárubeň)
    group.add(pos(box(frameW, doorHeight, frameD, frameMat), x + at - w / 2 - frameW / 2, y + doorHeight / 2, z));
    group.add(pos(box(frameW, doorHeight, frameD, frameMat), x + at + w / 2 + frameW / 2, y + doorHeight / 2, z));
    group.add(pos(box(w + frameW * 2, frameW, frameD, frameMat), x + at, y + doorHeight + frameW / 2, z));
  } else {
    group.add(pos(box(0.05, doorHeight, w, material), x, y + doorHeight / 2, z + at));
    group.add(pos(box(frameD, doorHeight, frameW, frameMat), x, y + doorHeight / 2, z + at - w / 2 - frameW / 2));
    group.add(pos(box(frameD, doorHeight, frameW, frameMat), x, y + doorHeight / 2, z + at + w / 2 + frameW / 2));
    group.add(pos(box(frameD, frameW, w + frameW * 2, frameMat), x, y + doorHeight + frameW / 2, z + at));
  }
}

// ════════════════════════════════════════════════
// FLOOR & CEILING
// ════════════════════════════════════════════════

export function addFloor(group, x, z, w, d, y = 0, material = MAT.floor) {
  const mat = material.clone();
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = 1;
  mat.polygonOffsetUnits = 1;
  group.add(pos(box(w, 0.13, d, mat), x + w / 2, y + 0.065, z + d / 2));
}

export function addCeiling(group, x, z, w, d, floorHeight, y = 0, material = MAT.ceiling) {
  const c = plane(w, d, material);
  c.rotation.x = Math.PI / 2;
  c.material.polygonOffset = true;
  c.material.polygonOffsetFactor = 1;
  c.material.polygonOffsetUnits = 1;
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
