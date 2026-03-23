import * as THREE from 'three';
import { addFloor, MAT, box, plane } from './building-utils.js';

const DS = THREE.DoubleSide;

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

const pr = (i) => ((i * 7 + 3) % 11) / 11;

// ════════════════════════════════════════════════
// MATERIALS
// ════════════════════════════════════════════════

// Ground
const grassMat = new THREE.MeshLambertMaterial({ color: 0x4a7c2e, side: DS });
const roadMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x999999, side: DS });
const cobbleMat = new THREE.MeshLambertMaterial({ color: 0xb0a080, side: DS });
const railMat = new THREE.MeshLambertMaterial({ color: 0x777777, side: DS });
const waterMat = new THREE.MeshLambertMaterial({ color: 0x3388bb, opacity: 0.7, transparent: true, side: DS });
const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x998877, side: DS });
const parkGreen = new THREE.MeshLambertMaterial({ color: 0x3a8a2e, side: DS });
const cemeteryMat = new THREE.MeshLambertMaterial({ color: 0x556655, side: DS });

// Buildings by type
const civicMat = new THREE.MeshLambertMaterial({ color: 0xe8d8a8, side: DS });
const churchMat = new THREE.MeshLambertMaterial({ color: 0xd8c8a0, side: DS });
const shopMat = new THREE.MeshLambertMaterial({ color: 0xd0b878, side: DS });
const residentialMat = new THREE.MeshLambertMaterial({ color: 0xc8b898, side: DS });
const apartmentMat = new THREE.MeshLambertMaterial({ color: 0xb8a888, side: DS });
const panelMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: DS });
const vilaMat = new THREE.MeshLambertMaterial({ color: 0xe0d8c0, side: DS });
const industrialMat = new THREE.MeshLambertMaterial({ color: 0x888877, side: DS });
const stationMat = new THREE.MeshLambertMaterial({ color: 0xc8a868, side: DS });

// Roofs
const roofRed = new THREE.MeshLambertMaterial({ color: 0xaa4422, side: DS });
const roofDark = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const roofGreen = new THREE.MeshLambertMaterial({ color: 0x446644, side: DS });

// Details
const treeTrunk = new THREE.MeshLambertMaterial({ color: 0x664422, side: DS });
const treeLeaf = new THREE.MeshLambertMaterial({ color: 0x2d6e1e, side: DS });
const fountainMat = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const waterJet = new THREE.MeshLambertMaterial({ color: 0x66bbee, emissive: 0x2288aa, emissiveIntensity: 0.2, transparent: true, opacity: 0.5, side: DS });

// Special
const redMat = new THREE.MeshLambertMaterial({ color: 0xcc3333, side: DS });
const whiteMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: DS });
const greenCross = new THREE.MeshLambertMaterial({ color: 0x228833, side: DS });
const canopyMat = new THREE.MeshLambertMaterial({ color: 0xdddddd, side: DS, transparent: true, opacity: 0.8 });
const gravelMat = new THREE.MeshLambertMaterial({ color: 0x998866, side: DS });
const headstone = new THREE.MeshLambertMaterial({ color: 0x889988, side: DS });
const playMat = new THREE.MeshLambertMaterial({ color: 0xdd6633, side: DS });
const yellowMat = new THREE.MeshLambertMaterial({ color: 0xeecc44, side: DS });
const blueMat = new THREE.MeshLambertMaterial({ color: 0x4488cc, side: DS });

// ════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════

function addBuilding(g, x, z, w, d, height, wallMat, roofMaterial, roofType = 'gable') {
  // Walls — solid box
  const walls = box(w, height, d, wallMat);
  walls.position.set(x + w / 2, height / 2, z + d / 2);
  g.add(walls);

  // Roof
  const roofH = Math.min(w, d) * 0.3;
  if (roofType === 'flat') {
    const roof = box(w + 0.3, 0.3, d + 0.3, roofMaterial);
    roof.position.set(x + w / 2, height + 0.15, z + d / 2);
    g.add(roof);
  } else if (roofType === 'gable') {
    // Triangular prism approximation: two angled planes
    const roofLen = Math.max(w, d);
    const roofSpan = Math.min(w, d);
    const slopeLen = Math.sqrt((roofSpan / 2) ** 2 + roofH ** 2);
    const angle = Math.atan2(roofH, roofSpan / 2);

    const isWide = w >= d; // ridge along the longer axis

    if (isWide) {
      // Ridge along X
      const p1 = box(w + 0.4, 0.15, slopeLen + 0.3, roofMaterial);
      p1.position.set(x + w / 2, height + roofH / 2, z + d / 4);
      p1.rotation.x = -angle;
      g.add(p1);

      const p2 = box(w + 0.4, 0.15, slopeLen + 0.3, roofMaterial);
      p2.position.set(x + w / 2, height + roofH / 2, z + d * 3 / 4);
      p2.rotation.x = angle;
      g.add(p2);
    } else {
      // Ridge along Z
      const p1 = box(slopeLen + 0.3, 0.15, d + 0.4, roofMaterial);
      p1.position.set(x + w / 4, height + roofH / 2, z + d / 2);
      p1.rotation.z = angle;
      g.add(p1);

      const p2 = box(slopeLen + 0.3, 0.15, d + 0.4, roofMaterial);
      p2.position.set(x + w * 3 / 4, height + roofH / 2, z + d / 2);
      p2.rotation.z = -angle;
      g.add(p2);
    }
  } else if (roofType === 'hip') {
    // Pyramid-ish: just a scaled box tilted concept — use a cone
    const radius = Math.max(w, d) / 2 * 1.1;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(radius, roofH, 4),
      roofMaterial
    );
    cone.position.set(x + w / 2, height + roofH / 2, z + d / 2);
    cone.rotation.y = Math.PI / 4;
    g.add(cone);
  }
}

function addTree(g, x, z, scale = 1) {
  const trunkH = 3 * scale;
  const trunkR = 0.2 * scale;
  const canopyR = 2 * scale;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR, trunkR, trunkH, 6),
    treeTrunk
  );
  trunk.position.set(x, trunkH / 2, z);
  g.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(canopyR, 8, 6),
    treeLeaf
  );
  canopy.position.set(x, trunkH + canopyR * 0.6, z);
  g.add(canopy);
}

function addHouse(g, x, z, w, d, wallMat = residentialMat, roofMaterial = roofRed) {
  addBuilding(g, x, z, w, d, 4, wallMat, roofMaterial, 'gable');
}

function addGround(g, x, z, w, d, mat, yOffset = 0.02) {
  const gnd = box(w, 0.1, d, mat);
  gnd.position.set(x + w / 2, yOffset, z + d / 2);
  g.add(gnd);
}

// ════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════

export function createMestecko(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // ── GRASS BASE ──────────────────────────────
  const base = box(200, 0.1, 150, grassMat);
  base.position.set(100, -0.05, 75);
  g.add(base);

  // ══════════════════════════════════════════════
  // ROADS
  // ══════════════════════════════════════════════

  // Hlavní třída (88,0) 8×150 — main north-south road
  addGround(g, 88, 0, 8, 150, roadMat, 0.05);

  // Náměstní ulice (40,58) 60×6 — east-west through square
  addGround(g, 40, 58, 60, 6, roadMat, 0.05);

  // Říční ulice (20,95) 160×6 — along river
  addGround(g, 20, 95, 160, 6, roadMat, 0.05);

  // Školní ulice (40,10) 6×85 — school road
  addGround(g, 40, 10, 6, 85, roadMat, 0.05);

  // Zahradní ulice (130,25) 6×75
  addGround(g, 130, 25, 6, 75, roadMat, 0.05);

  // Nádražní ulice (5,20) 35×6
  addGround(g, 5, 20, 35, 6, roadMat, 0.05);

  // ── RAILWAY (0,0) 200×6 ──
  addGround(g, 0, 0, 200, 6, gravelMat, 0.03);
  // Two rails
  const rail1 = box(200, 0.15, 0.15, railMat);
  rail1.position.set(100, 0.1, 2);
  g.add(rail1);
  const rail2 = box(200, 0.15, 0.15, railMat);
  rail2.position.set(100, 0.1, 4);
  g.add(rail2);
  // Sleepers
  for (let i = 0; i < 200; i += 1.5) {
    const sleeper = box(0.2, 0.08, 3, industrialMat);
    sleeper.position.set(i, 0.05, 3);
    g.add(sleeper);
  }

  // ── RIVER (0,110) 200×12 ──
  const river = box(200, 0.05, 12, waterMat);
  river.position.set(100, -0.1, 116);
  g.add(river);

  // ── Kamenný most (85,108) 10×16 ──
  const bridgeDeck = box(10, 0.5, 16, bridgeMat);
  bridgeDeck.position.set(90, 0.5, 116);
  g.add(bridgeDeck);
  // Railings
  const brail1 = box(0.3, 1.2, 16, bridgeMat);
  brail1.position.set(85.5, 1.1, 116);
  g.add(brail1);
  const brail2 = box(0.3, 1.2, 16, bridgeMat);
  brail2.position.set(94.5, 1.1, 116);
  g.add(brail2);
  // Arch underneath
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 10, 12, 1, false, 0, Math.PI),
    bridgeMat
  );
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  arch.position.set(90, -1, 116);
  g.add(arch);

  // ── Lávka (155,109) 4×14 — footbridge ──
  const footbridge = box(4, 0.2, 14, railMat);
  footbridge.position.set(157, 0.8, 116);
  g.add(footbridge);
  // Thin railings
  const fr1 = box(0.1, 1, 14, railMat);
  fr1.position.set(155.2, 1.3, 116);
  g.add(fr1);
  const fr2 = box(0.1, 1, 14, railMat);
  fr2.position.set(158.8, 1.3, 116);
  g.add(fr2);

  // ══════════════════════════════════════════════
  // NÁMĚSTÍ MÍRU — cobblestone square at (70, 45) 40×30m
  // ══════════════════════════════════════════════

  addGround(g, 70, 45, 40, 30, cobbleMat, 0.04);

  // Radnice (80,45) 18×6: 2 floors (7m) + tower
  addBuilding(g, 80, 45, 18, 6, 7, civicMat, roofRed, 'gable');
  // Tower 4×4 at center of radnice
  const radTower = box(4, 15, 4, civicMat);
  radTower.position.set(89, 7.5, 48);
  g.add(radTower);
  const radTowerRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 4, 4),
    roofRed
  );
  radTowerRoof.position.set(89, 17, 48);
  radTowerRoof.rotation.y = Math.PI / 4;
  g.add(radTowerRoof);

  // Kostel (70,47) 6×14: tall nave (12m) + tower (35m!)
  addBuilding(g, 70, 47, 6, 14, 12, churchMat, roofRed, 'gable');
  // Church tower
  const chTower = box(4, 35, 4, churchMat);
  chTower.position.set(73, 17.5, 48);
  g.add(chTower);
  const chSpire = new THREE.Mesh(
    new THREE.ConeGeometry(3, 8, 4),
    roofDark
  );
  chSpire.position.set(73, 39, 48);
  chSpire.rotation.y = Math.PI / 4;
  g.add(chSpire);

  // Knihovna (76,45) 4×5
  addBuilding(g, 76, 45, 4, 5, 7, civicMat, roofRed, 'gable');

  // Muzeum (100,45) 8×5
  addBuilding(g, 100, 45, 8, 5, 7, civicMat, roofRed, 'hip');

  // Pošta (100,51) 8×6
  addBuilding(g, 100, 51, 8, 6, 7, civicMat, roofRed, 'gable');

  // Lékárna (100,59) 6×5
  addBuilding(g, 100, 59, 6, 5, 4, shopMat, roofRed, 'gable');

  // Potraviny (70,65) 10×5
  addBuilding(g, 70, 65, 10, 5, 4, shopMat, roofRed, 'flat');

  // Pekárna (82,67) 6×5
  addBuilding(g, 82, 67, 6, 5, 4, shopMat, roofRed, 'gable');

  // Hospoda (98,67) 10×6 + beer garden
  addBuilding(g, 98, 67, 10, 6, 5, shopMat, roofRed, 'gable');
  // Beer garden — few tables
  for (let i = 0; i < 3; i++) {
    const table = box(1, 0.8, 1, industrialMat);
    table.position.set(100 + i * 3, 0.4, 74);
    g.add(table);
    // Chairs (small boxes)
    const ch1 = box(0.5, 0.6, 0.5, industrialMat);
    ch1.position.set(99.2 + i * 3, 0.3, 74);
    g.add(ch1);
    const ch2 = box(0.5, 0.6, 0.5, industrialMat);
    ch2.position.set(100.8 + i * 3, 0.3, 74);
    g.add(ch2);
  }

  // Kašna (86,58) — fountain
  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.8, 16),
    fountainMat
  );
  basin.position.set(86, 0.4, 58);
  g.add(basin);
  // Water inside basin
  const fWater = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 0.3, 16),
    waterMat
  );
  fWater.position.set(86, 0.65, 58);
  g.add(fWater);
  // Water jet
  const jet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.15, 3, 8),
    waterJet
  );
  jet.position.set(86, 2.3, 58);
  g.add(jet);

  // Trees along náměstí (lipová alej)
  for (let i = 0; i < 6; i++) {
    addTree(g, 71 + i * 7, 44, 0.8);
    addTree(g, 71 + i * 7, 76, 0.8);
  }

  // ══════════════════════════════════════════════
  // OTHER BUILDINGS
  // ══════════════════════════════════════════════

  // Škola (20,10) 18×14: 3 floors (10m)
  addBuilding(g, 20, 10, 18, 14, 10, civicMat, roofRed, 'gable');

  // Školka (20,28) 12×10: 1 floor (4m) — colorful
  addBuilding(g, 20, 28, 12, 10, 4, yellowMat, roofGreen, 'flat');
  // Colorful accents
  const accent1 = box(2, 2, 0.2, redMat);
  accent1.position.set(24, 2, 28);
  g.add(accent1);
  const accent2 = box(2, 2, 0.2, blueMat);
  accent2.position.set(28, 2, 28);
  g.add(accent2);

  // Nádraží (0,15) 18×12: 1 floor (5m) + platform canopy
  addBuilding(g, 0, 15, 18, 12, 5, stationMat, roofDark, 'flat');
  // Platform canopy
  const canopy = box(18, 0.15, 4, canopyMat);
  canopy.position.set(9, 4, 10);
  g.add(canopy);
  // Canopy supports
  for (let i = 0; i < 4; i++) {
    const pole = box(0.2, 4, 0.2, railMat);
    pole.position.set(2 + i * 5, 2, 8.5);
    g.add(pole);
    const pole2 = box(0.2, 4, 0.2, railMat);
    pole2.position.set(2 + i * 5, 2, 11.5);
    g.add(pole2);
  }

  // Činžák (5,28) 12×10: 3 floors (9m)
  addBuilding(g, 5, 28, 12, 10, 9, residentialMat, roofRed, 'gable');

  // Sportovní areál (5,45) 30×25: flat green field
  addGround(g, 5, 45, 30, 25, parkGreen, 0.03);
  // White line markings — field outline
  const line1 = box(28, 0.02, 0.15, whiteMat);
  line1.position.set(20, 0.08, 47);
  g.add(line1);
  const line2 = box(28, 0.02, 0.15, whiteMat);
  line2.position.set(20, 0.08, 68);
  g.add(line2);
  const line3 = box(0.15, 0.02, 21, whiteMat);
  line3.position.set(6, 0.08, 57.5);
  g.add(line3);
  const line4 = box(0.15, 0.02, 21, whiteMat);
  line4.position.set(34, 0.08, 57.5);
  g.add(line4);
  // Center line
  const centerLine = box(0.15, 0.02, 21, whiteMat);
  centerLine.position.set(20, 0.08, 57.5);
  g.add(centerLine);
  // Small clubhouse
  addBuilding(g, 7, 70, 8, 4, 3, residentialMat, roofDark, 'flat');

  // Hasičská zbrojnice (5,75) 15×12: 2 floors (7m)
  addBuilding(g, 5, 75, 15, 12, 7, redMat, roofDark, 'flat');
  // Hose drying tower
  const fireTower = box(3, 15, 3, redMat);
  fireTower.position.set(7, 7.5, 82);
  g.add(fireTower);
  const fireTowerTop = box(3.5, 0.3, 3.5, roofDark);
  fireTowerTop.position.set(7, 15.15, 82);
  g.add(fireTowerTop);

  // Zdravotní středisko (35,75) 10×8: 2 floors (7m) — white + green cross
  addBuilding(g, 35, 75, 10, 8, 7, whiteMat, roofDark, 'flat');
  // Green cross on front
  const crossH = box(2, 0.5, 0.2, greenCross);
  crossH.position.set(40, 5.5, 75);
  g.add(crossH);
  const crossV = box(0.5, 2, 0.2, greenCross);
  crossV.position.set(40, 5.5, 75);
  g.add(crossV);

  // Panelový dům (47,78) 35×14: 5 floors (15m) — boring grey
  addBuilding(g, 47, 78, 35, 14, 15, panelMat, roofDark, 'flat');
  // Panel joints — horizontal lines
  for (let floor = 1; floor < 5; floor++) {
    const joint = box(35.1, 0.05, 0.05, railMat);
    joint.position.set(64.5, floor * 3, 78);
    g.add(joint);
  }

  // Blok A (47,10) 35×20: townhouses — 8 houses in a row
  for (let i = 0; i < 8; i++) {
    const hx = 47 + i * 4.2;
    addHouse(g, hx, 10, 4, 8, residentialMat, roofRed);
    addHouse(g, hx, 20, 4, 8, residentialMat, roofRed);
  }

  // Blok B (47,32) 20×12: 4 floors (12m)
  addBuilding(g, 47, 32, 20, 12, 12, apartmentMat, roofDark, 'flat');

  // Blok C (100,10) 28×15: rowhouses — 6 houses
  for (let i = 0; i < 6; i++) {
    const hx = 100 + i * 4.5;
    addHouse(g, hx, 10, 4.2, 14, residentialMat, roofRed);
  }

  // Blok D (100,27) 28×10: 2 floors (7m)
  addBuilding(g, 100, 27, 28, 10, 7, residentialMat, roofRed, 'gable');

  // Vilová čtvrť (137,30) 30×22: 12 detached houses with gardens
  for (let i = 0; i < 12; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const hx = 138 + col * 7 + (pr(i) - 0.5) * 2;
    const hz = 31 + row * 7 + (pr(i + 5) - 0.5) * 2;
    addHouse(g, hx, hz, 5, 5, vilaMat, roofRed);
    // Garden tree
    addTree(g, hx + 6, hz + 2, 0.7);
  }

  // Čerpací stanice (100,82) 12×10
  // Canopy
  const gasCanopy = box(10, 0.2, 8, canopyMat);
  gasCanopy.position.set(106, 4, 87);
  g.add(gasCanopy);
  // Canopy supports (4 poles)
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const pole = box(0.3, 4, 0.3, railMat);
      pole.position.set(102 + i * 8, 2, 84 + j * 6);
      g.add(pole);
    }
  }
  // Pumps
  for (let i = 0; i < 3; i++) {
    const pump = box(0.5, 1.5, 0.5, yellowMat);
    pump.position.set(104 + i * 2, 0.75, 87);
    g.add(pump);
  }
  // Small shop
  addBuilding(g, 108, 83, 4, 5, 3, shopMat, roofDark, 'flat');
  addGround(g, 100, 82, 12, 10, sidewalkMat, 0.04);

  // Zemědělské družstvo (140,0) 25×20: barn + 3 silos
  addBuilding(g, 140, 0, 25, 12, 6, industrialMat, roofDark, 'gable');
  // 3 Silos
  for (let i = 0; i < 3; i++) {
    const silo = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 12, 12),
      industrialMat
    );
    silo.position.set(145 + i * 6, 6, 17);
    g.add(silo);
    const siloCap = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 3, 12),
      roofDark
    );
    siloCap.position.set(145 + i * 6, 13.5, 17);
    g.add(siloCap);
  }

  // Hřbitov (170,5) 25×20
  addGround(g, 170, 5, 25, 20, cemeteryMat, 0.03);
  // Small chapel
  addBuilding(g, 178, 6, 6, 8, 5, churchMat, roofDark, 'gable');
  // Headstone rows
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      const hs = box(0.4, 0.8, 0.15, headstone);
      hs.position.set(172 + col * 2.5, 0.4, 16 + row * 2);
      g.add(hs);
    }
  }

  // Rodinné domy J (20,125) 60×20: 15 small houses south of river
  for (let i = 0; i < 15; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const hx = 22 + col * 11 + (pr(i + 10) - 0.5) * 3;
    const hz = 126 + row * 6 + (pr(i + 20) - 0.5) * 2;
    addHouse(g, hx, hz, 6, 5, residentialMat, roofRed);
  }

  // Rodinné domy V (120,125) 45×18: 10 small houses
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const hx = 122 + col * 8 + (pr(i + 30) - 0.5) * 2;
    const hz = 126 + row * 8 + (pr(i + 40) - 0.5) * 2;
    addHouse(g, hx, hz, 6, 5, residentialMat, roofRed);
  }

  // ══════════════════════════════════════════════
  // PARK (137,55) 45×40
  // ══════════════════════════════════════════════

  addGround(g, 137, 55, 45, 40, parkGreen, 0.03);

  // ~15 scattered trees
  const parkTreePositions = [
    [140, 58], [145, 62], [150, 57], [155, 60], [160, 58],
    [165, 62], [170, 57], [142, 70], [148, 75], [155, 78],
    [162, 72], [168, 80], [175, 70], [172, 85], [140, 85]
  ];
  for (const [tx, tz] of parkTreePositions) {
    addTree(g, tx, tz);
  }

  // Pond (152,65) 12×10
  const pond = box(12, 0.05, 10, waterMat);
  pond.position.set(158, 0.05, 70);
  g.add(pond);

  // Playground area — colorful small boxes
  const playX = 140, playZ = 88;
  // Slide
  const slide = box(0.5, 2, 3, playMat);
  slide.position.set(playX, 1, playZ);
  slide.rotation.x = 0.3;
  g.add(slide);
  // Swing frame
  const swingFrame = box(3, 2.5, 0.2, yellowMat);
  swingFrame.position.set(playX + 5, 1.25, playZ);
  g.add(swingFrame);
  const swingLeg1 = box(0.15, 2.5, 1.5, yellowMat);
  swingLeg1.position.set(playX + 3.7, 1.25, playZ);
  g.add(swingLeg1);
  const swingLeg2 = box(0.15, 2.5, 1.5, yellowMat);
  swingLeg2.position.set(playX + 6.3, 1.25, playZ);
  g.add(swingLeg2);
  // Sandbox
  const sandbox = box(3, 0.3, 3, yellowMat);
  sandbox.position.set(playX + 10, 0.15, playZ);
  g.add(sandbox);

  // Altánek (167,60) 5×5: small pavilion
  // Roof
  const altRoof = new THREE.Mesh(
    new THREE.ConeGeometry(4, 3, 6),
    roofGreen
  );
  altRoof.position.set(169.5, 4.5, 62.5);
  g.add(altRoof);
  // Pillars
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const pillar = box(0.2, 3.5, 0.2, whiteMat);
    pillar.position.set(
      169.5 + Math.cos(angle) * 2.5,
      1.75,
      62.5 + Math.sin(angle) * 2.5
    );
    g.add(pillar);
  }
  // Floor
  const altFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 2.8, 0.15, 6),
    sidewalkMat
  );
  altFloor.position.set(169.5, 0.08, 62.5);
  g.add(altFloor);

  // ══════════════════════════════════════════════
  // STREET TREES
  // ══════════════════════════════════════════════

  // Trees along Školní ulice
  for (let i = 0; i < 8; i++) {
    addTree(g, 38, 15 + i * 10, 0.7);
    addTree(g, 48, 15 + i * 10, 0.7);
  }

  // Trees along park edges
  for (let i = 0; i < 8; i++) {
    addTree(g, 136, 57 + i * 5, 0.6);
    addTree(g, 183, 57 + i * 5, 0.6);
  }

  // Trees along Říční ulice (river road)
  for (let i = 0; i < 12; i++) {
    addTree(g, 25 + i * 13, 102, 0.7);
  }

  // Trees along Zahradní ulice
  for (let i = 0; i < 6; i++) {
    addTree(g, 128, 30 + i * 12, 0.7);
  }

  scene.add(g);
  return g;
}
