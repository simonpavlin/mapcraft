import * as THREE from 'three';
import { box, plane, MAT } from './building-utils.js';

// Točité schodiště ve věži — 3 patra, kamenné stupně kolem centrálního sloupu
// Vnější poloměr 2.5m, centrální sloup 0.4m, výška patra 3.5m

const DS = THREE.FrontSide;
const OUTER_R = 2.5;
const INNER_R = 0.4;
const FH = 3.5;
const FLOORS = 3;
const TOTAL_H = FLOORS * FH;            // 10.5m
const STEPS_PER_REV = 16;               // steps per full 360°
const TOTAL_STEPS = FLOORS * STEPS_PER_REV;  // 48
const STEP_RISE = TOTAL_H / TOTAL_STEPS;     // ~0.219m
const STEP_ANGLE = (Math.PI * 2) / STEPS_PER_REV;  // 22.5°
const TOWER_R = 3.0;                    // tower inner radius
const TOWER_WALL = 0.5;

const stone = new THREE.MeshLambertMaterial({ color: 0x8a8478, side: DS });
const stoneDark = new THREE.MeshLambertMaterial({ color: 0x6a6460, side: DS });
const stoneLight = new THREE.MeshLambertMaterial({ color: 0xa09888, side: DS });
const stoneStep = new THREE.MeshLambertMaterial({ color: 0x9a9080, side: DS });
const iron = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS });
const ironLight = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const wood = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const cobble = new THREE.MeshLambertMaterial({ color: 0x787068, side: DS });

export function createTociteSchodiste(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  buildTower(g);
  buildCentralColumn(g);
  buildSteps(g);
  buildRailing(g);
  buildFloorPlatforms(g);
  buildArrowSlits(g);

  scene.add(g);
}

// ── Věž (cylindrical tower shell) ───────────────────────

function buildTower(g) {
  // Outer wall — cylinder with open interior
  const outerGeo = new THREE.CylinderGeometry(
    TOWER_R + TOWER_WALL, TOWER_R + TOWER_WALL + 0.1,
    TOTAL_H + 1, 24, 1, true
  );
  const outerWall = new THREE.Mesh(outerGeo, stone);
  outerWall.position.set(0, (TOTAL_H + 1) / 2, 0);
  g.add(outerWall);

  // Inner face of wall (so it's visible from inside)
  const innerGeo = new THREE.CylinderGeometry(
    TOWER_R, TOWER_R, TOTAL_H + 1, 24, 1, true
  );
  const innerMat = stoneLight.clone();
  innerMat.side = THREE.BackSide;
  const innerWall = new THREE.Mesh(innerGeo, innerMat);
  innerWall.position.set(0, (TOTAL_H + 1) / 2, 0);
  g.add(innerWall);

  // Ground floor
  const floorGeo = new THREE.CircleGeometry(TOWER_R, 24);
  const floor = new THREE.Mesh(floorGeo, cobble);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.01, 0);
  g.add(floor);

  // Roof / top cap
  const roofGeo = new THREE.ConeGeometry(TOWER_R + TOWER_WALL + 0.3, 3, 24);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a3020, side: DS });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, TOTAL_H + 1 + 1.5, 0);
  g.add(roof);

  // Door opening at ground level (south side)
  const doorW = 1.2, doorH = 2.2;
  const door = box(doorW, doorH, TOWER_WALL + 0.2, stone);
  door.position.set(0, doorH / 2, TOWER_R + TOWER_WALL / 2);
  // Cut-out effect: place a dark recessed box
  const doorHole = box(doorW - 0.1, doorH - 0.1, TOWER_WALL + 0.3, new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS }));
  doorHole.position.set(0, doorH / 2, TOWER_R + TOWER_WALL / 2);
  g.add(doorHole);
}

// ── Centrální sloup ─────────────────────────────────────

function buildCentralColumn(g) {
  const colGeo = new THREE.CylinderGeometry(INNER_R, INNER_R + 0.05, TOTAL_H + 0.5, 12);
  const col = new THREE.Mesh(colGeo, stoneDark);
  col.position.set(0, (TOTAL_H + 0.5) / 2, 0);
  g.add(col);
}

// ── Stupně (wedge-shaped stone steps) ───────────────────

function buildSteps(g) {
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const angle = i * STEP_ANGLE;
    const y = i * STEP_RISE;

    buildWedgeStep(g, angle, y, STEP_RISE);
  }
}

function buildWedgeStep(g, angle, y, rise) {
  // Each step is a wedge: narrow at center column, wide at outer edge
  // Approximate with a box rotated around the center
  const midR = (INNER_R + OUTER_R) / 2;
  const stepLen = OUTER_R - INNER_R;   // radial length
  const stepWidthOuter = OUTER_R * STEP_ANGLE * 0.95;  // arc width at outer edge
  const stepWidthMid = midR * STEP_ANGLE * 0.95;

  // Use a custom shape for better wedge look
  const shape = new THREE.Shape();
  const innerW = INNER_R * STEP_ANGLE * 0.9;
  const outerW = OUTER_R * STEP_ANGLE * 0.9;

  // Wedge in local coords: x = radial (0 = inner, stepLen = outer), z = tangential
  shape.moveTo(0, -innerW / 2);
  shape.lineTo(stepLen, -outerW / 2);
  shape.lineTo(stepLen, outerW / 2);
  shape.lineTo(0, innerW / 2);
  shape.closePath();

  const extrudeSettings = { depth: rise, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  const step = new THREE.Mesh(geo, stoneStep);
  // Position: rotate around center
  step.rotation.y = -angle;
  step.rotation.x = -Math.PI / 2;  // extrude goes up

  // Offset radially from center
  const cx = Math.sin(angle) * (INNER_R + stepLen / 2);
  const cz = Math.cos(angle) * (INNER_R + stepLen / 2);

  // Reset — use group transform instead
  step.rotation.set(0, 0, 0);

  const stepGroup = new THREE.Group();
  stepGroup.add(step);

  // Place step: extrude geometry is in XY plane, depth along Z
  // We need it horizontal (XZ plane) with depth going up (Y)
  step.rotation.x = -Math.PI / 2;
  step.position.set(INNER_R, y + rise, 0);

  stepGroup.rotation.y = -angle;
  stepGroup.position.set(0, 0, 0);

  g.add(stepGroup);

  // Riser (vertical face) — thin strip at the front of the step
  const riserGroup = new THREE.Group();
  const riserW = midR * STEP_ANGLE;
  const riser = box(stepLen, rise, 0.02, stoneDark);
  riser.position.set(INNER_R + stepLen / 2, y + rise / 2, -innerW / 3);
  riserGroup.add(riser);
  riserGroup.rotation.y = -angle;
  g.add(riserGroup);
}

// ── Zábradlí (iron railing on outer edge) ───────────────

function buildRailing(g) {
  const RAIL_H = 0.9;
  const railR = OUTER_R + 0.05;

  for (let i = 0; i < TOTAL_STEPS; i++) {
    const angle = i * STEP_ANGLE;
    const y = i * STEP_RISE + STEP_RISE;

    // Baluster at outer edge of each step
    const bx = Math.sin(angle) * railR;
    const bz = Math.cos(angle) * railR;

    const baluster = box(0.03, RAIL_H, 0.03, iron);
    baluster.position.set(bx, y + RAIL_H / 2, bz);
    g.add(baluster);

    // Horizontal handrail segment connecting to next baluster
    if (i < TOTAL_STEPS - 1) {
      const nextAngle = (i + 1) * STEP_ANGLE;
      const nextY = (i + 1) * STEP_RISE + STEP_RISE;
      const nx = Math.sin(nextAngle) * railR;
      const nz = Math.cos(nextAngle) * railR;

      const segLen = Math.sqrt(
        (nx - bx) ** 2 + (nz - bz) ** 2 + (nextY - y) ** 2
      );
      const rail = box(0.04, 0.04, segLen, ironLight);

      // Point rail toward next baluster
      rail.position.set(
        (bx + nx) / 2,
        (y + nextY) / 2 + RAIL_H,
        (bz + nz) / 2
      );
      rail.lookAt(nx, nextY + RAIL_H, nz);
      g.add(rail);
    }

    // Decorative curl every 8 steps
    if (i % 8 === 0 && i > 0) {
      const ornament = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8), iron
      );
      ornament.position.set(bx, y + RAIL_H + 0.05, bz);
      g.add(ornament);
    }
  }
}

// ── Podlaží (platforms at each floor) ───────────────────

function buildFloorPlatforms(g) {
  // At each floor, add a landing platform (partial ring)
  // The landing is where you step off the spiral onto the floor
  for (let f = 1; f <= FLOORS; f++) {
    const y = f * FH;
    // Find which step index corresponds to this height
    const stepIdx = Math.round(y / STEP_RISE);
    const landingAngle = stepIdx * STEP_ANGLE;

    // Semi-circular landing platform (~90° arc)
    const segments = 6;
    for (let s = 0; s < segments; s++) {
      const a = landingAngle + (s / segments) * (Math.PI / 2);
      const midR2 = (OUTER_R + TOWER_R) / 2;
      const px = Math.sin(a) * midR2;
      const pz = Math.cos(a) * midR2;
      const platW = (TOWER_R - OUTER_R);
      const platD = midR2 * (Math.PI / 2) / segments;

      const plat = box(platW, 0.15, platD, stoneLight);
      plat.rotation.y = -a;
      plat.position.set(px, y, pz);
      g.add(plat);
    }
  }
}

// ── Střílny (arrow slits in tower wall) ─────────────────

function buildArrowSlits(g) {
  const slitMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS });

  for (let f = 0; f < FLOORS; f++) {
    // 4 arrow slits per floor, evenly spaced
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + f * 0.5; // offset per floor
      const y = f * FH + FH / 2 + 1;
      const wx = Math.sin(angle) * (TOWER_R + TOWER_WALL / 2);
      const wz = Math.cos(angle) * (TOWER_R + TOWER_WALL / 2);

      // Dark slit
      const slit = box(0.12, 0.8, TOWER_WALL + 0.1, slitMat);
      slit.rotation.y = -angle;
      slit.position.set(wx, y, wz);
      g.add(slit);
    }
  }
}
