import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof, addFloorOverlay,
  MAT, box, plane
} from './building-utils.js';

// Kostel s farou — MCP (60,60) → 3D (-40, -40)
// Kostel: věž(0,5) → předsíň(4,4.5) → loď(7,2) 15×10 → presbytář(22,3) 6×8
// Sakristie(22,11.5), Fara(15,16) 14×9
const DS = THREE.FrontSide;
const CHURCH_H = 8;   // hlavní loď výška
const PRESB_H = 9;    // presbytář ještě vyšší
const TOWER_H = 20;
const FARA_FH = 3;

const stone = new THREE.MeshLambertMaterial({ color: 0xc8c0b0, side: DS });
const stoneDk = new THREE.MeshLambertMaterial({ color: 0x8a8478, side: DS });
const stoneLight = new THREE.MeshLambertMaterial({ color: 0xd8d0c4, side: DS });
const woodChurch = new THREE.MeshLambertMaterial({ color: 0x8a6a40, side: DS });
const woodDk = new THREE.MeshLambertMaterial({ color: 0x5a4020, side: DS });
const woodFloor = new THREE.MeshLambertMaterial({ color: 0xb09060, side: DS });
const tile = new THREE.MeshLambertMaterial({ color: 0x7a3030, side: DS });
const gold = new THREE.MeshLambertMaterial({ color: 0xc8a820, side: DS });
const fabric = new THREE.MeshLambertMaterial({ color: 0x8a2020, side: DS });
const fabricWhite = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const vitraj = new THREE.MeshLambertMaterial({ color: 0x4488aa, opacity: 0.4, transparent: true, side: DS });
const vitrajRose = new THREE.MeshLambertMaterial({ color: 0xaa4466, opacity: 0.4, transparent: true, side: DS });
const iron = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const white = new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS });
const counter = new THREE.MeshLambertMaterial({ color: 0xe0dcd4, side: DS });
const fridge = new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS });
const bed = new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS });
const sheet = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const sofa = new THREE.MeshLambertMaterial({ color: 0x404850, side: DS });
const tvMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a, side: DS });
const mirror = new THREE.MeshLambertMaterial({ color: 0xaaccdd, side: DS });
const wood = new THREE.MeshLambertMaterial({ color: 0xb09060, side: DS });
const metal = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const mfb = new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createKostel(scene, cx = -40, cz = -40) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  buildTower(g);
  buildNartex(g);
  buildNave(g);
  buildPresbytery(g);
  buildSacristy(g);
  buildFara(g);

  scene.add(g);
}

function buildTower(g) {
  // mcp:vez (0,5) 4×4, height 20m
  const tx = 0, tz = 5;
  addFloor(g, tx, tz, 4, 4, 0, stoneDk);
  // Walls
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz, length: 4, height: TOWER_H, material: stone,
    openings: [{ start: 1.25, end: 2.75, top: 2.5 }] // mcp:d_vstup — portál
  });
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz + 4, length: 4, height: TOWER_H, material: stone });
  wallWithOpenings(g, { axis: 'z', x: tx, z: tz, length: 4, height: TOWER_H, material: stone });
  wallWithOpenings(g, { axis: 'z', x: tx + 4, z: tz, length: 4, height: TOWER_H, material: stone,
    openings: [{ start: 1.25, end: 2.75, top: 2.5 }] // průchod do předsíně
  });
  addDoor(g, { axis: 'x', x: tx, z: tz, at: 2, width: 1.5, doorHeight: 2.5, material: woodDk });

  // Pyramidová střecha
  const roofGeo = new THREE.ConeGeometry(3.2, 5, 4);
  const roof = new THREE.Mesh(roofGeo, tile);
  roof.position.set(tx + 2, TOWER_H + 2.5, tz + 2);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  // Zvonová okna nahoře
  for (const [wx, wz, axis] of [[tx, tz + 2, 'x'], [tx + 4, tz + 2, 'x'], [tx + 2, tz, 'z'], [tx + 2, tz + 4, 'z']]) {
    if (axis === 'x') {
      addWindow(g, { axis: 'z', x: wx === tx ? tx : tx + 4, z: tz, at: 2, width: 1, sillHeight: 16, winHeight: 2.5, glassMat: vitraj });
    }
  }
}

function buildNartex(g) {
  // mcp:predsin (4, 4.5) 3×5
  const nx = 4, nz = 4.5;
  addFloor(g, nx, nz, 3, 5, 0, stoneDk);
  wallWithOpenings(g, { axis: 'x', x: nx, z: nz, length: 3, height: CHURCH_H * 0.6, material: stone });
  wallWithOpenings(g, { axis: 'x', x: nx, z: nz + 5, length: 3, height: CHURCH_H * 0.6, material: stone });
  wallWithOpenings(g, { axis: 'z', x: nx + 3, z: nz, length: 5, height: CHURCH_H * 0.6, material: stone,
    openings: [{ start: 1.5, end: 3.5, top: 3 }] // mcp:d_predsin_lod
  });
  addDoor(g, { axis: 'z', x: nx + 3, z: nz, at: 2.5, width: 2, doorHeight: 3, material: woodDk });
  // Sedlová střecha
  addFlatRoof(g, nx, nz, 3, 5, CHURCH_H * 0.6, 0.2, tile);
}

function buildNave(g) {
  // mcp:lod (7, 2) 15×10, strop 8m
  const lx = 7, lz = 2;
  addFloor(g, lx, lz, 15, 10, 0, stoneDk);

  // North wall — 3 vitráže + 2 zpovědnice prostory
  wallWithOpenings(g, { axis: 'x', x: lx, z: lz, length: 15, height: CHURCH_H, material: stone,
    openings: [
      { start: 3, end: 4.5, bottom: 2, top: 6 },   // mcp:lod/w_north1
      { start: 7, end: 8.5, bottom: 2, top: 6 },   // mcp:lod/w_north2
      { start: 11, end: 12.5, bottom: 2, top: 6 },  // mcp:lod/w_north3
    ]
  });
  // South wall — 3 vitráže
  wallWithOpenings(g, { axis: 'x', x: lx, z: lz + 10, length: 15, height: CHURCH_H, material: stone,
    openings: [
      { start: 3, end: 4.5, bottom: 2, top: 6 },
      { start: 7, end: 8.5, bottom: 2, top: 6 },
      { start: 11, end: 12.5, bottom: 2, top: 6 },
    ]
  });
  // West wall — průchod z předsíně
  wallWithOpenings(g, { axis: 'z', x: lx, z: lz, length: 10, height: CHURCH_H, material: stone,
    openings: [{ start: 3.5, end: 5.5, top: 3.5 }]
  });
  // East wall — oblouk do presbytáře
  wallWithOpenings(g, { axis: 'z', x: lx + 15, z: lz, length: 10, height: CHURCH_H, material: stone,
    openings: [{ start: 3, end: 7, top: 7 }] // mcp:d_lod_presbytar — velký oblouk
  });

  // Vitráže — skla
  for (let i = 0; i < 3; i++) {
    const wx = lx + 3 + i * 4 + 0.75;
    addWindow(g, { axis: 'x', x: lx, z: lz, at: 3.75 + i * 4, width: 1.5, sillHeight: 2, winHeight: 4, glassMat: vitraj });
    addWindow(g, { axis: 'x', x: lx, z: lz + 10, at: 3.75 + i * 4, width: 1.5, sillHeight: 2, winHeight: 4, glassMat: vitraj });
  }

  // Strop — dřevěný trámový
  addCeiling(g, lx, lz, 15, 10, CHURCH_H, 0);
  // Trámy
  for (let i = 0; i < 6; i++) {
    g.add(p(box(0.2, 0.4, 10, woodDk), lx + 1.5 + i * 2.5, CHURCH_H - 0.2, lz + 5));
  }

  // Sedlová střecha
  const roofLen = 15.5;
  const roofWidth = Math.sqrt(5.5 * 5.5 + 2.5 * 2.5);
  for (const side of [-1, 1]) {
    const roofPanel = plane(roofLen, roofWidth, tile);
    roofPanel.rotation.order = 'YXZ';
    roofPanel.rotation.x = side * -Math.atan2(2.5, 5.5);
    roofPanel.rotation.y = Math.PI / 2;
    roofPanel.position.set(lx + 7.5, CHURCH_H + 1.25, lz + 5 + side * 2.5);
    g.add(roofPanel);
  }

  // === Nábytek z MCP ===
  // mcp:lod/lavice 4 řady (=) po stranách hlavní uličky
  for (const [bx, bw] of [[2, 1.2], [4.5, 1.2], [8.5, 1.2], [11, 1.2]]) {
    for (let row = 0; row < 7; row++) {
      const bench = box(bw, 0.45, 0.4, woodChurch);
      g.add(p(bench, lx + bx + bw / 2, 0.225, lz + 1 + row * 0.9));
      // Opěradlo
      const back = box(bw, 0.5, 0.05, woodChurch);
      g.add(p(back, lx + bx + bw / 2, 0.5, lz + 1 + row * 0.9 - 0.2));
    }
  }

  // mcp:lod/kruchta (0, 8.5) 15×1.5 — vyvýšený kůr vzadu
  const kx = lx, kz = lz + 8.5;
  g.add(p(box(15, 3, 1.5, stone), kx + 7.5, 1.5, kz + 0.75));
  // Zábradlí kůru
  g.add(p(box(15, 0.08, 0.1, woodDk), kx + 7.5, 3.1, kz));
  // Podpěrné sloupy
  for (let i = 0; i < 4; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 8), stone);
    g.add(p(col, kx + 2 + i * 3.5, 1.5, kz));
  }

  // Zpovědnice — mcp:zpoved1 (7,0) + zpoved2 (9,0) — severně od lodi
  for (const zx of [7, 9]) {
    g.add(p(box(1.5, 2.2, 1.5, woodDk), zx + 0.75, 1.1, 0 + 0.75));
    // Dvířka
    g.add(p(box(0.6, 1.8, 0.04, woodChurch), zx + 0.75, 0.9, 0.02));
  }
}

function buildPresbytery(g) {
  // mcp:presbytar (22, 3) 6×8, zvýšený podlaha +0.3m
  const px = 22, pz = 3;
  addFloor(g, px, pz, 6, 8, 0.3, stoneDk);
  // Schůdky
  g.add(p(box(4, 0.15, 0.3, stone), px - 0.5, 0.075, pz + 4));
  g.add(p(box(4, 0.15, 0.3, stone), px - 0.5, 0.225, pz + 3.7));

  // Walls — east + north + south (west is the arch from nave)
  wallWithOpenings(g, { axis: 'z', x: px + 6, z: pz, length: 8, height: PRESB_H, material: stone,
    openings: [{ start: 2, end: 5, bottom: 2, top: 7 }] // mcp:presbytar/w_east — růžicové okno
  });
  addWindow(g, { axis: 'z', x: px + 6, z: pz, at: 3.5, width: 3, sillHeight: 2, winHeight: 5, glassMat: vitrajRose });
  wallWithOpenings(g, { axis: 'x', x: px, z: pz, length: 6, height: PRESB_H, material: stone });
  wallWithOpenings(g, { axis: 'x', x: px, z: pz + 8, length: 6, height: PRESB_H, material: stone,
    openings: [{ start: 2, end: 3, top: 2.2 }] // dveře do sakristie
  });
  addDoor(g, { axis: 'x', x: px, z: pz + 8, at: 2.5, width: 1, material: woodDk });

  addCeiling(g, px, pz, 6, 8, PRESB_H, 0);
  addFlatRoof(g, px, pz, 6, 8, PRESB_H, 0.3, tile);

  // mcp:presbytar/oltar (3.5, 3) 2×1.2
  const altar = box(2, 1, 1.2, stoneLight);
  g.add(p(altar, px + 4.5, 0.3 + 0.5, pz + 3.6));
  // Oltářní plátno
  g.add(p(box(1.8, 0.02, 1.3, fabricWhite), px + 4.5, 0.3 + 1.01, pz + 3.6));
  // Svíčky
  for (const dx of [-0.6, 0.6]) {
    g.add(p(box(0.06, 0.3, 0.06, gold), px + 4.5 + dx, 0.3 + 1.15, pz + 3.6));
  }

  // mcp:presbytar/kriz (4, 0.5) — na zdi
  g.add(p(box(0.1, 2, 0.1, woodDk), px + 4.5, 0.3 + 4, pz + 0.3));
  g.add(p(box(1, 0.1, 0.1, woodDk), px + 4.5, 0.3 + 4.5, pz + 0.3));

  // mcp:presbytar/ambon (0.5, 2) 1×0.8
  g.add(p(box(1, 1.1, 0.8, woodChurch), px + 1, 0.3 + 0.55, pz + 2.4));
}

function buildSacristy(g) {
  // mcp:sakristie (22, 11.5) 5×4
  const sx = 22, sz = 11.5;
  addFloor(g, sx, sz, 5, 4, 0, woodFloor);
  addCeiling(g, sx, sz, 5, 4, 3.5, 0);

  wallWithOpenings(g, { axis: 'x', x: sx, z: sz + 4, length: 5, height: 3.5, material: stone,
    openings: [{ start: 2, end: 3, top: 2.2 }] // dveře do fary
  });
  addDoor(g, { axis: 'x', x: sx, z: sz + 4, at: 2.5, width: 1, material: woodDk });
  wallWithOpenings(g, { axis: 'z', x: sx + 5, z: sz, length: 4, height: 3.5, material: stone,
    openings: [{ start: 1.5, end: 2.7, bottom: 1, top: 2.2 }]
  });
  addWindow(g, { axis: 'z', x: sx + 5, z: sz, at: 2.1, width: 1.2, sillHeight: 1, winHeight: 1.2 });
  wallWithOpenings(g, { axis: 'z', x: sx, z: sz, length: 4, height: 3.5, material: stone });
  addFlatRoof(g, sx, sz, 5, 4, 3.5, 0.2, tile);

  // Nábytek — mcp:sakristie/skrin_param, stul, umyv
  g.add(p(box(2, 1.8, 0.6, woodDk), sx + 0.3 + 1, 0.9, sz + 0.3 + 0.3));
  g.add(p(box(1.5, 0.04, 0.8, wood), sx + 2 + 0.75, 0.75, sz + 2 + 0.4));
  g.add(p(box(0.5, 0.06, 0.4, white), sx + 4 + 0.25, 0.8, sz + 0.3 + 0.2));
}

function buildFara(g) {
  // mcp:fara (15, 16) 14×9 — 2 patra
  const fx = 15, fz = 16;

  for (let f = 0; f < 2; f++) {
    const y = f * FARA_FH;
    addFloor(g, fx, fz, 14, 9, y);
    addCeiling(g, fx, fz, 14, 9, FARA_FH, y);

    // Outer walls
    wallWithOpenings(g, { axis: 'z', x: fx, z: fz, length: 9, height: FARA_FH, y, material: stoneLight,
      openings: f === 0
        ? [{ start: 4, end: 5, top: 2.2 }]   // mcp:d_fara_vstup
        : [{ start: 1, end: 2.5, bottom: 0.5, top: 2.5 }, { start: 5, end: 6.5, bottom: 0.5, top: 2.5 }]
    });
    if (f === 0) addDoor(g, { axis: 'z', x: fx, z: fz, at: 4.5, width: 1, material: woodDk });
    else {
      addWindow(g, { axis: 'z', x: fx, z: fz, at: 1.75, width: 1.5, sillHeight: FARA_FH + 0.5, winHeight: 2 });
      addWindow(g, { axis: 'z', x: fx, z: fz, at: 5.75, width: 1.5, sillHeight: FARA_FH + 0.5, winHeight: 2 });
    }

    wallWithOpenings(g, { axis: 'z', x: fx + 14, z: fz, length: 9, height: FARA_FH, y, material: stoneLight,
      openings: f === 1 ? [{ start: 6, end: 7, bottom: 1.4, top: 2.2 }] : []
    });
    if (f === 1) addWindow(g, { axis: 'z', x: fx + 14, z: fz, at: 6.5, width: 1, sillHeight: FARA_FH + 1.4, winHeight: 0.8 });

    wallWithOpenings(g, { axis: 'x', x: fx, z: fz + 9, length: 14, height: FARA_FH, y, material: stoneLight,
      openings: f === 0
        ? [{ start: 3, end: 4.5, bottom: 0.9, top: 2.2 }]
        : [{ start: 1.5, end: 3.5, bottom: 0.5, top: 2.5 }, { start: 8, end: 10, bottom: 0.5, top: 2.5 }]
    });
  }

  // North wall (shared with kostel area) — connection to sakristie
  wallWithOpenings(g, { axis: 'x', x: fx, z: fz, length: 14, height: FARA_FH * 2, material: stoneLight,
    openings: [{ start: 9, end: 10, top: 2.2 }] // mcp:d_sakristie
  });

  addFlatRoof(g, fx, fz, 14, 9, FARA_FH * 2, 0.3, tile);

  // Inner walls — přízemí
  buildFaraP1Walls(g, fx, fz);
  // Inner walls — patro
  buildFaraP2Walls(g, fx, fz);

  // Schody — disabled (addUTurnStairs removed)
  // addUTurnStairs(g, { x: fx + 7, z: fz, width: 2.5, depth: 4, entryY: 0, exitY: FARA_FH, entrySide: 'south' });

  // Nábytek
  furnishFaraP1(g, fx, fz);
  furnishFaraP2(g, fx, fz);
}

function buildFaraP1Walls(g, fx, fz) {
  const y = 0;
  // mcp:fara/p1/chodba (0,3.5) 1.2×5.5
  // mcp:fara/p1/kancelar (1.5,0) 5×4
  wallWithOpenings(g, { axis: 'z', x: fx + 1.2, z: fz, length: 9, height: FARA_FH, y, thickness: 0.12, material: MAT.wallInner,
    openings: [{ start: 2, end: 2.9, top: 2.2 }, { start: 6, end: 6.9, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: fx + 1.2, z: fz, at: 2.45, width: 0.9 });
  addDoor(g, { axis: 'z', x: fx + 1.2, z: fz, at: 6.45, width: 0.9 });

  // mcp:fara/p1/kancelar south wall
  wallWithOpenings(g, { axis: 'x', x: fx + 1.5, z: fz + 4, length: 5, height: FARA_FH, y, thickness: 0.12, material: MAT.wallInner });

  // mcp:fara/p1/kuchyn (1.5, 4.5) 5×4.5
  wallWithOpenings(g, { axis: 'x', x: fx + 1.5, z: fz + 4.5, length: 5, height: FARA_FH, y, thickness: 0.12, material: MAT.wallInner });

  // mcp:fara/p1/schody (7, 0) right wall + wc + spíž walls
  wallWithOpenings(g, { axis: 'z', x: fx + 7, z: fz, length: 9, height: FARA_FH, y, thickness: 0.12, material: MAT.wallInner,
    openings: [{ start: 2, end: 2.9, top: 2.2 }, { start: 5, end: 5.8, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: fx + 7, z: fz, at: 2.45, width: 0.9 });
  addDoor(g, { axis: 'z', x: fx + 7, z: fz, at: 5.4, width: 0.8 });
  wallWithOpenings(g, { axis: 'z', x: fx + 8.5, z: fz + 4.5, length: 4.5, height: FARA_FH, y, thickness: 0.1, material: MAT.wallInner });
  wallWithOpenings(g, { axis: 'x', x: fx + 7, z: fz + 4.5, length: 1.5, height: FARA_FH, y, thickness: 0.1, material: MAT.wallInner });
  wallWithOpenings(g, { axis: 'x', x: fx + 7, z: fz + 7, length: 1.5, height: FARA_FH, y, thickness: 0.1, material: MAT.wallInner });
}

function buildFaraP2Walls(g, fx, fz) {
  const y = FARA_FH;
  // mcp:fara/p2/chodba (0,3.5) 9×1.5
  wallWithOpenings(g, { axis: 'x', x: fx, z: fz + 3.5, length: 9, height: FARA_FH, y, thickness: 0.12, material: MAT.wallInner,
    openings: [{ start: 2, end: 3, top: 2.2 }, { start: 6, end: 7, top: 2.2 }, { start: 7, end: 7.7, top: 2.2 }]
  });
  addDoor(g, { axis: 'x', x: fx, z: fz + 3.5, at: 2.5, width: 1, y });
  addDoor(g, { axis: 'x', x: fx, z: fz + 3.5, at: 6.5, width: 1, y });

  wallWithOpenings(g, { axis: 'x', x: fx, z: fz + 5, length: 9, height: FARA_FH, y, thickness: 0.12, material: MAT.wallInner,
    openings: [{ start: 2.5, end: 3.5, top: 2.2 }]
  });
  addDoor(g, { axis: 'x', x: fx, z: fz + 5, at: 3, width: 1, y });

  // loznice | pracovna divider
  wallWithOpenings(g, { axis: 'z', x: fx + 5, z: fz, length: 3.5, height: FARA_FH, y, thickness: 0.12, material: MAT.wallInner });
  // obyvak | koupelna divider
  wallWithOpenings(g, { axis: 'z', x: fx + 6, z: fz + 5, length: 4, height: FARA_FH, y, thickness: 0.12, material: MAT.wallBathroom,
    openings: [{ start: 1, end: 1.9, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: fx + 6, z: fz + 5, at: 1.45, width: 0.9, y });

  addFloorOverlay(g, fx + 6, fz + 5, 2.5, 3, FARA_FH, mfb);
}

function furnishFaraP1(g, fx, fz) {
  // mcp:fara/p1/kancelar (1.5,0) — stůl, knihovna, křesla
  const kx = fx + 1.5, kz = fz;
  g.add(p(box(2, 0.04, 0.8, wood), kx + 0.5 + 1, 0.72, kz + 0.3 + 0.4));
  g.add(p(box(0.5, 2, 3, woodDk), kx + 4 + 0.25, 1, kz + 0.3 + 1.5));
  for (const az of [2.5, 2.5]) {
    g.add(p(box(0.8, 0.4, 0.8, sofa), kx + 1 + 0.4, 0.35, kz + az + 0.4));
    g.add(p(box(0.8, 0.4, 0.8, sofa), kx + 2.5 + 0.4, 0.35, kz + az + 0.4));
  }

  // mcp:fara/p1/kuchyn (1.5,4.5) — linka, stůl, lednice
  const jx = fx + 1.5, jz = fz + 4.5;
  g.add(p(box(3, 0.9, 0.6, counter), jx + 0.3 + 1.5, 0.45, jz + 0.3 + 0.3));
  g.add(p(box(1.5, 0.04, 1, wood), jx + 1.5 + 0.75, 0.74, jz + 2 + 0.5));
  g.add(p(box(0.6, 1.9, 0.6, fridge), jx + 3.8 + 0.3, 0.95, jz + 0.3 + 0.3));
}

function furnishFaraP2(g, fx, fz) {
  const y = FARA_FH;
  // mcp:fara/p2/loznice (0,0) 4.5×3.5
  const lx = fx, lz = fz;
  g.add(p(box(1.8, 0.35, 2.2, bed), lx + 1 + 0.9, y + 0.275, lz + 0.3 + 1.1));
  g.add(p(box(1.7, 0.15, 2.1, sheet), lx + 1.9, y + 0.5, lz + 1.35));
  g.add(p(box(0.4, 0.4, 0.4, wood), lx + 3 + 0.2, y + 0.2, lz + 0.5 + 0.2));
  g.add(p(box(0.6, 2, 2, woodDk), lx + 3.5 + 0.3, y + 1, lz + 0.3 + 1));

  // mcp:fara/p2/obyvak (0,5) 5.5×4
  const ox = fx, oz = fz + 5;
  g.add(p(box(2.2, 0.4, 0.9, sofa), ox + 0.5 + 1.1, y + 0.35, oz + 1 + 0.45));
  g.add(p(box(1, 0.03, 0.6, wood), ox + 1 + 0.5, y + 0.4, oz + 2.5 + 0.3));
  g.add(p(box(0.8, 0.4, 0.8, sofa), ox + 3.5 + 0.4, y + 0.35, oz + 1.5 + 0.4));
  g.add(p(box(1.2, 0.7, 0.04, tvMat), ox + 4.7, y + 1.3, oz + 1 + 0.6));

  // mcp:fara/p2/koupelna (6,5) 2.5×3
  const bx = fx + 6, bz = fz + 5;
  g.add(p(box(0.7, 0.5, 1.5, white), bx + 0.2 + 0.35, y + 0.25, bz + 0.2 + 0.75));
  g.add(p(box(0.5, 0.06, 0.4, white), bx + 1.5 + 0.25, y + 0.8, bz + 0.3 + 0.2));
  g.add(p(box(0.4, 0.35, 0.5, white), bx + 1.5 + 0.2, y + 0.175, bz + 2 + 0.25));
}
