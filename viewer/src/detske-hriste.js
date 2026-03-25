import * as THREE from 'three';
import { box, plane, MAT } from './building-utils.js';
import { registerPlaygroundAnim, setupPlaygroundInteraction } from './playground-anim.js';

// ════════════════════════════════════════════════
// MATERIALS
// ════════════════════════════════════════════════

const wood = new THREE.MeshLambertMaterial({ color: 0xaa7744, side: THREE.FrontSide });
const woodLight = new THREE.MeshLambertMaterial({ color: 0xcc9955, side: THREE.FrontSide });
const woodDark = new THREE.MeshLambertMaterial({ color: 0x664422, side: THREE.FrontSide });
const steel = new THREE.MeshLambertMaterial({ color: 0x666677, side: THREE.FrontSide });
const steelRed = new THREE.MeshLambertMaterial({ color: 0xcc3333, side: THREE.FrontSide });
const steelBlue = new THREE.MeshLambertMaterial({ color: 0x3366cc, side: THREE.FrontSide });
const steelYellow = new THREE.MeshLambertMaterial({ color: 0xddaa22, side: THREE.FrontSide });
const steelGreen = new THREE.MeshLambertMaterial({ color: 0x33aa44, side: THREE.FrontSide });
const sand = new THREE.MeshLambertMaterial({ color: 0xe8d8a0, side: THREE.FrontSide });
const rubber = new THREE.MeshLambertMaterial({ color: 0xcc4444, side: THREE.FrontSide });
const rubberGreen = new THREE.MeshLambertMaterial({ color: 0x44aa55, side: THREE.FrontSide });
const rubberYellow = new THREE.MeshLambertMaterial({ color: 0xddcc33, side: THREE.FrontSide });
const rubberBlue = new THREE.MeshLambertMaterial({ color: 0x4488cc, side: THREE.FrontSide });
const rubberOrange = new THREE.MeshLambertMaterial({ color: 0xdd8833, side: THREE.FrontSide });
const grass = new THREE.MeshLambertMaterial({ color: 0x55aa33, side: THREE.FrontSide });
const chain = new THREE.MeshLambertMaterial({ color: 0x888888, side: THREE.FrontSide });
const nerez = new THREE.MeshLambertMaterial({ color: 0xbbbbcc, side: THREE.FrontSide });
const roofRed = new THREE.MeshLambertMaterial({ color: 0xbb2222, side: THREE.FrontSide });
const roofGreen = new THREE.MeshLambertMaterial({ color: 0x228833, side: THREE.FrontSide });
const concrete = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: THREE.FrontSide });
const hplBlue = new THREE.MeshLambertMaterial({ color: 0x3366aa, side: THREE.FrontSide });
const hplRed = new THREE.MeshLambertMaterial({ color: 0xcc3344, side: THREE.FrontSide });
const hplYellow = new THREE.MeshLambertMaterial({ color: 0xddbb22, side: THREE.FrontSide });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }
function cyl(r, h, mat, segs = 12) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), mat); }

// ════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════

export function createDetskeHriste(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  buildGround(g);
  buildFence(g);
  buildSwings(g);
  buildClimbingFrame(g);
  buildSandbox(g);
  buildSpringRiders(g);
  buildMerryGoRound(g);
  buildSeesaw(g);
  buildBenches(g);
  buildEntrance(g);

  setupPlaygroundInteraction(g);
  scene.add(g);
}

// ════════════════════════════════════════════════
// GROUND — grass + rubber safety surfaces (EPDM)
// ════════════════════════════════════════════════

function buildGround(g) {
  // Grass base
  const grassPlane = plane(28, 22, grass);
  grassPlane.rotation.x = -Math.PI / 2;
  grassPlane.position.set(14, 0.01, 11);
  g.add(grassPlane);

  // mcp:dp_houp (0.5,1) 7×8 — červená EPDM 40mm
  addRubberSurface(g, 0.5, 1, 7, 8, rubber);
  // mcp:dp_prolez (12.5,1.5) 8×8 — zelená EPDM 50mm
  addRubberSurface(g, 12.5, 1.5, 8, 8, rubberGreen);
  // mcp:dp_pruziny (7.5,9.5) 5.5×6 — žlutá EPDM 30mm
  addRubberSurface(g, 7.5, 9.5, 5.5, 6, rubberYellow);
  // mcp:dp_kolotoc (13,14) 6.5×6.5 — modrá EPDM 30mm
  addRubberSurface(g, 13, 14, 6.5, 6.5, rubberBlue);
  // mcp:dp_vahadlo (18.5,10.5) 6.5×3.5 — oranžová EPDM 30mm
  addRubberSurface(g, 18.5, 10.5, 6.5, 3.5, rubberOrange);
}

function addRubberSurface(g, x, z, w, d, mat) {
  const rp = plane(w, d, mat);
  rp.rotation.x = -Math.PI / 2;
  rp.position.set(x + w / 2, 0.02, z + d / 2);
  g.add(rp);
}

// ════════════════════════════════════════════════
// FENCE — mcp:oploceni (0,0) 28×22, 1.2m dřevěné laťky, sloupky po 2m
// ════════════════════════════════════════════════

function buildFence(g) {
  const W = 28, D = 22, H = 1.2;
  const postSpacing = 2;

  // 3 horizontal rails per side (top, mid, bottom)
  const railHeights = [H, H * 0.5, H * 0.15];
  for (const rh of railHeights) {
    g.add(p(box(W, 0.06, 0.06, wood), W / 2, rh, 0));
    g.add(p(box(W, 0.06, 0.06, wood), W / 2, rh, D));
    g.add(p(box(0.06, 0.06, D, wood), 0, rh, D / 2));
    g.add(p(box(0.06, 0.06, D, wood), W, rh, D / 2));
  }

  // Posts — all 4 sides, skip gate at north (12–13.2)
  for (let x = 0; x <= W; x += postSpacing) {
    if (x >= 12 && x <= 14) continue;
    g.add(p(box(0.08, H + 0.15, 0.08, woodDark), x, (H + 0.15) / 2, 0));
  }
  for (let x = 0; x <= W; x += postSpacing) {
    g.add(p(box(0.08, H + 0.15, 0.08, woodDark), x, (H + 0.15) / 2, D));
  }
  for (let z = postSpacing; z < D; z += postSpacing) {
    g.add(p(box(0.08, H + 0.15, 0.08, woodDark), 0, (H + 0.15) / 2, z));
    g.add(p(box(0.08, H + 0.15, 0.08, woodDark), W, (H + 0.15) / 2, z));
  }

  // Vertical slats — all 4 sides
  const slatSpacing = 0.11;
  // North
  for (let x = 0.1; x < W; x += slatSpacing) {
    if (x >= 11.9 && x <= 13.3) continue;
    g.add(p(box(0.02, H, 0.04, woodLight), x, H / 2, 0));
  }
  // South
  for (let x = 0.1; x < W; x += slatSpacing) {
    g.add(p(box(0.02, H, 0.04, woodLight), x, H / 2, D));
  }
  // West
  for (let z = 0.1; z < D; z += slatSpacing) {
    g.add(p(box(0.04, H, 0.02, woodLight), 0, H / 2, z));
  }
  // East
  for (let z = 0.1; z < D; z += slatSpacing) {
    g.add(p(box(0.04, H, 0.02, woodLight), W, H / 2, z));
  }
}

// ════════════════════════════════════════════════
// ENTRANCE — mcp:branka (12,0) 1.2×0.2 + chodník 1.2×3.5 + tabule + koš
// ════════════════════════════════════════════════

function buildEntrance(g) {
  // mcp:branka (12,0) 1.2×0.2, height_3d 1.0 — samozavírací
  const gateX = 12, gateW = 1.2, gateH = 1.0;
  g.add(p(box(0.1, gateH + 0.3, 0.1, woodDark), gateX, (gateH + 0.3) / 2, 0));
  g.add(p(box(0.1, gateH + 0.3, 0.1, woodDark), gateX + gateW, (gateH + 0.3) / 2, 0));
  // Gate panel (green steel, slightly ajar)
  g.add(p(box(gateW, gateH, 0.05, steelGreen), gateX + gateW / 2, gateH / 2, 0.15));
  // Gate horizontal bars
  g.add(p(box(gateW - 0.1, 0.03, 0.03, steelGreen), gateX + gateW / 2, gateH * 0.3, 0.15));
  g.add(p(box(gateW - 0.1, 0.03, 0.03, steelGreen), gateX + gateW / 2, gateH * 0.7, 0.15));

  // mcp:chodnik (12,0.2) 1.2×3.5 — zámková dlažba šedá
  const pathP = plane(1.2, 3.5, concrete);
  pathP.rotation.x = -Math.PI / 2;
  pathP.position.set(12 + 0.6, 0.03, 0.2 + 1.75);
  g.add(pathP);

  // mcp:tabule (10,0.5) 1×0.1, elev 0.8, height_3d 0.7 — info board
  g.add(p(box(0.06, 1.5, 0.06, woodDark), 10.5, 0.75, 0.55)); // post
  g.add(p(box(1, 0.7, 0.03, woodLight), 10.5, 0.8 + 0.35, 0.55)); // board

  // mcp:kos (10.5,0.5) 0.35×0.35, height_3d 0.75 — kovový se stříškou
  g.add(p(cyl(0.175, 0.7, steel), 10.68, 0.35, 0.68));
  g.add(p(cyl(0.2, 0.04, steel), 10.68, 0.72, 0.68)); // stříška
  g.add(p(box(0.04, 0.75, 0.04, steel), 10.68, 0.375, 0.5)); // stojan
}

// ════════════════════════════════════════════════
// HOUPAČKY — mcp:houpacky (2,4) 4×1.5, height_3d 2.5
// A-rám ocel práškově lakovaná červená, D48mm nohy, D60mm příčka
// ════════════════════════════════════════════════

function buildSwings(g) {
  const hx = 2, hz = 4;
  const frameH = 2.5, frameW = 4;
  const beamZ = hz + 0.75;

  // Static frame — A-rám + příčka
  const legSpread = 0.72;
  g.add(p(box(0.048, frameH + 0.2, 0.048, steelRed), hx, frameH / 2 + 0.1, beamZ - legSpread));
  g.add(p(box(0.048, frameH + 0.2, 0.048, steelRed), hx, frameH / 2 + 0.1, beamZ + legSpread));
  g.add(p(box(0.048, frameH + 0.2, 0.048, steelRed), hx + frameW, frameH / 2 + 0.1, beamZ - legSpread));
  g.add(p(box(0.048, frameH + 0.2, 0.048, steelRed), hx + frameW, frameH / 2 + 0.1, beamZ + legSpread));
  g.add(p(box(0.03, 0.03, legSpread * 2, steelRed), hx, 0.8, beamZ));
  g.add(p(box(0.03, 0.03, legSpread * 2, steelRed), hx + frameW, 0.8, beamZ));
  const topBeamMesh = cyl(0.03, frameW, steelRed);
  topBeamMesh.position.set(hx + frameW / 2, frameH, beamZ);
  topBeamMesh.rotation.z = Math.PI / 2;
  g.add(topBeamMesh);

  // Seat 1 — ploché sedadlo (animated swing group)
  // Pivot at beam attachment point, children offset downward
  const s1x = hx + 0.8 + 0.2;
  const swing1 = new THREE.Group();
  swing1.position.set(s1x, frameH, beamZ); // pivot = top beam
  // Chains relative to pivot (going down)
  swing1.add(p(box(0.015, 2.04, 0.015, chain), -0.15, -1.02, 0));
  swing1.add(p(box(0.015, 2.04, 0.015, chain), 0.15, -1.02, 0));
  // Seat
  swing1.add(p(box(0.4, 0.03, 0.18, steelBlue), 0, -2.05, 0));
  g.add(swing1);
  registerPlaygroundAnim(swing1, {
    type: 'swing', maxAngle: 0.6, frequency: 2.8,
  });

  // Seat 2 — košíkové sedadlo (animated swing group)
  const s2x = hx + 2.55 + 0.25;
  const swing2 = new THREE.Group();
  swing2.position.set(s2x, frameH, beamZ);
  swing2.add(p(box(0.015, 2.04, 0.015, chain), -0.2, -1.02, -0.15));
  swing2.add(p(box(0.015, 2.04, 0.015, chain), 0.2, -1.02, -0.15));
  swing2.add(p(box(0.015, 2.04, 0.015, chain), -0.2, -1.02, 0.15));
  swing2.add(p(box(0.015, 2.04, 0.015, chain), 0.2, -1.02, 0.15));
  swing2.add(p(box(0.45, 0.03, 0.35, steelYellow), 0, -2.05, 0));
  swing2.add(p(box(0.45, 0.28, 0.03, steelYellow), 0, -2.05 + 0.14, -0.16));
  swing2.add(p(box(0.45, 0.15, 0.03, steelYellow), 0, -2.05 + 0.075, 0.16));
  swing2.add(p(box(0.03, 0.2, 0.35, steelYellow), -0.21, -2.05 + 0.1, 0));
  swing2.add(p(box(0.03, 0.2, 0.35, steelYellow), 0.21, -2.05 + 0.1, 0));
  g.add(swing2);
  registerPlaygroundAnim(swing2, {
    type: 'swing', maxAngle: 0.45, frequency: 2.5,
  });
}

// ════════════════════════════════════════════════
// PROLÉZACÍ SESTAVA — mcp:prolezacka (14,3) 5×4, height_3d 3.4
// 2 věžičky, lanový mostík, skluzavka, žebřík, lano
// ════════════════════════════════════════════════

function buildClimbingFrame(g) {
  const px = 14, pz = 3;

  // ── Věž1: sloupy (0,0)→(1.72,1.72), platforma elev 1.5, střecha elev 2.9 ──
  const v1x = px, v1z = pz, v1W = 1.8, v1D = 1.8, platH1 = 1.5;
  const postH1 = 3.0; // noha_LZ height_3d
  for (const [cx, cz] of [[v1x, v1z], [v1x + v1W - 0.08, v1z], [v1x, v1z + v1D - 0.08], [v1x + v1W - 0.08, v1z + v1D - 0.08]]) {
    g.add(p(box(0.08, postH1, 0.08, woodDark), cx + 0.04, postH1 / 2, cz + 0.04));
  }
  // Platforma HPL protiskluz elev 1.5
  g.add(p(box(v1W, 0.06, v1D, wood), v1x + v1W / 2, platH1, v1z + v1D / 2));
  // Stříška HPL červená elev 2.9, přesah 0.1m
  g.add(p(box(v1W + 0.2, 0.04, v1D + 0.2, roofRed), v1x + v1W / 2, 2.9 + 0.02, v1z + v1D / 2));
  // Zábradlí elev 1.5, height_3d 0.7 — 3 strany (jih otevřená pro mostík)
  g.add(p(box(v1W, 0.06, 0.04, steelRed), v1x + v1W / 2, platH1 + 0.7, v1z)); // sever
  g.add(p(box(0.04, 0.7, v1D, steelRed), v1x, platH1 + 0.35, v1z + v1D / 2)); // západ
  g.add(p(box(0.04, 0.7, v1D, steelRed), v1x + v1W - 0.04, platH1 + 0.35, v1z + v1D / 2)); // východ
  // Zábradlí výplň (svislé tyčky)
  for (let i = 0; i < 5; i++) {
    g.add(p(box(0.02, 0.65, 0.02, steelRed), v1x + 0.3 + i * 0.3, platH1 + 0.35, v1z));
  }

  // ── Mostík: (1.8,0.4) 1.5×1, elev 1.5 — dřevěné lamely + lanová zábradlí ──
  const mx = px + 1.8, mz = pz + 0.4 + 0.5;
  for (let i = 0; i < 7; i++) {
    g.add(p(box(0.18, 0.035, 0.8, woodLight), mx + 0.11 + i * 0.2, platH1, mz));
  }
  // Lanová zábradlí — 2 lana, elev 1.5→2.0
  g.add(p(box(1.5, 0.025, 0.025, chain), mx + 0.75, platH1 + 0.5, mz - 0.35));
  g.add(p(box(1.5, 0.025, 0.025, chain), mx + 0.75, platH1 + 0.5, mz + 0.35));
  // Svislé šňůry
  for (let i = 0; i < 4; i++) {
    g.add(p(box(0.015, 0.5, 0.015, chain), mx + 0.2 + i * 0.4, platH1 + 0.25, mz - 0.35));
    g.add(p(box(0.015, 0.5, 0.015, chain), mx + 0.2 + i * 0.4, platH1 + 0.25, mz + 0.35));
  }

  // ── Věž2: (3.3,0) 1.7×1.8, platforma elev 2.2, střecha elev 3.3 ──
  const v2x = px + 3.3, v2z = pz, v2W = 1.7, v2D = 1.8, platH2 = 2.2;
  const postH2 = 3.4;
  for (const [cx, cz] of [[v2x, v2z], [v2x + v2W - 0.08, v2z], [v2x, v2z + v2D - 0.08], [v2x + v2W - 0.08, v2z + v2D - 0.08]]) {
    g.add(p(box(0.08, postH2, 0.08, woodDark), cx + 0.04, postH2 / 2, cz + 0.04));
  }
  g.add(p(box(v2W, 0.06, v2D, wood), v2x + v2W / 2, platH2, v2z + v2D / 2));
  g.add(p(box(v2W + 0.2, 0.04, v2D + 0.2, roofGreen), v2x + v2W / 2, 3.3 + 0.02, v2z + v2D / 2));
  // Zábradlí — sever + východ (západ ke skluzavce, jih k mostíku)
  g.add(p(box(v2W, 0.06, 0.04, steelGreen), v2x + v2W / 2, platH2 + 0.7, v2z));
  g.add(p(box(0.04, 0.7, v2D, steelGreen), v2x + v2W - 0.04, platH2 + 0.35, v2z + v2D / 2));

  // ── Skluzavka nerez: (3.8,1.8) 0.5×2.2, start elev 2.2 → end 0.15 ──
  const slX = px + 3.8 + 0.25;
  const slZ0 = pz + 1.8;
  const slZ1 = pz + 1.8 + 2.2;
  const slideCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(slX, platH2, slZ0),
    new THREE.Vector3(slX, platH2 * 0.55, slZ0 + (slZ1 - slZ0) * 0.4),
    new THREE.Vector3(slX, 0.15, slZ1),
  ]);
  const slidePts = slideCurve.getPoints(24);
  for (let i = 0; i < slidePts.length - 1; i++) {
    const a = slidePts[i], b = slidePts[i + 1];
    const dy = b.y - a.y, dz = b.z - a.z;
    const len = Math.sqrt(dy * dy + dz * dz);
    const seg = box(0.45, 0.02, len + 0.01, nerez);
    seg.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    seg.rotation.x = Math.atan2(dy, dz);
    g.add(seg);
  }
  // Boční lemování skluzavky
  for (const side of [-1, 1]) {
    const rail = new THREE.CatmullRomCurve3([
      new THREE.Vector3(slX + side * 0.24, platH2 + 0.12, slZ0),
      new THREE.Vector3(slX + side * 0.24, platH2 * 0.55 + 0.12, slZ0 + (slZ1 - slZ0) * 0.4),
      new THREE.Vector3(slX + side * 0.24, 0.27, slZ1),
    ]);
    const pts = rail.getPoints(16);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dy = b.y - a.y, dz = b.z - a.z;
      const len = Math.sqrt(dy * dy + dz * dz);
      const s = box(0.025, 0.12, len, nerez);
      s.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      s.rotation.x = Math.atan2(dy, dz);
      g.add(s);
    }
  }

  // ── Žebřík: (0.3,1.8) 0.5×0.6, 6 příček, sklon 75° ──
  const lx = px + 0.3 + 0.25, lz = pz + 1.8 + 0.3;
  // Bočnice
  g.add(p(box(0.035, platH1 + 0.3, 0.035, woodDark), lx - 0.2, platH1 / 2 + 0.15, lz));
  g.add(p(box(0.035, platH1 + 0.3, 0.035, woodDark), lx + 0.2, platH1 / 2 + 0.15, lz));
  // 6 příček ocel+dřevo
  for (let i = 0; i < 6; i++) {
    g.add(p(box(0.4, 0.035, 0.035, steelBlue), lx, 0.25 + i * 0.24, lz));
  }

  // ── Šplhací lano PP pr.18mm s uzly: (1.3,1.8) ──
  const ropeCx = px + 1.3 + 0.05, ropeCz = pz + 1.8 + 0.05;
  g.add(p(cyl(0.009, platH1 + 0.6, chain), ropeCx, (platH1 + 0.6) / 2, ropeCz));
  for (let i = 0; i < 4; i++) {
    g.add(p(cyl(0.04, 0.05, chain), ropeCx, 0.3 + i * 0.4, ropeCz));
  }

  // Animated slide ball — rides down the slide on click
  const slideCurveAnim = new THREE.CatmullRomCurve3([
    new THREE.Vector3(px + 3.8 + 0.25, platH2 + 0.1, pz + 1.8),
    new THREE.Vector3(px + 3.8 + 0.25, platH2 * 0.55 + 0.1, pz + 1.8 + (2.2) * 0.4),
    new THREE.Vector3(px + 3.8 + 0.25, 0.25, pz + 1.8 + 2.2),
  ]);
  const ballMat = new THREE.MeshLambertMaterial({ color: 0xff4444 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), ballMat);
  const startPt = slideCurveAnim.getPoint(0);
  ball.position.copy(startPt);
  g.add(ball);
  registerPlaygroundAnim(ball, {
    type: 'slideBall', curve: slideCurveAnim, duration: 1.8,
  });
}

// ════════════════════════════════════════════════
// PÍSKOVIŠTĚ — mcp:piskoviste (2,11) 4×4, height_3d 0.25
// Kulatina D12cm rám, rohové sloupky 0.35m, stolek + bagrík
// ════════════════════════════════════════════════

function buildSandbox(g) {
  const sx = 2, sz = 11, sW = 4, sD = 4;

  // Písková plocha
  const sandPlane = plane(sW - 0.3, sD - 0.3, sand);
  sandPlane.rotation.x = -Math.PI / 2;
  sandPlane.position.set(sx + sW / 2, 0.05, sz + sD / 2);
  g.add(sandPlane);

  // Dřevěný rám kulatina D12cm — 4 strany
  g.add(p(cyl(0.06, sW, woodDark), sx + sW / 2, 0.12, sz));
  g.children[g.children.length - 1].rotation.z = Math.PI / 2;
  g.add(p(cyl(0.06, sW, woodDark), sx + sW / 2, 0.12, sz + sD));
  g.children[g.children.length - 1].rotation.z = Math.PI / 2;
  g.add(p(cyl(0.06, sD, woodDark), sx, 0.12, sz + sD / 2));
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  g.add(p(cyl(0.06, sD, woodDark), sx + sW, 0.12, sz + sD / 2));
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;

  // Rohové sloupky 0.35m
  for (const [cx, cz] of [[sx, sz], [sx + sW, sz], [sx, sz + sD], [sx + sW, sz + sD]]) {
    g.add(p(cyl(0.07, 0.35, woodDark), cx, 0.175, cz));
  }

  // mcp:stolek (0.5,0.5) 1×0.6, elev 0, height_3d 0.5 — vodní/pískový stolek
  const fx = sx + 0.5 + 0.5, fz = sz + 0.5 + 0.3;
  g.add(p(box(1, 0.035, 0.6, woodLight), fx, 0.5, fz));
  for (const [dx, dz] of [[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]]) {
    g.add(p(box(0.05, 0.5, 0.05, woodDark), fx + dx, 0.25, fz + dz));
  }

  // mcp:bagrik (2.5,2.5) 0.8×0.8, height_3d 0.7 — otočný bagrík
  const bx = sx + 2.5 + 0.4, bz = sz + 2.5 + 0.4;
  g.add(p(cyl(0.035, 0.65, steel), bx, 0.325, bz)); // pivot
  g.add(p(box(0.035, 0.035, 0.55, steelYellow), bx, 0.6, bz + 0.275)); // rameno
  g.add(p(box(0.18, 0.1, 0.12, steelYellow), bx, 0.55, bz + 0.55)); // lžíce
  g.add(p(cyl(0.13, 0.035, steel), bx, 0.34, bz - 0.25)); // sedátko
}

// ════════════════════════════════════════════════
// PRUŽINOVÁ HOUPADLA — 3ks, HPL desky na ocelové pružině
// Každé: betonový základ → pružina ocel pr.12mm → HPL tělo → madla
// ════════════════════════════════════════════════

function buildSpringRiders(g) {
  const riders = [
    { x: 9 + 0.4, z: 11 + 0.5, mat: hplBlue, bodyW: 0.7, bodyD: 0.8, bodyH: 0.35, label: 'konik' },
    { x: 11 + 0.5, z: 11 + 0.35, mat: hplRed, bodyW: 0.8, bodyD: 0.6, bodyH: 0.3, label: 'motorka' },
    { x: 9.5 + 0.5, z: 13 + 0.4, mat: hplYellow, bodyW: 0.8, bodyD: 0.7, bodyH: 0.35, label: 'auto' },
  ];

  for (const r of riders) {
    // Static base
    g.add(p(cyl(0.2, 0.04, concrete, 8), r.x, 0.02, r.z));

    // Animated group — pivot at spring top (0.39m)
    const riderGrp = new THREE.Group();
    riderGrp.position.set(r.x, 0.39, r.z);

    // Spring (part of group so it stretches visually)
    riderGrp.add(p(cyl(0.055, 0.35, steel), 0, -0.175, 0));
    // Body
    riderGrp.add(p(box(r.bodyW, r.bodyH, r.bodyD, r.mat), 0, r.bodyH / 2, 0));
    // Madla
    if (r.label === 'konik') {
      riderGrp.add(p(box(0.25, 0.04, 0.04, steel), 0, 0.26 + 0.06, -r.bodyD * 0.3));
    } else if (r.label === 'motorka') {
      riderGrp.add(p(box(0.15, 0.18, 0.08, steel), 0, 0.21 + 0.09, -r.bodyD * 0.35));
    } else {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 12), steel);
      wheel.position.set(0, 0.16 + 0.1, -r.bodyD * 0.3);
      riderGrp.add(wheel);
    }
    // Stupačky
    riderGrp.add(p(box(0.07, 0.015, 0.1, steel), -0.2, 0, 0));
    riderGrp.add(p(box(0.07, 0.015, 0.1, steel), 0.2, 0, 0));

    g.add(riderGrp);
    registerPlaygroundAnim(riderGrp, {
      type: 'springRider', maxTilt: 0.25, frequency: 3.5,
      bounceHeight: 0.03, baseY: 0.39,
    });
  }
}

// ════════════════════════════════════════════════
// KOLOTOČ — mcp:kolotoc (15,16) 2.5×2.5, height_3d 0.6
// Středový sloup 0.2m, otočný disk HPL modrá D2.5m, 4 madla
// ════════════════════════════════════════════════

function buildMerryGoRound(g) {
  const cx = 15 + 1.25, cz = 16 + 1.25;

  // Static base — sloup + ložisko
  g.add(p(cyl(0.08, 0.6, steel), cx, 0.3, cz));
  g.add(p(cyl(0.12, 0.04, steel), cx, 0.52, cz));

  // Spinning group — disk + madla (pivot at center axis)
  const spinGrp = new THREE.Group();
  spinGrp.position.set(cx, 0, cz);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.25, 0.06, 24),
    steelBlue
  );
  disc.position.set(0, 0.53, 0);
  spinGrp.add(disc);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const hx = Math.cos(angle) * 1.05;
    const hz = Math.sin(angle) * 1.05;
    spinGrp.add(p(cyl(0.015, 0.4, steelRed), hx, 0.56 + 0.2, hz));
    spinGrp.add(p(cyl(0.035, 0.02, steelRed), hx, 0.56 + 0.4, hz));
  }

  g.add(spinGrp);
  registerPlaygroundAnim(spinGrp, {
    type: 'merryGoRound', maxSpeed: 3.0,
  });
}

// ════════════════════════════════════════════════
// VAHADLO — mcp:vahadlo (20,12) 3.5×0.5, height_3d 1.2
// A-tvar stojan ocel, rameno robinie 100×80mm, sedadla pryž, madla ocel
// ════════════════════════════════════════════════

function buildSeesaw(g) {
  const vx = 20, vz = 12, vW = 3.5;
  const cx = vx + vW / 2, cz = vz + 0.25;

  // Static base — A-frame stojan
  g.add(p(box(0.04, 0.52, 0.3, steel), cx - 0.1, 0.26, cz));
  g.add(p(box(0.04, 0.52, 0.3, steel), cx + 0.1, 0.26, cz));
  g.add(p(box(0.25, 0.04, 0.04, steel), cx, 0.5, cz));

  // Rocking group — pivot at center top of stojan
  const rockGrp = new THREE.Group();
  rockGrp.position.set(cx, 0.49, cz);

  // Rameno (centered at 0)
  rockGrp.add(p(box(vW, 0.08, 0.2, wood), 0, 0, 0));
  // Sedadla — offset from center
  const halfW = vW / 2;
  rockGrp.add(p(box(0.35, 0.04, 0.25, steelBlue), -halfW + 0.175, -0.02, 0));
  rockGrp.add(p(box(0.35, 0.04, 0.25, steelRed), halfW - 0.175, -0.02, 0));
  // Madla
  rockGrp.add(p(box(0.04, 0.35, 0.04, steel), -halfW + 0.175, 0.175, 0));
  rockGrp.add(p(box(0.04, 0.35, 0.04, steel), halfW - 0.175, 0.175, 0));
  // Grip tops
  rockGrp.add(p(box(0.15, 0.025, 0.04, steel), -halfW + 0.175, 0.36, 0));
  rockGrp.add(p(box(0.15, 0.025, 0.04, steel), halfW - 0.175, 0.36, 0));

  g.add(rockGrp);
  registerPlaygroundAnim(rockGrp, {
    type: 'seesaw', maxAngle: 0.18, frequency: 2.2,
  });
}

// ════════════════════════════════════════════════
// LAVIČKY — 4ks, dřevo robinie + ocel, elev 0, height_3d 0.85
// ════════════════════════════════════════════════

function buildBenches(g) {
  const benches = [
    { x: 0.5, z: 17 }, { x: 0.5, z: 19 },
    { x: 25, z: 17 }, { x: 25, z: 19 },
  ];

  for (const b of benches) {
    const bx = b.x + 0.9, bz = b.z + 0.25;
    // Nohy ocel (2 páry)
    g.add(p(box(0.05, 0.42, 0.35, steel), bx - 0.6, 0.21, bz));
    g.add(p(box(0.05, 0.42, 0.35, steel), bx + 0.6, 0.21, bz));
    // Sedák — 3 prkna
    for (let i = -1; i <= 1; i++) {
      g.add(p(box(1.6, 0.03, 0.1, wood), bx, 0.42, bz + i * 0.11));
    }
    // Opěradlo — 2 prkna
    g.add(p(box(1.6, 0.1, 0.025, wood), bx, 0.55, bz - 0.16));
    g.add(p(box(1.6, 0.1, 0.025, wood), bx, 0.7, bz - 0.16));
    // Područky
    g.add(p(box(0.04, 0.12, 0.3, steel), bx - 0.78, 0.48, bz));
    g.add(p(box(0.04, 0.12, 0.3, steel), bx + 0.78, 0.48, bz));
  }
}
