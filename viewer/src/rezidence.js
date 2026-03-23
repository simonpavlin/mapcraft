import * as THREE from 'three';

// Luxusní rezidence — dvoupatrová, L-shaped pozemek
// MCP: rezidence at (30, 140) in 200×200 world → 3D (-70, 40)
// Dům 20×14m, bazén vedle
// Přízemí: sauna, sprcha, vstup, schody, WC, posilovna, open-space obývák+kuchyně
// 2. patro: schody, chodba, hlavní ložnice+koupelna, 2 dětské pokoje, společná koupelna, pracovna

const DS = THREE.FrontSide;
const WALL = 0.15;
const IW = 0.1;
const FH = 3.2; // floor height

const m = {
  wo: new THREE.MeshLambertMaterial({ color: 0xe8e0d0, side: DS }),
  wa: new THREE.MeshLambertMaterial({ color: 0x333333, side: DS }),
  wi: new THREE.MeshLambertMaterial({ color: 0xf5f2ec, side: DS }),
  wb: new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS }),
  fl: new THREE.MeshLambertMaterial({ color: 0xc0a060, side: DS }),
  fh: new THREE.MeshLambertMaterial({ color: 0x907050, side: DS }),
  fb: new THREE.MeshLambertMaterial({ color: 0xc8c8d0, side: DS }),
  fg: new THREE.MeshLambertMaterial({ color: 0x606060, side: DS }),
  fs: new THREE.MeshLambertMaterial({ color: 0xb08040, side: DS }),
  ft: new THREE.MeshLambertMaterial({ color: 0xa08060, side: DS }),
  cl: new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS }),
  rf: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  wn: new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.35, transparent: true, side: DS }),
  wf: new THREE.MeshLambertMaterial({ color: 0x222222, side: DS }),
  dr: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS }),
  df: new THREE.MeshLambertMaterial({ color: 0x333333, side: DS }),
  st: new THREE.MeshLambertMaterial({ color: 0x888888, side: DS }),
  sr: new THREE.MeshLambertMaterial({ color: 0x444444, side: DS }),
  // Furniture
  sf: new THREE.MeshLambertMaterial({ color: 0x404040, side: DS }),
  tb: new THREE.MeshLambertMaterial({ color: 0xb09060, side: DS }),
  tm: new THREE.MeshLambertMaterial({ color: 0x555555, side: DS }),
  ch: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS }),
  ct: new THREE.MeshLambertMaterial({ color: 0xdedcd4, side: DS }),
  cd: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  tv: new THREE.MeshLambertMaterial({ color: 0x0a0a0a, side: DS }),
  bd: new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS }),
  bs: new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS }),
  pw: new THREE.MeshLambertMaterial({ color: 0xe8e0d0, side: DS }),
  tl: new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS }),
  sk: new THREE.MeshLambertMaterial({ color: 0xe4e4e4, side: DS }),
  bt: new THREE.MeshLambertMaterial({ color: 0xf4f4f4, side: DS }),
  mr: new THREE.MeshLambertMaterial({ color: 0xaaccdd, side: DS }),
  wd: new THREE.MeshLambertMaterial({ color: 0x7a6040, side: DS }),
  sh: new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS }),
  sw: new THREE.MeshLambertMaterial({ color: 0xbbddee, opacity: 0.3, transparent: true, side: DS }),
  fr: new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS }),
  stn: new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS }),
  dk: new THREE.MeshLambertMaterial({ color: 0xc0a878, side: DS }),
  mn: new THREE.MeshLambertMaterial({ color: 0x111111, side: DS }),
  // Gym
  gm: new THREE.MeshLambertMaterial({ color: 0x333333, side: DS }),
  gr: new THREE.MeshLambertMaterial({ color: 0xcc3333, side: DS }),
  // Sauna
  sa: new THREE.MeshLambertMaterial({ color: 0xc09050, side: DS }),
  // Pool
  pw2: new THREE.MeshLambertMaterial({ color: 0x4488cc, opacity: 0.6, transparent: true, side: DS }),
  pt: new THREE.MeshLambertMaterial({ color: 0x88aacc, side: DS }),
  rl: new THREE.MeshLambertMaterial({ color: 0x444444, side: DS }),
};

function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function pln(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }

const DW = 20, DD = 14; // building dims

export function createRezidence(scene, cx = -70, cz = 40) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // ── GROUND FLOOR ──
  buildFloor(g, 0);
  buildCeiling(g, 0);
  buildOuterWalls(g, 0);
  buildPrizemiWalls(g);
  buildPrizemiDoors(g);
  furnishPrizemi(g);

  // ── 2ND FLOOR ──
  buildFloor(g, FH);
  buildCeiling(g, FH);
  buildOuterWalls(g, FH);
  buildPatroWalls(g);
  buildPatroDoors(g);
  furnishPatro(g);

  // ── ROOF ──
  const roof = box(DW + 0.6, 0.25, DD + 0.6, m.rf);
  roof.position.set(DW / 2, FH * 2 + 0.125, DD / 2);
  g.add(roof);

  // ── STAIRWELL (both floors) ──
  buildStairs(g);

  // ── WINDOWS ──
  buildWindowsPrizemi(g);
  buildWindowsPatro(g);

  // ── POOL ──
  buildPool(g);

  scene.add(g);
}

function buildFloor(g, y) {
  const f = box(DW, 0.15, DD, m.fl);
  f.position.set(DW / 2, y + 0.075, DD / 2);
  g.add(f);
}

function buildCeiling(g, y) {
  const c = pln(DW - 0.2, DD - 0.2, m.cl);
  c.rotation.x = Math.PI / 2;
  c.position.set(DW / 2, y + FH - 0.01, DD / 2);
  g.add(c);
}

function buildOuterWalls(g, y) {
  wZ(g, 0, 0, DW, y, m.wo);        // north
  wZ(g, 0, DD, DW, y, m.wo);       // south
  wX(g, 0, 0, DD, y, m.wo);        // west
  wX(g, DW, 0, DD, y, m.wa);       // east (accent)
}

// ═══════════════════════════════
// PŘÍZEMÍ WALLS
// ═══════════════════════════════

function buildPrizemiWalls(g) {
  const y = 0;
  // Sauna (0,0) 3.5×3.5
  wX(g, 3.5, 0, 1.5, y, m.wi);  // right wall of sauna (gap 1.5-2.5 for door)
  wX(g, 3.5, 2.5, 1, y, m.wi);
  wZ(g, 0, 3.5, 3.5, y, m.wi);  // bottom wall of sauna

  // Sprcha (4, 0) 2.5×3.5
  // Left wall = sauna right wall
  wZ(g, 4, 3.5, 2.5, y, m.wi);  // bottom
  // Right wall shared with gap to hala

  // Vstupní hala (7, 0) 4×3.5
  wX(g, 7, 0, 1.5, y, m.wi);    // left (gap 1.5-2.5 for door from sprcha)
  wX(g, 7, 2.5, 1, y, m.wi);
  wZ(g, 7, 3.5, 1, y, m.wi);    // bottom-left
  // gap 8-10 for průchod to obývák
  wZ(g, 10, 3.5, 1.5, y, m.wi); // bottom-right

  // Schodiště (11.5, 0) 3×5
  wX(g, 11.5, 0, 1.5, y, m.wi);  // left (gap 1.5-2.5 door from hala)
  wX(g, 11.5, 2.5, 1, y, m.wi);
  wX(g, 14.5, 0, 5, y, m.wi);    // right wall of stairs
  wZ(g, 11.5, 5, 3, y, m.wi);    // bottom of stairs

  // WC (15, 0) 2.5×2.5
  // Left = stairs right wall
  wZ(g, 15, 2.5, 2.5, y, m.wi);  // bottom

  // Posilovna (0, 4) 6.5×10 | Obývák (7, 5.5) 13×8.5
  wX(g, 6.5, 4, 4, y, m.wi);     // divider top (gap 8-9 for door)
  wX(g, 6.5, 9, 5, y, m.wi);     // divider bottom
  wZ(g, 0, 4, 6.5, y, m.wi);     // top of posilovna

  // Obývák top wall (below hala/stairs area)
  wZ(g, 7, 5.5, 4.5, y, m.wi);   // left of průchod from hala
  wZ(g, 14.5, 5.5, 5.5, y, m.wi); // right side
}

// ═══════════════════════════════
// 2. PATRO WALLS
// ═══════════════════════════════

function buildPatroWalls(g) {
  const y = FH;
  // Hlavní ložnice (0,0) 7×5
  wX(g, 7, 0, 2, y, m.wi);      // right (gap 2-3 door to koupelna)
  wX(g, 7, 3, 2, y, m.wi);
  wZ(g, 0, 5, 3, y, m.wi);      // bottom-left (gap 3-4 door to chodba)
  wZ(g, 4, 5, 3, y, m.wi);

  // Koupelna hlavní (7.5, 0) 3.5×5
  wX(g, 11, 0, 5, y, m.wb);     // right
  wZ(g, 7.5, 5, 3.5, y, m.wb);  // bottom

  // Schodiště (11.5, 0) 3×5
  wX(g, 11.5, 0, 5, y, m.wi);   // left
  wX(g, 14.5, 0, 5, y, m.wi);   // right
  wZ(g, 11.5, 5, 1, y, m.wi);   // bottom-left (gap 12-14 for door)
  wZ(g, 14, 5, 0.5, y, m.wi);

  // Dětský pokoj 1 (15, 0) 5×5
  wX(g, 15, 0, 5, y, m.wi);     // left
  wZ(g, 15, 5, 1.5, y, m.wi);   // bottom-left (gap 16.5-17.5)
  wZ(g, 17.5, 5, 2.5, y, m.wi);

  // Chodba (0, 5.5) 20×2 — walls are the room boundaries above/below

  // Dětský pokoj 2 (0, 8) 6×6
  wZ(g, 0, 7.5, 3, y, m.wi);     // top-left (gap 3-4)
  wZ(g, 4, 7.5, 2, y, m.wi);
  wX(g, 6, 7.5, 6.5, y, m.wi);   // right

  // Koupelna společná (6.5, 8) 3.5×3
  wZ(g, 6.5, 7.5, 2, y, m.wb);   // top-left (gap 8-9)
  wZ(g, 9, 7.5, 1, y, m.wb);
  wX(g, 10, 7.5, 3.5, y, m.wb);  // right
  wZ(g, 6.5, 11, 3.5, y, m.wb);  // bottom

  // Pracovna (10.5, 8) 9.5×6
  wZ(g, 10.5, 7.5, 3.5, y, m.wi); // top-left (gap 14-15)
  wZ(g, 15, 7.5, 5, y, m.wi);
}

// ═══════════════════════════════
// DOORS
// ═══════════════════════════════

function buildPrizemiDoors(g) {
  const y = 0;
  // Main entrance (north wall, x=8..10)
  addDoor(g, 8, y, 0, 2, 'z', true);
  // Hala→schody
  addDoor(g, 11.5, y, 1.5, 1, 'x', false);
  // Hala→sprcha
  addDoor(g, 7, y, 1.5, 1, 'x', false);
  // Sprcha→sauna
  addDoor(g, 3.5, y, 1.5, 1, 'x', false);
  // Hala→WC
  addDoor(g, 14.5, y, 1, 1, 'x', false);
  // Hala→obývák (wide opening)
  addDoor(g, 8, y, 5.5, 2, 'z', false);
  // Obývák→posilovna
  addDoor(g, 6.5, y, 8, 1, 'x', false);
  // Obývák→bazén (sliding glass door in east wall)
  addDoor(g, DW, y, 9, 2, 'x', true);
}

function buildPatroDoors(g) {
  const y = FH;
  // Schody→chodba
  addDoor(g, 12, y, 5, 2, 'z', false);
  // Chodba→hlavní ložnice
  addDoor(g, 3, y, 5, 1, 'z', false);
  // Ložnice→koupelna
  addDoor(g, 7, y, 2, 1, 'x', false);
  // Chodba→dětský 1
  addDoor(g, 16.5, y, 5, 1, 'z', false);
  // Chodba→dětský 2
  addDoor(g, 3, y, 7.5, 1, 'z', false);
  // Chodba→koupelna společná
  addDoor(g, 8, y, 7.5, 1, 'z', false);
  // Chodba→pracovna
  addDoor(g, 14, y, 7.5, 1, 'z', false);
}

function addDoor(g, x, y, z, w, axis, isEntrance) {
  const mat = isEntrance ? m.dr : m.dr;
  if (axis === 'z') {
    const d = box(w, 2.2, IW + 0.02, mat);
    d.position.set(x + w / 2, y + 1.1, z);
    g.add(d);
  } else {
    const d = box(IW + 0.02, 2.2, w, mat);
    d.position.set(x, y + 1.1, z + w / 2);
    g.add(d);
  }
}

// ═══════════════════════════════
// STAIRS
// ═══════════════════════════════

function buildStairs(g) {
  // Stairwell at (11.5, 0) 3×5m, both floors
  const sx = 11.5, sz = 0;
  const stepsPerFlight = 10;
  const stepH = FH / (stepsPerFlight * 2);
  const stepD = 2.2 / stepsPerFlight;

  // First flight going south
  for (let s = 0; s < stepsPerFlight; s++) {
    const step = box(2.6, stepH, stepD, m.st);
    step.position.set(sx + 1.5, s * stepH + stepH / 2, sz + 0.3 + s * stepD);
    g.add(step);
  }
  // Landing
  const landing = box(2.6, 0.15, 1.5, m.st);
  landing.position.set(sx + 1.5, FH / 2, sz + 3.5);
  g.add(landing);
  // Second flight going north
  for (let s = 0; s < stepsPerFlight; s++) {
    const step = box(2.6, stepH, stepD, m.st);
    step.position.set(sx + 1.5, FH / 2 + s * stepH + stepH / 2, sz + 4.2 - s * stepD);
    g.add(step);
  }

  // Railings
  for (const side of [-1, 1]) {
    const rx = sx + 1.5 + side * 1.2;
    for (let s = 0; s <= stepsPerFlight; s += 3) {
      const post = box(0.04, 1, 0.04, m.sr);
      post.position.set(rx, s * stepH + 0.5, sz + 0.3 + s * stepD);
      g.add(post);
    }
  }

  // Stairwell floor overlay
  addFloorOverlay(g, sx, sz, 3, 5, m.fh, 0);
}

// ═══════════════════════════════
// WINDOWS
// ═══════════════════════════════

function buildWindowsPrizemi(g) {
  // North wall — sauna, hala area
  addWin(g, 1.5, 0.8, 0, 1.2, 1.5, 'z', 0);
  addWin(g, 5, 0.8, 0, 1.0, 1.2, 'z', 0);
  addWin(g, 16, 1.0, 0, 1.0, 1.0, 'z', 0); // WC

  // South wall — obývák + posilovna
  addWin(g, 2, 0.5, DD, 2.0, 2.2, 'z', 0);   // posilovna
  addWin(g, 10, 0.4, DD, 2.5, 2.4, 'z', 0);   // obývák
  addWin(g, 15, 0.4, DD, 2.5, 2.4, 'z', 0);   // obývák

  // West wall — sauna + posilovna
  addWin(g, 0, 0.8, 1.5, 1.0, 1.2, 'x', 0);
  addWin(g, 0, 0.4, 7, 2.0, 2.2, 'x', 0);
  addWin(g, 0, 0.4, 11, 2.0, 2.2, 'x', 0);

  // East wall — obývák panorama
  addWin(g, DW, 0.3, 7, 3.0, 2.5, 'x', 0);
  addWin(g, DW, 0.3, 12, 2.0, 2.0, 'x', 0);
}

function buildWindowsPatro(g) {
  const y = FH;
  // North — ložnice, dětský 1
  addWin(g, 2, 0.5, 0, 2.5, 2.2, 'z', y);
  addWin(g, 16.5, 0.5, 0, 2.0, 2.0, 'z', y);

  // South — dětský 2, pracovna
  addWin(g, 2, 0.5, DD, 2.0, 2.0, 'z', y);
  addWin(g, 13, 0.4, DD, 2.5, 2.2, 'z', y);
  addWin(g, 18, 0.5, DD, 1.5, 1.8, 'z', y);

  // West — ložnice + dětský 2
  addWin(g, 0, 0.5, 2, 2.0, 2.0, 'x', y);
  addWin(g, 0, 0.5, 10, 2.0, 2.0, 'x', y);

  // East — dětský 1 + pracovna
  addWin(g, DW, 0.5, 2, 1.8, 2.0, 'x', y);
  addWin(g, DW, 0.5, 10, 2.5, 2.2, 'x', y);
}

// ═══════════════════════════════
// POOL
// ═══════════════════════════════

function buildPool(g) {
  // Pool next to house: x=22..32, z=1..13 (shifted to be beside east wall)
  const px = 22, pz = 2, pw = 10, pd = 10;

  // Pool basin
  const basin = box(pw, 0.1, pd, m.pt);
  basin.position.set(px + pw / 2, -0.5, pz + pd / 2);
  g.add(basin);
  // Water surface
  const water = pln(pw - 0.4, pd - 0.4, m.pw2);
  water.rotation.x = -Math.PI / 2;
  water.position.set(px + pw / 2, -0.1, pz + pd / 2);
  g.add(water);
  // Pool edges
  const edgeN = box(pw + 0.6, 0.15, 0.5, m.pt);
  edgeN.position.set(px + pw / 2, 0.075, pz - 0.2);
  g.add(edgeN);
  const edgeS = box(pw + 0.6, 0.15, 0.5, m.pt);
  edgeS.position.set(px + pw / 2, 0.075, pz + pd + 0.2);
  g.add(edgeS);
  const edgeW = box(0.5, 0.15, pd + 0.4, m.pt);
  edgeW.position.set(px - 0.2, 0.075, pz + pd / 2);
  g.add(edgeW);
  const edgeE = box(0.5, 0.15, pd + 0.4, m.pt);
  edgeE.position.set(px + pw + 0.2, 0.075, pz + pd / 2);
  g.add(edgeE);
  // Terrace floor around pool
  const terrace = box(pw + 3, 0.08, pd + 3, m.ft);
  terrace.position.set(px + pw / 2, 0.04, pz + pd / 2);
  g.add(terrace);
}

// ═══════════════════════════════
// FURNISH PŘÍZEMÍ
// ═══════════════════════════════

function furnishPrizemi(g) {
  const y = 0;

  // ── Sauna (0,0) 3.5×3.5 ──
  addFloorOverlay(g, 0, 0, 3.5, 3.5, m.fs, y);
  // Benches (2 levels)
  const bench1 = box(2.5, 0.08, 0.6, m.sa);
  bench1.position.set(1.3, y + 0.45, 0.4);
  g.add(bench1);
  const bench1legs = box(2.5, 0.43, 0.05, m.sa);
  bench1legs.position.set(1.3, y + 0.22, 0.7);
  g.add(bench1legs);
  const bench2 = box(2.5, 0.08, 0.6, m.sa);
  bench2.position.set(1.3, y + 0.9, 0.4);
  g.add(bench2);
  // Heater
  const heater = box(0.5, 0.6, 0.5, m.gm);
  heater.position.set(3, y + 0.3, 3);
  g.add(heater);

  // ── Sprcha (4,0) 2.5×3.5 ──
  addFloorOverlay(g, 4, 0, 2.5, 3.5, m.fb, y);
  // Shower
  const showerTray = box(0.9, 0.06, 0.9, m.sk);
  showerTray.position.set(5, y + 0.03, 0.55);
  g.add(showerTray);
  const showerGlass = pln(0.9, 2.0, m.sw);
  showerGlass.position.set(5, y + 1.0, 1.0);
  g.add(showerGlass);

  // ── Vstupní hala (7,0) 4×3.5 ──
  addFloorOverlay(g, 7, 0, 4, 3.5, m.fh, y);
  // Shoe rack
  const shoes = box(1.0, 0.4, 0.3, m.sh);
  shoes.position.set(10.5, y + 0.2, 0.25);
  g.add(shoes);

  // ── WC (15,0) 2.5×2.5 ──
  addFloorOverlay(g, 15, 0, 2.5, 2.5, m.fb, y);
  const toilet = box(0.38, 0.35, 0.5, m.tl);
  toilet.position.set(16, y + 0.175, 2);
  g.add(toilet);
  const tank = box(0.33, 0.25, 0.18, m.tl);
  tank.position.set(16, y + 0.32, 2.3);
  g.add(tank);
  const wcSink = box(0.45, 0.06, 0.35, m.sk);
  wcSink.position.set(17, y + 0.7, 0.3);
  g.add(wcSink);

  // ── Posilovna (0,4) 6.5×10 ──
  addFloorOverlay(g, 0, 4, 6.5, 10, m.fg, y);
  // Treadmill
  const treadmill = box(0.8, 1.2, 1.8, m.gm);
  treadmill.position.set(1, y + 0.6, 6);
  g.add(treadmill);
  // Bench press
  const benchPress = box(0.6, 0.5, 1.6, m.gm);
  benchPress.position.set(3, y + 0.25, 9);
  g.add(benchPress);
  const bpBar = box(1.8, 0.04, 0.04, m.sr);
  bpBar.position.set(3, y + 0.7, 9);
  g.add(bpBar);
  // Rack
  const rack = box(1.5, 2.0, 0.4, m.gm);
  rack.position.set(5.5, y + 1.0, 12);
  g.add(rack);
  // Dumbbells
  for (let i = 0; i < 4; i++) {
    const db = box(0.4, 0.15, 0.15, m.sr);
    db.position.set(5.5 - 0.6 + i * 0.4, y + 0.5, 12);
    g.add(db);
  }
  // Mat
  const mat2 = pln(1.8, 0.8, m.gr);
  mat2.rotation.x = -Math.PI / 2;
  mat2.position.set(1, y + 0.16, 10);
  g.add(mat2);
  // Mirror on west wall
  const gymMirror = pln(4, 2, m.mr);
  gymMirror.rotation.y = Math.PI / 2;
  gymMirror.position.set(0.02, y + 1.5, 9);
  g.add(gymMirror);

  // ── Obývák+kuchyně (7, 5.5) 13×8.5 ──
  // Kitchen counter along south wall
  const counter = box(4, 0.9, 0.6, m.ct);
  counter.position.set(9, y + 0.45, DD - 0.4);
  g.add(counter);
  const stove = box(0.6, 0.03, 0.55, m.stn);
  stove.position.set(8, y + 0.92, DD - 0.4);
  g.add(stove);
  const island = box(2.5, 0.9, 0.8, m.cd);
  island.position.set(9, y + 0.45, DD - 2);
  g.add(island);
  const fridge = box(0.7, 1.9, 0.65, m.fr);
  fridge.position.set(11.5, y + 0.95, DD - 0.4);
  g.add(fridge);

  // Dining table
  const dTable = box(2.0, 0.04, 1.0, m.tb);
  dTable.position.set(14, y + 0.74, DD - 2.5);
  g.add(dTable);
  for (const dx of [-0.8, 0.8]) {
    const leg = box(0.04, 0.72, 0.8, m.tm);
    leg.position.set(14 + dx, y + 0.36, DD - 2.5);
    g.add(leg);
  }

  // Sofa — facing east wall (toward pool view)
  const sofa = box(2.8, 0.35, 0.85, m.sf);
  sofa.position.set(15, y + 0.275, 8);
  g.add(sofa);
  const sofaBack = box(2.8, 0.3, 0.12, m.sf);
  sofaBack.position.set(15, y + 0.5, 7.55);
  g.add(sofaBack);

  // Coffee table
  const coffee = box(1.2, 0.03, 0.6, m.tb);
  coffee.position.set(15, y + 0.35, 9);
  g.add(coffee);

  // TV on south-east area
  const tvP = box(1.5, 0.85, 0.04, m.tv);
  tvP.position.set(15, y + 1.5, 5.6);
  g.add(tvP);
}

// ═══════════════════════════════
// FURNISH 2. PATRO
// ═══════════════════════════════

function furnishPatro(g) {
  const y = FH;

  // ── Chodba (0, 5.5) 20×2 ──
  addFloorOverlay(g, 0, 5.5, 20, 2, m.fh, y);

  // ── Hlavní ložnice (0,0) 7×5 ──
  const bed = box(1.8, 0.3, 2.1, m.bd);
  bed.position.set(3.5, y + 0.25, 2.5);
  g.add(bed);
  const headboard = box(1.8, 0.6, 0.06, m.bd);
  headboard.position.set(3.5, y + 0.5, 0.2);
  g.add(headboard);
  const mattress = box(1.7, 0.15, 2.0, m.bs);
  mattress.position.set(3.5, y + 0.475, 2.5);
  g.add(mattress);
  for (const dx of [-0.4, 0.4]) {
    const pil = box(0.5, 0.1, 0.35, m.pw);
    pil.position.set(3.5 + dx, y + 0.6, 0.6);
    g.add(pil);
  }
  for (const sx of [2.1, 4.9]) {
    const ns = box(0.45, 0.4, 0.4, m.tb);
    ns.position.set(sx, y + 0.2, 0.5);
    g.add(ns);
  }
  const ward = box(2.0, 2.2, 0.55, m.wd);
  ward.position.set(1.2, y + 1.1, 4.5);
  g.add(ward);

  // ── Koupelna hlavní (7.5,0) 3.5×5 ──
  addFloorOverlay(g, 7.5, 0, 3.5, 5, m.fb, y);
  const tub = box(0.7, 0.5, 1.6, m.bt);
  tub.position.set(8, y + 0.25, 1);
  g.add(tub);
  const bSink = box(0.6, 0.06, 0.45, m.sk);
  bSink.position.set(10.5, y + 0.8, 0.4);
  g.add(bSink);
  const bMirror = pln(0.6, 0.8, m.mr);
  bMirror.position.set(10.5, y + 1.5, 0.06);
  g.add(bMirror);
  const bToilet = box(0.38, 0.35, 0.5, m.tl);
  bToilet.position.set(8, y + 0.175, 4);
  g.add(bToilet);

  // ── Dětský pokoj 1 (15,0) 5×5 ──
  const bed1 = box(0.9, 0.3, 2.0, m.bd);
  bed1.position.set(17, y + 0.25, 1.2);
  g.add(bed1);
  const matt1 = box(0.85, 0.12, 1.9, m.bs);
  matt1.position.set(17, y + 0.42, 1.2);
  g.add(matt1);
  const desk1 = box(1.2, 0.04, 0.6, m.dk);
  desk1.position.set(19, y + 0.72, 4);
  g.add(desk1);
  const shelf1 = box(1.5, 1.5, 0.3, m.sh);
  shelf1.position.set(15.5, y + 0.75, 4);
  g.add(shelf1);

  // ── Dětský pokoj 2 (0,8) 6×6 ──
  const bed2 = box(0.9, 0.3, 2.0, m.bd);
  bed2.position.set(2, y + 0.25, 10);
  g.add(bed2);
  const matt2 = box(0.85, 0.12, 1.9, m.bs);
  matt2.position.set(2, y + 0.42, 10);
  g.add(matt2);
  const desk2 = box(1.2, 0.04, 0.6, m.dk);
  desk2.position.set(1, y + 0.72, 13);
  g.add(desk2);
  const shelf2 = box(1.5, 1.5, 0.3, m.sh);
  shelf2.position.set(5, y + 0.75, 13);
  g.add(shelf2);

  // ── Koupelna společná (6.5,8) 3.5×3 ──
  addFloorOverlay(g, 6.5, 8, 3.5, 3, m.fb, y);
  const shTray = box(0.9, 0.06, 0.9, m.sk);
  shTray.position.set(7, y + 0.03, 8.5);
  g.add(shTray);
  const shGlass = pln(0.9, 2.0, m.sw);
  shGlass.position.set(7, y + 1.0, 9.0);
  g.add(shGlass);
  const s2Sink = box(0.5, 0.06, 0.4, m.sk);
  s2Sink.position.set(9.5, y + 0.75, 8.5);
  g.add(s2Sink);
  const s2Toilet = box(0.38, 0.35, 0.5, m.tl);
  s2Toilet.position.set(7, y + 0.175, 10.5);
  g.add(s2Toilet);

  // ── Pracovna (10.5,8) 9.5×6 ──
  const pDesk = box(2.0, 0.04, 0.8, m.dk);
  pDesk.position.set(15, y + 0.74, 10);
  g.add(pDesk);
  for (const dx of [-0.8, 0.8]) {
    const leg = box(0.04, 0.72, 0.6, m.tm);
    leg.position.set(15 + dx, y + 0.36, 10);
    g.add(leg);
  }
  const mon = box(0.6, 0.4, 0.03, m.mn);
  mon.position.set(15, y + 1.1, 9.7);
  g.add(mon);
  const bookshelf = box(3.0, 2.2, 0.35, m.sh);
  bookshelf.position.set(12, y + 1.1, 13.5);
  g.add(bookshelf);
  for (let i = 1; i <= 5; i++) {
    const board = box(2.9, 0.03, 0.33, m.sh);
    board.position.set(12, y + i * 0.4, 13.5);
    g.add(board);
  }
  // Reading chair
  const rChair = box(0.7, 0.35, 0.7, m.sf);
  rChair.position.set(18, y + 0.275, 12);
  g.add(rChair);
  const rChairBack = box(0.7, 0.4, 0.1, m.sf);
  rChairBack.position.set(18, y + 0.55, 12.35);
  g.add(rChairBack);
}

// ═══════════════════════════════
// HELPERS
// ═══════════════════════════════

function wZ(g, x, z, len, y, mat) {
  const w = box(len, FH, WALL, mat);
  w.position.set(x + len / 2, y + FH / 2, z);
  g.add(w);
}
function wX(g, x, z, len, y, mat) {
  const w = box(WALL, FH, len, mat);
  w.position.set(x, y + FH / 2, z + len / 2);
  g.add(w);
}

function addFloorOverlay(g, x, z, w, d, mat, y) {
  const f = pln(w, d, mat);
  f.rotation.x = -Math.PI / 2;
  f.position.set(x + w / 2, y + 0.16, z + d / 2);
  g.add(f);
}

function addWin(g, x, sillY, z, w, h, axis, floorY) {
  if (axis === 'z') {
    const off = z < DD / 2 ? 0.1 : -0.1;
    const glass = pln(w, h, m.wn);
    glass.position.set(x, floorY + sillY + h / 2, z + off);
    g.add(glass);
    const t = box(w + 0.04, 0.03, 0.06, m.wf); t.position.set(x, floorY + sillY + h, z + off); g.add(t);
    const b = box(w + 0.04, 0.03, 0.06, m.wf); b.position.set(x, floorY + sillY, z + off); g.add(b);
    const l = box(0.03, h, 0.06, m.wf); l.position.set(x - w / 2, floorY + sillY + h / 2, z + off); g.add(l);
    const r = box(0.03, h, 0.06, m.wf); r.position.set(x + w / 2, floorY + sillY + h / 2, z + off); g.add(r);
  } else {
    const off = x < DW / 2 ? 0.1 : -0.1;
    const glass = pln(w, h, m.wn);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(x + off, floorY + sillY + h / 2, z);
    g.add(glass);
    const t = box(0.06, 0.03, w + 0.04, m.wf); t.position.set(x + off, floorY + sillY + h, z); g.add(t);
    const b = box(0.06, 0.03, w + 0.04, m.wf); b.position.set(x + off, floorY + sillY, z); g.add(b);
    const l = box(0.06, h, 0.03, m.wf); l.position.set(x + off, floorY + sillY + h / 2, z - w / 2); g.add(l);
    const r = box(0.06, h, 0.03, m.wf); r.position.set(x + off, floorY + sillY + h / 2, z + w / 2); g.add(r);
  }
}
