import * as THREE from 'three';
import { wallWithOpenings, MAT, box } from './building-utils.js';

/**
 * MCP-driven 3D renderer.
 * Reads map.json, walks the tree, builds 3D from _template metadata.
 */

// ── Materials ──
const wallMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0 });
const floorMat = new THREE.MeshLambertMaterial({ color: 0xd0c0a8, side: THREE.DoubleSide });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: THREE.DoubleSide });
const chairMat = new THREE.MeshLambertMaterial({ color: 0x4466aa });
const chairLegMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
const doorMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
const doorFrameMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
const handleMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
const lightRimMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
const lightBodyMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 0.8 });
const potMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
const soilMat = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
const leafMat = new THREE.MeshLambertMaterial({ color: 0x2d6b30 });
const leafLightMat = new THREE.MeshLambertMaterial({ color: 0x4a9e3f });

const DOOR_H = 2.1, DOOR_W = 0.9, WALL_H = 3;

// ── Interactive doors tracking ──
const doors = [];
let _camera = null;

export function setCamera(cam) { _camera = cam; }

export function updateDoors(delta) {
  for (const d of doors) {
    const diff = d.userData.targetAngle - d.userData.currentAngle;
    if (Math.abs(diff) > 0.01) {
      d.userData.currentAngle += Math.sign(diff) * Math.min(Math.abs(diff), 3 * delta);
      d.rotation.y = d.userData.currentAngle;
    }
  }
}

// ── Model registry: _template → builder function ──
// Builder receives (group, absX, absZ, rotation, mcpNode)
const MODEL_REGISTRY = {
  'sablony/kreslo': buildChair,
  'sablony/dvere_90': buildDoor,
  'sablony/kytka': buildPlant,
  'sablony/svetlo': buildLight,
};

// ══════════════════════════════════════════
// MAIN: load map.json, build scene
// ══════════════════════════════════════════

export async function buildFromMCP(scene, spacePath, ox = 0, oz = 0) {
  const mapData = await fetch('/map.json').then(r => r.json());
  const space = resolvePath(mapData, spacePath);
  if (!space) { console.error('MCP space not found:', spacePath); return; }

  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  // Find rooms (tagged "room")
  for (const child of Object.values(space.children || {})) {
    if ((child.tags || []).includes('room')) {
      buildRoom(g, child, 0, 0);
    }
  }

  scene.add(g);
  setupDoorInteraction(g);
  return g;
}

// ══════════════════════════════════════════
// ROOM — walls from shape/rect + stamps from children
// ══════════════════════════════════════════

function buildRoom(group, room, offsetX, offsetZ) {
  const rx = offsetX + room.x;
  const rz = offsetZ + room.y;
  const rw = room.width;
  const rd = room.height;

  // Collect door positions for wall openings
  const doorPositions = collectDoors(room);

  // Build walls from shape or rectangle
  if (room.shape && room.shape.length >= 3) {
    buildLShapeWalls(group, room.shape, rx, rz, doorPositions);
    buildLShapeFloorCeiling(group, room.shape, rx, rz);
  } else {
    buildRectWalls(group, rx, rz, rw, rd, doorPositions);
    // Floor
    group.add(p(box(rw, 0.13, rd, floorMat), rx + rw / 2, 0.065, rz + rd / 2));
    // Ceiling
    group.add(p(box(rw, 0.1, rd, ceilingMat), rx + rw / 2, WALL_H - 0.05, rz + rd / 2));
  }

  // Walk children — build stamps
  walkAndBuild(group, room, rx, rz);
}

// ── Collect door _body positions from stamps ──
function collectDoors(room) {
  const doors = [];
  for (const child of Object.values(room.children || {})) {
    if (child.metadata?._template?.includes('dvere')) {
      // Find _body child for exact door position
      const body = child.children?._body;
      if (body) {
        doors.push({
          absX: child.x + body.x,
          absY: child.y + body.y,
          w: body.width,
          h: body.height,
          rotation: child.rotation || 0,
        });
      }
    }
  }
  return doors;
}

// ── Walk tree, find stamps, call model builders ──
function walkAndBuild(group, node, offsetX, offsetZ) {
  for (const child of Object.values(node.children || {})) {
    const tpl = child.metadata?._template;
    if (tpl && MODEL_REGISTRY[tpl]) {
      const absX = offsetX + child.x;
      const absZ = offsetZ + child.y;
      const rot = child.rotation || 0;
      MODEL_REGISTRY[tpl](group, absX, absZ, rot, child);
    }
    // Recurse into non-stamp containers (but not into stamp children)
    if (child.children && !tpl) {
      walkAndBuild(group, child, offsetX + child.x, offsetZ + child.y);
    }
  }
}

// ══════════════════════════════════════════
// WALLS — rectangular room
// ══════════════════════════════════════════

function buildRectWalls(group, rx, rz, rw, rd, doorPositions) {
  const walls = [
    { axis: 'x', x: rx, z: rz, length: rw },         // north (z=rz)
    { axis: 'x', x: rx, z: rz + rd, length: rw },     // south (z=rz+rd)
    { axis: 'z', x: rx, z: rz, length: rd },           // west (x=rx)
    { axis: 'z', x: rx + rw, z: rz, length: rd },      // east (x=rx+rw)
  ];

  for (const wall of walls) {
    const openings = findOpeningsForWall(wall, doorPositions, rx, rz);
    wallWithOpenings(group, {
      ...wall, height: WALL_H, material: wallMat, openings,
    });
  }
}

// ── L-shape walls from polygon vertices ──
function buildLShapeWalls(group, shape, rx, rz, doorPositions) {
  for (let i = 0; i < shape.length; i++) {
    const [x1, y1] = shape[i];
    const [x2, y2] = shape[(i + 1) % shape.length];

    let wall;
    if (y1 === y2) {
      // Horizontal segment → axis='x'
      const startX = Math.min(x1, x2);
      const len = Math.abs(x2 - x1);
      wall = { axis: 'x', x: rx + startX, z: rz + y1, length: len };
    } else if (x1 === x2) {
      // Vertical segment → axis='z'
      const startZ = Math.min(y1, y2);
      const len = Math.abs(y2 - y1);
      wall = { axis: 'z', x: rx + x1, z: rz + startZ, length: len };
    } else {
      continue; // Skip diagonal segments
    }

    const openings = findOpeningsForWall(wall, doorPositions, rx, rz);
    wallWithOpenings(group, {
      ...wall, height: WALL_H, material: wallMat, openings,
    });
  }
}

// ── L-shape floor + ceiling as polygon triangulation ──
function buildLShapeFloorCeiling(group, shape, rx, rz) {
  // Simple approach: decompose L into rectangles from shape
  // For a 6-vertex L: (0,0)→(10,0)→(10,5)→(4,5)→(4,8)→(0,8)
  // Decompose into: rect(0,0,10,5) + rect(0,5,4,3)
  // Generic: find horizontal splits and build rectangles
  const rects = decomposePolygonToRects(shape);
  for (const r of rects) {
    // Floor
    group.add(p(box(r.w, 0.13, r.h, floorMat), rx + r.x + r.w / 2, 0.065, rz + r.y + r.h / 2));
    // Ceiling
    group.add(p(box(r.w, 0.1, r.h, ceilingMat), rx + r.x + r.w / 2, WALL_H - 0.05, rz + r.y + r.h / 2));
  }
}

function decomposePolygonToRects(shape) {
  // Collect all unique Y values, sort them
  const ys = [...new Set(shape.map(p => p[1]))].sort((a, b) => a - b);
  const rects = [];

  for (let i = 0; i < ys.length - 1; i++) {
    const yTop = ys[i], yBot = ys[i + 1];
    const yMid = (yTop + yBot) / 2;

    // Find x-range at this y-level by ray casting
    const intersections = [];
    for (let j = 0; j < shape.length; j++) {
      const [x1, y1] = shape[j];
      const [x2, y2] = shape[(j + 1) % shape.length];
      if ((y1 <= yMid && y2 > yMid) || (y2 <= yMid && y1 > yMid)) {
        const x = x1 + (yMid - y1) / (y2 - y1) * (x2 - x1);
        intersections.push(x);
      }
    }
    intersections.sort((a, b) => a - b);

    // Pair intersections into ranges
    for (let k = 0; k < intersections.length - 1; k += 2) {
      rects.push({ x: intersections[k], y: yTop, w: intersections[k + 1] - intersections[k], h: yBot - yTop });
    }
  }
  return rects;
}

// ── Find door openings that belong to a wall segment ──
function findOpeningsForWall(wall, doorPositions, roomX, roomZ) {
  const openings = [];
  const TOL = 0.3; // tolerance for matching door to wall

  for (const door of doorPositions) {
    const doorAbsX = roomX + door.absX;
    const doorAbsY = roomZ + door.absY;

    if (wall.axis === 'x') {
      // Horizontal wall at z=wall.z
      // Door is on this wall if door's z-position is close to wall.z
      const doorZ = door.h < 0.3 ? doorAbsY : doorAbsY; // thin door = on wall line
      if (Math.abs(doorZ - wall.z) < TOL) {
        const start = doorAbsX - wall.x;
        const end = start + door.w;
        if (start >= -TOL && end <= wall.length + TOL) {
          openings.push({ start: Math.max(0, start), end: Math.min(wall.length, end), top: DOOR_H });
        }
      }
    } else {
      // Vertical wall at x=wall.x
      const doorX = door.w < 0.3 ? doorAbsX : doorAbsX;
      if (Math.abs(doorX - wall.x) < TOL) {
        const start = doorAbsY - wall.z;
        const end = start + door.h;
        if (start >= -TOL && end <= wall.length + TOL) {
          openings.push({ start: Math.max(0, start), end: Math.min(wall.length, end), top: DOOR_H });
        }
      }
    }
  }
  return openings;
}

// ══════════════════════════════════════════
// MODEL BUILDERS
// ══════════════════════════════════════════

function buildChair(group, absX, absZ, rotation, node) {
  // Find _body position within stamp for precise placement
  const body = node.children?._body;
  const bx = body ? body.x : 0, bz = body ? body.y : 0;
  const cx = absX + bx + 0.3; // center of 0.6 body
  const cz = absZ + bz + 0.3;

  const chair = new THREE.Group();
  chair.add(p(box(0.6, 0.08, 0.6, chairMat), 0, 0.46, 0));
  const lo = 0.26;
  for (const [lx, lz] of [[-lo, -lo], [lo, -lo], [-lo, lo], [lo, lo]])
    chair.add(p(box(0.04, 0.42, 0.04, chairLegMat), lx, 0.21, lz));
  chair.add(p(box(0.6, 0.45, 0.06, chairMat), 0, 0.645, -0.27));
  chair.rotation.y = -rotation * Math.PI / 180;
  chair.position.set(cx, 0, cz);
  group.add(chair);
}

function buildDoor(group, absX, absZ, rotation, node) {
  const body = node.children?._body;
  if (!body) return;

  // Determine hinge position and axis from door body position
  const bx = absX + body.x;
  const bz = absZ + body.y;
  const isHorizontal = body.width > body.height; // axis='x' vs 'z'

  const pivot = new THREE.Group();
  pivot.position.set(bx, 0, bz);
  pivot.userData = { isDoor: true, isOpen: false, currentAngle: 0, targetAngle: 0 };

  if (isHorizontal) {
    // Door along x-axis
    const panel = box(DOOR_W, DOOR_H, 0.05, doorMat);
    panel.position.set(DOOR_W / 2, DOOR_H / 2, 0);
    pivot.add(panel);
    // Frame
    pivot.add(p(box(DOOR_W + 0.08, 0.04, 0.08, doorFrameMat), DOOR_W / 2, DOOR_H + 0.02, 0));
    pivot.add(p(box(0.04, DOOR_H, 0.08, doorFrameMat), -0.02, DOOR_H / 2, 0));
    pivot.add(p(box(0.04, DOOR_H, 0.08, doorFrameMat), DOOR_W + 0.02, DOOR_H / 2, 0));
    // Handles
    pivot.add(p(box(0.03, 0.12, 0.06, handleMat), DOOR_W - 0.12, 1.0, 0.05));
    pivot.add(p(box(0.03, 0.12, 0.06, handleMat), DOOR_W - 0.12, 1.0, -0.05));
    // Determine swing direction: if door is near z=0 swing inward (+z), near max swing outward
    pivot.userData.openAngle = bz < 1 ? Math.PI / 2 : -Math.PI / 2;
  } else {
    // Door along z-axis
    const panel = box(0.05, DOOR_H, DOOR_W, doorMat);
    panel.position.set(0, DOOR_H / 2, DOOR_W / 2);
    pivot.add(panel);
    pivot.add(p(box(0.08, 0.04, DOOR_W + 0.08, doorFrameMat), 0, DOOR_H + 0.02, DOOR_W / 2));
    pivot.add(p(box(0.08, DOOR_H, 0.04, doorFrameMat), 0, DOOR_H / 2, -0.02));
    pivot.add(p(box(0.08, DOOR_H, 0.04, doorFrameMat), 0, DOOR_H / 2, DOOR_W + 0.02));
    pivot.add(p(box(0.03, 0.12, 0.06, handleMat), 0.05, 1.0, DOOR_W - 0.12));
    pivot.add(p(box(0.03, 0.12, 0.06, handleMat), -0.05, 1.0, DOOR_W - 0.12));
    pivot.userData.openAngle = bx < 1 ? -Math.PI / 2 : Math.PI / 2;
  }

  group.add(pivot);
  doors.push(pivot);
}

function buildPlant(group, absX, absZ, rotation, node) {
  const body = node.children?._body;
  const bx = body ? body.x : 0, bz = body ? body.y : 0;
  const px = absX + bx + 0.2;
  const pz = absZ + bz + 0.2;

  const pl = new THREE.Group();
  pl.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 8), potMat), 0, 0.175, 0));
  pl.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 8), soilMat), 0, 0.34, 0));
  pl.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.0, 6), trunkMat), 0, 0.85, 0));
  const sg = new THREE.SphereGeometry(0.18, 8, 6), bg = new THREE.SphereGeometry(0.22, 8, 6);
  pl.add(p(new THREE.Mesh(bg, leafMat), 0, 1.45, 0));
  pl.add(p(new THREE.Mesh(sg, leafLightMat), 0.12, 1.3, 0.1));
  pl.add(p(new THREE.Mesh(sg, leafMat), -0.1, 1.35, -0.12));
  pl.add(p(new THREE.Mesh(sg, leafLightMat), -0.08, 1.5, 0.1));
  pl.add(p(new THREE.Mesh(sg, leafMat), 0.1, 1.55, -0.08));
  pl.position.set(px, 0, pz);
  group.add(pl);
}

function buildLight(group, absX, absZ, rotation, node) {
  const lx = absX + 0.2;
  const lz = absZ + 0.2;
  group.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 12), lightRimMat), lx, WALL_H - 0.04, lz));
  group.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 12), lightBodyMat), lx, WALL_H - 0.1, lz));
  const light = new THREE.PointLight(0xffeedd, 1.5, 5, 1.5);
  light.position.set(lx, WALL_H - 0.15, lz);
  group.add(light);
}

// ══════════════════════════════════════════
// DOOR INTERACTION
// ══════════════════════════════════════════

function setupDoorInteraction(group) {
  const rc = new THREE.Raycaster();
  rc.far = 4;
  window.addEventListener('click', () => {
    if (!document.pointerLockElement || !_camera) return;
    rc.setFromCamera(new THREE.Vector2(0, 0), _camera);
    for (const hit of rc.intersectObjects(group.children, true)) {
      let obj = hit.object;
      while (obj && !obj.userData?.isDoor) obj = obj.parent;
      if (obj?.userData?.isDoor) {
        obj.userData.isOpen = !obj.userData.isOpen;
        obj.userData.targetAngle = obj.userData.isOpen ? obj.userData.openAngle : 0;
        break;
      }
    }
  });
}

// ── Helpers ──
function resolvePath(root, path) {
  if (!path || path === '/') return root;
  const parts = path.split('/').filter(Boolean);
  let node = root;
  for (const p of parts) {
    if (!node.children?.[p]) return null;
    node = node.children[p];
  }
  return node;
}

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }
