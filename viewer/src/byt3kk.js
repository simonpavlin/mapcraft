import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof, addFloorOverlay,
  MAT, box, plane
} from './building-utils.js';

// Byt 3+kk s balkonem — 14×11m vnitřní + 10×2m balkon
// MCP layout (recursive view verified):
//   koupelna (0,0) 3×3.5    — SZ roh
//   chodba (3,0) 1.5×7      — vertikální páteř
//   wc (4.5,0) 1.5×2        — u chodby
//   šatna (6,0) 2×2          — u chodby
//   tech (8,0) 1.5×2         — u chodby
//   ložnice (0,3.5) 3×3.5   — západ
//   dětský (10,0) 4×4        — SV roh
//   pracovna (10,4) 4×3      — východ
//   obývák (0,7) 14×4        — celý jih
//   balkon (2,11) 10×2       — za jižní stěnou

const DS = THREE.FrontSide;
const FH = 2.8;

const mw = new THREE.MeshLambertMaterial({ color: 0xf0ece4, side: DS });
const mi = new THREE.MeshLambertMaterial({ color: 0xf5f2ec, side: DS });
const mb = new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS });
const mfl = new THREE.MeshLambertMaterial({ color: 0xc4a06a, side: DS });
const mfb = new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS });
const mfh = new THREE.MeshLambertMaterial({ color: 0xa09080, side: DS });
const mft = new THREE.MeshLambertMaterial({ color: 0xb09070, side: DS });
const mc = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const sofa = new THREE.MeshLambertMaterial({ color: 0x404850, side: DS });
const wood = new THREE.MeshLambertMaterial({ color: 0xb09060, side: DS });
const woodDk = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const metal = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const white = new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS });
const counter = new THREE.MeshLambertMaterial({ color: 0xe0dcd4, side: DS });
const counterDk = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });
const bed = new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS });
const sheet = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const tvMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a, side: DS });
const fridge = new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS });
const mirror = new THREE.MeshLambertMaterial({ color: 0xaaccdd, side: DS });
const shower = new THREE.MeshLambertMaterial({ color: 0xbbddee, opacity: 0.3, transparent: true, side: DS });
const railing = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const railGlass = new THREE.MeshLambertMaterial({ color: 0x88bbcc, opacity: 0.25, transparent: true, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createByt3kk(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // Floor + ceiling
  addFloor(g, 0, 0, 14, 11, 0, mfl);
  addCeiling(g, 0, 0, 14, 11, FH, 0, mc);

  // Floor overlays
  addFloorOverlay(g, 3, 0, 1.5, 7, 0, mfh);     // mcp:chodba
  addFloorOverlay(g, 0, 0, 3, 3.5, 0, mfb);      // mcp:koupelna
  addFloorOverlay(g, 4.5, 0, 1.5, 2, 0, mfb);    // mcp:wc

  // ═══ OUTER WALLS ═══

  // North (z=0) — mcp:d_vstup (3.2,0) 1m
  wallWithOpenings(g, { axis: 'x', x: 0, z: 0, length: 14, height: FH, material: mw,
    openings: [
      { start: 3.2, end: 4.2, top: 2.2 },                    // mcp:d_vstup
      { start: 11, end: 13, bottom: 0.5, top: 2.5 },         // mcp:detsky/w_north
    ]
  });
  addDoor(g, { axis: 'x', x: 0, z: 0, at: 3.7, width: 1, material: MAT.doorEntrance });
  addWindow(g, { axis: 'x', x: 0, z: 0, at: 12, width: 2, sillHeight: 0.5, winHeight: 2 });

  // South (z=11) — mcp:d_balkon (5,11) 3m + mcp:obyvak/w_south panorama
  wallWithOpenings(g, { axis: 'x', x: 0, z: 11, length: 14, height: FH, material: mw,
    openings: [
      { start: 3, end: 10, bottom: 0.2, top: 2.8 },          // mcp:obyvak/w_south panorama
      { start: 5, end: 8 },                                    // mcp:d_balkon — full height sliding
    ]
  });
  addWindow(g, { axis: 'x', x: 0, z: 11, at: 4, width: 2, sillHeight: 0.2, winHeight: 2.6 });
  addWindow(g, { axis: 'x', x: 0, z: 11, at: 9, width: 2, sillHeight: 0.2, winHeight: 2.6 });
  addDoor(g, { axis: 'x', x: 0, z: 11, at: 6.5, width: 3, material: MAT.door });

  // West (x=0) — mcp:koupelna/w_west, mcp:loznice/w_west, mcp:obyvak/w_west
  wallWithOpenings(g, { axis: 'z', x: 0, z: 0, length: 11, height: FH, material: mw,
    openings: [
      { start: 1, end: 2, bottom: 1.2, top: 2.2 },           // mcp:koupelna/w_west
      { start: 4.5, end: 6, bottom: 0.5, top: 2.5 },         // mcp:loznice/w_west
      { start: 8, end: 9.5, bottom: 0.5, top: 2.5 },         // mcp:obyvak/w_west
    ]
  });
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 1.5, width: 1, sillHeight: 1.2, winHeight: 1 });
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 5.25, width: 1.5, sillHeight: 0.5, winHeight: 2 });
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 8.75, width: 1.5, sillHeight: 0.5, winHeight: 2 });

  // East (x=14) — mcp:detsky/w_east, mcp:pracovna/w_east, mcp:obyvak/w_east
  wallWithOpenings(g, { axis: 'z', x: 14, z: 0, length: 11, height: FH, material: mw,
    openings: [
      { start: 1, end: 2.5, bottom: 0.5, top: 2.3 },         // mcp:detsky/w_east
      { start: 4.5, end: 6, bottom: 0.5, top: 2.3 },         // mcp:pracovna/w_east
      { start: 8, end: 9.5, bottom: 0.5, top: 2.5 },         // mcp:obyvak/w_east
    ]
  });
  addWindow(g, { axis: 'z', x: 14, z: 0, at: 1.75, width: 1.5, sillHeight: 0.5, winHeight: 1.8 });
  addWindow(g, { axis: 'z', x: 14, z: 0, at: 5.25, width: 1.5, sillHeight: 0.5, winHeight: 1.8 });
  addWindow(g, { axis: 'z', x: 14, z: 0, at: 8.75, width: 1.5, sillHeight: 0.5, winHeight: 2 });

  // ═══ INNER WALLS ═══

  // mcp:koupelna (0,0) 3×3.5 — east wall, mcp:d_koupelna (3,1.5)
  wallWithOpenings(g, { axis: 'z', x: 3, z: 0, length: 3.5, height: FH, thickness: 0.12, material: mb,
    openings: [{ start: 1.5, end: 2.4, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 3, z: 0, at: 1.95, width: 0.9 });

  // mcp:koupelna south wall (z=3.5) — separates from ložnice
  wallWithOpenings(g, { axis: 'x', x: 0, z: 3.5, length: 3, height: FH, thickness: 0.12, material: mb });

  // mcp:loznice (0,3.5) 3×3.5 — east wall, mcp:d_loznice (3,4.5)
  wallWithOpenings(g, { axis: 'z', x: 3, z: 3.5, length: 3.5, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 1, end: 2, top: 2.2 }]   // door at z=4.5 → relative 1
  });
  addDoor(g, { axis: 'z', x: 3, z: 3.5, at: 1.5, width: 1 });

  // mcp:wc (4.5,0) 1.5×2
  wallWithOpenings(g, { axis: 'z', x: 4.5, z: 0, length: 2, height: FH, thickness: 0.1, material: mb,
    openings: [{ start: 0.8, end: 1.6, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 4.5, z: 0, at: 1.2, width: 0.8 });
  wallWithOpenings(g, { axis: 'z', x: 6, z: 0, length: 2, height: FH, thickness: 0.1, material: mi });
  wallWithOpenings(g, { axis: 'x', x: 4.5, z: 2, length: 1.5, height: FH, thickness: 0.1, material: mb });

  // mcp:satna (6,0) 2×2
  wallWithOpenings(g, { axis: 'z', x: 6, z: 0, length: 2, height: FH, thickness: 0.1, material: mi,
    openings: [{ start: 0.8, end: 1.6, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 6, z: 0, at: 1.2, width: 0.8 });
  wallWithOpenings(g, { axis: 'z', x: 8, z: 0, length: 2, height: FH, thickness: 0.1, material: mi });
  wallWithOpenings(g, { axis: 'x', x: 6, z: 2, length: 2, height: FH, thickness: 0.1, material: mi });

  // mcp:tech (8,0) 1.5×2
  wallWithOpenings(g, { axis: 'z', x: 8, z: 0, length: 2, height: FH, thickness: 0.1, material: mi,
    openings: [{ start: 0.8, end: 1.6, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 8, z: 0, at: 1.2, width: 0.8 });
  wallWithOpenings(g, { axis: 'z', x: 9.5, z: 0, length: 2, height: FH, thickness: 0.1, material: mi });
  wallWithOpenings(g, { axis: 'x', x: 8, z: 2, length: 1.5, height: FH, thickness: 0.1, material: mi });

  // mcp:detsky (10,0) 4×4 — west wall, mcp:d_detsky (10,2)
  wallWithOpenings(g, { axis: 'z', x: 10, z: 0, length: 4, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 2, end: 3, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 10, z: 0, at: 2.5, width: 1 });
  wallWithOpenings(g, { axis: 'x', x: 10, z: 4, length: 4, height: FH, thickness: 0.12, material: mi });

  // mcp:pracovna (10,4) 4×3 — west wall, mcp:d_pracovna (10,5)
  wallWithOpenings(g, { axis: 'z', x: 10, z: 4, length: 3, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 1, end: 2, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 10, z: 4, at: 1.5, width: 1 });

  // mcp:obyvak (0,7) top wall — mcp:d_obyvak (3,7) open průchod
  wallWithOpenings(g, { axis: 'x', x: 0, z: 7, length: 14, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 3, end: 4.5 }]   // mcp:d_obyvak
  });

  // chodba/pracovna divider at z=7 east side
  wallWithOpenings(g, { axis: 'z', x: 10, z: 7, length: 4, height: FH, thickness: 0.12, material: mi });

  // ═══ FURNITURE ═══
  furnishKoupelna(g);
  furnishLoznice(g);
  furnishDetsky(g);
  furnishPracovna(g);
  furnishObyvak(g);
  furnishWC(g);
  buildBalkon(g);

  scene.add(g);
}

function furnishKoupelna(g) {
  // mcp:koupelna (0, 0) 3×3.5
  const rx = 0, rz = 0;
  // mcp:koupelna/vana (0.2, 0.2) 0.7×1.6
  g.add(p(box(0.7, 0.5, 1.6, white), rx + 0.2 + 0.35, 0.25, rz + 0.2 + 0.8));
  // mcp:koupelna/sprcha (0.2, 2.2) 1×1
  g.add(p(box(1, 0.06, 1, mfb), rx + 0.2 + 0.5, 0.03, rz + 2.2 + 0.5));
  const glass = plane(1, 2.1, shower);
  glass.position.set(rx + 0.7, 1.05, rz + 2.2);
  g.add(glass);
  // mcp:koupelna/umyv (2, 0.3) 0.6×0.45
  g.add(p(box(0.6, 0.06, 0.45, white), rx + 2 + 0.3, 0.8, rz + 0.3 + 0.225));
  g.add(p(box(0.1, 0.7, 0.1, white), rx + 2.3, 0.35, rz + 0.525));
  const mirr = plane(0.6, 0.8, mirror);
  mirr.position.set(rx + 2.3, 1.4, rz + 0.06);
  g.add(mirr);
  // mcp:koupelna/zachod (2, 2.3) 0.4×0.5
  g.add(p(box(0.4, 0.35, 0.5, white), rx + 2 + 0.2, 0.175, rz + 2.3 + 0.25));
  g.add(p(box(0.35, 0.25, 0.18, white), rx + 2.2, 0.32, rz + 2.6));
}

function furnishLoznice(g) {
  // mcp:loznice (0, 3.5) 3×3.5
  const rx = 0, rz = 3.5;
  // mcp:loznice/postel (0.5, 0.5) 2×2.2
  g.add(p(box(2, 0.35, 2.2, bed), rx + 0.5 + 1, 0.275, rz + 0.5 + 1.1));
  g.add(p(box(1.9, 0.15, 2.1, sheet), rx + 0.5 + 0.95, 0.5, rz + 0.5 + 1.05));
  g.add(p(box(2, 0.5, 0.08, bed), rx + 1.5, 0.45, rz + 0.3));
  // mcp:loznice/stolek (0.2, 0.7) 0.4×0.4
  g.add(p(box(0.4, 0.4, 0.4, wood), rx + 0.2 + 0.2, 0.2, rz + 0.7 + 0.2));
  // mcp:loznice/komoda (0.3, 3) 1.2×0.5
  g.add(p(box(1.2, 0.7, 0.5, wood), rx + 0.3 + 0.6, 0.35, rz + 3 + 0.25));
}

function furnishDetsky(g) {
  // mcp:detsky (10, 0) 4×4
  const rx = 10, rz = 0;
  // mcp:detsky/postel (0.5, 0.5) 1×2
  g.add(p(box(1, 0.35, 2, bed), rx + 0.5 + 0.5, 0.275, rz + 0.5 + 1));
  g.add(p(box(0.9, 0.12, 1.9, sheet), rx + 1, 0.47, rz + 1.45));
  // mcp:detsky/stul (2, 0.3) 1.5×0.7
  g.add(p(box(1.5, 0.04, 0.7, wood), rx + 2 + 0.75, 0.72, rz + 0.3 + 0.35));
  for (const lx of [-0.6, 0.6]) {
    g.add(p(box(0.04, 0.7, 0.04, metal), rx + 2.75 + lx, 0.35, rz + 0.65));
  }
  // Monitor
  g.add(p(box(0.5, 0.3, 0.03, tvMat), rx + 2.75, 1.0, rz + 0.4));
  // mcp:detsky/skrin (3, 2.5) 0.6×1.5
  g.add(p(box(0.6, 2, 1.5, woodDk), rx + 3 + 0.3, 1, rz + 2.5 + 0.75));
}

function furnishPracovna(g) {
  // mcp:pracovna (10, 4) 4×3
  const rx = 10, rz = 4;
  // mcp:pracovna/stul (0.5, 0.3) 2×0.8
  g.add(p(box(2, 0.04, 0.8, wood), rx + 0.5 + 1, 0.72, rz + 0.3 + 0.4));
  for (const lx of [-0.8, 0.8]) {
    g.add(p(box(0.04, 0.7, 0.6, metal), rx + 1.5 + lx, 0.35, rz + 0.7));
  }
  g.add(p(box(0.6, 0.4, 0.03, tvMat), rx + 1.5, 1.1, rz + 0.4));
  // mcp:pracovna/knihovna (3, 0.3) 0.5×2.5
  g.add(p(box(0.5, 2, 2.5, woodDk), rx + 3 + 0.25, 1, rz + 0.3 + 1.25));
  for (let i = 1; i <= 4; i++) {
    g.add(p(box(0.48, 0.03, 2.4, wood), rx + 3.25, i * 0.4, rz + 1.55));
  }
  // mcp:pracovna/pohovka (0.5, 1.8) 2×1
  g.add(p(box(2, 0.4, 1, sofa), rx + 0.5 + 1, 0.35, rz + 1.8 + 0.5));
  g.add(p(box(2, 0.3, 0.12, sofa), rx + 1.5, 0.55, rz + 1.8));
}

function furnishObyvak(g) {
  // mcp:obyvak (0, 7) 14×4
  const rx = 0, rz = 7;
  // mcp:obyvak/linka (0.3, 0.3) 3×0.6
  g.add(p(box(3, 0.9, 0.6, counter), rx + 0.3 + 1.5, 0.45, rz + 0.3 + 0.3));
  g.add(p(box(0.6, 0.03, 0.55, counterDk), rx + 1, 0.92, rz + 0.6));  // stove
  // mcp:obyvak/ostrovek (0.5, 1.8) 2×0.8
  g.add(p(box(2, 0.9, 0.8, counterDk), rx + 0.5 + 1, 0.45, rz + 1.8 + 0.4));
  // mcp:obyvak/lednice (3.5, 0.3) 0.7×0.65
  g.add(p(box(0.7, 1.9, 0.65, fridge), rx + 3.5 + 0.35, 0.95, rz + 0.3 + 0.325));
  // mcp:obyvak/jid_stul (5.5, 1) 2×1.2
  g.add(p(box(2, 0.04, 1.2, wood), rx + 5.5 + 1, 0.74, rz + 1 + 0.6));
  for (const dx of [-0.8, 0.8]) {
    g.add(p(box(0.04, 0.72, 0.8, metal), rx + 6.5 + dx, 0.36, rz + 1.6));
  }
  for (const [dx, dz] of [[-1.3, 0], [1.3, 0], [0, -0.9], [0, 0.9]]) {
    g.add(p(box(0.42, 0.04, 0.42, metal), rx + 6.5 + dx, 0.45, rz + 1.6 + dz));
  }
  // mcp:obyvak/pohovka (9.5, 1) 2.5×1
  g.add(p(box(2.5, 0.4, 1, sofa), rx + 9.5 + 1.25, 0.35, rz + 1 + 0.5));
  g.add(p(box(2.5, 0.3, 0.12, sofa), rx + 10.75, 0.55, rz + 1));
  // mcp:obyvak/stolek (10, 2.5) 1.2×0.6
  g.add(p(box(1.2, 0.03, 0.6, wood), rx + 10 + 0.6, 0.4, rz + 2.5 + 0.3));
  for (const [dx, dz] of [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]]) {
    g.add(p(box(0.03, 0.38, 0.03, metal), rx + 10.6 + dx, 0.19, rz + 2.8 + dz));
  }
  // mcp:obyvak/tv (13, 1.5) 0.2×1.5 — wall mounted
  g.add(p(box(1.5, 0.85, 0.04, tvMat), rx + 13.5, 1.4, rz + 1.5 + 0.75));
}

function furnishWC(g) {
  // mcp:wc (4.5, 0) 1.5×2
  const rx = 4.5, rz = 0;
  g.add(p(box(0.38, 0.35, 0.5, white), rx + 0.6, 0.175, rz + 1.2));
  g.add(p(box(0.33, 0.25, 0.18, white), rx + 0.6, 0.32, rz + 1.5));
  g.add(p(box(0.35, 0.06, 0.3, white), rx + 0.8, 0.65, rz + 0.25));
}

function buildBalkon(g) {
  // mcp:balkon (2, 11) 10×2
  const bx = 2, bz = 11;
  // Deck
  g.add(p(box(10, 0.08, 2, mft), bx + 5, 0.04, bz + 1));
  // Planks
  for (let i = 0; i < 8; i++) {
    g.add(p(box(9.8, 0.005, 0.03, railing), bx + 5, 0.085, bz + 0.2 + i * 0.24));
  }
  // Glass railing — south + east + west sides
  const railS = plane(10, 1.1, railGlass);
  g.add(p(railS, bx + 5, 0.6, bz + 1.95));
  g.add(p(box(10, 0.04, 0.04, railing), bx + 5, 1.15, bz + 1.95));

  const railW = plane(2, 1.1, railGlass);
  railW.rotation.y = Math.PI / 2;
  g.add(p(railW, bx + 0.05, 0.6, bz + 1));
  g.add(p(box(0.04, 0.04, 2, railing), bx + 0.05, 1.15, bz + 1));

  const railE = plane(2, 1.1, railGlass);
  railE.rotation.y = Math.PI / 2;
  g.add(p(railE, bx + 9.95, 0.6, bz + 1));
  g.add(p(box(0.04, 0.04, 2, railing), bx + 9.95, 1.15, bz + 1));
}
