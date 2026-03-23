import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof, addFloorOverlay,
  MAT, box, plane
} from './building-utils.js';

// Podkrovní loft — 18×12m, MCP pos (80,85) → 3D (-20, -15)
// L-shaped obývák, zkosená ložnice, koupelna s výklenkem
const DS = THREE.FrontSide;
const FH = 3.0;

const mw = new THREE.MeshLambertMaterial({ color: 0xf0ece4, side: DS });
const mi = new THREE.MeshLambertMaterial({ color: 0xf5f2ec, side: DS });
const mb = new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS });
const mfl = new THREE.MeshLambertMaterial({ color: 0xc4a06a, side: DS });
const mfb = new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS });
const mfh = new THREE.MeshLambertMaterial({ color: 0xa09080, side: DS });
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
const carpet = new THREE.MeshLambertMaterial({ color: 0x505058, side: DS });
const stove = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createLoft(scene, cx = -20, cz = -15) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  addFloor(g, 0, 0, 18, 12, 0, mfl);
  addCeiling(g, 0, 0, 18, 12, FH, 0, mc);

  // ═══ OUTER WALLS ═══

  // mcp: North (z=0) — obývák kuchyně (0..6), chodba vstup (6.5..7.5), WC, tech, ložnice (12.5..18)
  wallWithOpenings(g, { axis: 'x', x: 0, z: 0, length: 18, height: FH, material: mw,
    openings: [
      { start: 6.5, end: 7.5, top: 2.2 },              // mcp:d_vstup
      { start: 14, end: 16.5, bottom: 0.5, top: 2.5 },  // mcp:loznice/w_north
    ]
  });
  addDoor(g, { axis: 'x', x: 0, z: 0, at: 7, width: 1, material: MAT.doorEntrance });
  addWindow(g, { axis: 'x', x: 0, z: 0, at: 15.25, width: 2.5, sillHeight: 0.5, winHeight: 2 });

  // mcp: South (z=12) — obývák panoramy
  wallWithOpenings(g, { axis: 'x', x: 0, z: 12, length: 18, height: FH, material: mw,
    openings: [
      { start: 4, end: 9, bottom: 0.2, top: 2.8 },      // mcp:obyvak/w_south1
      { start: 11, end: 16, bottom: 0.2, top: 2.8 },     // mcp:obyvak/w_south2
    ]
  });
  addWindow(g, { axis: 'x', x: 0, z: 12, at: 6.5, width: 5, sillHeight: 0.2, winHeight: 2.6 });
  addWindow(g, { axis: 'x', x: 0, z: 12, at: 13.5, width: 5, sillHeight: 0.2, winHeight: 2.6 });

  // mcp: West (x=0) — obývák/kuchyně okna
  wallWithOpenings(g, { axis: 'z', x: 0, z: 0, length: 12, height: FH, material: mw,
    openings: [
      { start: 1.5, end: 3, bottom: 0.9, top: 2.1 },    // mcp:kuchyn/w_west
      { start: 7, end: 9.5, bottom: 0.3, top: 2.7 },    // mcp:obyvak/w_west2
    ]
  });
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 2.25, width: 1.5, sillHeight: 0.9, winHeight: 1.2 });
  addWindow(g, { axis: 'z', x: 0, z: 0, at: 8.25, width: 2.5, sillHeight: 0.3, winHeight: 2.4 });

  // mcp: East (x=18) — ložnice + obývák okna
  wallWithOpenings(g, { axis: 'z', x: 18, z: 0, length: 12, height: FH, material: mw,
    openings: [
      { start: 1, end: 3, bottom: 0.5, top: 2.5 },      // mcp:loznice/w_east
      { start: 7, end: 9.5, bottom: 0.3, top: 2.7 },    // mcp:obyvak/w_east
    ]
  });
  addWindow(g, { axis: 'z', x: 18, z: 0, at: 2, width: 2, sillHeight: 0.5, winHeight: 2 });
  addWindow(g, { axis: 'z', x: 18, z: 0, at: 8.25, width: 2.5, sillHeight: 0.3, winHeight: 2.4 });

  // ═══ INNER WALLS ═══

  // mcp:chodba (6,0) 2×5 — west wall
  wallWithOpenings(g, { axis: 'z', x: 6, z: 0, length: 5, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 2.5, end: 4.5 }]  // mcp:d_obyvak — průchod
  });

  // mcp:chodba east wall (x=8) — with doors to WC, koupelna, ložnice
  wallWithOpenings(g, { axis: 'z', x: 8, z: 0, length: 5, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 1, end: 1.8, top: 2.2 }]  // mcp:d_wc
  });
  addDoor(g, { axis: 'z', x: 8, z: 0, at: 1.4, width: 0.8 });

  // mcp:wc (8.5,0) 2×2.5 — east wall + south wall
  wallWithOpenings(g, { axis: 'z', x: 10.5, z: 0, length: 2.5, height: FH, thickness: 0.1, material: mb });
  wallWithOpenings(g, { axis: 'x', x: 8.5, z: 2.5, length: 2, height: FH, thickness: 0.1, material: mb });

  // mcp:tech (11,0) 1.5×2.5
  wallWithOpenings(g, { axis: 'z', x: 11, z: 0, length: 2.5, height: FH, thickness: 0.1, material: mi,
    openings: [{ start: 1, end: 1.8, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 11, z: 0, at: 1.4, width: 0.8 });
  wallWithOpenings(g, { axis: 'z', x: 12.5, z: 0, length: 2.5, height: FH, thickness: 0.1, material: mi });
  wallWithOpenings(g, { axis: 'x', x: 11, z: 2.5, length: 1.5, height: FH, thickness: 0.1, material: mi });

  // mcp:koupelna (8.5,2.5) shape — south wall segments + west wall
  // Koupelna south wall at z=4 (short part, x=8.5..11) and z=5 (výklenek x=11..12.5)
  wallWithOpenings(g, { axis: 'x', x: 8.5, z: 4, length: 2.5, height: FH, thickness: 0.12, material: mb });
  wallWithOpenings(g, { axis: 'z', x: 11, z: 4, length: 1, height: FH, thickness: 0.12, material: mb });
  wallWithOpenings(g, { axis: 'x', x: 11, z: 5, length: 1.5, height: FH, thickness: 0.12, material: mb });
  // Koupelna west wall (x=8.5) — door from chodba mcp:d_koupelna (8.5, 3)
  wallWithOpenings(g, { axis: 'z', x: 8.5, z: 2.5, length: 2.5, height: FH, thickness: 0.12, material: mb,
    openings: [{ start: 0.5, end: 1.5, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 8.5, z: 2.5, at: 1, width: 1 });

  // mcp:loznice (12.5,0) zkosená shape — west wall (x=12.5) s dveřmi
  wallWithOpenings(g, { axis: 'z', x: 12.5, z: 0, length: 5, height: FH, thickness: 0.12, material: mi,
    openings: [{ start: 2.5, end: 3.5, top: 2.2 }]
  });
  addDoor(g, { axis: 'z', x: 12.5, z: 0, at: 3, width: 1 });
  // Ložnice south wall — zkosená stěna od (12.5, 3.5) do (15.5, 5)
  // Approximujeme dvěma segmenty
  wallWithOpenings(g, { axis: 'x', x: 15.5, z: 5, length: 2.5, height: FH, thickness: 0.12, material: mi });
  // Šikmá zeď — box natočený
  const diagLen = Math.sqrt(3*3 + 1.5*1.5);
  const diagAngle = Math.atan2(3, 1.5);
  const diagWall = box(0.12, FH, diagLen, mi);
  diagWall.rotation.y = diagAngle;
  diagWall.position.set(12.5 + 1.5, FH / 2, 3.5 + 0.75);
  g.add(diagWall);

  // mcp:obyvak top wall at z=5 (east part, x=6..18) — with barový pult area
  wallWithOpenings(g, { axis: 'x', x: 8, z: 5, length: 4.5, height: FH, thickness: 0.12, material: mi });

  // Floor overlays
  addFloorOverlay(g, 6, 0, 2, 5, 0, mfh);        // mcp:chodba
  addFloorOverlay(g, 8.5, 0, 2, 2.5, 0, mfb);    // mcp:wc
  addFloorOverlay(g, 8.5, 2.5, 4, 2.5, 0, mfb);  // mcp:koupelna

  // ═══ FURNITURE ═══
  furnishKuchyn(g);
  furnishObyvak(g);
  furnishLoznice(g);
  furnishKoupelna(g);
  furnishWC(g);

  scene.add(g);
}

function furnishKuchyn(g) {
  // mcp:obyvak/kuchyn (0,0) 5.5×5 — U-linka shape
  const rx = 0, rz = 0;

  // U-linka jako 3 segmenty spodních skříněk (0.9m výška)
  // Severní segment (zadní): x=0..5.5, hloubka 0.6m
  g.add(p(box(5.5, 0.9, 0.6, counter), rx + 2.75, 0.45, rz + 0.3));
  // Západní segment (levý): z=0.6..5, hloubka 0.6m
  g.add(p(box(0.6, 0.9, 4.4, counter), rx + 0.3, 0.45, rz + 2.8));
  // Východní segment (pravý): z=0..3, hloubka 0.6m
  g.add(p(box(0.6, 0.9, 3, counter), rx + 5.2, 0.45, rz + 1.5));

  // Pracovní deska (tmavá, na vrchu)
  g.add(p(box(5.5, 0.04, 0.6, counterDk), rx + 2.75, 0.92, rz + 0.3));
  g.add(p(box(0.6, 0.04, 4.4, counterDk), rx + 0.3, 0.92, rz + 2.8));
  g.add(p(box(0.6, 0.04, 3, counterDk), rx + 5.2, 0.92, rz + 1.5));

  // mcp:kuchyn/drez (1.5, 0.05) 0.9×0.5
  g.add(p(box(0.9, 0.08, 0.5, white), rx + 1.5 + 0.45, 0.94, rz + 0.05 + 0.25));

  // mcp:kuchyn/mycka (2.5, 0.05) 0.6×0.55
  g.add(p(box(0.6, 0.7, 0.55, white), rx + 2.5 + 0.3, 0.35, rz + 0.05 + 0.275));

  // mcp:kuchyn/sporak (0.05, 1.5) 0.5×0.6
  g.add(p(box(0.5, 0.04, 0.6, stove), rx + 0.05 + 0.25, 0.94, rz + 1.5 + 0.3));

  // mcp:kuchyn/trouba (0.05, 2.2) 0.5×0.6
  g.add(p(box(0.5, 0.5, 0.6, counterDk), rx + 0.05 + 0.25, 0.45, rz + 2.2 + 0.3));

  // mcp:kuchyn/digestor (0.05, 1.5) — above sporák
  g.add(p(box(0.5, 0.15, 0.6, metal), rx + 0.05 + 0.25, 1.7, rz + 1.5 + 0.3));
  // Digestor hood
  g.add(p(box(0.4, 0.3, 0.5, metal), rx + 0.3, 1.85, rz + 1.8));

  // mcp:kuchyn/lednice (4.85, 2.4) 0.6×0.7
  g.add(p(box(0.6, 1.9, 0.7, fridge), rx + 4.85 + 0.3, 0.95, rz + 2.4 + 0.35));

  // Horní skříňky — mcp:kuchyn/horni_s1 (0.1, 0.05) + horni_s2 (3.3, 0.05) + horni_z (0.05, 3.2)
  g.add(p(box(1.2, 0.6, 0.35, wood), rx + 0.1 + 0.6, 1.7, rz + 0.05 + 0.175));
  g.add(p(box(1.5, 0.6, 0.35, wood), rx + 3.3 + 0.75, 1.7, rz + 0.05 + 0.175));
  g.add(p(box(0.35, 0.6, 1.5, wood), rx + 0.05 + 0.175, 1.7, rz + 3.2 + 0.75));
}

function furnishObyvak(g) {
  // mcp:obyvak (0,7) — jižní část L-shape (celá šířka 18m, výška 5m z y=7..12)
  // Ale kuchyně je v (0,0)...(5.5,5), barový pult odděluje

  // mcp:obyvak/jid_stul (1.5, 3.5) 1.5×1.5 — kulatý stůl
  // Absolutně: (1.5, 3.5) v obýváku = (1.5, 3.5) v bytě (obývák origin = 0,0 ale L-shape)
  // Jídelní stůl je v kuchyňské zóně, ale patří do obýváku...
  // V 3D: stůl je na (1.5+0.75, y, 3.5+0.75) = (2.25, y, 4.25)
  const jx = 2.25, jz = 4.25;
  g.add(p(box(1.5, 0.04, 1.5, wood), jx, 0.74, jz));
  // Noha kulatého stolu
  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.15, 0.72, 8), metal);
  g.add(p(tableLeg, jx, 0.36, jz));

  // mcp:obyvak/barovy_pult (10, 5.5) 3×0.5
  g.add(p(box(3, 1.1, 0.5, counterDk), 10 + 1.5, 0.55, 5.5 + 0.25));

  // mcp:obyvak/pohovka (2, 7) 3×1 + pohovka2 (1, 8) 1×2 — L-shaped rohová
  g.add(p(box(3, 0.4, 1, sofa), 2 + 1.5, 0.35, 7 + 0.5));
  g.add(p(box(3, 0.3, 0.12, sofa), 3.5, 0.55, 7)); // opěradlo
  g.add(p(box(1, 0.4, 2, sofa), 1 + 0.5, 0.35, 8 + 1));
  g.add(p(box(0.12, 0.3, 2, sofa), 1, 0.55, 9)); // opěradlo bok

  // mcp:obyvak/stolek (3, 9) 1.2×0.7
  g.add(p(box(1.2, 0.03, 0.7, wood), 3 + 0.6, 0.4, 9 + 0.35));
  for (const [dx, dz] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) {
    g.add(p(box(0.03, 0.38, 0.03, metal), 3.6 + dx, 0.19, 9.35 + dz));
  }

  // mcp:obyvak/tv (8, 6) 2×0.15 — wall mounted
  g.add(p(box(2, 1, 0.04, tvMat), 8 + 1, 1.5, 5.1));

  // mcp:obyvak/koberec (1.5, 7.5) 4×3.5
  const carpetMesh = plane(4, 3.5, carpet);
  carpetMesh.rotation.x = -Math.PI / 2;
  g.add(p(carpetMesh, 1.5 + 2, 0.16, 7.5 + 1.75));

  // mcp:obyvak/knihovna (14, 5.5) 0.4×3
  g.add(p(box(0.4, 2.2, 3, woodDk), 14 + 0.2, 1.1, 5.5 + 1.5));
  for (let i = 1; i <= 5; i++) {
    g.add(p(box(0.38, 0.03, 2.9, wood), 14.2, i * 0.4, 7));
  }
}

function furnishLoznice(g) {
  // mcp:loznice (12.5, 0) 5.5×5 — zkosená
  const rx = 12.5, rz = 0;
  // mcp:loznice/postel (1.5, 0.8) 2×2.2
  g.add(p(box(2, 0.35, 2.2, bed), rx + 1.5 + 1, 0.275, rz + 0.8 + 1.1));
  g.add(p(box(1.9, 0.15, 2.1, sheet), rx + 2.5, 0.5, rz + 1.85));
  g.add(p(box(2, 0.5, 0.08, bed), rx + 2.5, 0.45, rz + 0.2)); // čelo
  // mcp:loznice/stolek_l (0.5, 1) + stolek_r (4, 1)
  g.add(p(box(0.45, 0.4, 0.4, wood), rx + 0.5 + 0.225, 0.2, rz + 1 + 0.2));
  g.add(p(box(0.45, 0.4, 0.4, wood), rx + 4 + 0.225, 0.2, rz + 1 + 0.2));
  // mcp:loznice/komoda (0.3, 3.5) 1.5×0.5
  g.add(p(box(1.5, 0.7, 0.5, wood), rx + 0.3 + 0.75, 0.35, rz + 3.5 + 0.25));
  // mcp:loznice/kreslo (4.5, 3) 0.8×0.8 — u východního okna
  g.add(p(box(0.8, 0.4, 0.8, sofa), rx + 4.5 + 0.4, 0.35, rz + 3 + 0.4));
  g.add(p(box(0.8, 0.3, 0.12, sofa), rx + 4.9, 0.55, rz + 3));
}

function furnishKoupelna(g) {
  // mcp:koupelna (8.5, 2.5) shape s výklenkem
  const rx = 8.5, rz = 2.5;
  // mcp:koupelna/vana (2.5, 0) 0.7×1.5 — ve výklenku
  g.add(p(box(0.7, 0.5, 1.5, white), rx + 2.5 + 0.35, 0.25, rz + 0 + 0.75));
  // mcp:koupelna/umyv (0.3, 0.2) 1.2×0.5
  g.add(p(box(1.2, 0.06, 0.5, white), rx + 0.3 + 0.6, 0.8, rz + 0.2 + 0.25));
  g.add(p(box(0.08, 0.7, 0.08, white), rx + 0.6, 0.35, rz + 0.45));
  g.add(p(box(0.08, 0.7, 0.08, white), rx + 1.2, 0.35, rz + 0.45));
  // Zrcadlo
  const mirr = plane(1.2, 0.8, mirror);
  mirr.position.set(rx + 0.9, 1.4, rz + 2.5 + 0.06);
  g.add(mirr);
  // mcp:koupelna/sprcha (0.2, 0.8) 1×0.8
  g.add(p(box(1, 0.06, 0.8, mfb), rx + 0.2 + 0.5, 0.03, rz + 0.8 + 0.4));
  const glass = plane(1, 2.1, shower);
  glass.position.set(rx + 0.7, 1.05, rz + 0.8);
  g.add(glass);
  // mcp:koupelna/zachod (2, 0.8) 0.4×0.5
  g.add(p(box(0.4, 0.35, 0.5, white), rx + 2 + 0.2, 0.175, rz + 0.8 + 0.25));
  g.add(p(box(0.35, 0.25, 0.18, white), rx + 2.2, 0.32, rz + 1.1));
}

function furnishWC(g) {
  // mcp:wc (8.5, 0) 2×2.5
  const rx = 8.5, rz = 0;
  g.add(p(box(0.38, 0.35, 0.5, white), rx + 1, 0.175, rz + 1.5));
  g.add(p(box(0.33, 0.25, 0.18, white), rx + 1, 0.32, rz + 1.8));
  g.add(p(box(0.35, 0.06, 0.3, white), rx + 1.5, 0.65, rz + 0.3));
}
