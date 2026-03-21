import * as THREE from 'three';

// Moderní vila - L-shaped, plochá střecha
// MCP plan coords used directly: plan-x → 3D x, plan-y → 3D z
// Vila internal: 16m × 13m
// Rooms (relative to vila origin):
//   openspace:  (0, 0)     10×6m
//   pracovna:   (10.5, 0)  5.5×3m
//   vstup:      (10.5, 3.5) 5.5×2.5m
//   loznice:    (0, 6.5)   7×6.5m
//   koupelna:   (7.5, 6.5) 3×3m
//   satna:      (7.5, 10)  3×3m
//   terasa:     (11, 6.5)  5×6.5m

const DS = THREE.DoubleSide;
const WALL = 0.15;
const IWALL = 0.1;
const H = 3.0; // floor height

const m = {
  wo: new THREE.MeshLambertMaterial({ color: 0xf0ece4, side: DS }),
  wa: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS }),
  wi: new THREE.MeshLambertMaterial({ color: 0xfaf6f0, side: DS }),
  wb: new THREE.MeshLambertMaterial({ color: 0xe8e8f0, side: DS }),
  fl: new THREE.MeshLambertMaterial({ color: 0xc4a06a, side: DS }),
  fd: new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS }),
  fb: new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS }),
  ft: new THREE.MeshLambertMaterial({ color: 0xb09070, side: DS }),
  cl: new THREE.MeshLambertMaterial({ color: 0xf5f2ec, side: DS }),
  rf: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  wn: new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.35, transparent: true, side: DS }),
  wf: new THREE.MeshLambertMaterial({ color: 0x222222, side: DS }),
  dr: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  sf: new THREE.MeshLambertMaterial({ color: 0x404040, side: DS }),
  sc: new THREE.MeshLambertMaterial({ color: 0x505050, side: DS }),
  tb: new THREE.MeshLambertMaterial({ color: 0xb09060, side: DS }),
  tm: new THREE.MeshLambertMaterial({ color: 0x555555, side: DS }),
  ch: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS }),
  ct: new THREE.MeshLambertMaterial({ color: 0xe0dcd4, side: DS }),
  cd: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  tv: new THREE.MeshLambertMaterial({ color: 0x0a0a0a, side: DS }),
  bd: new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS }),
  bs: new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS }),
  pw: new THREE.MeshLambertMaterial({ color: 0xe8e0d0, side: DS }),
  wd: new THREE.MeshLambertMaterial({ color: 0x7a6040, side: DS }),
  sh: new THREE.MeshLambertMaterial({ color: 0x8a7050, side: DS }),
  tl: new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS }),
  sk: new THREE.MeshLambertMaterial({ color: 0xe4e4e4, side: DS }),
  bt: new THREE.MeshLambertMaterial({ color: 0xf4f4f4, side: DS }),
  sw: new THREE.MeshLambertMaterial({ color: 0xbbddee, opacity: 0.3, transparent: true, side: DS }),
  mr: new THREE.MeshLambertMaterial({ color: 0xaaccdd, side: DS }),
  cp: new THREE.MeshLambertMaterial({ color: 0x606060, side: DS }),
  pt: new THREE.MeshLambertMaterial({ color: 0x3a6a3a, side: DS }),
  po: new THREE.MeshLambertMaterial({ color: 0x8a5a3a, side: DS }),
  dk: new THREE.MeshLambertMaterial({ color: 0xc0a878, side: DS }),
  mn: new THREE.MeshLambertMaterial({ color: 0x111111, side: DS }),
  rl: new THREE.MeshLambertMaterial({ color: 0x444444, side: DS }),
  fr: new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS }),
  st: new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS }),
};

function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function pln(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }

// 3D position: plan (75,120) in 200×200 world → 3D (75-100, 120-100) = (-25, 20)
export function createVila(scene, cx = -25, cz = 20) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // ── STRUCTURE ──
  buildMainBlockWalls(g);
  buildWingWalls(g);
  buildFloors(g);
  buildCeilings(g);
  buildRoofs(g);
  buildWindows(g);

  // ── ROOMS ──
  furnishOpenspace(g);
  furnishPracovna(g);
  furnishVstup(g);
  furnishLoznice(g);
  furnishKoupelna(g);
  furnishSatna(g);
  furnishTerasa(g);

  scene.add(g);
}

// ════════════════════════════════════════
// WALLS (from MCP layout, coords in meters)
// ════════════════════════════════════════

function buildMainBlockWalls(g) {
  // Main block: (0,0) 16×6
  wallZ(g, 0, 0, 16, m.wo);        // front
  wallZ(g, 0, 6, 10.5, m.wo);      // back (openspace portion)
  wallX(g, 0, 0, 6, m.wo);         // left
  wallX(g, 16, 0, 6, m.wa);        // right (accent)

  // Pracovna/vstup outer walls
  wallZ(g, 10.5, 0, 5.5, m.wo);    // front (already covered by main front)
  // Inner divider openspace | pracovna+vstup at x=10.5
  wallX_partial(g, 10.5, 0, 1.0, m.wi);     // top section
  wallX_partial(g, 10.5, 1.8, 1.5, m.wi);   // mid section (door gap at 1.0-1.8)
  wallX_partial(g, 10.5, 4.2, 1.8, m.wi);   // bottom section (door gap at 3.3-4.2)

  // Divider pracovna | vstup at y=3.5
  wallZ_partial(g, 10.5, 3.5, 2, m.wi);     // left section
  wallZ_partial(g, 13.3, 3.5, 2.7, m.wi);   // right section (door gap 12.5-13.3)
}

function buildWingWalls(g) {
  // Wing: ložnice (0, 6.5) 7×6.5, koupelna (7.5, 6.5) 3×3, šatna (7.5, 10) 3×3
  wallX(g, 0, 6.5, 6.5, m.wo);     // left (ložnice)
  wallZ(g, 0, 13, 10.5, m.wo);     // bottom

  // Divider ložnice | koupelna+šatna at x=7.5
  wallX_partial(g, 7.5, 6.5, 1.5, m.wi);    // top
  wallX_partial(g, 7.5, 8.8, 1.2, m.wi);    // mid (door gap 8.0-8.8 koupelna)
  wallX_partial(g, 7.5, 10.8, 2.2, m.wi);   // bottom section (door gap 10.0-10.8 šatna)

  // Divider koupelna | šatna at y=10
  wallZ(g, 7.5, 10, 3, m.wb);

  // Right wall of wing (koupelna+šatna) at x=10.5
  wallX(g, 10.5, 6.5, 6.5, m.wo);

  // Transition wall openspace → ložnice at y=6.5
  wallZ_partial(g, 0, 6.5, 3, m.wi);       // left section
  wallZ_partial(g, 3.8, 6.5, 3.7, m.wi);   // right section (door gap 3.0-3.8)

  // Terasa area (11, 6.5) 5×6.5 — no walls, just railing
}

// ════════════════════════════════════════
// FLOORS, CEILINGS, ROOFS
// ════════════════════════════════════════

function buildFloors(g) {
  // Main block floor
  addFloor(g, 0, 0, 16, 6, m.fl);
  // Vstup darker floor
  addFloor(g, 10.5, 3.5, 5.5, 2.5, m.fd);
  // Wing floor
  addFloor(g, 0, 6.5, 10.5, 6.5, m.fl);
  // Koupelna floor
  addFloor(g, 7.5, 6.5, 3, 3, m.fb);
  // Terasa deck
  addFloor(g, 11, 6.5, 5, 6.5, m.ft);
}

function buildCeilings(g) {
  addCeiling(g, 0, 0, 16, 6);
  addCeiling(g, 0, 6.5, 10.5, 6.5);
}

function buildRoofs(g) {
  // Flat modern roofs with overhang
  const r1 = box(16.5, 0.2, 6.5, m.rf);
  r1.position.set(8, H + 0.1, 3);
  g.add(r1);
  const r2 = box(11, 0.2, 7, m.rf);
  r2.position.set(5.25, H + 0.1, 9.75);
  g.add(r2);
}

// ════════════════════════════════════════
// WINDOWS
// ════════════════════════════════════════

function buildWindows(g) {
  // Front wall (y=0 → z=0): 3 large windows
  for (const x of [1.5, 5, 8.5]) addWin(g, x, 0.4, 0, 2.0, 2.2, 'z');
  addWin(g, 13, 0.5, 0, 1.5, 2.0, 'z'); // pracovna window

  // Back openspace wall (z=6): 2 panorama windows
  addWin(g, 2.5, 0.3, 6, 3.0, 2.4, 'z');
  addWin(g, 7.5, 0.3, 6, 2.5, 2.4, 'z');

  // Left wall (x=0): bedroom window
  addWin(g, 0, 0.3, 9, 2.5, 2.4, 'x');

  // Bottom wall (z=13): bedroom + closet windows
  addWin(g, 3, 0.5, 13, 2.0, 1.8, 'z');
  addWin(g, 9, 0.8, 13, 1.2, 1.2, 'z');

  // Right accent wall: entrance sidelight
  addWin(g, 16, 0.6, 1.5, 1.0, 2.0, 'x');

  // Koupelna small window
  addWin(g, 10.5, 1.2, 7.5, 0.8, 0.8, 'x');

  // Entrance door
  const eDoor = box(WALL + 0.02, 2.4, 1.2, m.dr);
  eDoor.position.set(16, 1.2, 4.75);
  g.add(eDoor);
}

// ════════════════════════════════════════
// FURNITURE (positions directly from MCP)
// ════════════════════════════════════════

function furnishOpenspace(g) {
  // Origin: (0, 0), 10×6m

  // Kuchyňská linka: (0.2, 5.2) 3.5×0.6
  const linka = box(3.5, 0.9, 0.6, m.ct);
  linka.position.set(0.2 + 1.75, 0.45, 5.2 + 0.3);
  g.add(linka);
  // Stove on linka
  const stove = box(0.6, 0.03, 0.55, m.st);
  stove.position.set(1.0, 0.92, 5.5);
  g.add(stove);

  // Ostrůvek: (0.5, 3.5) 2.5×0.8
  const island = box(2.5, 0.9, 0.8, m.cd);
  island.position.set(0.5 + 1.25, 0.45, 3.5 + 0.4);
  g.add(island);

  // Lednice: (4, 5.2) 0.7×0.65
  const fridge = box(0.7, 1.9, 0.65, m.fr);
  fridge.position.set(4 + 0.35, 0.95, 5.2 + 0.325);
  g.add(fridge);

  // Jídelní stůl: (4.2, 2) 1.8×0.9
  const jStul = box(1.8, 0.04, 0.9, m.tb);
  jStul.position.set(4.2 + 0.9, 0.74, 2 + 0.45);
  g.add(jStul);
  for (const dx of [-0.7, 0.7]) {
    const leg = box(0.04, 0.72, 0.7, m.tm);
    leg.position.set(4.2 + 0.9 + dx, 0.36, 2 + 0.45);
    g.add(leg);
  }
  // 4 chairs around table
  for (const [dx, dz] of [[-1.2, 0], [1.2, 0], [0, -0.7], [0, 0.7]]) {
    const seat = box(0.42, 0.04, 0.42, m.ch);
    seat.position.set(5.1 + dx, 0.45, 2.45 + dz);
    g.add(seat);
  }

  // L-shaped pohovka: main (7, 0.3) 2.5×0.85 + side (6.1, 1.15) 0.85×1.5
  const sofaMain = box(2.5, 0.35, 0.85, m.sf);
  sofaMain.position.set(7 + 1.25, 0.275, 0.3 + 0.425);
  g.add(sofaMain);
  const sofaSide = box(0.85, 0.35, 1.5, m.sf);
  sofaSide.position.set(6.1 + 0.425, 0.275, 1.15 + 0.75);
  g.add(sofaSide);
  // Backs
  const sofaBackM = box(2.5, 0.3, 0.12, m.sf);
  sofaBackM.position.set(8.25, 0.5, 0.3);
  g.add(sofaBackM);
  const sofaBackS = box(0.12, 0.3, 1.5, m.sf);
  sofaBackS.position.set(6.1, 0.5, 1.9);
  g.add(sofaBackS);
  // Cushions
  for (const dx of [-0.7, 0, 0.7]) {
    const c = box(0.6, 0.1, 0.55, m.sc);
    c.position.set(8.25 + dx, 0.55, 0.72);
    g.add(c);
  }

  // Konferenční stolek: (7.5, 1.8) 1×0.6
  const coffee = box(1.0, 0.03, 0.6, m.tb);
  coffee.position.set(7.5 + 0.5, 0.35, 1.8 + 0.3);
  g.add(coffee);
  for (const dx of [-0.4, 0.4]) {
    for (const dz of [-0.2, 0.2]) {
      const leg = box(0.03, 0.33, 0.03, m.tm);
      leg.position.set(8.0 + dx, 0.165, 2.1 + dz);
      g.add(leg);
    }
  }

  // TV: (8, 4.5) 1.5×0.1 — on wall
  const tvPanel = box(1.5, 0.8, 0.04, m.tv);
  tvPanel.position.set(8 + 0.75, 1.5, 4.5);
  g.add(tvPanel);

  // Carpet
  const carpet = pln(3.5, 3.0, m.cp);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(7.8, 0.16, 1.8);
  g.add(carpet);

  // Plant in corner
  addPlant(g, 0.4, 0, 0.4);
}

function furnishPracovna(g) {
  // Origin offset: (10.5, 0), 5.5×3m
  const ox = 10.5, oz = 0;

  // Stůl: (0.3, 0.3) → absolute (10.8, 0.3), 1.8×0.7
  const desk = box(1.8, 0.04, 0.7, m.dk);
  desk.position.set(ox + 0.3 + 0.9, 0.74, oz + 0.3 + 0.35);
  g.add(desk);
  for (const dx of [-0.7, 0.7]) {
    const leg = box(0.04, 0.72, 0.5, m.tm);
    leg.position.set(ox + 1.2 + dx, 0.36, oz + 0.65);
    g.add(leg);
  }
  // Monitor
  const mon = box(0.6, 0.4, 0.03, m.mn);
  mon.position.set(ox + 1.2, 1.1, oz + 0.4);
  g.add(mon);
  const monStand = box(0.06, 0.3, 0.15, m.tm);
  monStand.position.set(ox + 1.2, 0.91, oz + 0.45);
  g.add(monStand);
  // Chair
  const chair = box(0.5, 0.06, 0.5, m.ch);
  chair.position.set(ox + 1.2, 0.45, oz + 1.3);
  g.add(chair);

  // Knihovna: (3, 0.2) → absolute (13.5, 0.2), 1.2×0.35
  const shelf = box(1.2, 2.0, 0.35, m.sh);
  shelf.position.set(ox + 3 + 0.6, 1.0, oz + 0.2 + 0.175);
  g.add(shelf);
  for (let i = 1; i <= 4; i++) {
    const board = box(1.15, 0.03, 0.33, m.sh);
    board.position.set(ox + 3.6, i * 0.4, oz + 0.375);
    g.add(board);
  }
}

function furnishVstup(g) {
  // (10.5, 3.5) 5.5×2.5
  const ox = 10.5, oz = 3.5;

  // Dark floor already added
  // Shoe rack
  const rack = box(0.8, 0.4, 0.3, m.sh);
  rack.position.set(ox + 4.5, 0.2, oz + 1.25);
  g.add(rack);
  // Coat hooks
  for (let i = 0; i < 3; i++) {
    const hook = box(0.05, 0.05, 0.08, m.tm);
    hook.position.set(ox + 3.5 + i * 0.3, 1.5, oz + 0.08);
    g.add(hook);
  }
}

function furnishLoznice(g) {
  // (0, 6.5) 7×6.5
  const ox = 0, oz = 6.5;

  // Postel: (2.5, 1) 1.8×2.1
  const frame = box(1.8, 0.3, 2.1, m.bd);
  frame.position.set(ox + 2.5 + 0.9, 0.25, oz + 1 + 1.05);
  g.add(frame);
  const headboard = box(1.8, 0.6, 0.06, m.bd);
  headboard.position.set(ox + 3.4, 0.5, oz + 1);
  g.add(headboard);
  const mattress = box(1.7, 0.15, 2.0, m.bs);
  mattress.position.set(ox + 3.4, 0.475, oz + 2.05);
  g.add(mattress);
  // Pillows
  for (const dx of [-0.4, 0.4]) {
    const pil = box(0.5, 0.1, 0.35, m.pw);
    pil.position.set(ox + 3.4 + dx, 0.6, oz + 1.3);
    g.add(pil);
  }

  // Noční stolky: (1.8, 1) a (4.55, 1) — 0.45×0.4
  for (const sx of [1.8, 4.55]) {
    const ns = box(0.45, 0.4, 0.4, m.tb);
    ns.position.set(ox + sx + 0.225, 0.2, oz + 1.2);
    g.add(ns);
  }

  // Skříň: (0.2, 4) 0.55×2
  const ward = box(0.55, 2.0, 2.0, m.wd);
  ward.position.set(ox + 0.2 + 0.275, 1.0, oz + 4 + 1.0);
  g.add(ward);
}

function furnishKoupelna(g) {
  // (7.5, 6.5) 3×3
  const ox = 7.5, oz = 6.5;

  // Vana: (0.2, 0.2) 0.7×1.5
  const tub = box(0.7, 0.5, 1.5, m.bt);
  tub.position.set(ox + 0.2 + 0.35, 0.25, oz + 0.2 + 0.75);
  g.add(tub);
  // Shower glass
  const glass = pln(0.7, 2.0, m.sw);
  glass.position.set(ox + 0.55, 1.0, oz + 1.0);
  g.add(glass);

  // Umyvadlo: (1.5, 0.2) 0.6×0.45
  const sinkB = box(0.6, 0.06, 0.45, m.sk);
  sinkB.position.set(ox + 1.5 + 0.3, 0.8, oz + 0.2 + 0.225);
  g.add(sinkB);
  const sinkP = box(0.12, 0.7, 0.12, m.sk);
  sinkP.position.set(ox + 1.8, 0.35, oz + 0.425);
  g.add(sinkP);
  // Mirror
  const mirror = pln(0.6, 0.8, m.mr);
  mirror.position.set(ox + 1.8, 1.4, oz + 0.06);
  g.add(mirror);

  // Záchod: (2.2, 2) 0.4×0.5
  const toiletB = box(0.4, 0.35, 0.5, m.tl);
  toiletB.position.set(ox + 2.2 + 0.2, 0.175, oz + 2 + 0.25);
  g.add(toiletB);
  const tank = box(0.35, 0.25, 0.18, m.tl);
  tank.position.set(ox + 2.4, 0.32, oz + 2.55);
  g.add(tank);
}

function furnishSatna(g) {
  // (7.5, 10) 3×3
  const ox = 7.5, oz = 10;

  // Shelves along back wall
  for (let i = 0; i < 4; i++) {
    const sh = box(2.5, 0.04, 0.4, m.sh);
    sh.position.set(ox + 1.5, 0.5 + i * 0.55, oz + 2.7);
    g.add(sh);
  }
  // Clothes rod
  const rod = box(2.5, 0.03, 0.03, m.rl);
  rod.position.set(ox + 1.5, 1.8, oz + 1.5);
  g.add(rod);
  // Boxes
  for (let i = 0; i < 3; i++) {
    const bx = box(0.4, 0.3, 0.35, m.wd);
    bx.position.set(ox + 0.5 + i * 0.55, 0.15, oz + 2.7);
    g.add(bx);
  }
}

function furnishTerasa(g) {
  // (11, 6.5) 5×6.5
  const ox = 11, oz = 6.5;

  // Deck planks
  for (let i = 0; i < 13; i++) {
    const plank = box(4.8, 0.005, 0.03, m.tm);
    plank.position.set(ox + 2.5, 0.085, oz + 0.3 + i * 0.48);
    g.add(plank);
  }

  // Glass railing - right side
  const railR = pln(6.5, 1.0, m.sw);
  railR.rotation.y = Math.PI / 2;
  railR.position.set(ox + 4.95, 0.6, oz + 3.25);
  g.add(railR);
  const railRTop = box(0.04, 0.04, 6.5, m.rl);
  railRTop.position.set(ox + 4.95, 1.1, oz + 3.25);
  g.add(railRTop);

  // Glass railing - bottom
  const railB = pln(5.0, 1.0, m.sw);
  railB.position.set(ox + 2.5, 0.6, oz + 6.45);
  g.add(railB);
  const railBTop = box(5.0, 0.04, 0.04, m.rl);
  railBTop.position.set(ox + 2.5, 1.1, oz + 6.45);
  g.add(railBTop);

  // Venkovní stůl: (1.5, 2.5) 1.4×0.8
  const oTable = box(1.4, 0.04, 0.8, m.tb);
  oTable.position.set(ox + 1.5 + 0.7, 0.7, oz + 2.5 + 0.4);
  g.add(oTable);
  for (const dx of [-0.5, 0.5]) {
    const leg = box(0.04, 0.65, 0.6, m.tm);
    leg.position.set(ox + 2.2 + dx, 0.33, oz + 2.9);
    g.add(leg);
  }
  // 4 chairs
  for (const [dx, dz] of [[-1.0, 0], [1.0, 0], [0, -0.7], [0, 0.7]]) {
    const seat = box(0.45, 0.04, 0.45, m.ch);
    seat.position.set(ox + 2.2 + dx, 0.42, oz + 2.9 + dz);
    g.add(seat);
  }

  // Plants
  addPlant(g, ox + 0.5, 0.08, oz + 0.5);
  addPlant(g, ox + 4.3, 0.08, oz + 5.8);
  addPlant(g, ox + 4.3, 0.08, oz + 0.5);
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════

function wallZ(g, x, z, len, mat) {
  const w = box(len, H, WALL, mat);
  w.position.set(x + len / 2, H / 2, z);
  g.add(w);
}

function wallX(g, x, z, len, mat) {
  const w = box(WALL, H, len, mat);
  w.position.set(x, H / 2, z + len / 2);
  g.add(w);
}

function wallZ_partial(g, x, z, len, mat) {
  const w = box(len, H, IWALL, mat);
  w.position.set(x + len / 2, H / 2, z);
  g.add(w);
}

function wallX_partial(g, x, z, len, mat) {
  const w = box(IWALL, H, len, mat);
  w.position.set(x, H / 2, z + len / 2);
  g.add(w);
}

function addFloor(g, x, z, w, d, mat) {
  const f = box(w, 0.15, d, mat);
  f.position.set(x + w / 2, 0.075, z + d / 2);
  g.add(f);
}

function addCeiling(g, x, z, w, d) {
  const c = pln(w, d, m.cl);
  c.rotation.x = Math.PI / 2;
  c.position.set(x + w / 2, H - 0.01, z + d / 2);
  g.add(c);
}

function addWin(g, x, sillY, z, w, h, axis) {
  if (axis === 'z') {
    const zOff = z < 7 ? 0.01 : -0.01;
    const glass = pln(w, h, m.wn);
    glass.position.set(x, sillY + h / 2, z + zOff);
    g.add(glass);
    addFrame(g, x, sillY, z + zOff * 3, w, h, 'z');
  } else {
    const xOff = x < 8 ? 0.01 : -0.01;
    const glass = pln(w, h, m.wn);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(x + xOff, sillY + h / 2, z);
    g.add(glass);
    addFrame(g, x + xOff * 3, sillY, z, w, h, 'x');
  }
}

function addFrame(g, x, y, z, w, h, axis) {
  if (axis === 'z') {
    const t = box(w + 0.04, 0.03, 0.04, m.wf); t.position.set(x, y + h, z); g.add(t);
    const b = box(w + 0.04, 0.03, 0.04, m.wf); b.position.set(x, y, z); g.add(b);
    const l = box(0.03, h, 0.04, m.wf); l.position.set(x - w / 2, y + h / 2, z); g.add(l);
    const r = box(0.03, h, 0.04, m.wf); r.position.set(x + w / 2, y + h / 2, z); g.add(r);
  } else {
    const t = box(0.04, 0.03, w + 0.04, m.wf); t.position.set(x, y + h, z); g.add(t);
    const b = box(0.04, 0.03, w + 0.04, m.wf); b.position.set(x, y, z); g.add(b);
    const l = box(0.04, h, 0.03, m.wf); l.position.set(x, y + h / 2, z - w / 2); g.add(l);
    const r = box(0.04, h, 0.03, m.wf); r.position.set(x, y + h / 2, z + w / 2); g.add(r);
  }
}

function addPlant(g, x, y, z) {
  const pot = box(0.35, 0.3, 0.35, m.po);
  pot.position.set(x, y + 0.15, z);
  g.add(pot);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), m.pt);
  ball.position.set(x, y + 0.5, z);
  g.add(ball);
}
