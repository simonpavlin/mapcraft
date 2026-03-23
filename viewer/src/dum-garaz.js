import * as THREE from 'three';

// Rodinný dům s garáží — dvoupatrový
// MCP: (110,75) in 200×200 → 3D (10, -25)
// Dům 12×12m + garáž 6×6m vpravo
// Přízemí: WC, vstup, schody, open-space obývák+kuchyně, dveře do garáže
// 2. patro: schody, chodba, hlavní ložnice+koupelna, dětský pokoj, pracovna

const DS = THREE.FrontSide;
const WALL = 0.15;
const IW = 0.1;
const FH = 3.0;
const DW = 12, DD = 12; // house dims
const GW = 6, GD = 6, GZ = 3; // garage dims, offset z=3

const m = {
  wo: new THREE.MeshLambertMaterial({ color: 0xd8d0c0, side: DS }),
  wa: new THREE.MeshLambertMaterial({ color: 0x444444, side: DS }),
  wi: new THREE.MeshLambertMaterial({ color: 0xf5f2ec, side: DS }),
  wb: new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS }),
  fl: new THREE.MeshLambertMaterial({ color: 0xc0a060, side: DS }),
  fh: new THREE.MeshLambertMaterial({ color: 0x907050, side: DS }),
  fb: new THREE.MeshLambertMaterial({ color: 0xc8c8d0, side: DS }),
  fg: new THREE.MeshLambertMaterial({ color: 0x909090, side: DS }),
  cl: new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS }),
  rf: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  wn: new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.35, transparent: true, side: DS }),
  wf: new THREE.MeshLambertMaterial({ color: 0x222222, side: DS }),
  dr: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS }),
  de: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  st: new THREE.MeshLambertMaterial({ color: 0x888888, side: DS }),
  sr: new THREE.MeshLambertMaterial({ color: 0x444444, side: DS }),
  sf: new THREE.MeshLambertMaterial({ color: 0x404040, side: DS }),
  tb: new THREE.MeshLambertMaterial({ color: 0xb09060, side: DS }),
  tm: new THREE.MeshLambertMaterial({ color: 0x555555, side: DS }),
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
  dk: new THREE.MeshLambertMaterial({ color: 0xc0a878, side: DS }),
  mn: new THREE.MeshLambertMaterial({ color: 0x111111, side: DS }),
  gd: new THREE.MeshLambertMaterial({ color: 0x666666, side: DS }), // garage door
  fr: new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS }),
  stn: new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS }),
  sw: new THREE.MeshLambertMaterial({ color: 0xbbddee, opacity: 0.3, transparent: true, side: DS }),
};

function box(w, h, d, mt) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt); }
function pln(w, h, mt) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mt); }

export function createDumGaraz(scene, cx = 10, cz = -25) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  for (let f = 0; f < 2; f++) {
    const y = f * FH;
    addFloor(g, 0, 0, DW, DD, m.fl, y);
    addCeiling(g, DW, DD, y);
    buildOuterWalls(g, y);
    if (f === 0) buildPrizemiInner(g, y);
    else buildPatroInner(g, y);
  }

  // Roofs
  const roofH = box(DW + 0.5, 0.25, DD + 0.5, m.rf);
  roofH.position.set(DW / 2, FH * 2 + 0.125, DD / 2);
  g.add(roofH);

  // Garage structure
  buildGarage(g);

  // Stairs
  buildStairs(g);

  // Windows (from MCP metadata)
  buildAllWindows(g);

  // Furnish
  furnishPrizemi(g);
  furnishPatro(g);

  scene.add(g);
}

function buildOuterWalls(g, y) {
  wZ(g, 0, 0, DW, y, m.wo);
  wZ(g, 0, DD, DW, y, m.wo);
  wX(g, 0, 0, DD, y, m.wo);
  // East wall — with gap for garage connection at y=0
  if (y === 0) {
    wX_seg(g, DW, 0, 3, y, m.wa); // above garage connection
    // gap 5-6 for door to garage
    wX_seg(g, DW, 6, 3, y, m.wa);
    wX_seg(g, DW, 9, 3, y, m.wa);
  } else {
    wX(g, DW, 0, DD, y, m.wa);
  }
}

function buildGarage(g) {
  const gx = DW, gz = GZ;
  addFloor(g, gx, gz, GW, GD, m.fg, 0);
  addCeiling(g, GW, GD, 0, gx, gz);
  // Walls
  wZ(g, gx, gz, GW, 0, m.wo);           // north
  wZ(g, gx, gz + GD, GW, 0, m.wo);     // south
  wX(g, gx + GW, gz, GD, 0, m.wo);     // east
  // Roof
  const gRoof = box(GW + 0.4, 0.2, GD + 0.4, m.rf);
  gRoof.position.set(gx + GW / 2, FH + 0.1, gz + GD / 2);
  g.add(gRoof);
  // Garage door (north wall, sectional)
  const gDoor = box(3, 2.4, WALL + 0.02, m.gd);
  gDoor.position.set(gx + 1 + 1.5, 1.2, gz);
  g.add(gDoor);
  // Door to house (west wall = house east wall, gap at z=5..6)
  const hDoor = box(IW + 0.02, 2.1, 1, m.dr);
  hDoor.position.set(gx, 1.05, 5.5);
  g.add(hDoor);
}

function buildPrizemiInner(g, y) {
  // WC (0,0) 3.5×3
  wX_seg(g, 3.5, 0, 1, y, m.wi);   // top
  wX_seg(g, 3.5, 1.9, 1.1, y, m.wi);  // bottom (gap 1-1.9 door)
  wZ_seg(g, 0, 3, 3.5, y, m.wi);   // bottom of WC
  addFloor(g, 0, 0, 3.5, 3, m.fb, y);

  // Vstup (4,0) 4×3
  wX_seg(g, 8, 0, 1.5, y, m.wi);   // top (gap 1.5-2.4 for door to stairs)
  wX_seg(g, 8, 2.4, 0.6, y, m.wi);
  // bottom of vstup → průchod to obývák at y=3, gap 4.5-6.5
  wZ_seg(g, 0, 3.5, 4.5, y, m.wi);     // left of průchod (merged with WC bottom)
  wZ_seg(g, 6.5, 3.5, 2, y, m.wi);     // right of průchod
  addFloor(g, 4, 0, 4, 3, m.fh, y);

  // Schodiště (8.5,0.5) 2.5×4 — just walls
  wX_seg(g, 8.5, 0.5, 4, y, m.wi);  // left
  // bottom of stairs area → connects to obývák below

  // Obývák (0,3.5) 12×8.5 — main space, inner walls already drawn above
}

function buildPatroInner(g, y) {
  // Ložnice (0,0) 6×4.5
  wX_seg(g, 6, 0, 2, y, m.wi);       // right (gap 2-2.9 door to koupelna)
  wX_seg(g, 6, 2.9, 1.6, y, m.wi);
  wZ_seg(g, 0, 4.5, 2.5, y, m.wi);   // bottom-left (gap 2.5-3.5 door)
  wZ_seg(g, 3.5, 4.5, 2.5, y, m.wi);

  // Koupelna (6.5,0) 3×4
  wX_seg(g, 6.5, 0, 4, y, m.wb);     // left (shared with ložnice right)
  wX_seg(g, 9.5, 0, 4, y, m.wb);     // right (to stairs area)
  wZ_seg(g, 6.5, 4, 1, y, m.wb);     // bottom-left (gap 7-8 door)
  wZ_seg(g, 8, 4, 1.5, y, m.wb);
  addFloor(g, 6.5, 0, 3, 4, m.fb, y);

  // Schodiště (8.5,0.5) 2.5×4
  wX_seg(g, 8.5, 0.5, 4, y, m.wi);
  // gap 9-10.5 at y=4.5 for door to chodba
  wZ_seg(g, 8.5, 4.5, 0.5, y, m.wi);
  wZ_seg(g, 10.5, 4.5, 1.5, y, m.wi);

  // Chodba (0,4.5) 12×2 — implicit from walls above/below

  // Dětský (0,7) 5.5×5
  wZ_seg(g, 0, 6.5, 2.5, y, m.wi);     // top (gap 2.5-3.5)
  wZ_seg(g, 3.5, 6.5, 2, y, m.wi);
  wX_seg(g, 5.5, 6.5, 5.5, y, m.wi);   // right

  // Pracovna (6,7) 6×5
  wZ_seg(g, 6, 6.5, 2, y, m.wi);        // top-left (gap 8-9)
  wZ_seg(g, 9, 6.5, 3, y, m.wi);

  addFloor(g, 0, 4.5, 12, 2, m.fh, y); // chodba floor
}

function buildStairs(g) {
  // MCP: schody at (8.5, 0.5) 2.5×4m, direction: south, u_turn
  const sx = 8.5, sz = 0.5;
  const steps = 10;
  const stepH = FH / (steps * 2);
  const stepD = 1.8 / steps;

  // Flight 1: going south
  for (let s = 0; s < steps; s++) {
    const step = box(2.1, stepH, stepD, m.st);
    step.position.set(sx + 1.25, s * stepH + stepH / 2, sz + 0.2 + s * stepD);
    g.add(step);
  }
  // Landing
  const land = box(2.1, 0.15, 1.2, m.st);
  land.position.set(sx + 1.25, FH / 2, sz + 2.8);
  g.add(land);
  // Flight 2: going north (up to 2nd floor)
  for (let s = 0; s < steps; s++) {
    const step = box(2.1, stepH, stepD, m.st);
    step.position.set(sx + 1.25, FH / 2 + s * stepH + stepH / 2, sz + 3.5 - s * stepD);
    g.add(step);
  }

  // Railings
  for (const side of [-1, 1]) {
    const rx = sx + 1.25 + side * 0.95;
    for (let s = 0; s <= steps; s += 3) {
      const post = box(0.04, 0.9, 0.04, m.sr);
      post.position.set(rx, s * stepH + 0.45, sz + 0.2 + s * stepD);
      g.add(post);
    }
  }
}

function buildAllWindows(g) {
  // Přízemí windows (from MCP metadata: sill_height, win_height)
  addWin(g, 1.5, 1.0, 0, 1.0, 1.0, 'z', 0);      // WC north
  addWin(g, 7, 0.8, 0, 1.2, 1.4, 'z', 0);          // vstup north
  addWin(g, 1, 0.4, DD, 2.0, 2.2, 'z', 0);          // obývák south panorama
  addWin(g, 8, 0.3, DD, 2.5, 2.4, 'z', 0);          // obývák south panorama 2
  addWin(g, 0, 0.5, 6, 2.0, 2.0, 'x', 0);           // obývák west
  addWin(g, 0, 0.5, 9.5, 1.5, 1.8, 'x', 0);         // obývák west 2
  addWin(g, DW, 0.4, 7, 2.0, 2.2, 'x', 0);          // obývák east

  // 2. patro
  addWin(g, 2, 0.5, 0, 2.0, 2.0, 'z', FH);          // ložnice north
  addWin(g, 7.5, 1.2, 0, 0.8, 0.8, 'z', FH);        // koupelna north
  addWin(g, 1.5, 0.5, DD, 2.0, 1.8, 'z', FH);       // dětský south
  addWin(g, 8, 0.5, DD, 2.0, 2.0, 'z', FH);          // pracovna south
  addWin(g, 0, 0.5, 1, 2.0, 2.0, 'x', FH);           // ložnice west
  addWin(g, 0, 0.5, 8.5, 1.5, 1.8, 'x', FH);        // dětský west
  addWin(g, DW, 0.4, 9, 2.0, 2.2, 'x', FH);          // pracovna east

  // Doors
  // Entrance (north, x=5..6.2)
  const eDoor = box(1.2, 2.3, WALL + 0.02, m.de);
  eDoor.position.set(5.6, 1.15, 0);
  g.add(eDoor);
  // Obývák → zahrada (south, sliding)
  const sDoor = box(2, 2.2, WALL + 0.02, m.dr);
  sDoor.position.set(5, 1.1, DD);
  g.add(sDoor);
}

// ═══════════════════════════
// FURNISH
// ═══════════════════════════

function furnishPrizemi(g) {
  const y = 0;
  // WC
  const toilet = box(0.38, 0.35, 0.5, m.tl);
  toilet.position.set(1.5, y + 0.175, 2.3);
  g.add(toilet);
  const wcSink = box(0.45, 0.06, 0.35, m.sk);
  wcSink.position.set(2.8, y + 0.7, 0.3);
  g.add(wcSink);

  // Vstup — shoe rack
  const shoes = box(0.8, 0.4, 0.3, m.sh);
  shoes.position.set(7.5, y + 0.2, 0.3);
  g.add(shoes);

  // Obývák — kuchyně vlevo vzadu
  const counter = box(3.5, 0.9, 0.6, m.ct);
  counter.position.set(2, y + 0.45, DD - 0.4);
  g.add(counter);
  const stove = box(0.6, 0.03, 0.55, m.stn);
  stove.position.set(1, y + 0.92, DD - 0.4);
  g.add(stove);
  const fridge = box(0.7, 1.9, 0.65, m.fr);
  fridge.position.set(4.5, y + 0.95, DD - 0.4);
  g.add(fridge);
  const island = box(2, 0.9, 0.7, m.cd);
  island.position.set(2, y + 0.45, DD - 2);
  g.add(island);

  // Dining
  const dTable = box(1.6, 0.04, 0.8, m.tb);
  dTable.position.set(6, y + 0.74, DD - 2.5);
  g.add(dTable);
  for (const dx of [-0.6, 0.6]) {
    const leg = box(0.04, 0.72, 0.6, m.tm);
    leg.position.set(6 + dx, y + 0.36, DD - 2.5);
    g.add(leg);
  }

  // Sofa
  const sofa = box(2.2, 0.35, 0.8, m.sf);
  sofa.position.set(8, y + 0.275, 5);
  g.add(sofa);
  const sofaBack = box(2.2, 0.3, 0.12, m.sf);
  sofaBack.position.set(8, y + 0.5, 4.6);
  g.add(sofaBack);
  // Coffee table
  const coffee = box(1.0, 0.03, 0.5, m.tb);
  coffee.position.set(8, y + 0.35, 6);
  g.add(coffee);
  // TV
  const tvP = box(1.3, 0.75, 0.04, m.tv);
  tvP.position.set(8, y + 1.4, 7.5);
  g.add(tvP);

  // Garáž — car placeholder
  const car = box(2, 1.2, 4, m.wa);
  car.position.set(DW + 3, y + 0.6, GZ + 3);
  g.add(car);
}

function furnishPatro(g) {
  const y = FH;
  // Chodba floor
  addFloor(g, 0, 4.5, 12, 2, m.fh, y);

  // Hlavní ložnice (0,0) 6×4.5
  const bed = box(1.8, 0.3, 2.1, m.bd);
  bed.position.set(3, y + 0.25, 2);
  g.add(bed);
  const mattress = box(1.7, 0.15, 2.0, m.bs);
  mattress.position.set(3, y + 0.475, 2);
  g.add(mattress);
  const headboard = box(1.8, 0.5, 0.06, m.bd);
  headboard.position.set(3, y + 0.5, 0.2);
  g.add(headboard);
  for (const dx of [-0.4, 0.4]) {
    const pil = box(0.5, 0.1, 0.35, m.pw);
    pil.position.set(3 + dx, y + 0.6, 0.6);
    g.add(pil);
  }
  for (const sx of [1.5, 4.5]) {
    const ns = box(0.4, 0.4, 0.35, m.tb);
    ns.position.set(sx, y + 0.2, 0.4);
    g.add(ns);
  }
  const ward = box(1.5, 2.0, 0.5, m.wd);
  ward.position.set(0.85, y + 1.0, 3.8);
  g.add(ward);

  // Koupelna (6.5,0) 3×4
  const tub = box(0.7, 0.5, 1.5, m.bt);
  tub.position.set(7, y + 0.25, 1);
  g.add(tub);
  const bSink = box(0.5, 0.06, 0.4, m.sk);
  bSink.position.set(9, y + 0.8, 0.3);
  g.add(bSink);
  const bMirror = pln(0.5, 0.7, m.mr);
  bMirror.position.set(9, y + 1.4, 0.06);
  g.add(bMirror);
  const bToilet = box(0.38, 0.35, 0.5, m.tl);
  bToilet.position.set(7, y + 0.175, 3.3);
  g.add(bToilet);

  // Dětský pokoj (0,7) 5.5×5
  const bed2 = box(0.9, 0.3, 2.0, m.bd);
  bed2.position.set(1.5, y + 0.25, 9);
  g.add(bed2);
  const matt2 = box(0.85, 0.12, 1.9, m.bs);
  matt2.position.set(1.5, y + 0.42, 9);
  g.add(matt2);
  const desk = box(1.2, 0.04, 0.6, m.dk);
  desk.position.set(4.5, y + 0.72, 11.2);
  g.add(desk);
  const shelf = box(1.2, 1.5, 0.3, m.sh);
  shelf.position.set(0.5, y + 0.75, 11.2);
  g.add(shelf);

  // Pracovna (6,7) 6×5
  const pDesk = box(1.8, 0.04, 0.7, m.dk);
  pDesk.position.set(9, y + 0.74, 8);
  g.add(pDesk);
  const mon = box(0.6, 0.4, 0.03, m.mn);
  mon.position.set(9, y + 1.1, 7.7);
  g.add(mon);
  const bookshelf = box(2.5, 2.0, 0.35, m.sh);
  bookshelf.position.set(8, y + 1.0, 11.5);
  g.add(bookshelf);
  for (let i = 1; i <= 4; i++) {
    const board = box(2.4, 0.03, 0.33, m.sh);
    board.position.set(8, y + i * 0.4, 11.5);
    g.add(board);
  }
  const rChair = box(0.6, 0.35, 0.6, m.sf);
  rChair.position.set(11, y + 0.275, 10);
  g.add(rChair);
}

// ═══════════════════════════
// HELPERS
// ═══════════════════════════

function wZ(g, x, z, len, y, mt) {
  const w = box(len, FH, WALL, mt);
  w.position.set(x + len / 2, y + FH / 2, z);
  g.add(w);
}
function wX(g, x, z, len, y, mt) {
  const w = box(WALL, FH, len, mt);
  w.position.set(x, y + FH / 2, z + len / 2);
  g.add(w);
}
function wZ_seg(g, x, z, len, y, mt) {
  const w = box(len, FH, IW, mt);
  w.position.set(x + len / 2, y + FH / 2, z);
  g.add(w);
}
function wX_seg(g, x, z, len, y, mt) {
  const w = box(IW, FH, len, mt);
  w.position.set(x, y + FH / 2, z + len / 2);
  g.add(w);
}

function addFloor(g, x, z, w, d, mt, y) {
  const f = box(w, 0.15, d, mt);
  f.position.set(x + w / 2, y + 0.075, z + d / 2);
  g.add(f);
}
function addCeiling(g, w, d, y, ox = 0, oz = 0) {
  const c = pln(w - 0.1, d - 0.1, m.cl);
  c.rotation.x = Math.PI / 2;
  c.position.set(ox + w / 2, y + FH - 0.01, oz + d / 2);
  g.add(c);
}

function addWin(g, x, sillY, z, w, h, axis, floorY) {
  const off = 0.1;
  if (axis === 'z') {
    const dir = z < DD / 2 ? off : -off;
    const glass = pln(w, h, m.wn);
    glass.position.set(x, floorY + sillY + h / 2, z + dir);
    g.add(glass);
    const t = box(w + 0.04, 0.03, 0.06, m.wf); t.position.set(x, floorY + sillY + h, z + dir); g.add(t);
    const b = box(w + 0.04, 0.03, 0.06, m.wf); b.position.set(x, floorY + sillY, z + dir); g.add(b);
    const l = box(0.03, h, 0.06, m.wf); l.position.set(x - w / 2, floorY + sillY + h / 2, z + dir); g.add(l);
    const r = box(0.03, h, 0.06, m.wf); r.position.set(x + w / 2, floorY + sillY + h / 2, z + dir); g.add(r);
  } else {
    const dir = x < DW / 2 ? off : -off;
    const glass = pln(w, h, m.wn);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(x + dir, floorY + sillY + h / 2, z);
    g.add(glass);
    const t = box(0.06, 0.03, w + 0.04, m.wf); t.position.set(x + dir, floorY + sillY + h, z); g.add(t);
    const b = box(0.06, 0.03, w + 0.04, m.wf); b.position.set(x + dir, floorY + sillY, z); g.add(b);
    const l = box(0.06, h, 0.03, m.wf); l.position.set(x + dir, floorY + sillY + h / 2, z - w / 2); g.add(l);
    const r = box(0.06, h, 0.03, m.wf); r.position.set(x + dir, floorY + sillY + h / 2, z + w / 2); g.add(r);
  }
}
