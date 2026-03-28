import * as THREE from 'three';
import { wallWithOpenings, addWindow, addDoor, addFloor, addFlatRoof, MAT, box } from '../building-utils.js';

const DS = THREE.FrontSide;

// ═══════════════════════════════════════════════
// MATERIALS
// ═══════════════════════════════════════════════

const matCache = {};
function getMat(color) {
  if (!matCache[color]) matCache[color] = new THREE.MeshLambertMaterial({ color, side: DS });
  return matCache[color];
}

const waterMat = new THREE.MeshLambertMaterial({
  color: 0x4488cc, opacity: 0.7, transparent: true, side: DS,
});

const wallColors = {
  building: 0xe0d8c8,
  garage: 0xc8c0b0,
  default: 0xd8d0c0,
};

const FLAT_COLORS = {
  road: 0x444444,
  sidewalk: 0xaaaaaa,
  garden: 0x5a9e3a,
  path: 0x999988,
  parking: 0x666666,
  square: 0xbbaa88,
  park: 0x6ab04a,
};

// ═══════════════════════════════════════════════
// TEMPLATE CONFIG — ref path → opening properties
// ═══════════════════════════════════════════════

function getOpeningProps(ref) {
  if (ref.includes('dvere_120')) return { type: 'door', w: 1.2, sill: 0, h: 2.1 };
  if (ref.includes('dvere_90')) return { type: 'door', w: 0.9, sill: 0, h: 2.1 };
  if (ref.includes('okno_120')) return { type: 'window', w: 1.2, sill: 0.9, h: 1.5 };
  if (ref.includes('okno_80')) return { type: 'window', w: 0.8, sill: 1.2, h: 0.8 };
  return null;
}

// ═══════════════════════════════════════════════
// FIND OPENINGS — doors + windows from MCP ref stamps
// ═══════════════════════════════════════════════

function findOpenings(node) {
  const openings = [];
  if (!node.c) return openings;
  for (const child of Object.values(node.c)) {
    if (!child.ref) continue;
    const props = getOpeningProps(child.ref);
    if (!props) continue;
    openings.push({
      ...props,
      x: child.x ?? 0,
      y: child.y ?? 0,
      r: child.r ?? 0,
    });
  }
  return openings;
}

// Assign opening to wall of a building based on position + rotation
function assignToWall(opening, bx, by, bw, bh) {
  const r = opening.r;
  // Rotation tells us which wall: 0=north, 90=east, 180=south, 270=west
  if (r === 0) return { wall: 'north', pos: opening.x - bx };
  if (r === 180) return { wall: 'south', pos: bx + bw - opening.x };
  if (r === 90) return { wall: 'east', pos: opening.y - by };
  if (r === 270) return { wall: 'west', pos: by + bh - opening.y };
  // Fallback by proximity
  const tol = 0.5;
  if (Math.abs(opening.y - by) < tol) return { wall: 'north', pos: opening.x - bx };
  if (Math.abs(opening.y - (by + bh)) < tol) return { wall: 'south', pos: opening.x - bx };
  if (Math.abs(opening.x - bx) < tol) return { wall: 'west', pos: opening.y - by };
  if (Math.abs(opening.x - (bx + bw)) < tol) return { wall: 'east', pos: opening.y - by };
  return null;
}

// ═══════════════════════════════════════════════
// BUILDING RENDERER — walls + openings from MCP data
// ═══════════════════════════════════════════════

function renderBuilding(group, bld, wx, wz, allOpenings) {
  const bx = bld.x ?? 0;
  const by = bld.y ?? 0;
  const bw = bld.w;
  const bh = bld.h;
  const h3 = bld.h3 ?? 3;
  const baseY = bld.z ?? 0;
  const tags = bld.t || [];
  const isGarage = tags.includes('garage');

  const wallMat = getMat(wallColors[isGarage ? 'garage' : 'building'] || wallColors.default);
  const abx = wx + bx;
  const abz = wz + by;

  // Assign openings to walls
  const wallOpenings = { north: [], south: [], east: [], west: [] };
  for (const op of allOpenings) {
    const assigned = assignToWall(op, bx, by, bw, bh);
    if (assigned) {
      wallOpenings[assigned.wall].push({ ...op, pos: assigned.pos });
    }
  }

  // Build each wall
  const wallDefs = [
    { name: 'north', axis: 'x', x: abx, z: abz, len: bw },
    { name: 'south', axis: 'x', x: abx, z: abz + bh, len: bw },
    { name: 'west', axis: 'z', x: abx, z: abz, len: bh },
    { name: 'east', axis: 'z', x: abx + bw, z: abz, len: bh },
  ];

  for (const wall of wallDefs) {
    const ops = wallOpenings[wall.name];

    // Convert to wallWithOpenings format
    const holeSpecs = ops.map(op => ({
      start: op.pos,
      end: op.pos + op.w,
      bottom: op.sill,
      top: op.sill + op.h,
    }));

    wallWithOpenings(group, {
      axis: wall.axis,
      x: wall.x, z: wall.z,
      length: wall.len,
      height: h3,
      y: baseY,
      material: wallMat,
      openings: holeSpecs,
    });

    // Add visual elements for each opening
    for (const op of ops) {
      const center = op.pos + op.w / 2;
      if (op.type === 'window') {
        addWindow(group, {
          axis: wall.axis,
          x: wall.x, z: wall.z,
          at: center,
          width: op.w,
          sillHeight: op.sill,
          winHeight: op.h,
          y: baseY,
          hasCurtains: !isGarage,
          hasSill: true,
        });
      } else if (op.type === 'door') {
        addDoor(group, {
          axis: wall.axis,
          x: wall.x, z: wall.z,
          at: center,
          width: op.w,
          doorHeight: op.h,
          y: baseY,
        });
      }
    }
  }

  addFloor(group, abx, abz, bw, bh, baseY);
  addFlatRoof(group, abx, abz, bw, bh, baseY + h3, 0.2);
}

// ═══════════════════════════════════════════════
// SIMPLE RENDERERS
// ═══════════════════════════════════════════════

function addTree(group, wx, wz, w, h, h3) {
  const cx = wx + w / 2;
  const cz = wz + h / 2;
  const crownR = Math.max(w, h) / 2;
  const trunkH = h3 * 0.35;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, trunkH, 6),
    getMat(0x6b4226),
  );
  trunk.position.set(cx, trunkH / 2, cz);
  group.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(crownR, 8, 6),
    getMat(0x2d6e1e),
  );
  crown.position.set(cx, trunkH + crownR * 0.6, cz);
  group.add(crown);
}

function addFence(group, wx, wz, w, h, h3) {
  const fenceH = h3 || 1.5;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, fenceH, h),
    getMat(0x8b7355),
  );
  mesh.position.set(wx + w / 2, fenceH / 2, wz + h / 2);
  group.add(mesh);
}

function addFurniture3D(group, wx, wz, w, h, h3, z) {
  const baseY = z ?? 0;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h3, h),
    getMat(0x907050),
  );
  mesh.position.set(wx + w / 2, baseY + h3 / 2, wz + h / 2);
  group.add(mesh);
}

function addFlat(group, wx, wz, w, h, color, yPos) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    getMat(color),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(wx + w / 2, yPos, wz + h / 2);
  group.add(mesh);
}

function addTerrace(group, x, z, w, h, height) {
  const postMat = getMat(0x8b7355);
  const roofMat = getMat(0xb09070);
  const posts = [
    [x + 0.2, z + 0.2], [x + w - 0.2, z + 0.2],
    [x + 0.2, z + h - 0.2], [x + w - 0.2, z + h - 0.2],
  ];
  for (const [px, pz] of posts) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, height, 6), postMat);
    post.position.set(px, height / 2, pz);
    group.add(post);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.08, h + 0.3), roofMat);
  roof.position.set(x + w / 2, height, z + h / 2);
  group.add(roof);
  addFlat(group, x, z, w, h, 0xb09070, 0.05);
}

// ═══════════════════════════════════════════════
// CONTAINER PROCESSORS
// ═══════════════════════════════════════════════

function processContainer(group, node, nx, ny) {
  if (!node.c) return;

  // Collect all openings from ref stamps
  const openings = findOpenings(node);

  for (const child of Object.values(node.c)) {
    if (child.ref) continue; // stamps handled via openings

    const tags = child.t || [];
    const cx = (child.x ?? 0) + nx;
    const cy = (child.y ?? 0) + ny;
    const w = child.w;
    const h = child.h;
    const h3 = child.h3;
    const z = child.z;

    if (!w || !h || w <= 0 || h <= 0) continue;

    if (tags.includes('building')) {
      renderBuilding(group, child, nx, ny, openings);
    } else if (tags.includes('fence')) {
      addFence(group, cx, cy, w, h, h3);
    } else if (tags.includes('tree') && h3) {
      addTree(group, cx, cy, w, h, h3);
    } else if (tags.includes('water') || tags.includes('pool')) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), waterMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(cx + w / 2, 0.02, cy + h / 2);
      group.add(mesh);
    } else if (tags.includes('terrace')) {
      if (h3 && h3 > 0.2) addTerrace(group, cx, cy, w, h, h3);
      else addFlat(group, cx, cy, w, h, 0xb09070, (z ?? 0) + (h3 || 0.05));
    } else if (tags.includes('courtyard')) {
      addFlat(group, cx, cy, w, h, 0x88aa66, 0.02);
    } else if (tags.includes('furniture') && h3 && h3 > 0.2) {
      addFurniture3D(group, cx, cy, w, h, h3, z);
    } else if (tags.includes('public') && h3) {
      addFlat(group, cx, cy, w, h, 0xcc9944, 0.02);
    } else {
      const flatColor = FLAT_COLORS[tags.find(t => FLAT_COLORS[t])];
      if (flatColor) {
        addFlat(group, cx, cy, w, h, flatColor, tags.includes('sidewalk') ? 0.06 : 0.01);
      }
    }
  }
}

// ═══════════════════════════════════════════════
// MAIN — process the whole map
// ═══════════════════════════════════════════════

function processMap(group, mapNode) {
  if (!mapNode.c) return;

  for (const child of Object.values(mapNode.c)) {
    const tags = child.t || [];
    const cx = child.x ?? 0;
    const cy = child.y ?? 0;
    const w = child.w;
    const h = child.h;

    if (!w || !h) continue;

    if (tags.includes('house') || tags.includes('commercial')) {
      processContainer(group, child, cx, cy);
    } else if (tags.includes('park') || tags.includes('public') || tags.includes('square')) {
      addFlat(group, cx, cy, w, h, FLAT_COLORS[tags.find(t => FLAT_COLORS[t])] || 0x6ab04a, 0.01);
      processContainer(group, child, cx, cy);
    } else if (tags.includes('road')) {
      addFlat(group, cx, cy, w, h, 0x444444, 0.01);
    } else if (tags.includes('sidewalk')) {
      addFlat(group, cx, cy, w, h, 0xaaaaaa, 0.06);
    }
  }
}

export async function createObytnaCtvrt(scene, ox = 0, oz = 0) {
  const resp = await fetch('/obytna-ctvrt.json');
  const data = await resp.json();

  const group = new THREE.Group();
  group.position.set(ox, 0, oz);

  processMap(group, data);

  scene.add(group);
  return group;
}
