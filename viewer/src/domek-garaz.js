import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof, addFloorOverlay,
  boxWithOpenings, addUTurnStairs,
  MAT, box, plane
} from './building-utils.js';

// Domek s garáží — přízemí garáž + sklad, patro byt
// 12×10m footprint, 2 floors

const DS = THREE.FrontSide;
const FH0 = 3.0;  // ground floor height
const FH1 = 2.8;  // upper floor height
const Y1 = 3.0;   // upper floor Y offset

// Exterior
const wallExt = new THREE.MeshLambertMaterial({ color: 0xe8dcc8, side: DS });
const wallGarage = new THREE.MeshLambertMaterial({ color: 0xc8c0b0, side: DS });
const wallInt = new THREE.MeshLambertMaterial({ color: 0xf0ece4, side: DS });
const wallBath = new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS });
const floorMat = new THREE.MeshLambertMaterial({ color: 0xb8935a, side: DS });
const floorGarage = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const floorBath = new THREE.MeshLambertMaterial({ color: 0xc8c8d0, side: DS });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const roofMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS });

// Furniture
const oak = new THREE.MeshLambertMaterial({ color: 0x8a6a3a, side: DS });
const oakDark = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS });
const whiteLam = new THREE.MeshLambertMaterial({ color: 0xe8e8e8, side: DS });
const granite = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const metalMat = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const fabricBrown = new THREE.MeshLambertMaterial({ color: 0x6b5b4a, side: DS });
const bedMat = new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS });
const sheetMat = new THREE.MeshLambertMaterial({ color: 0xeee8d8, side: DS });
const tvMat = new THREE.MeshLambertMaterial({ color: 0x111111, side: DS });
const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.3, transparent: true, side: DS });
const glassFrame = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const doorMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const garageDoorMat = new THREE.MeshLambertMaterial({ color: 0x777777, side: DS });
const railMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createDomekGaraz(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // ═══════════════════════════════════════
  // GROUND FLOOR (Y=0)
  // ═══════════════════════════════════════

  buildGroundFloors(g);
  buildGroundOuterWalls(g);
  buildGroundInnerWalls(g);
  buildGroundDoors(g);

  // ═══════════════════════════════════════
  // UPPER FLOOR (Y=3)
  // ═══════════════════════════════════════

  buildUpperFloorSlab(g);
  buildUpperFloors(g);
  buildUpperOuterWalls(g);
  buildUpperInnerWalls(g);
  buildUpperDoors(g);
  buildUpperWindows(g);
  buildBalcony(g);

  // ═══════════════════════════════════════
  // STAIRS
  // ═══════════════════════════════════════

  addUTurnStairs(g, {
    x: 9, z: 0, width: 3, depth: 5,
    entryY: 0, exitY: Y1,
    entrySide: 'north',
  });

  // ═══════════════════════════════════════
  // ROOF
  // ═══════════════════════════════════════

  addFlatRoof(g, 0, 0, 12, 10, Y1 + FH1, 0.3, roofMat);

  // ═══════════════════════════════════════
  // FURNITURE
  // ═══════════════════════════════════════

  furnishGarage(g);
  furnishSklad(g);
  furnishTechnicka(g);
  furnishObyvak(g);
  furnishLoznice(g);
  furnishKoupelna(g);
  furnishWC(g);

  scene.add(g);
}

// ════════════════════════════════════════════════
// GROUND FLOOR — floors & ceilings
// ════════════════════════════════════════════════

function buildGroundFloors(g) {
  // garaz (0,0) 9×6
  addFloor(g, 0, 0, 9, 6, 0, floorGarage);
  addCeiling(g, 0, 0, 9, 6, FH0, 0, ceilingMat);
  // schody (9,0) 3×5
  addFloor(g, 9, 0, 3, 5, 0, floorGarage);
  addCeiling(g, 9, 0, 3, 5, FH0, 0, ceilingMat);
  // technicka (9,5) 3×5
  addFloor(g, 9, 5, 3, 5, 0, floorGarage);
  addCeiling(g, 9, 5, 3, 5, FH0, 0, ceilingMat);
  // sklad (0,6) 9×4
  addFloor(g, 0, 6, 9, 4, 0, floorGarage);
  addCeiling(g, 0, 6, 9, 4, FH0, 0, ceilingMat);
}

// ════════════════════════════════════════════════
// GROUND FLOOR — outer walls
// ════════════════════════════════════════════════

function buildGroundOuterWalls(g) {
  // North wall (z=0): x=0..12, garage door at x=2..5, top=2.5
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 0, length: 12, height: FH0, y: 0,
    material: wallGarage,
    openings: [{ start: 2, end: 5, bottom: 0, top: 2.5 }],
  });
  // South wall (z=10): x=0..12, no openings
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 10, length: 12, height: FH0, y: 0,
    material: wallGarage,
  });
  // West wall (x=0): z=0..10, no openings
  wallWithOpenings(g, {
    axis: 'z', x: 0, z: 0, length: 10, height: FH0, y: 0,
    material: wallGarage,
  });
  // East wall (x=12): z=0..10, no openings
  wallWithOpenings(g, {
    axis: 'z', x: 12, z: 0, length: 10, height: FH0, y: 0,
    material: wallGarage,
  });

  // Garage door panel
  g.add(p(box(3, 2.5, 0.08, garageDoorMat), 3.5, 1.25, 0));
}

// ════════════════════════════════════════════════
// GROUND FLOOR — inner walls
// ════════════════════════════════════════════════

function buildGroundInnerWalls(g) {
  // garaz/schody divider: x=9, z=0..6, door at z=2..2.9 (top=2.1)
  wallWithOpenings(g, {
    axis: 'z', x: 9, z: 0, length: 6, height: FH0, y: 0,
    material: wallInt,
    openings: [{ start: 2, end: 2.9, bottom: 0, top: 2.1 }],
  });
  // garaz/sklad divider: z=6, x=0..9, door at x=5..5.9 (top=2.1)
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 6, length: 9, height: FH0, y: 0,
    material: wallInt,
    openings: [{ start: 5, end: 5.9, bottom: 0, top: 2.1 }],
  });
  // schody/technicka divider: z=5, x=9..12, no door
  wallWithOpenings(g, {
    axis: 'x', x: 9, z: 5, length: 3, height: FH0, y: 0,
    material: wallInt,
  });
  // sklad/technicka divider: x=9, z=6..10, door at z=6..6.8 (top=2.1)
  wallWithOpenings(g, {
    axis: 'z', x: 9, z: 6, length: 4, height: FH0, y: 0,
    material: wallInt,
    openings: [{ start: 0, end: 0.8, bottom: 0, top: 2.1 }],
  });
}

// ════════════════════════════════════════════════
// GROUND FLOOR — doors
// ════════════════════════════════════════════════

function buildGroundDoors(g) {
  // d_garaz_schody: x=9 wall, z=2..2.9
  addDoor(g, { axis: 'z', x: 9, z: 0, at: 2.45, width: 0.9, doorHeight: 2.1, y: 0, material: doorMat });
  // d_sklad: z=6 wall, x=5..5.9
  addDoor(g, { axis: 'x', x: 0, z: 6, at: 5.45, width: 0.9, doorHeight: 2.1, y: 0, material: doorMat });
  // d_tech: x=9 wall, z=6..6.8
  addDoor(g, { axis: 'z', x: 9, z: 6, at: 0.4, width: 0.8, doorHeight: 2.1, y: 0, material: doorMat });
}

// ════════════════════════════════════════════════
// UPPER FLOOR — slab with stairwell hole
// ════════════════════════════════════════════════

function buildUpperFloorSlab(g) {
  boxWithOpenings(g, {
    x: 0, y: Y1, z: 0, width: 12, height: 0.15, depth: 10,
    material: floorMat,
    openings: [
      { face: 'top', start: 9, end: 12, bottom: 0, top: 5 },
      { face: 'bottom', start: 9, end: 12, bottom: 0, top: 5 },
    ],
  });
}

function buildUpperFloors(g) {
  // Bathroom tile overlay
  addFloorOverlay(g, 5, 5, 4, 3, Y1, floorBath);
  // WC tile overlay
  addFloorOverlay(g, 5, 8, 2, 2, Y1, floorBath);

  // Ceilings for upper floor rooms
  addCeiling(g, 0, 0, 7, 5, FH1, Y1, ceilingMat);  // obyvak
  addCeiling(g, 4, 3, 5, 1.5, FH1, Y1, ceilingMat); // chodba
  addCeiling(g, 9, 0, 3, 5, FH1, Y1, ceilingMat);   // schody
  addCeiling(g, 0, 5, 5, 5, FH1, Y1, ceilingMat);   // loznice
  addCeiling(g, 5, 5, 4, 3, FH1, Y1, ceilingMat);   // koupelna
  addCeiling(g, 5, 8, 2, 2, FH1, Y1, ceilingMat);   // wc
  addCeiling(g, 7, 8, 2, 2, FH1, Y1, ceilingMat);   // satna
  // balkon — no ceiling
}

// ════════════════════════════════════════════════
// UPPER FLOOR — outer walls
// ════════════════════════════════════════════════

function buildUpperOuterWalls(g) {
  // North wall (z=0): x=0..12
  // obyvak windows: w_sever1 at x=1..3.5 (sill=0.4, top=2.4), w_sever2 at x=4.5..5.7 (sill=0.9, top=2.1)
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 0, length: 12, height: FH1, y: Y1,
    material: wallExt,
    openings: [
      { start: 1, end: 3.5, bottom: 0.4, top: 2.4 },
      { start: 4.5, end: 5.7, bottom: 0.9, top: 2.1 },
    ],
  });

  // South wall (z=10): x=0..12
  // loznice w_jih: room (0,5), window at (1.5,5) 1.5m wide → abs x=1.5..3, sill=0.9, top=2.1
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 10, length: 12, height: FH1, y: Y1,
    material: wallExt,
    openings: [
      { start: 1.5, end: 3, bottom: 0.9, top: 2.1 },
    ],
  });

  // West wall (x=0): z=0..10
  // obyvak w_zapad: (0,1.5), sill=0.4, winH=1.8 → z=1.5..3.5, bottom=0.4, top=2.2
  // loznice w_zapad: room at z=5, (0,1.5) → abs z=6.5..8.5, sill=0.9, top=2.1
  wallWithOpenings(g, {
    axis: 'z', x: 0, z: 0, length: 10, height: FH1, y: Y1,
    material: wallExt,
    openings: [
      { start: 1.5, end: 3.5, bottom: 0.4, top: 2.2 },
      { start: 6.5, end: 8.5, bottom: 0.9, top: 2.1 },
    ],
  });

  // East wall (x=12): z=0..10, no windows
  wallWithOpenings(g, {
    axis: 'z', x: 12, z: 0, length: 10, height: FH1, y: Y1,
    material: wallExt,
  });
}

// ════════════════════════════════════════════════
// UPPER FLOOR — inner walls
// ════════════════════════════════════════════════

function buildUpperInnerWalls(g) {
  // x=7, z=0..3: between obyvak and balkon, door d_balkon at z=1..2 (top=2.2)
  wallWithOpenings(g, {
    axis: 'z', x: 7, z: 0, length: 3, height: FH1, y: Y1,
    material: wallInt,
    openings: [{ start: 1, end: 2, bottom: 0, top: 2.2 }],
  });

  // z=3, x=7..9: between balkon/obyvak south edge and chodba north
  wallWithOpenings(g, {
    axis: 'x', x: 7, z: 3, length: 2, height: FH1, y: Y1,
    material: wallInt,
  });

  // x=9, z=0..5: between schody and obyvak/chodba, door d_schody at z=3..3.9
  wallWithOpenings(g, {
    axis: 'z', x: 9, z: 0, length: 5, height: FH1, y: Y1,
    material: wallInt,
    openings: [{ start: 3, end: 3.9, bottom: 0, top: 2.1 }],
  });

  // x=4, z=3..4.5: between obyvak living zone and chodba, door d_obyvak at z=3..3.9
  wallWithOpenings(g, {
    axis: 'z', x: 4, z: 3, length: 1.5, height: FH1, y: Y1,
    material: wallInt,
    openings: [{ start: 0, end: 0.9, bottom: 0, top: 2.1 }],
  });

  // x=4, z=4.5..5: solid wall between obyvak and south
  wallWithOpenings(g, {
    axis: 'z', x: 4, z: 4.5, length: 0.5, height: FH1, y: Y1,
    material: wallInt,
  });

  // z=4.5, x=4..9: south wall of chodba, door d_koupelna at x=5.5..6.3
  wallWithOpenings(g, {
    axis: 'x', x: 4, z: 4.5, length: 5, height: FH1, y: Y1,
    material: wallInt,
    openings: [{ start: 1.5, end: 2.3, bottom: 0, top: 2.1 }], // relative: x=5.5-4=1.5, end=6.3-4=2.3
  });

  // z=5, x=0..4: between obyvak south and loznice north (solid)
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 5, length: 4, height: FH1, y: Y1,
    material: wallInt,
  });

  // z=5, x=4..5: between chodba area and loznice, door d_loznice at x=4..4.9
  // The door is at (4,5) 0.2×0.9 on the x=4 wall... actually it's between chodba and loznice
  // d_loznice is at position (4,5) meaning x=4 wall at z=5. Let's put it on z=5 wall
  wallWithOpenings(g, {
    axis: 'x', x: 4, z: 5, length: 1, height: FH1, y: Y1,
    material: wallInt,
    openings: [{ start: 0, end: 0.9, bottom: 0, top: 2.1 }],
  });

  // z=5, x=5..9: between koupelna/wc/satna north and obyvak/chodba south
  wallWithOpenings(g, {
    axis: 'x', x: 5, z: 5, length: 4, height: FH1, y: Y1,
    material: wallInt,
  });

  // x=5, z=5..10: between loznice east and koupelna/wc/satna west
  wallWithOpenings(g, {
    axis: 'z', x: 5, z: 5, length: 5, height: FH1, y: Y1,
    material: wallInt,
  });

  // z=8, x=5..9: between koupelna south and wc/satna
  // d_wc at x=5.5..6.2, d_satna at x=7.5..8.2
  wallWithOpenings(g, {
    axis: 'x', x: 5, z: 8, length: 4, height: FH1, y: Y1,
    material: wallInt,
    openings: [
      { start: 0.5, end: 1.2, bottom: 0, top: 2.1 },  // d_wc: 5.5-5=0.5, 6.2-5=1.2
      { start: 2.5, end: 3.2, bottom: 0, top: 2.1 },  // d_satna: 7.5-5=2.5, 8.2-5=3.2
    ],
  });

  // x=7, z=8..10: between wc and satna
  wallWithOpenings(g, {
    axis: 'z', x: 7, z: 8, length: 2, height: FH1, y: Y1,
    material: wallInt,
  });

  // x=9, z=5..10: east wall of koupelna/wc/satna area (building interior, separates from stairwell continuation area)
  wallWithOpenings(g, {
    axis: 'z', x: 9, z: 5, length: 5, height: FH1, y: Y1,
    material: wallInt,
  });

  // z=3, x=4..7: north edge of chodba within obyvak area — no wall needed here
  // (obyvak is open to x=7 from z=0..5, chodba starts at z=3 from x=4)
}

// ════════════════════════════════════════════════
// UPPER FLOOR — doors
// ════════════════════════════════════════════════

function buildUpperDoors(g) {
  // d_obyvak: x=4 wall, z=3..3.9
  addDoor(g, { axis: 'z', x: 4, z: 3, at: 0.45, width: 0.9, doorHeight: 2.1, y: Y1, material: doorMat });
  // d_loznice: z=5 wall, x=4..4.9
  addDoor(g, { axis: 'x', x: 4, z: 5, at: 0.45, width: 0.9, doorHeight: 2.1, y: Y1, material: doorMat });
  // d_koupelna: z=4.5 wall, x=5.5..6.3
  addDoor(g, { axis: 'x', x: 4, z: 4.5, at: 1.9, width: 0.8, doorHeight: 2.1, y: Y1, material: doorMat });
  // d_wc: z=8 wall, x=5.5..6.2
  addDoor(g, { axis: 'x', x: 5, z: 8, at: 0.85, width: 0.7, doorHeight: 2.1, y: Y1, material: doorMat });
  // d_satna: z=8 wall, x=7.5..8.2
  addDoor(g, { axis: 'x', x: 5, z: 8, at: 2.85, width: 0.7, doorHeight: 2.1, y: Y1, material: doorMat });
  // d_schody: x=9 wall, z=3..3.9
  addDoor(g, { axis: 'z', x: 9, z: 0, at: 3.45, width: 0.9, doorHeight: 2.1, y: Y1, material: doorMat });
  // d_balkon: x=7 wall, z=1..2, sliding glass door
  addDoor(g, { axis: 'z', x: 7, z: 0, at: 1.5, width: 1.0, doorHeight: 2.2, y: Y1, material: glassMat });
}

// ════════════════════════════════════════════════
// UPPER FLOOR — windows
// ════════════════════════════════════════════════

function buildUpperWindows(g) {
  // Obyvak windows (room at 0,0)
  // w_sever1: north wall z=0, center at x=2.25, width=2.5, sill=0.4, winH=2.0
  addWindow(g, { axis: 'x', x: 0, z: 0, at: 2.25, width: 2.5, sillHeight: 0.4, winHeight: 2.0, y: Y1, glassMat, frameMat: glassFrame });
  // w_sever2: north wall z=0, center at x=5.1, width=1.2, sill=0.9, winH=1.2
  addWindow(g, { axis: 'x', x: 0, z: 0, at: 5.1, width: 1.2, sillHeight: 0.9, winHeight: 1.2, y: Y1, glassMat, frameMat: glassFrame });
  // w_zapad: west wall x=0, center at z=2.5, width=2.0, sill=0.4, winH=1.8
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 2.5, width: 2.0, sillHeight: 0.4, winHeight: 1.8, y: Y1, glassMat, frameMat: glassFrame });

  // Loznice windows (room at 0,5)
  // w_zapad: west wall x=0, center at z=5+1.5+1.0=7.5 (room-relative 1.5, height 2m → width=2, center=1.5+1=2.5 → abs z=5+2.5=7.5)
  addWindow(g, { axis: 'z', x: 0, z: 5, at: 2.5, width: 2.0, sillHeight: 0.9, winHeight: 1.2, y: Y1, glassMat, frameMat: glassFrame });
  // w_jih: south wall z=10, center at x=0+1.5+0.75=2.25, width=1.5, sill=0.9, winH=1.2
  addWindow(g, { axis: 'x', x: 0, z: 10, at: 2.25, width: 1.5, sillHeight: 0.9, winHeight: 1.2, y: Y1, glassMat, frameMat: glassFrame });
}

// ════════════════════════════════════════════════
// BALCONY
// ════════════════════════════════════════════════

function buildBalcony(g) {
  // Balcony floor slab at (7,0) 2×3, extends beyond north wall
  // Actually balkon is inside the footprint at (7,0) 2×3
  g.add(p(box(2, 0.15, 3, floorGarage), 8, Y1 + 0.075, 1.5));

  // Railings on 3 sides: north (z=0), east (x=9 side — but x=9 has stairwell wall),
  // Actually balkon is x=7..9, z=0..3. North (z=0), west (x=7 is interior wall with door), east side is stairwell.
  // Railing on north (z=0), east side not needed (building wall). So railing on z=0 x=7..9 and possibly open sides.
  // Balcony is recessed into the building, so it has walls on south (z=3), west (x=7), east (x=9).
  // Only the north side (z=0) is open and needs railing.

  const rH = 1.1; // railing height
  const rY = Y1 + 0.15;

  // North railing (z=0, x=7..9)
  // Posts
  g.add(p(box(0.04, rH, 0.04, railMat), 7.1, rY + rH / 2, 0.1));
  g.add(p(box(0.04, rH, 0.04, railMat), 8.0, rY + rH / 2, 0.1));
  g.add(p(box(0.04, rH, 0.04, railMat), 8.9, rY + rH / 2, 0.1));
  // Top horizontal bar
  g.add(p(box(2.0, 0.04, 0.04, railMat), 8.0, rY + rH, 0.1));
  // Middle horizontal bar
  g.add(p(box(2.0, 0.04, 0.04, railMat), 8.0, rY + rH * 0.5, 0.1));

  // Glass panel fill
  g.add(p(box(1.8, rH * 0.8, 0.02, glassMat), 8.0, rY + rH * 0.45, 0.1));
}

// ════════════════════════════════════════════════
// FURNITURE — Ground floor
// ════════════════════════════════════════════════

function furnishGarage(g) {
  const y = 0;
  // Car parking spot marking (flat on floor)
  g.add(p(box(2.5, 0.02, 5, new THREE.MeshLambertMaterial({ color: 0xaaaa44, side: DS })), 4, y + 0.14, 3));

  // Workbench at garaz (7, 1) → abs center (7.75, 1.3)
  g.add(p(box(1.5, 0.9, 0.6, oak), 7.75, y + 0.45, 1.3));
  // Workbench top
  g.add(p(box(1.5, 0.05, 0.6, oakDark), 7.75, y + 0.925, 1.3));

  // Shelf at (7, 2) → abs center (7.75, 2.2)
  g.add(p(box(1.5, 1.8, 0.4, metalMat), 7.75, y + 0.9, 2.2));
}

function furnishSklad(g) {
  const y = 0;
  // Storage shelves along south wall
  g.add(p(box(3, 2, 0.5, metalMat), 4.5, y + 1.0, 9.5));
  // Boxes on shelves
  g.add(p(box(0.5, 0.4, 0.4, oakDark), 3.5, y + 0.5, 9.5));
  g.add(p(box(0.6, 0.3, 0.4, oakDark), 5.0, y + 0.5, 9.5));
}

function furnishTechnicka(g) {
  const y = 0;
  // Boiler / water heater
  g.add(p(box(0.6, 1.5, 0.6, whiteMat), 10.5, y + 0.75, 7.5));
  // Electrical panel
  g.add(p(box(0.6, 0.8, 0.1, metalMat), 11.5, y + 1.5, 5.15));
}

// ════════════════════════════════════════════════
// FURNITURE — Upper floor obyvak (0,0) 7×5 at Y1
// ════════════════════════════════════════════════

function furnishObyvak(g) {
  const y = Y1;

  // Kitchen counter — kuch_linka: (0, 0.3) 0.6×3.5, against west wall
  g.add(p(box(0.6, 0.9, 3.5, whiteLam), 0.3, y + 0.45, 0.3 + 1.75));
  // Counter top
  g.add(p(box(0.6, 0.04, 3.5, granite), 0.3, y + 0.92, 0.3 + 1.75));

  // Upper cabinets — kuch_horna: (0, 0.3) 0.35×3.5, elevation=1.4
  g.add(p(box(0.35, 0.7, 3.5, whiteLam), 0.175, y + 1.4 + 0.35, 0.3 + 1.75));

  // Fridge — lednice: (0, 3.8) 0.7×0.7
  g.add(p(box(0.7, 1.8, 0.7, whiteMat), 0.35, y + 0.9, 3.8 + 0.35));

  // Dining table — jid_stul: (2, 1.5) 1.5×0.9
  g.add(p(box(1.5, 0.05, 0.9, oak), 2 + 0.75, y + 0.76, 1.5 + 0.45));
  // Table legs
  g.add(p(box(0.05, 0.74, 0.05, oak), 2.2, y + 0.37, 1.7));
  g.add(p(box(0.05, 0.74, 0.05, oak), 3.3, y + 0.37, 1.7));
  g.add(p(box(0.05, 0.74, 0.05, oak), 2.2, y + 0.37, 2.2));
  g.add(p(box(0.05, 0.74, 0.05, oak), 3.3, y + 0.37, 2.2));

  // Sofa — pohovka: (1.5, 3.5) 2.2×0.9
  g.add(p(box(2.2, 0.4, 0.9, fabricBrown), 1.5 + 1.1, y + 0.2, 3.5 + 0.45));
  // Sofa back
  g.add(p(box(2.2, 0.35, 0.15, fabricBrown), 1.5 + 1.1, y + 0.575, 3.5 + 0.85));

  // TV — tv: (5, 4.5) 1.2×0.05, elevation=1 (wall-mounted)
  g.add(p(box(1.2, 0.7, 0.05, tvMat), 5 + 0.6, y + 1.35, 4.5));

  // TV stand — tv_stolek: (5.2, 4.2) 1.5×0.4
  g.add(p(box(1.5, 0.45, 0.4, oakDark), 5.2 + 0.75, y + 0.225, 4.2 + 0.2));

  // Coffee table — konf_stolek: (3, 2.8) 0.8×0.5
  g.add(p(box(0.8, 0.04, 0.5, oak), 3 + 0.4, y + 0.42, 2.8 + 0.25));
  // Legs
  g.add(p(box(0.04, 0.4, 0.04, metalMat), 3.15, y + 0.2, 2.95));
  g.add(p(box(0.04, 0.4, 0.04, metalMat), 3.65, y + 0.2, 2.95));
  g.add(p(box(0.04, 0.4, 0.04, metalMat), 3.15, y + 0.2, 3.15));
  g.add(p(box(0.04, 0.4, 0.04, metalMat), 3.65, y + 0.2, 3.15));
}

// ════════════════════════════════════════════════
// FURNITURE — Upper floor loznice (0,5) 5×5 at Y1
// ════════════════════════════════════════════════

function furnishLoznice(g) {
  const y = Y1;
  const rx = 0, rz = 5; // room origin

  // Bed — postel: (0, 1.5) 2.2×1.8 → abs (0, 6.5)
  // Bed frame
  g.add(p(box(2.2, 0.35, 1.8, bedMat), rx + 1.1, y + 0.175, rz + 1.5 + 0.9));
  // Mattress/sheet
  g.add(p(box(2.0, 0.15, 1.6, sheetMat), rx + 1.1, y + 0.425, rz + 1.5 + 0.9));
  // Pillows
  g.add(p(box(0.5, 0.1, 0.35, whiteMat), rx + 0.5, y + 0.5, rz + 1.65));
  g.add(p(box(0.5, 0.1, 0.35, whiteMat), rx + 1.7, y + 0.5, rz + 1.65));

  // Nightstands — nocni_l: (0, 0.8), nocni_r: (0, 3.3)
  g.add(p(box(0.5, 0.5, 0.5, oakDark), rx + 0.25, y + 0.25, rz + 0.8 + 0.25));
  g.add(p(box(0.5, 0.5, 0.5, oakDark), rx + 0.25, y + 0.25, rz + 3.3 + 0.25));

  // Wardrobe — skrin: (3.5, 1.5) 0.6×2.5
  g.add(p(box(0.6, 2.2, 2.5, oakDark), rx + 3.5 + 0.3, y + 1.1, rz + 1.5 + 1.25));

  // Komoda: (2.5, 4) 1.2×0.5
  g.add(p(box(1.2, 0.8, 0.5, oak), rx + 2.5 + 0.6, y + 0.4, rz + 4 + 0.25));
}

// ════════════════════════════════════════════════
// FURNITURE — Koupelna (5,5) 4×3 at Y1
// ════════════════════════════════════════════════

function furnishKoupelna(g) {
  const y = Y1;
  const rx = 5, rz = 5;

  // Shower/bath — sprchový kout in corner
  // Shower tray
  g.add(p(box(1.0, 0.1, 1.0, floorBath), rx + 0.5, y + 0.15, rz + 0.5));
  // Shower glass panels
  g.add(p(box(1.0, 2.0, 0.02, glassMat), rx + 0.5, y + 1.1, rz + 1.0));
  g.add(p(box(0.02, 2.0, 1.0, glassMat), rx + 1.0, y + 1.1, rz + 0.5));

  // Sink — umyvadlo
  g.add(p(box(0.8, 0.15, 0.5, whiteMat), rx + 2.5, y + 0.85, rz + 0.4));
  // Sink cabinet
  g.add(p(box(0.8, 0.7, 0.5, whiteLam), rx + 2.5, y + 0.35, rz + 0.4));

  // Mirror above sink
  g.add(p(box(0.7, 0.8, 0.03, new THREE.MeshLambertMaterial({ color: 0xaaccdd, side: DS })), rx + 2.5, y + 1.5, rz + 0.17));

  // Bathtub along east wall
  g.add(p(box(0.7, 0.5, 1.7, whiteMat), rx + 3.55, y + 0.25, rz + 1.35));
}

// ════════════════════════════════════════════════
// FURNITURE — WC (5,8) 2×2 at Y1
// ════════════════════════════════════════════════

function furnishWC(g) {
  const y = Y1;
  const rx = 5, rz = 8;

  // Toilet
  g.add(p(box(0.4, 0.4, 0.6, whiteMat), rx + 1.0, y + 0.2, rz + 1.5));
  // Toilet tank
  g.add(p(box(0.35, 0.3, 0.2, whiteMat), rx + 1.0, y + 0.55, rz + 1.8));

  // Small sink
  g.add(p(box(0.4, 0.12, 0.3, whiteMat), rx + 0.4, y + 0.8, rz + 0.4));
  // Sink pedestal
  g.add(p(box(0.1, 0.65, 0.1, whiteMat), rx + 0.4, y + 0.325, rz + 0.4));
}
