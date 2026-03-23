import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor, addFloor, addCeiling, addFlatRoof,
  boxWithOpenings, MAT, box, plane
} from './building-utils.js';

// ═══════════════════════════════════════════════════════════
// HOGWARTS CASTLE — 3D Model from MCP floor plans
// MCP coords: x → 3D x, y → 3D z
// Floor height: 4.5m, Great Hall: 14m, Entrance Hall: 10m
// ═══════════════════════════════════════════════════════════

const DS = THREE.FrontSide;
const FH = 4.5;           // standard floor height
const WALL_T = 0.8;       // outer wall thickness
const WALL_T_INNER = 0.3; // inner wall thickness
const FLOORS = 7;

// Materials
const stone = new THREE.MeshLambertMaterial({ color: 0x9a8a78, side: DS });
const stoneDark = new THREE.MeshLambertMaterial({ color: 0x7a6a58, side: DS });
const stoneLight = new THREE.MeshLambertMaterial({ color: 0xb0a090, side: DS });
const stoneWarm = new THREE.MeshLambertMaterial({ color: 0xa08a70, side: DS });
const stoneFloor = new THREE.MeshLambertMaterial({ color: 0x908070, side: DS });
const marble = new THREE.MeshLambertMaterial({ color: 0xe0d8c8, side: DS });
const marbleFloor = new THREE.MeshLambertMaterial({ color: 0xd0c4b0, side: DS });
const wood = new THREE.MeshLambertMaterial({ color: 0x6a4a28, side: DS });
const woodDark = new THREE.MeshLambertMaterial({ color: 0x4a3018, side: DS });
const woodFloor = new THREE.MeshLambertMaterial({ color: 0x8a6a40, side: DS });
const roofTile = new THREE.MeshLambertMaterial({ color: 0x3a3030, side: DS });
const roofSlate = new THREE.MeshLambertMaterial({ color: 0x4a4a50, side: DS });
const iron = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS });
const gold = new THREE.MeshLambertMaterial({ color: 0xc8a830, side: DS });
const redFabric = new THREE.MeshLambertMaterial({ color: 0x8a1818, side: DS });
const blueFabric = new THREE.MeshLambertMaterial({ color: 0x1a3a7a, side: DS });
const greenFabric = new THREE.MeshLambertMaterial({ color: 0x1a5a2a, side: DS });
const yellowFabric = new THREE.MeshLambertMaterial({ color: 0xc8a820, side: DS });
const glass = new THREE.MeshLambertMaterial({ color: 0x88aacc, opacity: 0.3, transparent: true, side: DS });
const stainedGlass = new THREE.MeshLambertMaterial({ color: 0xaa6633, opacity: 0.5, transparent: true, side: DS });
const cobble = new THREE.MeshLambertMaterial({ color: 0x686058, side: DS });
const grass = new THREE.MeshLambertMaterial({ color: 0x4a7a2e, side: DS });
const water = new THREE.MeshLambertMaterial({ color: 0x2a4a6a, opacity: 0.7, transparent: true, side: DS });
const candleGlow = new THREE.MeshLambertMaterial({ color: 0xffdd44, emissive: 0xff8800, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createHogwarts(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // Ground floor base — entire castle footprint
  addFloor(g, 10, 0, 55, 55, 0, stoneFloor);

  buildGroundFloorShell(g);
  buildGreatHall(g);
  buildEntranceHall(g);
  buildCourtyard(g);
  buildCorridors(g);
  buildTransfiguration(g);
  buildStaffRoom(g);
  buildGrandStaircase(g);
  buildUpperFloors(g);
  buildTowers(g);
  buildDungeons(g);
  buildGrounds(g);

  scene.add(g);
}

// ═══════════════════════════════════════════════════════════
// GROUND FLOOR SHELL — outer walls enclosing the castle
// ═══════════════════════════════════════════════════════════

function buildGroundFloorShell(g) {
  const totalH = FLOORS * FH + 2; // total wall height for main body

  // North wall (front) — mcp y=0 → z=0
  // Main entrance opening at x=38+7=45 to x=38+12=50 (5m wide, Entrance Hall door)
  wallWithOpenings(g, {
    axis: 'x', x: 10, z: 0, length: 55, height: totalH, thickness: WALL_T, material: stone,
    openings: [
      { start: 35, end: 40, top: 4.5 }, // main entrance (x=45..50 absolute, relative to wall start x=10: 35..40)
      // Windows on each floor
      ...generateWindowOpenings(55, FLOORS, 2, [35, 40])
    ]
  });

  // South wall — mcp y≈50 → z=50
  wallWithOpenings(g, {
    axis: 'x', x: 10, z: 55, length: 55, height: totalH, thickness: WALL_T, material: stone,
    openings: generateWindowOpenings(55, FLOORS, 3, [])
  });

  // West wall — mcp x=10 → x=10
  wallWithOpenings(g, {
    axis: 'z', x: 10, z: 0, length: 55, height: totalH, thickness: WALL_T, material: stone,
    openings: generateWindowOpenings(55, FLOORS, 3, [])
  });

  // East wall — mcp x≈65 → x=65 (before Great Hall wing)
  wallWithOpenings(g, {
    axis: 'z', x: 65, z: 0, length: 55, height: totalH, thickness: WALL_T, material: stone,
    openings: generateWindowOpenings(55, FLOORS, 2, [])
  });

  // Great Hall wing walls (extends east from main body)
  // mcp: velky_sal at (60,2) 37×12 → 3D x=60..97, z=2..14
  const ghH = 14; // Great Hall full height

  // North wall of Great Hall wing
  wallWithOpenings(g, {
    axis: 'x', x: 65, z: 2, length: 32, height: ghH, thickness: WALL_T, material: stoneDark,
    openings: [
      // Tall gothic windows
      { start: 4, end: 7, bottom: 2, top: 12 },
      { start: 11, end: 14, bottom: 2, top: 12 },
      { start: 18, end: 21, bottom: 2, top: 12 },
      { start: 25, end: 28, bottom: 2, top: 12 },
    ]
  });
  // South wall of Great Hall wing
  wallWithOpenings(g, {
    axis: 'x', x: 65, z: 14, length: 32, height: ghH, thickness: WALL_T, material: stoneDark,
    openings: [
      { start: 4, end: 7, bottom: 2, top: 12 },
      { start: 11, end: 14, bottom: 2, top: 12 },
      { start: 18, end: 21, bottom: 2, top: 12 },
      { start: 25, end: 28, bottom: 2, top: 12 },
    ]
  });
  // East wall (end of Great Hall)
  wallWithOpenings(g, {
    axis: 'z', x: 97, z: 2, length: 12, height: ghH, thickness: WALL_T, material: stoneDark,
    openings: [{ start: 3, end: 9, bottom: 3, top: 11 }] // large stained glass window behind High Table
  });

  // Windows — stained glass in Great Hall
  for (const wz of [2, 14]) {
    for (const wx of [69, 76, 83, 90]) {
      addWindow(g, { axis: 'x', x: 65, z: wz, at: wx - 65, width: 3, sillHeight: 2, winHeight: 10,
        glassMat: stainedGlass });
    }
  }
  // East stained glass
  addWindow(g, { axis: 'z', x: 97, z: 2, at: 6, width: 6, sillHeight: 3, winHeight: 8, glassMat: stainedGlass });

  // Roof slabs
  addFlatRoof(g, 10, 0, 55, 55, totalH, 0.5, roofSlate);
  // Great Hall roof — peaked (simplified as flat for now + ridge)
  addFlatRoof(g, 65, 2, 32, 12, ghH, 0.3, roofSlate);
}

function generateWindowOpenings(wallLen, floors, spacing, excludeRange) {
  const openings = [];
  for (let f = 0; f < floors; f++) {
    const floorY = f * FH;
    for (let w = 3; w < wallLen - 2; w += spacing + 2) {
      // Skip if in exclude range
      if (excludeRange.length === 2 && w >= excludeRange[0] - 1 && w <= excludeRange[1] + 1) continue;
      openings.push({
        start: w, end: w + 1.5,
        bottom: floorY + 1.2, top: floorY + 3.5
      });
    }
  }
  return openings;
}

// ═══════════════════════════════════════════════════════════
// GREAT HALL — mcp: (60,2) 37×12, ceiling 14m
// ═══════════════════════════════════════════════════════════

function buildGreatHall(g) {
  // mcp coords: x=60..97, y=2..14 → 3D x=60..97, z=2..14
  const sx = 60, sz = 2, sw = 37, sd = 12;

  // Floor
  addFloor(g, sx, sz, sw, sd, 0, stoneFloor);

  // 4 house tables (split by center aisle at x=75..77 relative to hall)
  // mcp: stul_nebelvir_l (2,1) 13×1.5, stul_nebelvir_r (17,1) 10×1.5
  const tables = [
    { z: 3, color: redFabric, name: 'Gryffindor' },     // y=1 + sz=2 → z=3
    { z: 5.5, color: yellowFabric, name: 'Hufflepuff' }, // y=3.5
    { z: 8, color: blueFabric, name: 'Ravenclaw' },      // y=6
    { z: 10.5, color: greenFabric, name: 'Slytherin' },  // y=8.5
  ];

  for (const t of tables) {
    // Left half
    g.add(p(box(13, 0.1, 1.2, wood), sx + 2 + 6.5, 0.78, t.z + 0.6));
    // Right half
    g.add(p(box(10, 0.1, 1.2, wood), sx + 17 + 5, 0.78, t.z + 0.6));
    // Table legs (4 per half)
    for (const lx of [sx + 3, sx + 8, sx + 13, sx + 18, sx + 23, sx + 26]) {
      g.add(p(box(0.12, 0.76, 0.12, woodDark), lx, 0.38, t.z + 0.6));
    }
    // Bench fabric runners
    g.add(p(box(13, 0.02, 0.4, t.color), sx + 2 + 6.5, 0.84, t.z + 0.6));
    g.add(p(box(10, 0.02, 0.4, t.color), sx + 17 + 5, 0.84, t.z + 0.6));
  }

  // High Table / Staff table — mcp: ucitelsky_stul (28,3) 8×6
  // Raised platform
  g.add(p(box(8, 0.3, 6, stone), sx + 28 + 4, 0.15, sz + 3 + 3));
  g.add(p(box(7, 0.1, 2, wood), sx + 28 + 3.5, 0.88, sz + 5));
  // Dumbledore's chair (center)
  g.add(p(box(0.8, 1.5, 0.5, gold), sx + 32, 1.05, sz + 3.5));

  // Floating candles
  for (let cx = sx + 5; cx < sx + 35; cx += 3) {
    for (let cz = sz + 2; cz < sz + 11; cz += 2.5) {
      const candleY = 6 + Math.random() * 4;
      g.add(p(box(0.04, 0.3, 0.04, new THREE.MeshLambertMaterial({ color: 0xeeeecc, side: DS })),
        cx + Math.random(), candleY, cz + Math.random()));
      g.add(p(box(0.06, 0.08, 0.06, candleGlow),
        cx + Math.random(), candleY + 0.2, cz + Math.random()));
    }
  }
}

// ═══════════════════════════════════════════════════════════
// ENTRANCE HALL — mcp: (38,0) 20×15, ceiling 10m
// ═══════════════════════════════════════════════════════════

function buildEntranceHall(g) {
  // mcp: vstupni_hala at (38,0) 20×15
  const ex = 38, ez = 0, ew = 20, ed = 15;
  const ehH = 10; // double height

  addFloor(g, ex, ez, ew, ed, 0, marbleFloor);

  // Checker pattern on floor
  for (let i = 0; i < ew; i += 2) {
    for (let j = 0; j < ed; j += 2) {
      const tile = plane(1, 1, stoneDark);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(ex + i + 0.5, 0.14, ez + j + 0.5);
      g.add(tile);
    }
  }

  // Interior walls (where not shared with outer shell)
  // South wall of Entrance Hall (toward courtyard)
  wallWithOpenings(g, {
    axis: 'x', x: ex, z: ez + ed, length: ew, height: ehH, thickness: WALL_T_INNER, material: stoneWarm,
    openings: [
      { start: 5, end: 8, top: 3 }, // door to courtyard (mcp: d_nadvori at (5,14.7))
    ]
  });

  // Marble staircase — mcp: mramorove_schodiste at (2,6) 6×8
  const stX = ex + 2, stZ = ez + 6;
  const stW = 5, stD = 8, stSteps = 22;
  for (let s = 0; s < stSteps; s++) {
    const step = box(stW, 0.16, stD / stSteps, marble);
    step.position.set(stX + stW / 2, s * (FH / stSteps) + 0.08, stZ + s * (stD / stSteps) + (stD / stSteps) / 2);
    g.add(step);
  }
  // Staircase railing
  for (let s = 0; s <= stSteps; s += 4) {
    const ry = s * (FH / stSteps);
    const rz = stZ + s * (stD / stSteps);
    g.add(p(box(0.06, 0.9, 0.06, iron), stX, ry + 0.45, rz));
    g.add(p(box(0.06, 0.9, 0.06, iron), stX + stW, ry + 0.45, rz));
  }

  // Giant hourglasses — mcp: presypaci_hodiny at (14,2) 3×1.5
  for (let i = 0; i < 4; i++) {
    const hx = ex + 14 + i * 0.7;
    const hz = ez + 2.5;
    const hGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8);
    const colors = [redFabric, greenFabric, blueFabric, yellowFabric];
    const hg = new THREE.Mesh(hGeo, colors[i]);
    hg.position.set(hx, 1.5, hz);
    g.add(hg);
  }

  // Balcony (1st floor overlook) at y=FH
  g.add(p(box(ew, 0.15, 3, stoneLight), ex + ew / 2, FH, ez + ed - 1.5));
}

// ═══════════════════════════════════════════════════════════
// COURTYARD — mcp: nadvori at (30,20) 8×25 (open air)
// ═══════════════════════════════════════════════════════════

function buildCourtyard(g) {
  const cx = 30, cz = 20, cw = 8, cd = 25;

  // Cobblestone floor
  addFloor(g, cx, cz, cw, cd, 0, cobble);

  // Surrounding walls (cloisters) at ground level with arched openings
  // North cloister
  wallWithOpenings(g, {
    axis: 'x', x: cx, z: cz, length: cw, height: FH, thickness: WALL_T_INNER, material: stoneLight,
    openings: [{ start: 1, end: 3, top: 3.5 }, { start: 4, end: 6, top: 3.5 }]
  });
  // South cloister
  wallWithOpenings(g, {
    axis: 'x', x: cx, z: cz + cd, length: cw, height: FH, thickness: WALL_T_INNER, material: stoneLight,
    openings: [{ start: 1, end: 3, top: 3.5 }, { start: 4, end: 6, top: 3.5 }]
  });

  // Fountain — mcp: kasna at (5.5,11) 2.5×2.5
  const fx = cx + 5.5 + 1.25, fz = cz + 11 + 1.25;
  const fountain = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.8, 12), stone);
  fountain.position.set(fx, 0.4, fz);
  g.add(fountain);
  // Water in fountain
  const fWater = new THREE.Mesh(new THREE.CircleGeometry(1.1, 12), water);
  fWater.rotation.x = -Math.PI / 2;
  fWater.position.set(fx, 0.78, fz);
  g.add(fWater);
  // Center spout
  g.add(p(box(0.15, 1.2, 0.15, stoneLight), fx, 1, fz));

  // Benches
  g.add(p(box(4, 0.4, 0.4, stone), cx + 5.5 + 2.5, 0.2, cz + 3.25));
  g.add(p(box(4, 0.4, 0.4, stone), cx + 5.5 + 2.5, 0.2, cz + 20.25));

  // Tree
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 8), woodDark);
  trunk.position.set(cx + 1.5, 1.5, cz + 18);
  g.add(trunk);
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), grass);
  leaves.position.set(cx + 1.5, 3.5, cz + 18);
  g.add(leaves);
}

// ═══════════════════════════════════════════════════════════
// CORRIDORS — floor slabs for main corridors
// ═══════════════════════════════════════════════════════════

function buildCorridors(g) {
  // Ground floor corridors
  // mcp: chodba_sever (10,0) 28×4
  addFloor(g, 10, 0, 28, 4, 0, stoneFloor);
  // mcp: chodba_zapad (26,4) 4×16
  addFloor(g, 26, 4, 4, 16, 0, stoneFloor);
  // mcp: chodba_vychod (58,14) 4×31
  addFloor(g, 58, 14, 4, 31, 0, stoneFloor);
  // mcp: chodba_jih (30,45) 32×4
  addFloor(g, 30, 45, 32, 4, 0, stoneFloor);

  // Torch holders along corridors
  const torchPositions = [
    // North corridor
    ...Array.from({ length: 6 }, (_, i) => [14 + i * 5, 1.5, 2]),
    // West corridor
    ...Array.from({ length: 3 }, (_, i) => [27, 1.5, 7 + i * 5]),
    // East corridor
    ...Array.from({ length: 5 }, (_, i) => [59, 1.5, 18 + i * 6]),
  ];

  for (const [tx, _, tz] of torchPositions) {
    g.add(p(box(0.06, 0.4, 0.06, iron), tx, 2.5, tz));
    g.add(p(box(0.08, 0.1, 0.08, candleGlow), tx, 2.8, tz));
  }
}

// ═══════════════════════════════════════════════════════════
// TRANSFIGURATION CLASSROOM — mcp: premenovani (10,4) 15×10
// ═══════════════════════════════════════════════════════════

function buildTransfiguration(g) {
  const rx = 10, rz = 4, rw = 15, rd = 10;

  addFloor(g, rx, rz, rw, rd, 0, woodFloor);
  addCeiling(g, rx, rz, rw, rd, FH, 0);

  // Interior walls
  wallWithOpenings(g, { axis: 'x', x: rx, z: rz + rd, length: rw, height: FH, thickness: WALL_T_INNER, material: stoneWarm,
    openings: [{ start: 7, end: 10, top: 2.5 }] // door
  });
  wallWithOpenings(g, { axis: 'z', x: rx + rw, z: rz, length: rd, height: FH, thickness: WALL_T_INNER, material: stoneWarm });

  // Katedra — mcp: (6,0.5) 3×1.5
  g.add(p(box(3, 0.08, 1.5, woodDark), rx + 7.5, 0.82, rz + 1.25));
  // Tabule
  g.add(p(box(2, 1.2, 0.05, new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS })),
    rx + 7.5, 2, rz + 0.15));

  // Lavice (3 rows × 2 halves)
  for (const row of [3, 5, 7]) {
    g.add(p(box(4, 0.06, 0.8, wood), rx + 3, 0.72, rz + row + 0.5));
    g.add(p(box(4.5, 0.06, 0.8, wood), rx + 11.25, 0.72, rz + row + 0.5));
  }

  // Skříň se zvířaty
  g.add(p(box(1.2, 2, 0.4, woodDark), rx + 1, 1, rz + 4.5));
}

// ═══════════════════════════════════════════════════════════
// STAFF ROOM — mcp: sborovna (10,15) 12×6
// ═══════════════════════════════════════════════════════════

function buildStaffRoom(g) {
  const rx = 10, rz = 15, rw = 12, rd = 6;

  addFloor(g, rx, rz, rw, rd, 0, woodFloor);
  addCeiling(g, rx, rz, rw, rd, FH, 0);

  // Walls
  wallWithOpenings(g, { axis: 'x', x: rx, z: rz, length: rw, height: FH, thickness: WALL_T_INNER, material: stoneWarm,
    openings: [{ start: 0, end: 2, top: 2.5 }]
  });
  wallWithOpenings(g, { axis: 'z', x: rx + rw, z: rz, length: rd, height: FH, thickness: WALL_T_INNER, material: stoneWarm });

  // Long table — mcp: (2,1.5) 8×2
  g.add(p(box(8, 0.08, 2, wood), rx + 6, 0.78, rz + 2.5));
  // Fireplace
  g.add(p(box(2, 1.5, 0.4, stoneDark), rx + 6, 0.75, rz + 5.7));
}

// ═══════════════════════════════════════════════════════════
// GRAND STAIRCASE — mcp: velke_schodiste (38,20) 10×25
// ═══════════════════════════════════════════════════════════

function buildGrandStaircase(g) {
  const sx = 38, sz = 20, sw = 10, sd = 25;
  const totalH = FLOORS * FH;

  // Staircase shaft walls
  wallWithOpenings(g, { axis: 'z', x: sx, z: sz, length: sd, height: totalH, thickness: WALL_T_INNER, material: stone,
    openings: Array.from({ length: FLOORS }, (_, f) => ({
      start: 1, end: 4, bottom: f * FH, top: f * FH + 3
    }))
  });
  wallWithOpenings(g, { axis: 'z', x: sx + sw, z: sz, length: sd, height: totalH, thickness: WALL_T_INNER, material: stone,
    openings: Array.from({ length: FLOORS }, (_, f) => ({
      start: 1, end: 4, bottom: f * FH, top: f * FH + 3
    }))
  });

  // Moving staircases — simplified as stone flights zigzagging up
  const flightW = 3;
  for (let f = 0; f < FLOORS; f++) {
    const baseY = f * FH;
    const midY = baseY + FH / 2;

    // Flight going south (left side)
    for (let s = 0; s < 10; s++) {
      const step = box(flightW, 0.16, sd / 20, stone);
      step.position.set(sx + 2.5, baseY + s * (FH / 20) + 0.08, sz + 2 + s * (sd / 20 - 0.02));
      g.add(step);
    }
    // Flight going north (right side)
    for (let s = 0; s < 10; s++) {
      const step = box(flightW, 0.16, sd / 20, stone);
      step.position.set(sx + sw - 2.5, midY + s * (FH / 20) + 0.08, sz + sd - 2 - s * (sd / 20 - 0.02));
      g.add(step);
    }
    // Landing
    g.add(p(box(sw - 2, 0.15, 3, stoneLight), sx + sw / 2, midY, sz + sd - 1.5));
  }

  // Portraits on walls (dark rectangles with gold frames)
  for (let f = 0; f < FLOORS; f++) {
    for (const side of [sx + 0.2, sx + sw - 0.2]) {
      for (let pz = sz + 4; pz < sz + sd - 4; pz += 4) {
        const frame = box(0.04, 1.2, 0.8, gold);
        frame.position.set(side, f * FH + 2.5, pz);
        g.add(frame);
        const painting = box(0.02, 1, 0.6, new THREE.MeshLambertMaterial({
          color: 0x200000 + Math.floor(Math.random() * 0x404040), side: DS
        }));
        painting.position.set(side, f * FH + 2.5, pz);
        g.add(painting);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// UPPER FLOORS — floor slabs + corridor floors for floors 1-7
// ═══════════════════════════════════════════════════════════

function buildUpperFloors(g) {
  for (let f = 1; f <= FLOORS; f++) {
    const y = f * FH;

    // Floor slab with hole for Grand Staircase (38,20 10×25)
    // Front section (north of staircase)
    addFloor(g, 10, 0, 55, 20, y, stoneFloor);
    // Left of staircase
    addFloor(g, 10, 20, 28, 25, y, stoneFloor);
    // Right of staircase
    addFloor(g, 48, 20, 17, 25, y, stoneFloor);
    // Behind staircase (south)
    addFloor(g, 10, 45, 55, 10, y, stoneFloor);

    // Ceiling for each floor
    addCeiling(g, 10, 0, 55, 55, FH, y);
  }

  // Entrance Hall ceiling at double height (10m = ~2.2 floors)
  addCeiling(g, 38, 0, 20, 15, 10, 0);
  // Ground floor ceiling (rest of main body, excluding Entrance Hall)
  addCeiling(g, 10, 0, 28, 55, FH, 0);
  addCeiling(g, 10, 15, 55, 40, FH, 0);
}

// ═══════════════════════════════════════════════════════════
// TOWERS
// ═══════════════════════════════════════════════════════════

function buildTowers(g) {
  // Astronomy Tower — mcp: vez_astronomicka_base (62,45) 10×10
  buildCylindricalTower(g, 67, 50, 5, FLOORS * FH + 6 * FH, stoneDark, roofSlate);

  // Clock Tower — mcp: vez_hodinova_base (10,45) 8×8
  buildCylindricalTower(g, 14, 49, 4, FLOORS * FH + 4 * FH, stone, roofSlate);
  // Clock face
  const clockGeo = new THREE.CircleGeometry(2.5, 16);
  const clockFace = new THREE.Mesh(clockGeo, new THREE.MeshLambertMaterial({ color: 0xf0e8d0, side: DS }));
  clockFace.position.set(14, FLOORS * FH + 2 * FH, 49 - 4.1);
  g.add(clockFace);
  // Clock hands
  g.add(p(box(0.08, 2, 0.05, iron), 14, FLOORS * FH + 2 * FH + 0.5, 49 - 4.2));
  g.add(p(box(0.06, 1.5, 0.05, iron), 14.3, FLOORS * FH + 2 * FH + 0.3, 49 - 4.2));

  // Bell Tower — mcp: vez_zvonova_base (0,20) 8×8
  buildCylindricalTower(g, 4, 24, 4, FLOORS * FH + 3 * FH, stoneLight, roofSlate);

  // Gryffindor Tower — separate tall tower near 7th floor area
  buildCylindricalTower(g, 12, 46, 6, FLOORS * FH + 4 * FH, stone, roofTile);

  // Owlery (West Tower top)
  buildCylindricalTower(g, 4, 10, 3, FLOORS * FH + 3 * FH, stoneLight, roofSlate);
}

function buildCylindricalTower(g, cx, cz, radius, height, wallMat, roofMat) {
  // Tower shaft
  const towerGeo = new THREE.CylinderGeometry(radius, radius + 0.3, height, 16, 1, true);
  const tower = new THREE.Mesh(towerGeo, wallMat);
  tower.position.set(cx, height / 2, cz);
  g.add(tower);

  // Inner face
  const innerGeo = new THREE.CylinderGeometry(radius - 0.5, radius - 0.2, height, 16, 1, true);
  const innerMat = stoneLight.clone();
  innerMat.side = THREE.BackSide;
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.position.set(cx, height / 2, cz);
  g.add(inner);

  // Conical roof
  const roofGeo = new THREE.ConeGeometry(radius + 0.5, radius * 1.5, 16);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(cx, height + radius * 0.75, cz);
  g.add(roof);

  // Crenellations at top
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const mx = cx + Math.cos(angle) * (radius + 0.15);
    const mz = cz + Math.sin(angle) * (radius + 0.15);
    if (i % 2 === 0) {
      g.add(p(box(0.8, 0.7, 0.4, wallMat), mx, height + 0.35, mz));
    }
  }

  // Arrow slit windows
  for (let h = FH; h < height - FH; h += FH) {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + h * 0.3;
      const wx = cx + Math.cos(angle) * (radius + 0.1);
      const wz = cz + Math.sin(angle) * (radius + 0.1);
      const slit = box(0.12, 1, 0.5, new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS }));
      slit.rotation.y = -angle;
      slit.position.set(wx, h + 1.5, wz);
      g.add(slit);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// DUNGEONS — below ground level (y < 0)
// ═══════════════════════════════════════════════════════════

function buildDungeons(g) {
  const dy = -FH; // dungeon floor level

  // Dungeon floor slab (same footprint as castle)
  addFloor(g, 10, 0, 55, 55, dy, stoneDark);
  addCeiling(g, 10, 0, 55, 55, FH, dy);

  // Kitchen — mcp: kuchyne (60,2) 37×12 (below Great Hall)
  addFloor(g, 60, 2, 37, 12, dy, stoneFloor);
  addCeiling(g, 60, 2, 37, 12, FH, dy);
  // Kitchen tables mirroring Great Hall
  for (const tz of [3, 5.5, 8, 10.5]) {
    g.add(p(box(28, 0.08, 1, wood), 76, dy + 0.78, tz));
  }
  // Fireplace
  g.add(p(box(3, 2.5, 1, stoneDark), 95, dy + 1.25, 8));

  // Potions Classroom — mcp: lektvary (20,12) 12×10
  addFloor(g, 20, 12, 12, 10, dy, stoneDark);
  // Cauldrons on desks
  for (const row of [15, 17, 19]) {
    for (const col of [22, 28]) {
      const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.3, 8), iron);
      cauldron.position.set(col, dy + 0.93, row);
      g.add(cauldron);
    }
  }

  // Slytherin Common Room — mcp: (0,15) 15×8
  addFloor(g, 0, 15, 15, 8, dy, new THREE.MeshLambertMaterial({ color: 0x2a3a2a, side: DS }));
  // Green lamps
  const greenGlow = new THREE.MeshLambertMaterial({ color: 0x22aa44, emissive: 0x115522, side: DS });
  for (const lx of [3, 7.5, 12]) {
    g.add(p(box(0.3, 0.2, 0.3, greenGlow), lx, dy + 3, 19));
  }
}

// ═══════════════════════════════════════════════════════════
// GROUNDS — terrain, lake, Hagrid's hut, Quidditch
// ═══════════════════════════════════════════════════════════

function buildGrounds(g) {
  // Ground plane — below castle floor so it doesn't poke through
  const groundGeo = new THREE.PlaneGeometry(300, 300);
  const ground = new THREE.Mesh(groundGeo, grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(50, -0.15, 80);
  g.add(ground);

  // Stone courtyard around castle base
  const baseGeo = new THREE.PlaneGeometry(70, 70);
  const basePlate = new THREE.Mesh(baseGeo, cobble);
  basePlate.rotation.x = -Math.PI / 2;
  basePlate.position.set(37, -0.05, 27);
  g.add(basePlate);

  // Great Lake — mcp: jezero (30,145) 80×55
  const lakeGeo = new THREE.PlaneGeometry(80, 55);
  const lake = new THREE.Mesh(lakeGeo, water);
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(70, -0.3, 172);
  g.add(lake);

  // Hagrid's Hut — mcp: (75,120) 8×6
  const hx = 75, hz = 120;
  addFloor(g, hx, hz, 8, 6, 0, woodFloor);
  wallWithOpenings(g, { axis: 'x', x: hx, z: hz, length: 8, height: 3.5, thickness: 0.3, material: wood,
    openings: [{ start: 3, end: 5, top: 2.8 }]
  });
  wallWithOpenings(g, { axis: 'x', x: hx, z: hz + 6, length: 8, height: 3.5, thickness: 0.3, material: wood });
  wallWithOpenings(g, { axis: 'z', x: hx, z: hz, length: 6, height: 3.5, thickness: 0.3, material: wood,
    openings: [{ start: 2, end: 4, bottom: 1, top: 2.8 }]
  });
  wallWithOpenings(g, { axis: 'z', x: hx + 8, z: hz, length: 6, height: 3.5, thickness: 0.3, material: wood,
    openings: [{ start: 2, end: 4, bottom: 1, top: 2.8 }]
  });
  addWindow(g, { axis: 'z', x: hx, z: hz, at: 3, width: 2, sillHeight: 1, winHeight: 1.8 });
  addWindow(g, { axis: 'z', x: hx + 8, z: hz, at: 3, width: 2, sillHeight: 1, winHeight: 1.8 });
  // Roof
  const roofGeo = new THREE.ConeGeometry(6, 3, 4);
  const hRoof = new THREE.Mesh(roofGeo, woodDark);
  hRoof.position.set(hx + 4, 5, hz + 3);
  hRoof.rotation.y = Math.PI / 4;
  g.add(hRoof);

  // Quidditch Pitch — mcp: famfrpal (0,100) 55×25
  const qx = 0, qz = 100, qw = 55, qd = 25;
  // Pitch floor (grass)
  addFloor(g, qx, qz, qw, qd, 0, new THREE.MeshLambertMaterial({ color: 0x3a6a22, side: DS }));
  // Goal hoops (3 per side)
  for (const side of [qx + 2, qx + qw - 2]) {
    for (const dz of [-4, 0, 4]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 15, 8), iron);
      pole.position.set(side, 7.5, qz + qd / 2 + dz);
      g.add(pole);
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 16), gold);
      hoop.position.set(side, 15, qz + qd / 2 + dz);
      g.add(hoop);
    }
  }
  // Stands (simplified boxes)
  g.add(p(box(qw - 10, 8, 3, wood), qx + qw / 2, 4, qz - 1.5));
  g.add(p(box(qw - 10, 8, 3, wood), qx + qw / 2, 4, qz + qd + 1.5));

  // Greenhouses — mcp: skleniky (55,92) 30×8
  for (let i = 0; i < 3; i++) {
    const gx = 55 + i * 10, gz = 92;
    g.add(p(box(8, 3, 7, glass), gx + 4, 1.5, gz + 3.5));
    // Metal frame
    g.add(p(box(8.1, 0.08, 0.08, iron), gx + 4, 3, gz + 0.5));
    g.add(p(box(8.1, 0.08, 0.08, iron), gx + 4, 3, gz + 6.5));
  }

  // Whomping Willow — mcp: (90,105) 5×5
  const wTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 5, 8), woodDark);
  wTrunk.position.set(92.5, 2.5, 107.5);
  g.add(wTrunk);
  // Branches (angled boxes)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const branch = box(0.12, 0.12, 4, woodDark);
    branch.rotation.y = angle;
    branch.rotation.z = -0.5;
    branch.position.set(92.5 + Math.cos(angle) * 2, 4, 107.5 + Math.sin(angle) * 2);
    g.add(branch);
  }
}
