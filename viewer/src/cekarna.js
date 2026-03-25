import * as THREE from 'three';
import { wallWithOpenings, addFloor, MAT, box } from './building-utils.js';

// Materials
const wallMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0 });
const floorMat = new THREE.MeshLambertMaterial({ color: 0xd0c0a8, side: THREE.DoubleSide });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: THREE.DoubleSide });
const chairMat = new THREE.MeshLambertMaterial({ color: 0x4466aa });
const chairLegMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
const doorMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
const doorFrameMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
const handleMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
const lightBodyMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 0.8 });
const lightRimMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
const potMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
const soilMat = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
const leafMat = new THREE.MeshLambertMaterial({ color: 0x2d6b30 });
const leafLightMat = new THREE.MeshLambertMaterial({ color: 0x4a9e3f });

const H = 3, DOOR_H = 2.1, DOOR_W = 0.9;
// mcp: L-shape (0,0)→(10,0)→(10,5)→(4,5)→(4,8)→(0,8)
const doors = [];

export function createCekarna(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  // ── L-shaped floor (2 rectangles) ──
  // Main: 10×5
  g.add(p(box(10, 0.13, 5, floorMat), 5, 0.065, 2.5));
  // Wing: 4×3
  g.add(p(box(4, 0.13, 3, floorMat), 2, 0.065, 6.5));

  // ── Ceiling (2 rectangles) ──
  g.add(p(box(10, 0.1, 5, ceilingMat), 5, H - 0.05, 2.5));
  g.add(p(box(4, 0.1, 3, ceilingMat), 2, H - 0.05, 6.5));

  // ── 6 wall segments of the L-shape ──

  // 1. North wall (z=0, x=0..10) — 2 doors at x=2 and x=7
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 0, length: 10, height: H, material: wallMat,
    openings: [
      { start: 2, end: 2.9, top: DOOR_H },
      { start: 7, end: 7.9, top: DOOR_H },
    ]
  });

  // 2. East wall main (x=10, z=0..5) — 1 door at z=2
  wallWithOpenings(g, {
    axis: 'z', x: 10, z: 0, length: 5, height: H, material: wallMat,
    openings: [
      { start: 2, end: 2.9, top: DOOR_H },
    ]
  });

  // 3. Inner horizontal wall (z=5, x=4..10) — 1 door at x=6
  wallWithOpenings(g, {
    axis: 'x', x: 4, z: 5, length: 6, height: H, material: wallMat,
    openings: [
      { start: 2, end: 2.9, top: DOOR_H }, // x=6..6.9 relative to x=4 → start=2
    ]
  });

  // 4. Inner vertical wall (x=4, z=5..8) — no doors
  wallWithOpenings(g, {
    axis: 'z', x: 4, z: 5, length: 3, height: H, material: wallMat,
  });

  // 5. South wall wing (z=8, x=0..4) — 1 door at x=1.5
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 8, length: 4, height: H, material: wallMat,
    openings: [
      { start: 1.5, end: 2.4, top: DOOR_H },
    ]
  });

  // 6. West wall (x=0, z=0..8) — 1 door at z=2
  wallWithOpenings(g, {
    axis: 'z', x: 0, z: 0, length: 8, height: H, material: wallMat,
    openings: [
      { start: 2, end: 2.9, top: DOOR_H },
    ]
  });

  // ── Interactive doors ──
  // mcp:d_s1 north x=2, d_s2 north x=7
  addDoor(g, { hx: 2, hz: 0, axis: 'x', openAngle: Math.PI / 2 });
  addDoor(g, { hx: 7, hz: 0, axis: 'x', openAngle: Math.PI / 2 });
  // mcp:d_v1 east z=2
  addDoor(g, { hx: 10, hz: 2, axis: 'z', openAngle: Math.PI / 2 });
  // mcp:d_z west z=2
  addDoor(g, { hx: 0, hz: 2, axis: 'z', openAngle: -Math.PI / 2 });
  // mcp:d_j south wing x=1.5
  addDoor(g, { hx: 1.5, hz: 8, axis: 'x', openAngle: -Math.PI / 2 });
  // mcp:d_roh inner horizontal z=5, at x=6
  addDoor(g, { hx: 6, hz: 5, axis: 'x', openAngle: -Math.PI / 2 });

  // ── Chairs — all from MCP stamps ──
  // North wall (rot=0): k_n2..k_n5 (corners removed for plants)
  for (const x of [1.1, 4.0, 4.8, 5.6]) addChair(g, x + 0.3, 0.1 + 0.3, 0);
  // East wall main (rot=90): k_e2, k_e3 (corners removed)
  for (const z of [1.1, 3.3]) addChair(g, 8.9 + 0.4 + 0.3, z + 0.3, 90);
  // Inner horizontal wall (rot=180): k_ih1..k_ih4 (ih5 removed — corner collision)
  for (const x of [4.5, 5.3, 7.5, 8.3]) addChair(g, x + 0.3, 3.9 + 0.4 + 0.3, 180);
  // Inner vertical wall (rot=90): k_iv1, k_iv2
  for (const z of [5.3, 6.1]) addChair(g, 2.9 + 0.4 + 0.3, z + 0.3, 90);
  // South wall wing (rot=180): k_s2 only (k_s1 removed — corner collision)
  addChair(g, 2.7 + 0.3, 6.9 + 0.4 + 0.3, 180);
  // West wall (rot=270): k_w2..k_w6 (w1 removed — corner collision)
  for (const z of [1.1, 3.3, 4.2, 5.2, 6.0]) addChair(g, 0.1 + 0.3, z + 0.3, 270);

  // ── Plants in L-corners ──
  // mcp: ky_sz, ky_sv, ky_jv, ky_roh, ky_jz, ky_jv2
  // mcp: ky_sz(0.1,0.1), ky_sv(9.5,0.1), ky_jv(9.5,4.3), ky_roh(3.5,4.5), ky_jz(0.1,7.3), ky_jv2(3.5,7.3)
  for (const [px, pz] of [[0.3, 0.3], [9.7, 0.3], [9.7, 4.5], [3.7, 4.7], [0.3, 7.5], [3.7, 7.5]]) {
    addPlant(g, px, pz);
  }

  // ── Ceiling lights ──
  // mcp: sv_1..sv_4
  for (const [lx, lz] of [[2.5, 1.7], [7.5, 1.7], [7.5, 3.7], [1.7, 6.5]]) {
    addLight(g, lx, lz);
  }

  scene.add(g);
  setupDoorInteraction(g);
}

// ── CHAIR ──
function addChair(g, cx, cz, rotation) {
  const chair = new THREE.Group();
  chair.add(p(box(0.6, 0.08, 0.6, chairMat), 0, 0.46, 0));
  const lo = 0.26;
  for (const [lx, lz] of [[-lo, -lo], [lo, -lo], [-lo, lo], [lo, lo]])
    chair.add(p(box(0.04, 0.42, 0.04, chairLegMat), lx, 0.21, lz));
  chair.add(p(box(0.6, 0.45, 0.06, chairMat), 0, 0.42 + 0.225, -0.27));
  chair.rotation.y = -rotation * Math.PI / 180;
  chair.position.set(cx, 0, cz);
  g.add(chair);
}

// ── PLANT ──
function addPlant(g, px, pz) {
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
  pl.position.set(px, 0, pz); g.add(pl);
}

// ── LIGHT ──
function addLight(g, lx, lz) {
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 12), lightRimMat), lx, H - 0.04, lz));
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 12), lightBodyMat), lx, H - 0.1, lz));
  const l = new THREE.PointLight(0xffeedd, 1.5, 5, 1.5);
  l.position.set(lx, H - 0.15, lz); g.add(l);
}

// ── INTERACTIVE DOOR ──
function addDoor(g, { hx, hz, axis, openAngle }) {
  const pivot = new THREE.Group();
  pivot.position.set(hx, 0, hz);
  pivot.userData = { isDoor: true, openAngle, isOpen: false, currentAngle: 0, targetAngle: 0 };

  const panel = box(axis === 'x' ? DOOR_W : 0.05, DOOR_H, axis === 'x' ? 0.05 : DOOR_W, doorMat);
  panel.position.set(axis === 'x' ? DOOR_W / 2 : 0, DOOR_H / 2, axis === 'z' ? DOOR_W / 2 : 0);
  pivot.add(panel);

  const ft = 0.04, fd = 0.08;
  if (axis === 'x') {
    pivot.add(p(box(DOOR_W + ft * 2, ft, fd, doorFrameMat), DOOR_W / 2, DOOR_H + ft / 2, 0));
    pivot.add(p(box(ft, DOOR_H, fd, doorFrameMat), -ft / 2, DOOR_H / 2, 0));
    pivot.add(p(box(ft, DOOR_H, fd, doorFrameMat), DOOR_W + ft / 2, DOOR_H / 2, 0));
  } else {
    pivot.add(p(box(fd, ft, DOOR_W + ft * 2, doorFrameMat), 0, DOOR_H + ft / 2, DOOR_W / 2));
    pivot.add(p(box(fd, DOOR_H, ft, doorFrameMat), 0, DOOR_H / 2, -ft / 2));
    pivot.add(p(box(fd, DOOR_H, ft, doorFrameMat), 0, DOOR_H / 2, DOOR_W + ft / 2));
  }

  const ho = axis === 'x' ? DOOR_W - 0.12 : 0, hz2 = axis === 'z' ? DOOR_W - 0.12 : 0;
  pivot.add(p(box(0.03, 0.12, 0.06, handleMat), axis === 'x' ? ho : 0.05, 1.0, axis === 'z' ? hz2 : 0.05));
  pivot.add(p(box(0.03, 0.12, 0.06, handleMat), axis === 'x' ? ho : -0.05, 1.0, axis === 'z' ? hz2 : -0.05));

  g.add(pivot);
  doors.push(pivot);
}

let _camera = null;
export function setCekarnaCamera(cam) { _camera = cam; }

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

export function updateCekarnaDoors(delta) {
  for (const d of doors) {
    const diff = d.userData.targetAngle - d.userData.currentAngle;
    if (Math.abs(diff) > 0.01) {
      d.userData.currentAngle += Math.sign(diff) * Math.min(Math.abs(diff), 3 * delta);
      d.rotation.y = d.userData.currentAngle;
    }
  }
}

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }
