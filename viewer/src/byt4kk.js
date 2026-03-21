import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof, addFloorOverlay,
  MAT, box, plane
} from './building-utils.js';

// Byt 4+kk — 16×12m, jednopodlažní
// MCP layout:
//   chodba (3.5, 0.5) 1.8×8    — páteř
//   ložnice (0, 0) 3.5×4.5     — západ nahoře
//   koupelna (0, 5) 3.5×3.5    — západ dole
//   WC (5.5, 0) 1.8×2          — u vstupu
//   šatna (7.5, 0) 2×2         — u vstupu
//   spíž (5.5, 2.5) 1.5×1.5   — u chodby
//   tech (9.8, 0) 1.5×2        — vpravo nahoře
//   dětský (11.5, 0) 4.5×4.5   — východ nahoře
//   pracovna (11.5, 5) 4.5×3.5 — východ dole
//   obývák (5.5, 4.5) 6×7.5   — střed+jih

const DS = THREE.DoubleSide;
const FH = 2.8;

const mw = new THREE.MeshLambertMaterial({ color: 0xf0ece4, side: DS });    // vnější zdi
const mi = new THREE.MeshLambertMaterial({ color: 0xf5f2ec, side: DS });    // vnitřní zdi
const mb = new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS });    // koupelna zdi
const mf = new THREE.MeshLambertMaterial({ color: 0xc4a06a, side: DS });    // podlaha dřevo
const mfb = new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS });   // podlaha koupelna
const mfh = new THREE.MeshLambertMaterial({ color: 0xa09080, side: DS });   // podlaha chodba
const mc = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });    // strop
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

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createByt4kk(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  addFloor(g, 0, 0, 16, 12, 0, mf);
  addCeiling(g, 0, 0, 16, 12, FH, 0, mc);

  // Floor overlays
  addFloorOverlay(g, 3.5, 0.5, 1.8, 8, 0, mfh);   // mcp:chodba (3.5,0.5) 1.8×8
  addFloorOverlay(g, 0, 0, 3.5, 4, 0, mfb);         // mcp:koupelna (0,0) 3.5×4
  addFloorOverlay(g, 5.5, 0, 1.8, 2, 0, mfb);       // mcp:wc (5.5,0) 1.8×2

  // ═══ OUTER WALLS ═══
  // North (y=0 → z=0) — vstupní dveře na x=4..5
  wallWithOpenings(g, { axis: 'x', x: 0, z: 0, length: 16, height: FH, material: mw,
    openings: [
      { start: 4, end: 5, top: 2.2 },                   // vstup
      { start: 13, end: 15, bottom: 0.5, top: 2.5 },    // dětský okno
    ]
  });
  addDoor(g, { axis: 'x', x: 0, z: 0, at: 4.5, width: 1, material: MAT.doorEntrance });
  addWindow(g, { axis: 'x', x: 0, z: 0, at: 14, width: 2, sillHeight: 0.5, winHeight: 2 });

  // South (z=12) — panorama obývák
  wallWithOpenings(g, { axis: 'x', x: 0, z: 12, length: 16, height: FH, material: mw,
    openings: [
      { start: 6, end: 11, bottom: 0.2, top: 2.8 },    // panorama
    ]
  });
  addWindow(g, { axis: 'x', x: 0, z: 12, at: 8.5, width: 5, sillHeight: 0.2, winHeight: 2.6 });

  // West (x=0) — mcp:w_koup_z (0,1.5) + mcp:w_loz_z (0,6.5) + mcp:w_obyvak_z (0,10)
  wallWithOpenings(g, { axis: 'z', x: 0, z: 0, length: 12, height: FH, material: mw,
    openings: [
      { start: 1.5, end: 2.5, bottom: 1.2, top: 2.2 },   // mcp:w_koup_z — koupelna okno (malé, vysoko)
      { start: 6.5, end: 8.5, bottom: 0.5, top: 2.5 },   // mcp:w_loz_z — ložnice okno
      { start: 10, end: 11.5, bottom: 0.5, top: 2.5 },   // mcp:w_obyvak_z — obývák okno
    ]
  });
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 2, width: 1, sillHeight: 1.2, winHeight: 1 });       // mcp:w_koup_z
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 7.5, width: 2, sillHeight: 0.5, winHeight: 2 });     // mcp:w_loz_z
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 10.75, width: 1.5, sillHeight: 0.5, winHeight: 2 }); // mcp:w_obyvak_z

  // East (x=16) — dětský + pracovna okna
  wallWithOpenings(g, { axis: 'z', x: 16, z: 0, length: 12, height: FH, material: mw,
    openings: [
      { start: 1.5, end: 3.5, bottom: 0.5, top: 2.5 },  // dětský
      { start: 6.5, end: 8.3, bottom: 0.5, top: 2.3 },   // pracovna
    ]
  });
  addWindow(g, { axis: 'z', x: 16, z: 0, at: 2.5, width: 2, sillHeight: 0.5, winHeight: 2 });
  addWindow(g, { axis: 'z', x: 16, z: 0, at: 7.4, width: 1.8, sillHeight: 0.5, winHeight: 1.8 });

  // ═══ INNER WALLS ═══

  // mcp:koupelna (0,0) 3.5×4 — východní zeď, mcp:d_koup (3.5,1.5) dveře z chodby
  wallWithOpenings(g, { axis: 'z', x: 3.5, z: 0, length: 4, height: FH, thickness: 0.12, material: mb,
    openings: [{ start: 1.5, end: 2.5, top: 2.2 }]  // mcp:d_koup
  });
  addDoor(g, { axis: 'z', x: 3.5, z: 0, at: 2, width: 1 });  // mcp:d_koup

  // mcp:d_loz_koup (1.5,4) — zeď mezi koupelnou a ložnicí, en-suite dveře
  wallWithOpenings(g, { axis: 'x', x: 0, z: 4, length: 3.5, height: FH, thickness: 0.12, material: mb,
    openings: [{ start: 1.5, end: 2.5, top: 2.2 }]  // mcp:d_loz_koup
  });
  addDoor(g, { axis: 'x', x: 0, z: 4, at: 2, width: 1 });  // mcp:d_loz_koup

  // mcp:loznice (0,4.5) 3.5×5 — východní zeď, mcp:d_loz (3.5,6) dveře z chodby
  wallWithOpenings(g, { axis: 'z', x: 3.5, z: 4.5, length: 5, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 1.5, end: 2.5, top: 2.2 }]  // mcp:d_loz at z=6 → relative 6-4.5=1.5
  });
  addDoor(g, { axis: 'z', x: 3.5, z: 4.5, at: 2, width: 1 });  // mcp:d_loz

  // mcp:d_obyvak (5.3,5.5) — zeď ložnice/chodba → obývák
  wallWithOpenings(g, { axis: 'x', x: 0, z: 9.5, length: 5.5, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 4, end: 5.5 }]  // mcp:d_obyvak — průchod do obýváku
  });

  // WC zdi (5.5, 0) 1.8×2
  wallWithOpenings(g, { axis: 'z', x: 5.5, z: 0, length: 2, height: FH, thickness: 0.1, material: mb,
    openings: [{ start: 1.5, end: 2 }] // dveře dole (od chodby)
  });
  addDoor(g, { axis: 'z', x: 5.5, z: 0, at: 1.75, width: 0.5, doorHeight: 2 });
  wallWithOpenings(g, { axis: 'z', x: 7.3, z: 0, length: 2, height: FH, thickness: 0.1, material: mb });
  wallWithOpenings(g, { axis: 'x', x: 5.5, z: 2, length: 1.8, height: FH, thickness: 0.1, material: mb });

  // Šatna (7.5, 0) 2×2
  wallWithOpenings(g, { axis: 'z', x: 7.5, z: 0, length: 2, height: FH, thickness: 0.1, material: mi,
    openings: [{ start: 1.5, end: 2 }]
  });
  addDoor(g, { axis: 'z', x: 7.5, z: 0, at: 1.75, width: 0.5, doorHeight: 2 });
  wallWithOpenings(g, { axis: 'z', x: 9.5, z: 0, length: 2, height: FH, thickness: 0.1, material: mi });
  wallWithOpenings(g, { axis: 'x', x: 7.5, z: 2, length: 2, height: FH, thickness: 0.1, material: mi });

  // Spíž (5.5, 2.5) 1.5×1.5
  wallWithOpenings(g, { axis: 'z', x: 5.5, z: 2.5, length: 1.5, height: FH, thickness: 0.1, material: mi,
    openings: [{ start: 0, end: 0.8, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 5.5, z: 2.5, at: 0.4, width: 0.8 });
  wallWithOpenings(g, { axis: 'z', x: 7, z: 2.5, length: 1.5, height: FH, thickness: 0.1, material: mi });
  wallWithOpenings(g, { axis: 'x', x: 5.5, z: 4, length: 1.5, height: FH, thickness: 0.1, material: mi });

  // Tech (9.8, 0) 1.5×2
  wallWithOpenings(g, { axis: 'z', x: 9.8, z: 0, length: 2, height: FH, thickness: 0.1, material: mi,
    openings: [{ start: 1, end: 1.8, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 9.8, z: 0, at: 1.4, width: 0.8 });
  wallWithOpenings(g, { axis: 'z', x: 11.3, z: 0, length: 2, height: FH, thickness: 0.1, material: mi });
  wallWithOpenings(g, { axis: 'x', x: 9.8, z: 2, length: 1.5, height: FH, thickness: 0.1, material: mi });

  // Dětský pokoj (11.5, 0) 4.5×4.5 — dveře z chodby na x=11.5, z=2..3
  wallWithOpenings(g, { axis: 'z', x: 11.5, z: 0, length: 4.5, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 2, end: 3, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 11.5, z: 0, at: 2.5, width: 1 });
  wallWithOpenings(g, { axis: 'x', x: 11.5, z: 4.5, length: 4.5, height: FH, thickness: 0.12, material: mi });

  // Pracovna (11.5, 5) 4.5×3.5 — dveře na x=11.5, z=6.5..7.5
  wallWithOpenings(g, { axis: 'z', x: 11.5, z: 5, length: 3.5, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 1.5, end: 2.5, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 11.5, z: 5, at: 2, width: 1 });

  // Zeď mezi dětským a pracovnou (z=4.5..5 je mezera — ale dětský končí na 4.5, pracovna začíná 5)
  // Zeď chodba/obývák na východě (x=11.5, z=8.5..12)
  wallWithOpenings(g, { axis: 'z', x: 11.5, z: 8.5, length: 3.5, height: FH, thickness: 0.12, material: mi });

  // ═══ NÁBYTEK ═══
  furnishLoznice(g);
  furnishKoupelna(g);
  furnishObyvak(g);
  furnishDetsky(g);
  furnishPracovna(g);
  furnishWC(g);

  scene.add(g);
}

function furnishLoznice(g) {
  // mcp:loznice (0, 4.5) 3.5×5
  const lx = 0, lz = 4.5;
  // mcp:loznice/postel (0.8, 0.5) 2×2.2
  g.add(p(box(2, 0.35, 2.2, bed), lx + 0.8 + 1, 0.275, lz + 0.5 + 1.1));
  g.add(p(box(1.9, 0.15, 2.1, sheet), lx + 0.8 + 0.95, 0.5, lz + 0.5 + 1.05));
  g.add(p(box(2, 0.5, 0.08, bed), lx + 1.8, 0.45, lz + 0.3));
  // mcp:loznice/stolek_l (0.2, 0.8) + stolek_r (2.9, 0.8)
  g.add(p(box(0.45, 0.4, 0.4, wood), lx + 0.2 + 0.225, 0.2, lz + 0.8 + 0.2));
  g.add(p(box(0.45, 0.4, 0.4, wood), lx + 2.9 + 0.225, 0.2, lz + 0.8 + 0.2));
  // mcp:loznice/komoda (0.3, 3.5) 1.2×0.5
  g.add(p(box(1.2, 0.7, 0.5, wood), lx + 0.3 + 0.6, 0.35, lz + 3.5 + 0.25));
}

function furnishKoupelna(g) {
  // mcp:koupelna (0, 0) 3.5×4
  const bx = 0, bz = 0;
  // mcp:koupelna/vana (0.2, 0.2) 0.75×1.7
  g.add(p(box(0.75, 0.5, 1.7, white), bx + 0.2 + 0.375, 0.25, bz + 0.2 + 0.85));
  // mcp:koupelna/sprcha (0.2, 2.2) 1×1
  g.add(p(box(1, 0.06, 1, mfb), bx + 0.2 + 0.5, 0.03, bz + 2.2 + 0.5));
  const glass = plane(1, 2.1, shower);
  glass.position.set(bx + 0.7, 1.05, bz + 2.2);
  g.add(glass);
  // mcp:koupelna/umyv1 (2, 0.3) + umyv2 (2.7, 0.3)
  for (const ux of [2, 2.7]) {
    g.add(p(box(0.6, 0.06, 0.45, white), bx + ux + 0.3, 0.8, bz + 0.3 + 0.225));
    g.add(p(box(0.1, 0.7, 0.1, white), bx + ux + 0.3, 0.35, bz + 0.3 + 0.225));
  }
  // Zrcadlo nad umyvadly
  const mirr = plane(1.3, 0.8, mirror);
  mirr.position.set(bx + 2.35, 1.4, bz + 0.06);
  g.add(mirr);
  // mcp:koupelna/zachod (2.5, 2.2) 0.4×0.5
  g.add(p(box(0.4, 0.35, 0.5, white), bx + 2.5 + 0.2, 0.175, bz + 2.2 + 0.25));
  g.add(p(box(0.35, 0.25, 0.18, white), bx + 2.7, 0.32, bz + 2.75));
}

function furnishObyvak(g) {
  const ox = 5.5, oz = 4.5;
  // Linka (0.3, 0.3) 3.5×0.6
  g.add(p(box(3.5, 0.9, 0.6, counter), ox + 0.3 + 1.75, 0.45, oz + 0.3 + 0.3));
  // Stove
  g.add(p(box(0.6, 0.03, 0.55, counterDk), ox + 1, 0.92, oz + 0.6));
  // Ostrůvek (0.5, 1.8) 2.5×0.8
  g.add(p(box(2.5, 0.9, 0.8, counterDk), ox + 0.5 + 1.25, 0.45, oz + 1.8 + 0.4));
  // Lednice (4.2, 0.3) 0.7×0.65
  g.add(p(box(0.7, 1.9, 0.65, fridge), ox + 4.2 + 0.35, 0.95, oz + 0.3 + 0.325));
  // Jídelní stůl (1.5, 3.5) 2×1.2
  g.add(p(box(2, 0.04, 1.2, wood), ox + 1.5 + 1, 0.74, oz + 3.5 + 0.6));
  for (const dx of [-0.8, 0.8]) {
    g.add(p(box(0.04, 0.72, 0.8, metal), ox + 2.5 + dx, 0.36, oz + 4.1));
  }
  // Židle kolem stolu
  for (const [dx, dz] of [[-1.3, 0], [1.3, 0], [0, -0.9], [0, 0.9]]) {
    g.add(p(box(0.42, 0.04, 0.42, metal), ox + 2.5 + dx, 0.45, oz + 4.1 + dz));
  }
  // Pohovka (3.5, 5) 2.2×1
  g.add(p(box(2.2, 0.4, 1, sofa), ox + 3.5 + 1.1, 0.35, oz + 5 + 0.5));
  g.add(p(box(2.2, 0.3, 0.12, sofa), ox + 4.6, 0.55, oz + 5));
  // Konferenční stolek (3.8, 6.3) 1.2×0.6
  g.add(p(box(1.2, 0.03, 0.6, wood), ox + 3.8 + 0.6, 0.4, oz + 6.3 + 0.3));
  for (const [dx, dz] of [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]]) {
    g.add(p(box(0.03, 0.38, 0.03, metal), ox + 4.4 + dx, 0.19, oz + 6.6 + dz));
  }
  // TV (3.5, 7.2) — na zdi
  g.add(p(box(1.5, 0.85, 0.04, tvMat), ox + 3.5 + 0.75, 1.4, oz + 7.3));
}

function furnishDetsky(g) {
  const dx = 11.5, dz = 0;
  // Postel (0.5, 0.5) 1×2
  g.add(p(box(1, 0.35, 2, bed), dx + 0.5 + 0.5, 0.275, dz + 0.5 + 1));
  g.add(p(box(0.9, 0.12, 1.9, sheet), dx + 1, 0.47, dz + 1.45));
  // Psací stůl (2.5, 0.3) 1.5×0.7
  g.add(p(box(1.5, 0.04, 0.7, wood), dx + 2.5 + 0.75, 0.72, dz + 0.3 + 0.35));
  for (const lx of [-0.6, 0.6]) {
    g.add(p(box(0.04, 0.7, 0.04, metal), dx + 3.25 + lx, 0.35, dz + 0.65));
  }
  // Monitor
  g.add(p(box(0.5, 0.3, 0.03, tvMat), dx + 3.25, 1.0, dz + 0.4));
  // Skříň (3.5, 2.5) 0.6×1.5
  g.add(p(box(0.6, 2, 1.5, woodDk), dx + 3.5 + 0.3, 1, dz + 2.5 + 0.75));
  // Police (0.3, 3) 1.5×0.4
  g.add(p(box(1.5, 0.04, 0.4, wood), dx + 0.3 + 0.75, 1.2, dz + 3 + 0.2));
  g.add(p(box(1.5, 0.04, 0.4, wood), dx + 0.3 + 0.75, 1.7, dz + 3 + 0.2));
}

function furnishPracovna(g) {
  const px = 11.5, pz = 5;
  // Pracovní stůl (0.5, 0.3) 2×0.8
  g.add(p(box(2, 0.04, 0.8, wood), px + 0.5 + 1, 0.72, pz + 0.3 + 0.4));
  for (const lx of [-0.8, 0.8]) {
    g.add(p(box(0.04, 0.7, 0.6, metal), px + 1.5 + lx, 0.35, pz + 0.7));
  }
  // Monitor
  g.add(p(box(0.6, 0.4, 0.03, tvMat), px + 1.5, 1.1, pz + 0.4));
  // Knihovna (3.5, 0.3) 0.5×3
  g.add(p(box(0.5, 2, 3, woodDk), px + 3.5 + 0.25, 1, pz + 0.3 + 1.5));
  for (let i = 1; i <= 4; i++) {
    g.add(p(box(0.48, 0.03, 2.9, wood), px + 3.75, i * 0.4, pz + 1.8));
  }
  // Rozkladací pohovka (0.5, 2) 2×1
  g.add(p(box(2, 0.4, 1, sofa), px + 0.5 + 1, 0.35, pz + 2 + 0.5));
  g.add(p(box(2, 0.3, 0.12, sofa), px + 1.5, 0.55, pz + 2));
}

function furnishWC(g) {
  // WC (5.5, 0) 1.8×2
  g.add(p(box(0.38, 0.35, 0.5, white), 6.2, 0.175, 1.2));
  g.add(p(box(0.33, 0.25, 0.18, white), 6.2, 0.32, 1.5));
  // Malé umyvadlo
  g.add(p(box(0.4, 0.06, 0.3, white), 6.5, 0.7, 0.3));
}
