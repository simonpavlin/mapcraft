import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof, addStairs,
  MAT, box, plane
} from './building-utils.js';

// Mrakodrap — MCP (150,70) → 3D (50, -30)
// 30×30m footprint, 25 floors × 3.5m = 87.5m
// Templates: lobby (P0), office (P1-P22), penthouse (P23-P24)
// Core: elevators + 2 stairwells + WC at center of every floor

const DS = THREE.DoubleSide;
const BW = 30, BD = 30;
const FH = 3.5;
const FLOORS = 25;
const LOBBY_H = 5; // double height lobby

const glass = new THREE.MeshLambertMaterial({ color: 0x6699bb, opacity: 0.3, transparent: true, side: DS });
const glassFrame = new THREE.MeshLambertMaterial({ color: 0x334455, side: DS });
const steel = new THREE.MeshLambertMaterial({ color: 0x555560, side: DS });
const steelDark = new THREE.MeshLambertMaterial({ color: 0x333338, side: DS });
const concrete = new THREE.MeshLambertMaterial({ color: 0x999090, side: DS });
const marble = new THREE.MeshLambertMaterial({ color: 0xd8d0c0, side: DS });
const marbleDark = new THREE.MeshLambertMaterial({ color: 0xa09888, side: DS });
const woodFloor = new THREE.MeshLambertMaterial({ color: 0xb09060, side: DS });
const carpet = new THREE.MeshLambertMaterial({ color: 0x404860, side: DS });
const carpetRed = new THREE.MeshLambertMaterial({ color: 0x6a3030, side: DS });
const deskMat = new THREE.MeshLambertMaterial({ color: 0xc0b098, side: DS });
const chairMat = new THREE.MeshLambertMaterial({ color: 0x333333, side: DS });
const sofaMat = new THREE.MeshLambertMaterial({ color: 0x404040, side: DS });
const counterMat = new THREE.MeshLambertMaterial({ color: 0xd0ccc0, side: DS });
const elevDoor = new THREE.MeshLambertMaterial({ color: 0x888890, side: DS });
const bedMat = new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS });
const bedSheet = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const tileMat = new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS });

function pos(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createMrakodrap(scene, cx = 50, cz = -30) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // Lobby (ground floor, double height)
  buildLobby(g);

  // Office floors (P1 - P22)
  for (let f = 1; f <= 22; f++) {
    const y = LOBBY_H + (f - 1) * FH;
    buildOfficeFloor(g, y, f);
  }

  // Penthouse (P23-P24)
  const pentY = LOBBY_H + 22 * FH;
  buildPenthouse(g, pentY);

  // Core on every floor
  buildCoreAllFloors(g);

  // Curtain wall facade (full height)
  buildFacade(g);

  // Roof
  const totalH = LOBBY_H + 22 * FH + 2 * FH;
  addFlatRoof(g, 0, 0, BW, BD, totalH, 0.5, steelDark);
  // Antenna
  g.add(pos(box(0.3, 8, 0.3, steel), BW / 2, totalH + 4, BD / 2));

  scene.add(g);
}

// ═══════════════════════════════
// FACADE — glass curtain wall
// ═══════════════════════════════

function buildFacade(g) {
  const totalH = LOBBY_H + 22 * FH + 2 * FH;

  // Structural mullions (vertical steel strips)
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i <= 10; i++) {
      const pos2 = i * 3;
      const mullion = side < 2
        ? box(0.08, totalH, 0.15, steelDark)
        : box(0.15, totalH, 0.08, steelDark);
      if (side === 0) mullion.position.set(pos2, totalH / 2, 0);
      else if (side === 1) mullion.position.set(pos2, totalH / 2, BD);
      else if (side === 2) mullion.position.set(0, totalH / 2, pos2);
      else mullion.position.set(BW, totalH / 2, pos2);
      g.add(mullion);
    }
  }

  // Horizontal spandrels at each floor
  for (let f = 0; f <= FLOORS; f++) {
    const y = f === 0 ? 0 : (LOBBY_H + (f - 1) * FH);
    for (let side = 0; side < 4; side++) {
      const spandrel = side < 2
        ? box(BW, 0.08, 0.1, steelDark)
        : box(0.1, 0.08, BD, steelDark);
      if (side === 0) spandrel.position.set(BW / 2, y, 0);
      else if (side === 1) spandrel.position.set(BW / 2, y, BD);
      else if (side === 2) spandrel.position.set(0, y, BD / 2);
      else spandrel.position.set(BW, y, BD / 2);
      g.add(spandrel);
    }
  }

  // Glass panels between mullions (per floor)
  for (let f = 0; f < FLOORS; f++) {
    const y = f === 0 ? 0 : (LOBBY_H + (f - 1) * FH);
    const fh = f === 0 ? LOBBY_H : FH;

    for (let i = 0; i < 10; i++) {
      const panelPos = i * 3 + 1.5;
      // North
      g.add(pos(plane(2.8, fh - 0.3, glass), panelPos, y + fh / 2, 0.01));
      // South
      const sp = plane(2.8, fh - 0.3, glass);
      sp.rotation.y = Math.PI;
      g.add(pos(sp, panelPos, y + fh / 2, BD - 0.01));
      // West
      const wp = plane(2.8, fh - 0.3, glass);
      wp.rotation.y = Math.PI / 2;
      g.add(pos(wp, 0.01, y + fh / 2, panelPos));
      // East
      const ep = plane(2.8, fh - 0.3, glass);
      ep.rotation.y = -Math.PI / 2;
      g.add(pos(ep, BW - 0.01, y + fh / 2, panelPos));
    }
  }
}

// ═══════════════════════════════
// CORE — elevators, stairs, WC
// ═══════════════════════════════

function buildCoreAllFloors(g) {
  const totalH = LOBBY_H + 22 * FH + 2 * FH;

  // Core walls (full height)
  // Core area: roughly x=10..20, z=10..20
  wallWithOpenings(g, { axis: 'x', x: 10, z: 10, length: 10, height: totalH, thickness: 0.2, material: concrete });
  wallWithOpenings(g, { axis: 'x', x: 10, z: 20, length: 10, height: totalH, thickness: 0.2, material: concrete });
  wallWithOpenings(g, { axis: 'z', x: 10, z: 10, length: 10, height: totalH, thickness: 0.2, material: concrete });
  wallWithOpenings(g, { axis: 'z', x: 20, z: 10, length: 10, height: totalH, thickness: 0.2, material: concrete });

  // Elevator shafts (11,11) 4×4 — 4 elevator doors per floor
  for (let f = 0; f < FLOORS; f++) {
    const y = f === 0 ? 0 : (LOBBY_H + (f - 1) * FH);
    // Elevator doors on north side of core
    for (let e = 0; e < 4; e++) {
      const ex = 12 + e * 1.5;
      const door = box(1.2, 2.2, 0.06, elevDoor);
      door.position.set(ex, y + 1.1, 10.01);
      g.add(door);
    }
  }

  // Stairs A (11, 15.5) 3×4 and B (16, 11) 3×4
  for (let f = 0; f < FLOORS - 1; f++) {
    const y = f === 0 ? 0 : (LOBBY_H + (f - 1) * FH);
    const fh = f === 0 ? LOBBY_H : FH;
    addStairs(g, { x: 11, z: 15.5, width: 3, depth: 4, floorHeight: fh, y, direction: 'south', material: concrete, railMaterial: steel });
    addStairs(g, { x: 16, z: 11, width: 3, depth: 4, floorHeight: fh, y, direction: 'south', material: concrete, railMaterial: steel });
  }
}

// ═══════════════════════════════
// LOBBY
// ═══════════════════════════════

function buildLobby(g) {
  addFloor(g, 0, 0, BW, BD, 0, marble);
  addCeiling(g, 0, 0, BW, BD, LOBBY_H, 0, marbleDark);

  // Entrance (revolving door area) — north side, center
  // Already open via glass facade

  // Reception desk (11, 3) 8×2
  const reception = box(8, 1.1, 2, counterMat);
  reception.position.set(15, 0.55, 4);
  g.add(reception);
  const receptionTop = box(8.2, 0.05, 2.2, marbleDark);
  receptionTop.position.set(15, 1.125, 4);
  g.add(receptionTop);

  // Seating areas
  for (const [sx, sz] of [[4.5, 5], [25.5, 5]]) {
    const sofa = box(3, 0.4, 1, sofaMat);
    g.add(pos(sofa, sx, 0.35, sz));
    const table = box(1, 0.03, 0.6, deskMat);
    g.add(pos(table, sx, 0.45, sz + 1.2));
  }

  // Floor pattern — carpet runner
  const runner = plane(6, 8, carpetRed);
  runner.rotation.x = -Math.PI / 2;
  g.add(pos(runner, 15, 0.16, 4));

  // Shop area left (2, 10) 8×8
  wallWithOpenings(g, { axis: 'x', x: 2, z: 10, length: 8, height: LOBBY_H, thickness: 0.1, material: glass,
    openings: [{ start: 4, end: 5.5, top: 2.5 }]
  });
  wallWithOpenings(g, { axis: 'z', x: 10, z: 10, length: 8, height: LOBBY_H, thickness: 0.1, material: concrete });

  // Café area right (20, 10) 8×8
  wallWithOpenings(g, { axis: 'x', x: 20, z: 10, length: 8, height: LOBBY_H, thickness: 0.1, material: glass,
    openings: [{ start: 2, end: 3.5, top: 2.5 }]
  });
  wallWithOpenings(g, { axis: 'z', x: 20, z: 10, length: 8, height: LOBBY_H, thickness: 0.1, material: concrete });

  // Security (2, 20) 5×4
  wallWithOpenings(g, { axis: 'x', x: 2, z: 20, length: 5, height: LOBBY_H, thickness: 0.1, material: concrete,
    openings: [{ start: 2, end: 3, top: 2.2 }]
  });
  addDoor(g, { axis: 'x', x: 2, z: 20, at: 2.5, width: 1 });
}

// ═══════════════════════════════
// OFFICE FLOOR (template)
// ═══════════════════════════════

function buildOfficeFloor(g, y, floorNum) {
  addFloor(g, 0, 0, BW, BD, y, carpet);
  addCeiling(g, 0, 0, BW, BD, FH, y);

  // Desk rows — from MCP template positions
  // North rows: (7, 2) 14×1 and (7, 5) 14×1
  addDeskRow(g, 7, 2, 14, y);
  addDeskRow(g, 7, 5, 14, y);
  // South rows: (7, 22) and (7, 25)
  addDeskRow(g, 7, 22, 14, y);
  addDeskRow(g, 7, 25, 14, y);
  // West: (2, 13) 5×1
  addDeskRow(g, 2, 13, 5, y);
  // East: (23, 13) 5×1
  addDeskRow(g, 23, 13, 5, y);

  // Meeting rooms — glass partitions
  // Zasedačka A (1,1) 5×4
  wallWithOpenings(g, { axis: 'z', x: 6, z: 1, length: 4, height: FH, y, thickness: 0.06, material: glass,
    openings: [{ start: 1, end: 2, top: 2.2 }]
  });
  wallWithOpenings(g, { axis: 'x', x: 1, z: 5, length: 5, height: FH, y, thickness: 0.06, material: glass });

  // Zasedačka B (24,1) 5×4
  wallWithOpenings(g, { axis: 'z', x: 24, z: 1, length: 4, height: FH, y, thickness: 0.06, material: glass,
    openings: [{ start: 1, end: 2, top: 2.2 }]
  });
  wallWithOpenings(g, { axis: 'x', x: 24, z: 5, length: 5, height: FH, y, thickness: 0.06, material: glass });

  // Meeting table in each zasedačka
  for (const mx of [3.5, 26.5]) {
    const mTable = box(3, 0.04, 1.5, deskMat);
    g.add(pos(mTable, mx, y + 0.74, 3));
  }

  // Kuchyňka (1, 5.5) 4×3
  wallWithOpenings(g, { axis: 'z', x: 5, z: 5.5, length: 3, height: FH, y, thickness: 0.1, material: concrete,
    openings: [{ start: 0.5, end: 1.5, top: 2.2 }]
  });
  const kitchenCounter = box(3.5, 0.9, 0.5, counterMat);
  g.add(pos(kitchenCounter, 2.75, y + 0.45, 8));
}

function addDeskRow(g, x, z, length, y) {
  // Row of desks with dividers
  const numDesks = Math.floor(length / 1.8);
  for (let i = 0; i < numDesks; i++) {
    const dx = x + i * 1.8 + 0.9;
    // Desk surface
    const desk = box(1.6, 0.03, 0.8, deskMat);
    g.add(pos(desk, dx, y + 0.73, z + 0.4));
    // Legs
    for (const lx of [-0.7, 0.7]) {
      const leg = box(0.04, 0.71, 0.04, steelDark);
      g.add(pos(leg, dx + lx, y + 0.355, z + 0.4));
    }
    // Monitor
    const mon = box(0.5, 0.3, 0.03, new THREE.MeshLambertMaterial({ color: 0x111111, side: DS }));
    g.add(pos(mon, dx, y + 1.05, z + 0.2));
    // Chair
    const chair = box(0.45, 0.04, 0.45, chairMat);
    g.add(pos(chair, dx, y + 0.45, z + 1));
  }
}

// ═══════════════════════════════
// PENTHOUSE (P23-P24)
// ═══════════════════════════════

function buildPenthouse(g, y) {
  // Two floors for penthouse
  for (let pf = 0; pf < 2; pf++) {
    const py = y + pf * FH;
    addFloor(g, 0, 0, BW, BD, py, woodFloor);
    addCeiling(g, 0, 0, BW, BD, FH, py);
  }

  // P23 — living floor
  const py = y;

  // Obývák (1,1) 14×12
  // Interior walls
  // Wall between obývák and kuchyně at x=15.5 (with open passage at z=4..6)
  wallWithOpenings(g, { axis: 'z', x: 15, z: 1, length: 12, height: FH, y: py, thickness: 0.12, material: MAT.wallInner,
    openings: [{ start: 3, end: 5 }]
  });
  // Wall between living zone and bedrooms at y=14.5
  wallWithOpenings(g, { axis: 'x', x: 1, z: 14.5, length: 28, height: FH, y: py, thickness: 0.12, material: MAT.wallInner,
    openings: [{ start: 4, end: 5.2, top: 2.2 }, { start: 19, end: 20.2, top: 2.2 }]
  });
  addDoor(g, { axis: 'x', x: 1, z: 14.5, at: 4.6, width: 1.2, y: py });
  addDoor(g, { axis: 'x', x: 1, z: 14.5, at: 19.6, width: 1.2, y: py });

  // Koupelna walls (11.5, 15) 4.5×5
  wallWithOpenings(g, { axis: 'z', x: 11, z: 15, length: 5, height: FH, y: py, thickness: 0.1, material: MAT.wallBathroom,
    openings: [{ start: 2, end: 3, top: 2.2 }]
  });
  wallWithOpenings(g, { axis: 'z', x: 16, z: 15, length: 8, height: FH, y: py, thickness: 0.1, material: MAT.wallInner });
  wallWithOpenings(g, { axis: 'x', x: 11.5, z: 20, length: 4.5, height: FH, y: py, thickness: 0.1, material: MAT.wallBathroom });
  // Šatna wall
  wallWithOpenings(g, { axis: 'x', x: 11.5, z: 20.5, length: 4.5, height: FH, y: py, thickness: 0.1, material: MAT.wallInner,
    openings: [{ start: 0, end: 1, top: 2.2 }]
  });

  // Terasa wall (south, y=24) — sliding glass door
  wallWithOpenings(g, { axis: 'x', x: 1, z: 24, length: 28, height: FH, y: py, thickness: 0.1, material: MAT.wallInner,
    openings: [{ start: 11, end: 14 }]
  });
  // Glass railing on terasa
  const railing = plane(28, 1.1, glass);
  g.add(pos(railing, 15, py + 0.6, BD - 0.5));

  // Bathroom floor
  const bathFloor = plane(4.5, 5, tileMat);
  bathFloor.rotation.x = -Math.PI / 2;
  g.add(pos(bathFloor, 13.75, py + 0.16, 17.5));

  // === Furniture ===

  // Pohovka (3, 5) 3×1
  const sofa = box(3, 0.4, 1, sofaMat);
  g.add(pos(sofa, 4.5, py + 0.35, 5.5));
  const sofaBack = box(3, 0.35, 0.12, sofaMat);
  g.add(pos(sofaBack, 4.5, py + 0.55, 5));

  // Stolek (3.5, 7) 1.5×0.8
  const table = box(1.5, 0.03, 0.8, deskMat);
  g.add(pos(table, 4.25, py + 0.4, 7.4));

  // TV
  const tv = box(1.8, 1, 0.04, new THREE.MeshLambertMaterial({ color: 0x0a0a0a, side: DS }));
  g.add(pos(tv, 7, py + 1.5, 1.2));

  // Kitchen counter
  const counter = box(6, 0.9, 0.6, counterMat);
  g.add(pos(counter, 19.5, py + 0.45, 1.5));
  // Kitchen island
  const island = box(3, 0.9, 0.8, steelDark);
  g.add(pos(island, 19.5, py + 0.45, 4));

  // Dining table
  const dTable = box(2.5, 0.04, 1.2, deskMat);
  g.add(pos(dTable, 19.5, py + 0.75, 10));

  // Postel (3, 17) 2×2.2
  const bed = box(2, 0.35, 2.2, bedMat);
  g.add(pos(bed, 4, py + 0.275, 18.1));
  const mattress = box(1.9, 0.15, 2.1, bedSheet);
  g.add(pos(mattress, 4, py + 0.5, 18.1));
  const headboard = box(2, 0.6, 0.1, bedMat);
  g.add(pos(headboard, 4, py + 0.5, 15.2));

  // Guest room bed
  const gBed = box(1.6, 0.35, 2, bedMat);
  g.add(pos(gBed, 20.5, py + 0.275, 18));
  const gMatt = box(1.5, 0.12, 1.9, bedSheet);
  g.add(pos(gMatt, 20.5, py + 0.48, 18));
}

// ═══════════════════════════════
// HELPERS
// ═══════════════════════════════

// (all imported from building-utils.js)
