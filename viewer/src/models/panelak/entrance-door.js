import * as THREE from 'three';
import { box } from '../../building-utils.js';

// ════════════════════════════════════════════════
// MATERIALS
// ════════════════════════════════════════════════

const DS = THREE.FrontSide;

const frameMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });
const frameInner = new THREE.MeshLambertMaterial({ color: 0x333333, side: DS });
const glassMat = new THREE.MeshLambertMaterial({ color: 0x88bbdd, opacity: 0.3, transparent: true, side: DS });
const glassTransom = new THREE.MeshLambertMaterial({ color: 0x7799aa, opacity: 0.25, transparent: true, side: DS });
const handleMat = new THREE.MeshLambertMaterial({ color: 0xcccccc, side: DS });
const kickplateMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS });
const thresholdMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const intercomMat = new THREE.MeshLambertMaterial({ color: 0x222222, side: DS });
const screenMat = new THREE.MeshLambertMaterial({ color: 0x1a3a1a, side: DS });
const btnMat = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const ledMat = new THREE.MeshLambertMaterial({ color: 0x00cc44, side: DS, emissive: 0x004411 });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

function glassPlane(w, h, mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat.clone());
  m.material.polygonOffset = true;
  m.material.polygonOffsetFactor = -1;
  m.material.polygonOffsetUnits = -1;
  return m;
}

// ════════════════════════════════════════════════
// INTERACTIVE DOOR SYSTEM
// ════════════════════════════════════════════════

const interactiveDoors = [];

export function updateEntranceDoors(delta) {
  for (const d of interactiveDoors) {
    const diff = d.userData.targetAngle - d.userData.currentAngle;
    if (Math.abs(diff) > 0.005) {
      d.userData.currentAngle += Math.sign(diff) * Math.min(Math.abs(diff), 2.5 * delta);
      d.rotation.y = d.userData.currentAngle;
    }
  }
}

let _clickSetup = false;
let _camera = null;

export function setupEntranceDoorInteraction(camera) {
  _camera = camera;
  if (_clickSetup) return;
  _clickSetup = true;

  const rc = new THREE.Raycaster();
  rc.far = 5;

  window.addEventListener('click', () => {
    if (!document.pointerLockElement || !_camera) return;
    rc.setFromCamera(new THREE.Vector2(0, 0), _camera);

    // Collect all meshes from interactive doors
    const meshes = [];
    for (const door of interactiveDoors) {
      door.traverse(child => { if (child.isMesh) meshes.push(child); });
    }

    for (const hit of rc.intersectObjects(meshes, false)) {
      let obj = hit.object;
      while (obj && !obj.userData?.isDoorLeaf) obj = obj.parent;
      if (obj?.userData?.isDoorLeaf) {
        obj.userData.isOpen = !obj.userData.isOpen;
        obj.userData.targetAngle = obj.userData.isOpen ? obj.userData.openAngle : 0;
        break;
      }
    }
  });
}

// ════════════════════════════════════════════════
// ENTRANCE DOOR — double-leaf glass door
// ════════════════════════════════════════════════
// MCP: vstupni_dvere_panelak/otvor (0,0) 1.6×2.4m
//   ram_levy (0,0) 0.05×2.4 | ram_pravy (1.55,0) 0.05×2.4
//   ram_delici (0.775,0) 0.05×2.1 | ram_horni (0,2.36) 1.6×0.04
//   ram_stredni (0.05,2.1) 1.5×0.04 | prah (0,0) 1.6×0.02
//   kridlo_leve (0.05,0.02) 0.725×2.08 | kridlo_prave (0.825,0.02) 0.725×2.08
//   nadsvetlik (0.05,2.14) 1.5×0.22 | zvonek (1.6,1.1) 0.12×0.28

export function createEntranceDoor(group, { axis = 'x', cx, z: wz, doorWidth = 1.6, y = 0 }) {
  const g = new THREE.Group();

  // mcp:otvor (0,0) 1.6×2.4
  const totalH = 2.4;
  const doorH = 2.1;
  const frameW = 0.05;
  const frameD = 0.12;
  const leafW = 0.725;  // mcp:kridlo_leve.w
  const zOff = 0.06;

  if (axis === 'x') {
    const startX = cx - doorWidth / 2;

    // ── VNĚJŠÍ RÁM ──

    // mcp:ram_levy (0,0) 0.05×2.4
    g.add(p(box(frameW, totalH, frameD, frameMat),
      startX + frameW / 2, y + totalH / 2, wz));
    // mcp:ram_pravy (1.55,0) 0.05×2.4
    g.add(p(box(frameW, totalH, frameD, frameMat),
      startX + 1.55 + frameW / 2, y + totalH / 2, wz));
    // mcp:ram_delici (0.775,0) 0.05×2.1
    g.add(p(box(frameW, doorH, frameD, frameMat),
      startX + 0.775 + frameW / 2, y + doorH / 2, wz));
    // mcp:ram_horni (0,2.36) 1.6×0.04
    g.add(p(box(doorWidth, 0.04, frameD, frameMat),
      cx, y + 2.36 + 0.02, wz));
    // mcp:ram_stredni (0.05,2.1) 1.5×0.04
    g.add(p(box(1.5, 0.04, frameD, frameMat),
      cx, y + 2.1 + 0.02, wz));

    // ── PRÁH ──
    // mcp:prah (0,0) 1.6×0.02
    g.add(p(box(doorWidth, 0.02, 0.2, thresholdMat),
      cx, y + 0.01, wz));

    // ── NADSVĚTLÍK ──
    // mcp:nadsvetlik (0.05,2.14) 1.5×0.22
    const transGlass = glassPlane(1.5, 0.22, glassTransom);
    transGlass.position.set(cx, y + 2.14 + 0.11, wz + zOff);
    g.add(transGlass);

    // ── LEVÉ KŘÍDLO (interaktivní) ──
    // mcp:kridlo_leve (0.05,0.02) 0.725×2.08
    // Pivot at left edge (hinge side), swings outward (+z)
    const leftPivot = new THREE.Group();
    leftPivot.position.set(startX + 0.05, y + 0.02, wz);
    leftPivot.userData = {
      isDoorLeaf: true, isOpen: false,
      currentAngle: 0, targetAngle: 0,
      openAngle: Math.PI / 2,  // opens outward (south)
    };
    buildLeafContents(leftPivot, leafW, 2.08, zOff, 'right');
    g.add(leftPivot);
    interactiveDoors.push(leftPivot);

    // ── PRAVÉ KŘÍDLO (interaktivní) ──
    // mcp:kridlo_prave (0.825,0.02) 0.725×2.08
    // Pivot at right edge (hinge side), swings outward (+z)
    const rightPivot = new THREE.Group();
    rightPivot.position.set(startX + 0.825 + leafW, y + 0.02, wz);
    rightPivot.userData = {
      isDoorLeaf: true, isOpen: false,
      currentAngle: 0, targetAngle: 0,
      openAngle: -Math.PI / 2,  // opens outward (south), opposite direction
    };
    buildLeafContents(rightPivot, leafW, 2.08, zOff, 'left');
    g.add(rightPivot);
    interactiveDoors.push(rightPivot);

    // ── ZVONKOVÝ PANEL ──
    // mcp:zvonek (1.6,1.1) 0.12×0.28
    buildIntercom(g, {
      x: startX + 1.6 + 0.06,
      y: y + 1.1 + 0.14,
      z: wz + frameD / 2 + 0.01,
    });
  }

  group.add(g);
}

// ════════════════════════════════════════════════
// LEAF CONTENTS — built relative to pivot point
// ════════════════════════════════════════════════
// handleSide: 'right' = handle on right (for left leaf), 'left' = handle on left (for right leaf)
// For left leaf: pivot at x=0, leaf extends to x=+leafW
// For right leaf: pivot at x=0 (right edge), leaf extends to x=-leafW

function buildLeafContents(pivot, leafW, leafH, zOff, handleSide) {
  // Direction: left leaf extends +x from pivot, right leaf extends -x
  const dir = handleSide === 'right' ? 1 : -1;
  const cx = dir * leafW / 2; // center x relative to pivot

  // mcp:kopaci_plech (0.01,0) 0.705×0.25
  const kickW = 0.705;
  const kickH = 0.25;
  pivot.add(p(box(kickW, kickH, 0.04, kickplateMat),
    cx, kickH / 2, zOff));

  // mcp:sklo_dolni (0.02,0.28) 0.685×0.72
  const glassDW = 0.685, glassDH = 0.72;
  const glassD = glassPlane(glassDW, glassDH, glassMat);
  glassD.position.set(cx, 0.28 + glassDH / 2, zOff);
  pivot.add(glassD);

  // mcp:pricka_stred (0.01,1) 0.705×0.03
  pivot.add(p(box(kickW, 0.03, 0.03, frameInner),
    cx, 1 + 0.015, zOff));

  // mcp:sklo_horni (0.02,1.03) 0.685×0.98
  const glassHH = 0.98;
  const glassH = glassPlane(glassDW, glassHH, glassMat);
  glassH.position.set(cx, 1.03 + glassHH / 2, zOff);
  pivot.add(glassH);

  // mcp:ram_l, ram_r, ram_top — leaf frame profiles
  const edgeL = dir === 1 ? cx - kickW / 2 : cx + kickW / 2;
  const edgeR = dir === 1 ? cx + kickW / 2 : cx - kickW / 2;
  pivot.add(p(box(0.02, leafH - 0.25, 0.03, frameInner),
    edgeL, 0.25 + (leafH - 0.25) / 2, zOff));
  pivot.add(p(box(0.02, leafH - 0.25, 0.03, frameInner),
    edgeR, 0.25 + (leafH - 0.25) / 2, zOff));
  // mcp:ram_top (0.01,2.03) 0.705×0.03
  pivot.add(p(box(kickW, 0.03, 0.03, frameInner),
    cx, leafH - 0.015, zOff));

  // ── MADLO (handle) ──
  // mcp:klika (0.62,0.76) 0.03×0.3 or (0.065,0.76) for right leaf
  // Handle is always at the FREE edge (far from hinge/pivot)
  const handleX = dir * (leafW - 0.06);

  const handleH = 0.3;
  const handleY = 0.76 + handleH / 2;

  // Handle bar (cylinder)
  const handleGeom = new THREE.CylinderGeometry(0.012, 0.012, handleH, 8);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.set(handleX, handleY, zOff + 0.035);
  pivot.add(handle);

  // Handle mounts
  for (const dy of [-handleH / 2 + 0.03, handleH / 2 - 0.03]) {
    pivot.add(p(box(0.02, 0.02, 0.04, handleMat),
      handleX, handleY + dy, zOff + 0.02));
  }

  // ── ZÁMEK ──
  // mcp:zamek (0.63,0.65) 0.03×0.03
  const lockGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8);
  lockGeom.rotateX(Math.PI / 2);
  const lock = new THREE.Mesh(lockGeom, handleMat);
  lock.position.set(handleX, 0.65 + 0.015, zOff + 0.03);
  pivot.add(lock);
}

// ════════════════════════════════════════════════
// INTERCOM — zvonkový panel
// ════════════════════════════════════════════════
// mcp:zvonek (1.6,1.1) 0.12×0.28
//   kamera (0.03,0.2) 0.06×0.04 | reproduktor (0.02,0.13) 0.08×0.05
//   tlacitka (0.02,0.02) 0.08×0.1 | rfid (0.03,0) 0.06×0.02

function buildIntercom(g, { x, y, z }) {
  // Panel body
  g.add(p(box(0.12, 0.28, 0.025, intercomMat), x, y, z));

  // mcp:kamera (0.03,0.2) 0.06×0.04
  g.add(p(box(0.06, 0.04, 0.005, screenMat), x, y + 0.09, z + 0.013));

  // mcp:reproduktor (0.02,0.13) 0.08×0.05
  for (let i = -2; i <= 2; i++) {
    g.add(p(box(0.05, 0.003, 0.003, btnMat), x, y + 0.05 + i * 0.007, z + 0.013));
  }

  // mcp:tlacitka (0.02,0.02) 0.08×0.1
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      g.add(p(box(0.018, 0.012, 0.005, btnMat),
        x - 0.015 + col * 0.03, y - 0.02 - row * 0.022, z + 0.013));
    }
  }

  // LED
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 6), ledMat);
  led.position.set(x + 0.04, y + 0.09, z + 0.015);
  g.add(led);

  // mcp:rfid (0.03,0) 0.06×0.02
  g.add(p(box(0.04, 0.025, 0.005, frameInner), x, y - 0.12, z + 0.013));
}
