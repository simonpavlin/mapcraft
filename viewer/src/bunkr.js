import * as THREE from 'three';
import { wallWithOpenings, addDoor, addFloor, addCeiling, addFlatRoof, MAT, box, plane } from './building-utils.js';

const DS = THREE.DoubleSide;

// ════════════════════════════════════════════════
// MATERIALS — Underground shipping-container bunker
// ════════════════════════════════════════════════

const steel = new THREE.MeshLambertMaterial({ color: 0x5a6068, side: DS });
const steelInner = new THREE.MeshLambertMaterial({ color: 0x8a9098, side: DS });
const steelDark = new THREE.MeshLambertMaterial({ color: 0x3a3e44, side: DS });
const floorConcrete = new THREE.MeshLambertMaterial({ color: 0x707070, side: DS });
const floorLab = new THREE.MeshLambertMaterial({ color: 0x9a9aaa, side: DS });
const floorBath = new THREE.MeshLambertMaterial({ color: 0x888898, side: DS });
const floorLiving = new THREE.MeshLambertMaterial({ color: 0x8a7a6a, side: DS });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0x7a8088, side: DS });
const wood = new THREE.MeshLambertMaterial({ color: 0xa08050, side: DS });
const woodDark = new THREE.MeshLambertMaterial({ color: 0x6a5030, side: DS });
const white = new THREE.MeshLambertMaterial({ color: 0xe8e8e8, side: DS });
const labWhite = new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS });
const metalShelf = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const metalFrame = new THREE.MeshLambertMaterial({ color: 0x666666, side: DS });
const greenGen = new THREE.MeshLambertMaterial({ color: 0x446644, side: DS });
const blueTank = new THREE.MeshLambertMaterial({ color: 0x4466aa, side: DS });
const blackMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });
const fabric = new THREE.MeshLambertMaterial({ color: 0x5a6a7a, side: DS });
const bedsheet = new THREE.MeshLambertMaterial({ color: 0xc8c8d8, side: DS });
const screenMat = new THREE.MeshLambertMaterial({ color: 0x222233, side: DS });
const screenGlow = new THREE.MeshLambertMaterial({ color: 0x3388aa, emissive: 0x114466, emissiveIntensity: 0.5, side: DS });
const ceramic = new THREE.MeshLambertMaterial({ color: 0xdddde0, side: DS });
const chromeMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: DS });
const filterMat = new THREE.MeshLambertMaterial({ color: 0x8a8a7a, side: DS });
const batteryMat = new THREE.MeshLambertMaterial({ color: 0x3a5a3a, side: DS });
const doorSteel = new THREE.MeshLambertMaterial({ color: 0x555560, side: DS });
const lightMat = new THREE.MeshLambertMaterial({ color: 0xffffee, emissive: 0xffff88, emissiveIntensity: 0.6, side: DS });
const wireMat = new THREE.MeshLambertMaterial({ color: 0x333333, side: DS });
const yellow = new THREE.MeshLambertMaterial({ color: 0xccaa22, side: DS });
const red = new THREE.MeshLambertMaterial({ color: 0xaa3333, side: DS });
const glassShower = new THREE.MeshLambertMaterial({ color: 0x88bbcc, opacity: 0.25, transparent: true, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

const H = 2.4; // container interior height
const T = 0.1; // wall thickness

// ════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════

export function createBunkr(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  buildStructure(g);
  furnishVstup(g);
  furnishLab(g);
  furnishUtility(g);
  furnishKuchyn(g);
  furnishSklad(g);
  furnishKoupelna(g);
  furnishObyvak(g);
  furnishLoznice(g);
  addLighting(g);

  scene.add(g);
}

// ════════════════════════════════════════════════
// STRUCTURE — walls, floors, ceilings, doors
// ════════════════════════════════════════════════

function buildStructure(g) {
  // ═══ FLOORS ═══
  // mcp:vstup (0,0) 6×2.5
  addFloor(g, 0, 0, 6, 2.5, 0, floorConcrete);
  // mcp:laborator (6,0) 12×2.5
  addFloor(g, 6, 0, 12, 2.5, 0, floorLab);
  // mcp:utility (0,2.5) 6×2.5
  addFloor(g, 0, 2.5, 6, 2.5, 0, floorConcrete);
  // mcp:kuchyn (6,2.5) 6×2.5
  addFloor(g, 6, 2.5, 6, 2.5, 0, floorLiving);
  // mcp:sklad (12,2.5) 6×2.5
  addFloor(g, 12, 2.5, 6, 2.5, 0, floorConcrete);
  // mcp:koupelna (0,5) 6×2.5
  addFloor(g, 0, 5, 6, 2.5, 0, floorBath);
  // mcp:obyvak (6,5) 6×2.5
  addFloor(g, 6, 5, 6, 2.5, 0, floorLiving);
  // mcp:loznice (12,5) 6×2.5
  addFloor(g, 12, 5, 6, 2.5, 0, floorLiving);

  // ═══ CEILING ═══
  addCeiling(g, 0, 0, 18, 7.5, H, 0, ceilingMat);

  // ═══ OUTER WALLS ═══
  // North wall (z=0) — entrance door at x=2.5, w=1.2
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 0, length: 18, height: H,
    thickness: T, material: steel,
    openings: [{ start: 2.5, end: 3.7, bottom: 0, top: 2.1 }]
  });
  // South wall (z=7.5) — solid
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 7.5, length: 18, height: H,
    thickness: T, material: steel
  });
  // West wall (x=0) — solid
  wallWithOpenings(g, {
    axis: 'z', x: 0, z: 0, length: 7.5, height: H,
    thickness: T, material: steel
  });
  // East wall (x=18) — solid
  wallWithOpenings(g, {
    axis: 'z', x: 18, z: 0, length: 7.5, height: H,
    thickness: T, material: steel
  });

  // ═══ INTERNAL WALLS along x=6 ═══
  // mcp:d_vstup_lab — door at z=0.65, w=1
  wallWithOpenings(g, {
    axis: 'z', x: 6, z: 0, length: 2.5, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 0.65, end: 1.65, bottom: 0, top: 2.1 }]
  });
  // mcp:d_utility_kuchyn — door at local 0.75, w=1
  wallWithOpenings(g, {
    axis: 'z', x: 6, z: 2.5, length: 2.5, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 0.75, end: 1.75, bottom: 0, top: 2.1 }]
  });
  // mcp:d_koupelna_obyvak — door at local 0.75, w=1
  wallWithOpenings(g, {
    axis: 'z', x: 6, z: 5, length: 2.5, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 0.75, end: 1.75, bottom: 0, top: 2.1 }]
  });

  // ═══ INTERNAL WALLS along x=12 ═══
  // (no wall x=12 z=0..2.5 — lab is one 40ft container)
  // mcp:d_kuchyn_sklad — door at local 0.75, w=1
  wallWithOpenings(g, {
    axis: 'z', x: 12, z: 2.5, length: 2.5, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 0.75, end: 1.75, bottom: 0, top: 2.1 }]
  });
  // mcp:d_obyvak_loznice — door at local 0.75, w=1
  wallWithOpenings(g, {
    axis: 'z', x: 12, z: 5, length: 2.5, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 0.75, end: 1.75, bottom: 0, top: 2.1 }]
  });

  // ═══ INTERNAL WALLS along z=2.5 ═══
  // mcp:d_vstup_utility — door at x=2.5, w=1
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 2.5, length: 6, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 2.5, end: 3.5, bottom: 0, top: 2.1 }]
  });
  // mcp:d_lab_sklad — wall x=6..18, door at local 8, w=1
  wallWithOpenings(g, {
    axis: 'x', x: 6, z: 2.5, length: 12, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 8, end: 9, bottom: 0, top: 2.1 }]
  });

  // ═══ INTERNAL WALLS along z=5 ═══
  // mcp:d_utility_koupelna — door at x=2.5, w=1
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 5, length: 6, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 2.5, end: 3.5, bottom: 0, top: 2.1 }]
  });
  // mcp:d_kuchyn_obyvak — door at local 2, w=1
  wallWithOpenings(g, {
    axis: 'x', x: 6, z: 5, length: 6, height: H,
    thickness: T, material: steelInner,
    openings: [{ start: 2, end: 3, bottom: 0, top: 2.1 }]
  });
  // sklad|loznice — solid wall
  wallWithOpenings(g, {
    axis: 'x', x: 12, z: 5, length: 6, height: H,
    thickness: T, material: steelInner
  });

  // ═══ DOOR PANELS ═══
  // Entrance (north wall, heavy blast door)
  addDoor(g, { axis: 'x', x: 0, z: 0, at: 3.1, width: 1.2, doorHeight: 2.1, material: steelDark });
  // mcp:d_vstup_lab — steel security door
  addDoor(g, { axis: 'z', x: 6, z: 0, at: 1.15, width: 1, doorHeight: 2.1, material: steelDark });
  // mcp:d_vstup_utility — steel door
  addDoor(g, { axis: 'x', x: 0, z: 2.5, at: 3, width: 1, doorHeight: 2.1, material: steelDark });
  // mcp:d_utility_kuchyn — open pass (no panel)
  // mcp:d_utility_koupelna
  addDoor(g, { axis: 'x', x: 0, z: 5, at: 3, width: 1, doorHeight: 2.1, material: doorSteel });
  // mcp:d_kuchyn_obyvak — open pass (no panel)
  // mcp:d_kuchyn_sklad
  addDoor(g, { axis: 'z', x: 12, z: 2.5, at: 1.25, width: 1, doorHeight: 2.1, material: doorSteel });
  // mcp:d_obyvak_loznice
  addDoor(g, { axis: 'z', x: 12, z: 5, at: 1.25, width: 1, doorHeight: 2.1, material: doorSteel });
  // mcp:d_lab_sklad — steel
  addDoor(g, { axis: 'x', x: 6, z: 2.5, at: 8.5, width: 1, doorHeight: 2.1, material: steelDark });
  // mcp:d_koupelna_obyvak
  addDoor(g, { axis: 'z', x: 6, z: 5, at: 1.25, width: 1, doorHeight: 2.1, material: doorSteel });

  // ═══ ROOF — container tops flush with ground level ═══
  addFlatRoof(g, 0, 0, 18, 7.5, H, 0.5, steel);

  // ═══ CONTAINER RIBS — corrugated steel detail on outer walls ═══
  for (let i = 0.6; i < 18; i += 0.6) {
    // North wall ribs
    g.add(p(box(0.02, H, 0.02, metalFrame), i, H / 2, -0.06));
    // South wall ribs
    g.add(p(box(0.02, H, 0.02, metalFrame), i, H / 2, 7.56));
  }
  for (let j = 0.6; j < 7.5; j += 0.6) {
    // West wall ribs
    g.add(p(box(0.02, H, 0.02, metalFrame), -0.06, H / 2, j));
    // East wall ribs
    g.add(p(box(0.02, H, 0.02, metalFrame), 18.06, H / 2, j));
  }
}

// ════════════════════════════════════════════════
// VSTUP / AIRLOCK — (0,0) 6×2.5
// ════════════════════════════════════════════════

function furnishVstup(g) {
  const rx = 0, rz = 0;

  // mcp:vstup/skrinka_obleky (0,0) 1.5×0.6 — tall hazmat locker
  g.add(p(box(1.5, 2, 0.6, metalFrame), rx + 0.75, 1, rz + 0.3));

  // mcp:vstup/dekont_sprcha (3.5,0) 1.2×1.2 — decontamination shower booth
  // Glass walls
  g.add(p(box(1.2, 2, 0.02, glassShower), rx + 3.5 + 0.6, 1, rz + 0));
  g.add(p(box(0.02, 2, 1.2, glassShower), rx + 3.5, 1, rz + 0.6));
  g.add(p(box(0.02, 2, 1.2, glassShower), rx + 3.5 + 1.2, 1, rz + 0.6));
  // Shower head
  g.add(p(box(0.15, 0.03, 0.15, chromeMat), rx + 3.5 + 0.6, 2.2, rz + 0.3));
  g.add(p(box(0.02, 0.2, 0.02, chromeMat), rx + 3.5 + 0.6, 2.1, rz + 0.1));
  // Shower tray
  g.add(p(box(1.2, 0.05, 1.2, metalFrame), rx + 3.5 + 0.6, 0.175, rz + 0.6));

  // mcp:vstup/panel_bezp (5.5,0) 0.5×0.5 — security panel on wall
  g.add(p(box(0.5, 0.4, 0.08, blackMat), rx + 5.75, 1.4, rz + 0.08));
  g.add(p(box(0.35, 0.25, 0.01, screenGlow), rx + 5.75, 1.45, rz + 0.13));

  // mcp:vstup/lavice (0,1.2) 2×0.4 — bench
  g.add(p(box(2, 0.05, 0.4, wood), rx + 1, 0.45, rz + 1.4));
  g.add(p(box(0.05, 0.3, 0.35, metalFrame), rx + 0.1, 0.3, rz + 1.4));
  g.add(p(box(0.05, 0.3, 0.35, metalFrame), rx + 1.9, 0.3, rz + 1.4));

  // Warning stripes on floor near entrance
  g.add(p(box(1.4, 0.01, 0.1, yellow), rx + 3.1, 0.14, rz + 0.3));
  g.add(p(box(1.4, 0.01, 0.1, yellow), rx + 3.1, 0.14, rz + 0.6));
}

// ════════════════════════════════════════════════
// LABORATORY — (6,0) 12×2.5
// ════════════════════════════════════════════════

function furnishLab(g) {
  const rx = 6, rz = 0;

  // mcp:laborator/pracovni_stul1 (0.5,0) 3×0.8 — main lab bench
  // Table top
  g.add(p(box(3, 0.05, 0.8, labWhite), rx + 0.5 + 1.5, 0.9, rz + 0.4));
  // Legs
  g.add(p(box(0.04, 0.87, 0.04, metalFrame), rx + 0.6, 0.435, rz + 0.1));
  g.add(p(box(0.04, 0.87, 0.04, metalFrame), rx + 3.4, 0.435, rz + 0.1));
  g.add(p(box(0.04, 0.87, 0.04, metalFrame), rx + 0.6, 0.435, rz + 0.7));
  g.add(p(box(0.04, 0.87, 0.04, metalFrame), rx + 3.4, 0.435, rz + 0.7));
  // Shelf underneath
  g.add(p(box(2.8, 0.03, 0.6, metalShelf), rx + 0.5 + 1.5, 0.35, rz + 0.4));

  // mcp:laborator/pracovni_stul2 (4,0) 2.5×0.8 — secondary bench with microscope
  g.add(p(box(2.5, 0.05, 0.8, labWhite), rx + 4 + 1.25, 0.9, rz + 0.4));
  g.add(p(box(0.04, 0.87, 0.04, metalFrame), rx + 4.1, 0.435, rz + 0.1));
  g.add(p(box(0.04, 0.87, 0.04, metalFrame), rx + 6.4, 0.435, rz + 0.1));
  g.add(p(box(0.04, 0.87, 0.04, metalFrame), rx + 4.1, 0.435, rz + 0.7));
  g.add(p(box(0.04, 0.87, 0.04, metalFrame), rx + 6.4, 0.435, rz + 0.7));
  // Microscope on table
  g.add(p(box(0.15, 0.35, 0.2, blackMat), rx + 4.5, 0.93 + 0.175, rz + 0.35));
  g.add(p(box(0.08, 0.15, 0.08, blackMat), rx + 4.5, 0.93 + 0.35 + 0.075, rz + 0.3));

  // mcp:laborator/digestor (7,0) 1.5×0.7 — fume hood
  // Cabinet body
  g.add(p(box(1.5, 0.9, 0.7, labWhite), rx + 7 + 0.75, 0.45, rz + 0.35));
  // Hood top
  g.add(p(box(1.5, 0.8, 0.7, labWhite), rx + 7 + 0.75, 0.9 + 0.4 + 0.4, rz + 0.35));
  // Glass front
  g.add(p(box(1.4, 0.7, 0.02, glassShower), rx + 7 + 0.75, 0.9 + 0.35 + 0.35, rz + 0.7));
  // Exhaust pipe
  g.add(p(box(0.12, 0.5, 0.12, metalFrame), rx + 7 + 0.75, H - 0.25, rz + 0.2));

  // mcp:laborator/skrin_chem (9,0) 1.2×0.5 — chemical cabinet
  g.add(p(box(1.2, 1.8, 0.5, yellow), rx + 9 + 0.6, 0.9, rz + 0.25));
  // Hazard symbol (red stripe)
  g.add(p(box(1.2, 0.1, 0.01, red), rx + 9 + 0.6, 1.6, rz + 0.51));

  // mcp:laborator/lednice_lab (10.5,0) 0.7×0.7 — lab fridge
  g.add(p(box(0.7, 1.7, 0.7, white), rx + 10.5 + 0.35, 0.85, rz + 0.35));
  g.add(p(box(0.6, 0.02, 0.01, metalFrame), rx + 10.5 + 0.35, 1.1, rz + 0.71));

  // mcp:laborator/pc_stanice (0.5,1.8) 1.5×0.7 — PC desk on south wall
  // Desk
  g.add(p(box(1.5, 0.05, 0.7, woodDark), rx + 0.5 + 0.75, 0.75, rz + 1.8 + 0.35));
  g.add(p(box(0.04, 0.72, 0.04, metalFrame), rx + 0.6, 0.36, rz + 1.9));
  g.add(p(box(0.04, 0.72, 0.04, metalFrame), rx + 1.9, 0.36, rz + 1.9));
  g.add(p(box(0.04, 0.72, 0.04, metalFrame), rx + 0.6, 0.36, rz + 2.4));
  g.add(p(box(0.04, 0.72, 0.04, metalFrame), rx + 1.9, 0.36, rz + 2.4));
  // Monitors (2x)
  g.add(p(box(0.55, 0.35, 0.03, screenMat), rx + 0.9, 0.78 + 0.25, rz + 1.95));
  g.add(p(box(0.45, 0.25, 0.01, screenGlow), rx + 0.9, 0.78 + 0.27, rz + 1.94));
  g.add(p(box(0.55, 0.35, 0.03, screenMat), rx + 1.55, 0.78 + 0.25, rz + 1.95));
  g.add(p(box(0.45, 0.25, 0.01, screenGlow), rx + 1.55, 0.78 + 0.27, rz + 1.94));
  // Monitor stands
  g.add(p(box(0.06, 0.15, 0.06, blackMat), rx + 0.9, 0.78 + 0.075, rz + 1.95));
  g.add(p(box(0.06, 0.15, 0.06, blackMat), rx + 1.55, 0.78 + 0.075, rz + 1.95));

  // mcp:laborator/zidle_lab (2.5,1.5) 0.5×0.5 — lab chair
  g.add(p(box(0.45, 0.05, 0.45, blackMat), rx + 2.75, 0.55, rz + 1.75));
  g.add(p(box(0.06, 0.4, 0.06, chromeMat), rx + 2.75, 0.3, rz + 1.75));
  // Backrest
  g.add(p(box(0.4, 0.3, 0.04, blackMat), rx + 2.75, 0.72, rz + 2));

  // mcp:laborator/umyvadlo_lab (7,2) 0.6×0.5 — sink with eyewash
  g.add(p(box(0.6, 0.2, 0.5, ceramic), rx + 7 + 0.3, 0.85, rz + 2 + 0.25));
  g.add(p(box(0.05, 0.3, 0.05, chromeMat), rx + 7 + 0.3, 1.1, rz + 2.05));
  g.add(p(box(0.12, 0.08, 0.05, chromeMat), rx + 7 + 0.3, 1.25, rz + 2.15));
}

// ════════════════════════════════════════════════
// UTILITY — (0,2.5) 6×2.5
// ════════════════════════════════════════════════

function furnishUtility(g) {
  const rx = 0, rz = 2.5;

  // mcp:utility/generator (0,0) 1.5×1 — diesel generator
  g.add(p(box(1.5, 0.9, 1, greenGen), rx + 0.75, 0.45, rz + 0.5));
  // Exhaust pipe
  g.add(p(box(0.08, 1.3, 0.08, metalFrame), rx + 0.3, 0.9 + 0.65, rz + 0.3));
  // Control panel on top
  g.add(p(box(0.3, 0.15, 0.2, blackMat), rx + 1.1, 0.9 + 0.075, rz + 0.5));

  // mcp:utility/baterie (2,0) 1.5×0.8 — battery bank
  g.add(p(box(1.5, 0.8, 0.8, batteryMat), rx + 2 + 0.75, 0.4, rz + 0.4));
  // Status LEDs
  for (let i = 0; i < 4; i++) {
    g.add(p(box(0.03, 0.03, 0.01, screenGlow), rx + 2.3 + i * 0.3, 0.7, rz + 0.81));
  }

  // mcp:utility/filtrace (3.8,0) 1.5×0.8 — air filtration HEPA
  g.add(p(box(1.5, 1.6, 0.8, filterMat), rx + 3.8 + 0.75, 0.8, rz + 0.4));
  // Intake/exhaust ducts
  g.add(p(box(0.2, 0.2, 0.3, metalFrame), rx + 4.55, 1.8, rz + 0.15));
  g.add(p(box(0.3, H - 1.7, 0.2, metalFrame), rx + 4.55, 1.7 + (H - 1.7) / 2, rz + 0.15));

  // mcp:utility/rozvodna (0,2) 1×0.5 — electrical panel
  g.add(p(box(1, 1.2, 0.15, metalFrame), rx + 0.5, 1.2, rz + 2 + 0.08));
  // Panel door
  g.add(p(box(0.8, 1, 0.02, metalShelf), rx + 0.5, 1.2, rz + 2 + 0.16));

  // mcp:utility/cerpadlo (2,1.7) 1.5×0.8 — water pump + tank
  // Tank (cylinder approximated as box)
  g.add(p(box(0.8, 1, 0.8, blueTank), rx + 2 + 0.4, 0.5, rz + 1.7 + 0.4));
  // Pump
  g.add(p(box(0.5, 0.4, 0.4, metalFrame), rx + 3.1, 0.2, rz + 1.7 + 0.4));
  // Pipes
  g.add(p(box(0.05, 0.6, 0.05, chromeMat), rx + 2.4, 1.3, rz + 2.1));

  // mcp:utility/bojler (4,1.8) 0.7×0.7 — water heater
  g.add(p(box(0.7, 1.2, 0.7, white), rx + 4 + 0.35, 0.6, rz + 1.8 + 0.35));
  g.add(p(box(0.05, 0.3, 0.05, chromeMat), rx + 4.35, 1.35, rz + 2.15));
}

// ════════════════════════════════════════════════
// KITCHEN + DINING — (6,2.5) 6×2.5
// ════════════════════════════════════════════════

function furnishKuchyn(g) {
  const rx = 6, rz = 2.5;

  // mcp:kuchyn/linka (0,0) 3×0.6 — kitchen counter with sink
  // Counter top
  g.add(p(box(3, 0.05, 0.6, labWhite), rx + 1.5, 0.9, rz + 0.3));
  // Base cabinet
  g.add(p(box(3, 0.85, 0.58, white), rx + 1.5, 0.425, rz + 0.3));
  // Sink basin
  g.add(p(box(0.5, 0.15, 0.4, chromeMat), rx + 1.8, 0.87, rz + 0.3));
  // Faucet
  g.add(p(box(0.03, 0.25, 0.03, chromeMat), rx + 1.5, 0.93 + 0.125, rz + 0.12));
  g.add(p(box(0.1, 0.03, 0.03, chromeMat), rx + 1.5, 0.93 + 0.25, rz + 0.18));
  // Upper cabinets on wall
  g.add(p(box(3, 0.6, 0.35, white), rx + 1.5, 1.7, rz + 0.18));

  // mcp:kuchyn/sporak (3,0) 0.6×0.6 — induction cooktop
  g.add(p(box(0.6, 0.9, 0.6, white), rx + 3 + 0.3, 0.45, rz + 0.3));
  g.add(p(box(0.55, 0.02, 0.55, blackMat), rx + 3 + 0.3, 0.92, rz + 0.3));
  // Burner rings
  g.add(p(box(0.18, 0.005, 0.18, screenGlow), rx + 3.15, 0.93, rz + 0.2));
  g.add(p(box(0.18, 0.005, 0.18, screenGlow), rx + 3.45, 0.93, rz + 0.2));

  // mcp:kuchyn/lednice (3.6,0) 0.7×0.7 — fridge + freezer
  g.add(p(box(0.7, 1.8, 0.7, white), rx + 3.6 + 0.35, 0.9, rz + 0.35));
  g.add(p(box(0.6, 0.02, 0.01, metalFrame), rx + 3.95, 1.1, rz + 0.71));
  g.add(p(box(0.6, 0.02, 0.01, metalFrame), rx + 3.95, 0.5, rz + 0.71));

  // mcp:kuchyn/mikrovlnka (4.3,0) 0.6×0.5 — microwave + oven
  // Wall shelf for microwave
  g.add(p(box(0.7, 0.03, 0.4, metalShelf), rx + 4.6, 1.2, rz + 0.2));
  g.add(p(box(0.6, 0.35, 0.4, blackMat), rx + 4.6, 1.2 + 0.2, rz + 0.2));
  // Oven below
  g.add(p(box(0.6, 0.6, 0.5, blackMat), rx + 4.6, 0.45, rz + 0.25));
  g.add(p(box(0.5, 0.5, 0.01, screenMat), rx + 4.6, 0.45, rz + 0.51));

  // mcp:kuchyn/stul_jidelni (1.5,1.2) 1.2×0.8 — dining table
  g.add(p(box(1.2, 0.04, 0.8, wood), rx + 1.5 + 0.6, 0.76, rz + 1.2 + 0.4));
  g.add(p(box(0.05, 0.74, 0.05, metalFrame), rx + 1.6, 0.37, rz + 1.3));
  g.add(p(box(0.05, 0.74, 0.05, metalFrame), rx + 2.6, 0.37, rz + 1.3));
  g.add(p(box(0.05, 0.74, 0.05, metalFrame), rx + 1.6, 0.37, rz + 1.9));
  g.add(p(box(0.05, 0.74, 0.05, metalFrame), rx + 2.6, 0.37, rz + 1.9));

  // mcp:kuchyn/zidle1 (1.2,2.1) 0.4×0.4
  addChair(g, rx + 1.4, rz + 2.3);
  // mcp:kuchyn/zidle2 (2.4,2.1) 0.4×0.4
  addChair(g, rx + 2.6, rz + 2.3);
}

function addChair(g, cx, cz) {
  g.add(p(box(0.4, 0.04, 0.4, wood), cx, 0.46, cz));
  g.add(p(box(0.04, 0.44, 0.04, metalFrame), cx - 0.16, 0.22, cz - 0.16));
  g.add(p(box(0.04, 0.44, 0.04, metalFrame), cx + 0.16, 0.22, cz - 0.16));
  g.add(p(box(0.04, 0.44, 0.04, metalFrame), cx - 0.16, 0.22, cz + 0.16));
  g.add(p(box(0.04, 0.44, 0.04, metalFrame), cx + 0.16, 0.22, cz + 0.16));
  // Backrest
  g.add(p(box(0.38, 0.35, 0.03, wood), cx, 0.66, cz + 0.18));
}

// ════════════════════════════════════════════════
// STORAGE — (12,2.5) 6×2.5
// ════════════════════════════════════════════════

function furnishSklad(g) {
  const rx = 12, rz = 2.5;

  // mcp:sklad/regal1 (0,0) 2×0.5 — food supplies
  addShelfUnit(g, rx + 0, rz + 0, 2, 0.5);
  // mcp:sklad/regal2 (2,0) 2×0.5 — water, hygiene
  addShelfUnit(g, rx + 2, rz + 0, 2, 0.5);

  // mcp:sklad/regal3 (0,2) 2×0.5 — meds, tools
  addShelfUnit(g, rx + 0, rz + 2, 2, 0.5);
  // mcp:sklad/regal_lab (3,2) 0.8×0.5 — lab supplies
  addShelfUnit(g, rx + 3, rz + 2, 0.8, 0.5);

  // mcp:sklad/mrazak (5.2,1.7) 0.8×0.8 — deep freezer
  g.add(p(box(0.8, 0.9, 0.8, white), rx + 5.2 + 0.4, 0.45, rz + 1.7 + 0.4));
  g.add(p(box(0.7, 0.04, 0.7, white), rx + 5.6, 0.92, rz + 2.1));

  // Some boxes on shelves for detail
  g.add(p(box(0.3, 0.2, 0.25, yellow), rx + 0.3, 0.55 + 0.1, rz + 0.2));
  g.add(p(box(0.25, 0.15, 0.2, red), rx + 0.8, 0.55 + 0.075, rz + 0.2));
  g.add(p(box(0.3, 0.2, 0.25, yellow), rx + 2.3, 0.55 + 0.1, rz + 0.2));
  g.add(p(box(0.3, 0.2, 0.25, blueTank), rx + 2.8, 1.15 + 0.1, rz + 0.2));
}

function addShelfUnit(g, sx, sz, w, d) {
  const shelfH = 2;
  const levels = 4;
  // Uprights
  g.add(p(box(0.03, shelfH, 0.03, metalFrame), sx + 0.03, shelfH / 2, sz + 0.03));
  g.add(p(box(0.03, shelfH, 0.03, metalFrame), sx + w - 0.03, shelfH / 2, sz + 0.03));
  g.add(p(box(0.03, shelfH, 0.03, metalFrame), sx + 0.03, shelfH / 2, sz + d - 0.03));
  g.add(p(box(0.03, shelfH, 0.03, metalFrame), sx + w - 0.03, shelfH / 2, sz + d - 0.03));
  // Shelves
  for (let i = 0; i < levels; i++) {
    const y = 0.15 + i * 0.5;
    g.add(p(box(w - 0.06, 0.03, d - 0.06, metalShelf), sx + w / 2, y, sz + d / 2));
  }
}

// ════════════════════════════════════════════════
// BATHROOM — (0,5) 6×2.5
// ════════════════════════════════════════════════

function furnishKoupelna(g) {
  const rx = 0, rz = 5;

  // mcp:koupelna/sprcha (0,0) 1×1 — shower enclosure
  g.add(p(box(0.02, 2, 1, glassShower), rx + 1, 1, rz + 0.5));
  g.add(p(box(1, 2, 0.02, glassShower), rx + 0.5, 1, rz + 1));
  g.add(p(box(1, 0.03, 1, floorBath), rx + 0.5, 0.17, rz + 0.5));
  // Shower head + pipe
  g.add(p(box(0.03, 1.5, 0.03, chromeMat), rx + 0.15, 1.2, rz + 0.15));
  g.add(p(box(0.12, 0.03, 0.12, chromeMat), rx + 0.15, 2.1, rz + 0.25));

  // mcp:koupelna/wc (2,0) 0.5×0.7 — toilet
  g.add(p(box(0.4, 0.4, 0.6, ceramic), rx + 2 + 0.25, 0.2, rz + 0.35));
  g.add(p(box(0.35, 0.5, 0.15, ceramic), rx + 2 + 0.25, 0.45, rz + 0.08));

  // mcp:koupelna/umyvadlo (3,0) 0.6×0.5 — sink
  g.add(p(box(0.6, 0.15, 0.45, ceramic), rx + 3 + 0.3, 0.82, rz + 0.23));
  g.add(p(box(0.03, 0.25, 0.03, chromeMat), rx + 3.3, 0.95 + 0.125, rz + 0.08));
  // Mirror above
  g.add(p(box(0.5, 0.6, 0.02, chromeMat), rx + 3.3, 1.4, rz + 0.06));

  // mcp:koupelna/pracka (4,0) 0.6×0.6 — washing machine
  g.add(p(box(0.6, 0.85, 0.6, white), rx + 4 + 0.3, 0.425, rz + 0.3));
  // Door circle on front
  g.add(p(box(0.4, 0.4, 0.01, metalFrame), rx + 4.3, 0.45, rz + 0.61));

  // mcp:koupelna/skrinka_hyg (5,0) 0.7×0.4 — hygiene cabinet
  g.add(p(box(0.7, 1.6, 0.4, white), rx + 5 + 0.35, 0.8, rz + 0.2));
}

// ════════════════════════════════════════════════
// LIVING ROOM — (6,5) 6×2.5
// ════════════════════════════════════════════════

function furnishObyvak(g) {
  const rx = 6, rz = 5;

  // mcp:obyvak/tv (1,0) 1.2×0.1 — wall-mounted TV
  g.add(p(box(1.2, 0.7, 0.04, screenMat), rx + 1 + 0.6, 1.4, rz + 0.08));
  g.add(p(box(1.05, 0.55, 0.01, screenGlow), rx + 1.6, 1.42, rz + 0.07));

  // mcp:obyvak/knihovna (3,0) 1.5×0.4 — bookshelf
  g.add(p(box(1.5, 2, 0.4, woodDark), rx + 3 + 0.75, 1, rz + 0.2));
  // Shelves
  for (let i = 0; i < 4; i++) {
    g.add(p(box(1.44, 0.02, 0.38, wood), rx + 3.75, 0.4 + i * 0.45, rz + 0.2));
  }
  // Some books
  g.add(p(box(0.5, 0.25, 0.18, red), rx + 3.3, 0.53, rz + 0.15));
  g.add(p(box(0.4, 0.3, 0.2, blueTank), rx + 3.9, 0.55, rz + 0.15));
  g.add(p(box(0.35, 0.25, 0.15, greenGen), rx + 4.3, 0.93, rz + 0.15));

  // mcp:obyvak/stul_pc (5,0) 1×0.6 — desk with laptop
  g.add(p(box(1, 0.04, 0.6, wood), rx + 5 + 0.5, 0.75, rz + 0.3));
  g.add(p(box(0.04, 0.73, 0.04, metalFrame), rx + 5.1, 0.365, rz + 0.1));
  g.add(p(box(0.04, 0.73, 0.04, metalFrame), rx + 5.9, 0.365, rz + 0.1));
  g.add(p(box(0.04, 0.73, 0.04, metalFrame), rx + 5.1, 0.365, rz + 0.5));
  g.add(p(box(0.04, 0.73, 0.04, metalFrame), rx + 5.9, 0.365, rz + 0.5));
  // Laptop
  g.add(p(box(0.35, 0.01, 0.25, blackMat), rx + 5.5, 0.78, rz + 0.3));
  g.add(p(box(0.35, 0.25, 0.01, screenGlow), rx + 5.5, 0.78 + 0.14, rz + 0.16));

  // mcp:obyvak/stolek (1,1) 0.8×0.5 — coffee table
  g.add(p(box(0.8, 0.04, 0.5, wood), rx + 1 + 0.4, 0.4, rz + 1 + 0.25));
  g.add(p(box(0.04, 0.38, 0.04, metalFrame), rx + 1.1, 0.19, rz + 1.1));
  g.add(p(box(0.04, 0.38, 0.04, metalFrame), rx + 1.7, 0.19, rz + 1.1));
  g.add(p(box(0.04, 0.38, 0.04, metalFrame), rx + 1.1, 0.19, rz + 1.4));
  g.add(p(box(0.04, 0.38, 0.04, metalFrame), rx + 1.7, 0.19, rz + 1.4));

  // mcp:obyvak/pohovka (0,1.6) 2.2×0.9 — sofa against south wall
  // Seat
  g.add(p(box(2.2, 0.4, 0.7, fabric), rx + 1.1, 0.2, rz + 1.6 + 0.35));
  // Backrest
  g.add(p(box(2.2, 0.35, 0.2, fabric), rx + 1.1, 0.6, rz + 1.6 + 0.8));
  // Armrests
  g.add(p(box(0.15, 0.25, 0.7, fabric), rx + 0.08, 0.52, rz + 2.0));
  g.add(p(box(0.15, 0.25, 0.7, fabric), rx + 2.12, 0.52, rz + 2.0));

  // mcp:obyvak/kreslo (3.5,1.6) 0.8×0.8 — armchair
  g.add(p(box(0.8, 0.38, 0.6, fabric), rx + 3.5 + 0.4, 0.19, rz + 1.6 + 0.3));
  g.add(p(box(0.8, 0.35, 0.15, fabric), rx + 3.9, 0.57, rz + 2.25));
  g.add(p(box(0.12, 0.2, 0.5, fabric), rx + 3.55, 0.48, rz + 1.9));
  g.add(p(box(0.12, 0.2, 0.5, fabric), rx + 4.25, 0.48, rz + 1.9));
}

// ════════════════════════════════════════════════
// BEDROOM — (12,5) 6×2.5
// ════════════════════════════════════════════════

function furnishLoznice(g) {
  const rx = 12, rz = 5;

  // mcp:loznice/postel (0,0.25) 1.4×2 — bed
  // Frame
  g.add(p(box(1.4, 0.3, 2, woodDark), rx + 0.7, 0.15, rz + 0.25 + 1));
  // Mattress
  g.add(p(box(1.3, 0.15, 1.9, bedsheet), rx + 0.7, 0.375, rz + 0.25 + 1));
  // Pillow
  g.add(p(box(0.5, 0.1, 0.35, white), rx + 0.7, 0.48, rz + 0.4));
  // Headboard
  g.add(p(box(1.4, 0.6, 0.05, woodDark), rx + 0.7, 0.6, rz + 0.27));

  // mcp:loznice/stolek_nocni (1.4,0) 0.5×0.5 — nightstand
  g.add(p(box(0.5, 0.5, 0.5, wood), rx + 1.4 + 0.25, 0.25, rz + 0.25));
  // Lamp on nightstand
  g.add(p(box(0.06, 0.25, 0.06, metalFrame), rx + 1.65, 0.625, rz + 0.25));
  g.add(p(box(0.12, 0.1, 0.12, lightMat), rx + 1.65, 0.8, rz + 0.25));

  // mcp:loznice/satni_skrin (3,0) 1.5×0.6 — wardrobe
  g.add(p(box(1.5, 2, 0.6, woodDark), rx + 3 + 0.75, 1, rz + 0.3));
  // Door lines
  g.add(p(box(0.02, 1.8, 0.01, metalFrame), rx + 3.75, 1, rz + 0.61));

  // mcp:loznice/komoda (4.5,0) 0.8×0.5 — dresser
  g.add(p(box(0.8, 0.8, 0.5, wood), rx + 4.5 + 0.4, 0.4, rz + 0.25));
  // Drawer lines
  g.add(p(box(0.7, 0.01, 0.01, metalFrame), rx + 4.9, 0.35, rz + 0.51));
  g.add(p(box(0.7, 0.01, 0.01, metalFrame), rx + 4.9, 0.55, rz + 0.51));

  // mcp:loznice/cisticka (5.6,2.1) 0.4×0.4 — air purifier
  g.add(p(box(0.4, 0.6, 0.4, white), rx + 5.6 + 0.2, 0.3, rz + 2.1 + 0.2));
  g.add(p(box(0.3, 0.05, 0.3, metalFrame), rx + 5.8, 0.62, rz + 2.3));
}

// ════════════════════════════════════════════════
// LIGHTING — strip lights in each container
// ════════════════════════════════════════════════

function addLighting(g) {
  const lightY = H - 0.08;

  // LED strip lights along each container ceiling
  const rooms = [
    [0, 0, 6, 2.5],       // vstup
    [6, 0, 18, 2.5],      // lab
    [0, 2.5, 6, 5],       // utility
    [6, 2.5, 12, 5],      // kuchyn
    [12, 2.5, 18, 5],     // sklad
    [0, 5, 6, 7.5],       // koupelna
    [6, 5, 12, 7.5],      // obyvak
    [12, 5, 18, 7.5],     // loznice
  ];

  for (const [x1, z1, x2, z2] of rooms) {
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const lw = (x2 - x1) * 0.7;
    // Light strip
    g.add(p(box(lw, 0.03, 0.06, lightMat), cx, lightY, cz));
    // Point light for illumination
    const light = new THREE.PointLight(0xffeedd, 1.5, 6);
    light.position.set(cx, lightY - 0.1, cz);
    g.add(light);
  }

  // Extra lab lighting (longer room needs more)
  const labLight2 = new THREE.PointLight(0xffeedd, 1, 5);
  labLight2.position.set(15, lightY - 0.1, 1.25);
  g.add(labLight2);
}
