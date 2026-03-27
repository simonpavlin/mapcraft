import * as THREE from 'three';
import { box, boxWithOpenings } from '../../building-utils.js';

// ════════════════════════════════════════════════
// MATERIALS
// ════════════════════════════════════════════════

const DS = THREE.FrontSide;

const lamino = new THREE.MeshLambertMaterial({ color: 0xc4a06a, side: DS });     // dub - korpus, police, přepážky
const laminoDark = new THREE.MeshLambertMaterial({ color: 0xa08050, side: DS }); // tmavší dub - sokl, horní deska
const drawerFront = new THREE.MeshLambertMaterial({ color: 0xb8956a, side: DS });// čelo zásuvky
const drawerInside = new THREE.MeshLambertMaterial({ color: 0xd8c8a8, side: DS }); // vnitřek zásuvky
const chrome = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: DS });     // tyče, úchytky
const mirror = new THREE.MeshLambertMaterial({ color: 0xc8dde8, opacity: 0.7, transparent: true, side: DS }); // zrcadlové dveře
const rail = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });       // kolejnice

// ════════════════════════════════════════════════
// HELPER — position a mesh
// ════════════════════════════════════════════════

function p(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

// ════════════════════════════════════════════════
// WARDROBE — 2.4m × 2.2m × 0.6m
// 3 sections with sliding doors
// ════════════════════════════════════════════════

export default function createWardrobe({ width = 2.4, height = 2.2, depth = 0.6 } = {}) {
  const g = new THREE.Group();

  // Base dimensions — model is built at these, then scaled to requested size
  const W = 2.4, H = 2.2, D = 0.6;
  const THICK = 0.018; // tloušťka desek

  // ── KORPUS ──

  // mcp:korpus/sokl (0, 0) 2.4×0.05
  g.add(p(box(W, 0.05, D, laminoDark), W / 2, 0.025, D / 2));

  // mcp:korpus/horni_deska (0, 2.18) 2.4×0.02
  g.add(p(box(W, THICK, D, laminoDark), W / 2, 2.18 + THICK / 2, D / 2));

  // Levá boční stěna
  g.add(p(box(THICK, H - 0.05, D, lamino), THICK / 2, 0.05 + (H - 0.05) / 2, D / 2));

  // Pravá boční stěna
  g.add(p(box(THICK, H - 0.05, D, lamino), W - THICK / 2, 0.05 + (H - 0.05) / 2, D / 2));

  // Zadní stěna (tenká)
  g.add(p(box(W, H, 0.005), W / 2, H / 2, 0.0025));

  // mcp:korpus/predelka_1 (0.78, 0.05) 0.02×2.13
  g.add(p(box(THICK, 2.13, D - 0.02, lamino), 0.78 + THICK / 2, 0.05 + 2.13 / 2, D / 2));

  // mcp:korpus/predelka_2 (1.58, 0.05) 0.02×2.13
  g.add(p(box(THICK, 2.13, D - 0.02, lamino), 1.58 + THICK / 2, 0.05 + 2.13 / 2, D / 2));

  // ── SEKCE LEVÁ — police ──
  // mcp:sekce_leva (0.02, 0.05) 0.76×2.13
  const lx = 0.02, ly = 0.05;
  const shelfW = 0.76, shelfD = 0.55;

  const shelfYs = [0, 0.35, 0.7, 1.05, 1.4, 1.75];
  for (const sy of shelfYs) {
    // mcp:sekce_leva/p1..p6 (0, sy) 0.76×0.02
    g.add(p(box(shelfW, THICK, shelfD, lamino),
      lx + shelfW / 2, ly + sy + THICK / 2, D / 2 + 0.02));
  }

  // ── SEKCE STŘEDNÍ — tyč + zásuvky ──
  // mcp:sekce_stred (0.82, 0.05) 0.76×2.13
  const sx = 0.82, sy0 = 0.05;

  // mcp:sekce_stred/p_nad_tyci (0, 2) 0.76×0.02
  g.add(p(box(shelfW, THICK, shelfD, lamino),
    sx + shelfW / 2, sy0 + 2 + THICK / 2, D / 2 + 0.02));

  // mcp:sekce_stred/tyc_hlavni (0, 1.65) 0.76×0.03 — chrom tyč
  const rodDiam = 0.025;
  const rodGeom = new THREE.CylinderGeometry(rodDiam / 2, rodDiam / 2, shelfW, 8);
  rodGeom.rotateZ(Math.PI / 2);
  const rod1 = new THREE.Mesh(rodGeom, chrome);
  rod1.position.set(sx + shelfW / 2, sy0 + 1.65 + rodDiam / 2, D / 2);
  g.add(rod1);

  // Držáky tyče (2× chromové konzoly)
  for (const dx of [0.03, shelfW - 0.03]) {
    g.add(p(box(0.03, 0.04, 0.03, chrome),
      sx + dx, sy0 + 1.65 + rodDiam / 2, D / 2));
  }

  // mcp:sekce_stred/p_pod_tyci (0, 0.56) 0.76×0.02
  g.add(p(box(shelfW, THICK, shelfD, lamino),
    sx + shelfW / 2, sy0 + 0.56 + THICK / 2, D / 2 + 0.02));

  // mcp:sekce_stred/z1 (0, 0) 0.76×0.18
  // mcp:sekce_stred/z2 (0, 0.19) 0.76×0.18
  // mcp:sekce_stred/z3 (0, 0.38) 0.76×0.18
  const drawerYs = [0, 0.19, 0.38];
  const drawerH = 0.17, drawerGap = 0.01;
  for (const dy of drawerYs) {
    const dGroup = new THREE.Group();
    const cy = sy0 + dy + drawerH / 2;

    // Čelo zásuvky
    dGroup.add(p(box(shelfW - 0.004, drawerH, THICK, drawerFront),
      sx + shelfW / 2, cy, D - THICK / 2 + 0.01));

    // Tělo zásuvky (box)
    dGroup.add(p(box(shelfW - 0.02, drawerH - 0.02, 0.45, drawerInside),
      sx + shelfW / 2, cy, D / 2 - 0.02));

    // Úchytka (chromový proužek)
    dGroup.add(p(box(0.12, 0.015, 0.02, chrome),
      sx + shelfW / 2, cy, D + 0.01));

    g.add(dGroup);
  }

  // ── SEKCE PRAVÁ — dvojitá tyč ──
  // mcp:sekce_prava (1.62, 0.05) 0.76×2.13
  const rx = 1.62, ry = 0.05;

  // mcp:sekce_prava/p_top (0, 2) 0.76×0.02
  g.add(p(box(shelfW, THICK, shelfD, lamino),
    rx + shelfW / 2, ry + 2 + THICK / 2, D / 2 + 0.02));

  // mcp:sekce_prava/tyc_horni (0, 1.65) 0.76×0.03
  const rod2Geom = new THREE.CylinderGeometry(rodDiam / 2, rodDiam / 2, shelfW, 8);
  rod2Geom.rotateZ(Math.PI / 2);
  const rod2 = new THREE.Mesh(rod2Geom, chrome);
  rod2.position.set(rx + shelfW / 2, ry + 1.65 + rodDiam / 2, D / 2);
  g.add(rod2);

  // Držáky horní tyče
  for (const dx of [0.03, shelfW - 0.03]) {
    g.add(p(box(0.03, 0.04, 0.03, chrome),
      rx + dx, ry + 1.65 + rodDiam / 2, D / 2));
  }

  // mcp:sekce_prava/p_mid (0, 0.73) 0.76×0.02
  g.add(p(box(shelfW, THICK, shelfD, lamino),
    rx + shelfW / 2, ry + 0.73 + THICK / 2, D / 2 + 0.02));

  // mcp:sekce_prava/tyc_dolni (0, 0.75) 0.76×0.03
  const rod3Geom = new THREE.CylinderGeometry(rodDiam / 2, rodDiam / 2, shelfW, 8);
  rod3Geom.rotateZ(Math.PI / 2);
  const rod3 = new THREE.Mesh(rod3Geom, chrome);
  rod3.position.set(rx + shelfW / 2, ry + 0.75 + rodDiam / 2, D / 2);
  g.add(rod3);

  // Držáky dolní tyče
  for (const dx of [0.03, shelfW - 0.03]) {
    g.add(p(box(0.03, 0.04, 0.03, chrome),
      rx + dx, ry + 0.75 + rodDiam / 2, D / 2));
  }

  // ── POSUVNÉ DVEŘE ──

  // mcp:korpus/kolejnice_horni (0, 2.15) 2.4×0.03
  g.add(p(box(W, 0.02, 0.04, rail), W / 2, 2.17, D + 0.02));

  // mcp:korpus/kolejnice_dolni (0, 0.02) 2.4×0.03
  g.add(p(box(W, 0.01, 0.04, rail), W / 2, 0.055, D + 0.02));

  // mcp:korpus/dvere_L (0, 0.05) 0.8×2.13 — zrcadlo
  g.add(p(box(0.8, 2.13, 0.01, mirror), 0.4, 0.05 + 2.13 / 2, D + 0.015));

  // mcp:korpus/dvere_S (0.8, 0.05) 0.8×2.13 — lamino dub
  g.add(p(box(0.8, 2.13, 0.01, lamino), 1.2, 0.05 + 2.13 / 2, D + 0.035));

  // mcp:korpus/dvere_P (1.6, 0.05) 0.8×2.13 — zrcadlo
  g.add(p(box(0.8, 2.13, 0.01, mirror), 2.0, 0.05 + 2.13 / 2, D + 0.015));

  // Rámečky dveří (hliníkové profily)
  const frameProf = 0.02;
  for (const doorX of [0, 0.8, 1.6]) {
    const dz = doorX === 0.8 ? D + 0.035 : D + 0.015;
    // Levý profil
    g.add(p(box(frameProf, 2.13, frameProf, rail),
      doorX + frameProf / 2, 0.05 + 2.13 / 2, dz));
    // Pravý profil
    g.add(p(box(frameProf, 2.13, frameProf, rail),
      doorX + 0.8 - frameProf / 2, 0.05 + 2.13 / 2, dz));
  }

  // ── VĚŠÁKY (dekorativní) ──

  // Pár věšáků na hlavní tyči (střední sekce)
  for (let i = 0; i < 4; i++) {
    const hx = sx + 0.1 + i * 0.18;
    const hangerGroup = createHanger();
    hangerGroup.position.set(hx, sy0 + 1.65 + rodDiam / 2, D / 2);
    g.add(hangerGroup);
  }

  // Věšáky na horní tyči (pravá sekce)
  for (let i = 0; i < 3; i++) {
    const hx = rx + 0.12 + i * 0.22;
    const hangerGroup = createHanger();
    hangerGroup.position.set(hx, ry + 1.65 + rodDiam / 2, D / 2);
    g.add(hangerGroup);
  }

  // Věšáky na dolní tyči (pravá sekce)
  for (let i = 0; i < 3; i++) {
    const hx = rx + 0.12 + i * 0.22;
    const hangerGroup = createHanger();
    hangerGroup.position.set(hx, ry + 0.75 + rodDiam / 2, D / 2);
    g.add(hangerGroup);
  }

  // Scale to requested dimensions
  g.scale.set(width / W, height / H, depth / D);

  return g;
}

// ════════════════════════════════════════════════
// HANGER — věšák z drátů
// ════════════════════════════════════════════════

function createHanger() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0x555555, side: THREE.FrontSide });

  // Háček
  g.add(p(box(0.005, 0.04, 0.005, mat), 0, 0.02, 0));

  // Ramena (trojúhelníkový tvar zjednodušený jako 2 šikmé tyčky)
  const armLen = 0.18;
  const armThick = 0.004;

  // Levé rameno
  const armL = box(armLen, armThick, armThick, mat);
  armL.rotation.z = -0.35;
  armL.position.set(-armLen / 2 * Math.cos(0.35), -0.03, 0);
  g.add(armL);

  // Pravé rameno
  const armR = box(armLen, armThick, armThick, mat);
  armR.rotation.z = 0.35;
  armR.position.set(armLen / 2 * Math.cos(0.35), -0.03, 0);
  g.add(armR);

  // Spodní příčka
  g.add(p(box(0.22, armThick, armThick, mat), 0, -0.06, 0));

  return g;
}
