import * as THREE from 'three';
import { wallWithOpenings, addWindow, addDoor, addFloor, addCeiling, addFlatRoof, boxWithOpenings, MAT, box, plane } from './building-utils.js';

const DS = THREE.FrontSide;

// ── Materials ──
const wallOuter = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS });
const wallInner = new THREE.MeshLambertMaterial({ color: 0xf0ede6, side: DS });
const floorTile = new THREE.MeshLambertMaterial({ color: 0xd8d8d8, side: DS });
const floorDark = new THREE.MeshLambertMaterial({ color: 0x252525, side: DS });
const barTop = new THREE.MeshLambertMaterial({ color: 0xb08040, side: DS });
const tableMat = new THREE.MeshLambertMaterial({ color: 0xa07030, side: DS });
const metalBlack = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS });
const metalRed = new THREE.MeshLambertMaterial({ color: 0xcc2222, side: DS });
const metalYellow = new THREE.MeshLambertMaterial({ color: 0xccaa22, side: DS });
const chairDark = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });
const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.25, transparent: true, side: DS });
const chalkboard = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: DS });
const shelfMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0x404040, side: DS });
const espressoMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0, side: DS });
const vitrinaMat = new THREE.MeshLambertMaterial({ color: 0xe8e8e8, side: DS });
const woodColumn = new THREE.MeshLambertMaterial({ color: 0x8b7355, side: DS });
const plank1 = new THREE.MeshLambertMaterial({ color: 0x7a5c3a, side: DS });
const plank2 = new THREE.MeshLambertMaterial({ color: 0x9b7850, side: DS });
const plank3 = new THREE.MeshLambertMaterial({ color: 0x6b5030, side: DS });
const plank4 = new THREE.MeshLambertMaterial({ color: 0x8a6a48, side: DS });
const plankMats = [plank1, plank2, plank3, plank4, plank2, plank3];

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createKavarna(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  // mcp:kavarna3/prostor (0,0) 6×5, ceiling 3.2m
  const W = 6, D = 5, H = 3.2;

  // ════════════════════════════════════════
  // FLOOR — black & white geometric tile
  // ════════════════════════════════════════
  addFloor(g, 0, 0, W, D, 0, floorTile);
  const ts = 0.15;
  for (let ix = 0; ix < W / ts; ix++) {
    for (let iz = 0; iz < D / ts; iz++) {
      const cx = ix * ts + ts / 2, cz = iz * ts + ts / 2;
      if (cx > W || cz > D) continue;
      if (((ix + iz) % 3 === 0) || ((ix * 2 + iz) % 5 === 0)) {
        const t = plane(ts * 0.85, ts * 0.85, floorDark);
        t.rotation.x = -Math.PI / 2;
        t.position.set(cx, 0.135, cz);
        g.add(t);
      }
    }
  }

  // ════════════════════════════════════════
  // CEILING + exposed beams
  // ════════════════════════════════════════
  addCeiling(g, 0, 0, W, D, H, 0, ceilingMat);
  for (let bx = 1; bx < W; bx += 1.5) {
    g.add(p(box(0.12, 0.15, D, metalBlack), bx, H - 0.075, D / 2));
  }

  // ════════════════════════════════════════
  // WALLS
  // ════════════════════════════════════════
  // mcp:d_vstup (2.5, 0) 1×0.15
  // mcp:w_front_l (0.2, 0) 1.8×0.1, sill=0, h=2.5
  // mcp:w_front_r (3.9, 0) 1.8×0.1, sill=0, h=2.5
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 0, length: W, height: H,
    material: wallOuter,
    openings: [
      { start: 0.2, end: 2.0, bottom: 0, top: 2.5 },   // w_front_l
      { start: 2.5, end: 3.5, bottom: 0, top: 2.3 },    // d_vstup
      { start: 3.9, end: 5.7, bottom: 0, top: 2.5 },    // w_front_r
    ]
  });
  addWindow(g, { axis: 'x', x: 0, z: 0, at: 1.1, width: 1.8, sillHeight: 0, winHeight: 2.5 });
  addWindow(g, { axis: 'x', x: 0, z: 0, at: 4.8, width: 1.8, sillHeight: 0, winHeight: 2.5 });
  addDoor(g, { axis: 'x', x: 0, z: 0, at: 3.0, width: 1, doorHeight: 2.3, material: metalBlack });

  // North wall (y=5) — solid
  wallWithOpenings(g, { axis: 'x', x: 0, z: D, length: W, height: H, material: wallInner });
  // West wall (x=0) — solid
  wallWithOpenings(g, { axis: 'z', x: 0, z: 0, length: D, height: H, material: wallInner });
  // East wall (x=6) — solid
  wallWithOpenings(g, { axis: 'z', x: W, z: 0, length: D, height: H, material: wallInner });

  // ════════════════════════════════════════
  // BAR COUNTER — reclaimed wood planks
  // ════════════════════════════════════════
  // mcp:bar (0.15, 2.5) 3×0.6, h=1.1
  const bx = 0.15, bz = 2.5, bw = 3, bd = 0.6, bh = 1.1;
  // Front face — horizontal reclaimed wood planks
  const plankH = 0.18;
  for (let i = 0; i < Math.ceil(bh / plankH); i++) {
    const py = i * plankH + plankH / 2;
    if (py > bh) break;
    const ph = Math.min(plankH, bh - i * plankH);
    g.add(p(box(bw, ph, 0.04, plankMats[i % plankMats.length]), bx + bw / 2, py, bz));
  }
  // Left side panel
  for (let i = 0; i < Math.ceil(bh / plankH); i++) {
    const py = i * plankH + plankH / 2;
    if (py > bh) break;
    const ph = Math.min(plankH, bh - i * plankH);
    g.add(p(box(0.04, ph, bd, plankMats[(i + 2) % plankMats.length]), bx, py, bz + bd / 2));
  }
  // Right side
  g.add(p(box(0.04, bh, bd, plank3), bx + bw, bh / 2, bz + bd / 2));
  // Back panel
  g.add(p(box(bw, bh, 0.03, wallInner), bx + bw / 2, bh / 2, bz + bd));
  // Counter top — wood, slight overhang
  g.add(p(box(bw + 0.08, 0.04, bd + 0.12, barTop), bx + bw / 2, bh + 0.02, bz + bd / 2));

  // ════════════════════════════════════════
  // PREP COUNTER
  // ════════════════════════════════════════
  // mcp:prep (0.15, 3.3) 3×0.55, h=0.9
  const px = 0.15, pz = 3.3, pw = 3, pd = 0.55, ph = 0.9;
  g.add(p(box(pw, ph, pd, wallInner), px + pw / 2, ph / 2, pz + pd / 2));
  g.add(p(box(pw + 0.04, 0.03, pd + 0.02, barTop), px + pw / 2, ph + 0.015, pz + pd / 2));

  // mcp:kavovar (1, 3.35) 0.65×0.5, elev=0.9, h=0.5
  g.add(p(box(0.65, 0.45, 0.45, espressoMat), 1 + 0.325, ph + 0.225, 3.35 + 0.25));
  g.add(p(box(0.65, 0.05, 0.45, metalBlack), 1 + 0.325, ph + 0.475, 3.35 + 0.25));
  g.add(p(box(0.08, 0.1, 0.05, metalBlack), 1.15, ph + 0.05, 3.33));
  g.add(p(box(0.08, 0.1, 0.05, metalBlack), 1.35, ph + 0.05, 3.33));

  // mcp:mlynek (1.8, 3.4) 0.25×0.25, elev=0.9, h=0.4
  g.add(p(box(0.2, 0.35, 0.2, metalBlack), 1.8 + 0.125, ph + 0.175, 3.4 + 0.125));
  g.add(p(box(0.12, 0.12, 0.12, metalBlack), 1.8 + 0.125, ph + 0.41, 3.4 + 0.125));

  // ════════════════════════════════════════
  // BAR STOOLS — red Tolix
  // ════════════════════════════════════════
  function barStool(sx, sz) {
    const spread = 0.13, seatH = 0.75;
    g.add(p(box(0.02, seatH, 0.02, metalBlack), sx - spread, seatH / 2, sz - spread));
    g.add(p(box(0.02, seatH, 0.02, metalBlack), sx + spread, seatH / 2, sz - spread));
    g.add(p(box(0.02, seatH, 0.02, metalBlack), sx - spread, seatH / 2, sz + spread));
    g.add(p(box(0.02, seatH, 0.02, metalBlack), sx + spread, seatH / 2, sz + spread));
    g.add(p(box(0.3, 0.03, 0.3, metalRed), sx, seatH, sz));
    g.add(p(box(0.24, 0.02, 0.02, metalBlack), sx, 0.3, sz - spread));
    g.add(p(box(0.24, 0.02, 0.02, metalBlack), sx, 0.3, sz + spread));
    g.add(p(box(0.02, 0.02, 0.24, metalBlack), sx - spread, 0.3, sz));
    g.add(p(box(0.02, 0.02, 0.24, metalBlack), sx + spread, 0.3, sz));
  }
  // mcp:s1 (0.35,2) s2 (0.95,2) s3 (1.55,2) s4 (2.15,2)
  barStool(0.35 + 0.175, 2 + 0.175);
  barStool(0.95 + 0.175, 2 + 0.175);
  barStool(1.55 + 0.175, 2 + 0.175);
  barStool(2.15 + 0.175, 2 + 0.175);

  // ════════════════════════════════════════
  // CAFÉ TABLES
  // ════════════════════════════════════════
  function cafeTable(tx, tz, tw = 0.65) {
    g.add(p(box(0.05, 0.7, 0.05, metalBlack), tx, 0.35, tz));
    g.add(p(box(0.35, 0.02, 0.35, metalBlack), tx, 0.01, tz));
    g.add(p(box(tw, 0.03, tw, tableMat), tx, 0.72, tz));
  }

  // ════════════════════════════════════════
  // CHAIRS
  // ════════════════════════════════════════
  function tolixChair(cx, cz, mat, facing) {
    const seatH = 0.45, s = 0.15;
    g.add(p(box(0.02, seatH, 0.02, metalBlack), cx - s, seatH / 2, cz - s));
    g.add(p(box(0.02, seatH, 0.02, metalBlack), cx + s, seatH / 2, cz - s));
    g.add(p(box(0.02, seatH, 0.02, metalBlack), cx - s, seatH / 2, cz + s));
    g.add(p(box(0.02, seatH, 0.02, metalBlack), cx + s, seatH / 2, cz + s));
    g.add(p(box(0.36, 0.02, 0.36, mat), cx, seatH, cz));
    const backZ = facing === 0 ? cz + 0.18 : cz - 0.18;
    g.add(p(box(0.34, 0.35, 0.02, mat), cx, seatH + 0.18, backZ));
    g.add(p(box(0.3, 0.02, 0.02, mat), cx, seatH + 0.08, backZ));
  }

  function curvedChair(cx, cz, facing) {
    const seatH = 0.45;
    g.add(p(box(0.025, seatH, 0.025, chairDark), cx - 0.14, seatH / 2, cz - 0.14));
    g.add(p(box(0.025, seatH, 0.025, chairDark), cx + 0.14, seatH / 2, cz - 0.14));
    g.add(p(box(0.025, seatH, 0.025, chairDark), cx - 0.14, seatH / 2, cz + 0.14));
    g.add(p(box(0.025, seatH, 0.025, chairDark), cx + 0.14, seatH / 2, cz + 0.14));
    g.add(p(box(0.38, 0.025, 0.36, chairDark), cx, seatH, cz));
    const backZ = facing === 0 ? cz + 0.17 : cz - 0.17;
    g.add(p(box(0.4, 0.38, 0.025, chairDark), cx, seatH + 0.2, backZ));
  }

  // mcp:t1 (1.2, 0.7) 0.7×0.7 — center (1.55, 1.05)
  cafeTable(1.55, 1.05);
  // mcp:z1a (1.1, 0.15) red tolix ↓
  tolixChair(1.3, 0.35, metalRed, 180);
  // mcp:z1b (1.4, 1.5) dark curved ↑
  curvedChair(1.6, 1.7, 0);

  // mcp:t2 (3, 0.8) 0.7×0.7 — center (3.35, 1.15)
  cafeTable(3.35, 1.15);
  // mcp:z2a (2.85, 0.25) yellow ↓
  tolixChair(3.05, 0.45, metalYellow, 180);
  // mcp:z2b (3.25, 1.6) yellow ↑
  tolixChair(3.45, 1.8, metalYellow, 0);

  // mcp:t3 (4.6, 0.7) 0.65×0.65 — center (4.925, 1.025)
  cafeTable(4.925, 1.025, 0.6);
  // mcp:z3a (4.5, 0.15) dark ↓
  curvedChair(4.7, 0.35, 180);
  // mcp:z3b (4.95, 1.45) dark ↑
  curvedChair(5.15, 1.65, 0);

  // mcp:t4 (4.6, 2.7) 0.65×0.65 — center (4.925, 3.025)
  cafeTable(4.925, 3.025, 0.6);
  // mcp:z4a (4.5, 2.2) yellow ↓
  tolixChair(4.7, 2.4, metalYellow, 180);
  // mcp:z4b (4.95, 3.45) yellow ↑
  tolixChair(5.15, 3.65, metalYellow, 0);

  // ════════════════════════════════════════
  // DISPLAY FRIDGE
  // ════════════════════════════════════════
  // mcp:vitrina (5, 3.9) 0.7×0.65, h=1.9
  const vx = 5, vz = 3.9, vw = 0.7, vd = 0.65, vh = 1.9;
  boxWithOpenings(g, {
    x: vx, y: 0, z: vz, width: vw, height: vh, depth: vd,
    material: vitrinaMat,
    openings: [{ face: 'front', start: 0.04, end: 0.66, bottom: 0.2, top: 1.8 }]
  });
  const vGlass = plane(0.62, 1.6, glassMat);
  vGlass.position.set(vx + 0.35, 0.2 + 0.8, vz - 0.005);
  g.add(vGlass);
  for (let sh = 0.4; sh < 1.7; sh += 0.35) {
    g.add(p(box(0.62, 0.015, 0.58, vitrinaMat), vx + 0.35, sh, vz + 0.32));
  }
  const fridgeLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.02, 0.02),
    new THREE.MeshLambertMaterial({ color: 0xeeeeff, emissive: 0xaabbff, emissiveIntensity: 0.6 })
  );
  fridgeLight.position.set(vx + 0.35, 1.75, vz + 0.1);
  g.add(fridgeLight);

  // ════════════════════════════════════════
  // INDUSTRIAL SHELF
  // ════════════════════════════════════════
  // mcp:regal (3.8, 4.6) 1.1×0.4, h=2.2
  const rx = 3.8, rz = 4.6, rw = 1.1, rd = 0.35, rh = 2.2;
  const pw2 = 0.025;
  g.add(p(box(pw2, rh, pw2, shelfMat), rx, rh / 2, rz));
  g.add(p(box(pw2, rh, pw2, shelfMat), rx + rw, rh / 2, rz));
  g.add(p(box(pw2, rh, pw2, shelfMat), rx, rh / 2, rz + rd));
  g.add(p(box(pw2, rh, pw2, shelfMat), rx + rw, rh / 2, rz + rd));
  for (let i = 0; i < 5; i++) {
    g.add(p(box(rw, 0.02, rd, shelfMat), rx + rw / 2, 0.15 + i * 0.48, rz + rd / 2));
  }
  g.add(p(box(0.02, rh * 0.7, 0.02, shelfMat), rx + rw * 0.3, rh * 0.4, rz + rd));
  g.add(p(box(0.02, rh * 0.7, 0.02, shelfMat), rx + rw * 0.7, rh * 0.4, rz + rd));
  // Items on shelves
  g.add(p(box(0.15, 0.12, 0.12, plank2), rx + 0.2, 0.21, rz + 0.15));
  g.add(p(box(0.3, 0.18, 0.2, plank4), rx + 0.7, 0.72, rz + 0.15));
  g.add(p(box(0.2, 0.15, 0.15, espressoMat), rx + 0.3, 1.19, rz + 0.12));

  // ════════════════════════════════════════
  // CHALKBOARD
  // ════════════════════════════════════════
  // mcp:tabule (0.6, 4.6) 2.8×0.05, elev=1, h=1.3
  const cbx = 0.6, cbw = 2.8, cbElev = 1.0, cbH = 1.3;
  const cb = plane(cbw, cbH, chalkboard);
  cb.position.set(cbx + cbw / 2, cbElev + cbH / 2, D - 0.06);
  cb.rotation.y = Math.PI;
  g.add(cb);
  const fm = metalBlack;
  g.add(p(box(cbw + 0.04, 0.025, 0.025, fm), cbx + cbw / 2, cbElev, D - 0.055));
  g.add(p(box(cbw + 0.04, 0.025, 0.025, fm), cbx + cbw / 2, cbElev + cbH, D - 0.055));
  g.add(p(box(0.025, cbH, 0.025, fm), cbx, cbElev + cbH / 2, D - 0.055));
  g.add(p(box(0.025, cbH, 0.025, fm), cbx + cbw, cbElev + cbH / 2, D - 0.055));
  g.add(p(box(cbw, 0.03, 0.06, fm), cbx + cbw / 2, cbElev - 0.02, D - 0.08));

  // ════════════════════════════════════════
  // WOODEN COLUMN
  // ════════════════════════════════════════
  // mcp:sloupek (4.2, 0.1) 0.15×0.15, h=3.2
  g.add(p(box(0.15, H, 0.15, woodColumn), 4.2 + 0.075, H / 2, 0.1 + 0.075));

  // ════════════════════════════════════════
  // PENDANT LIGHTS
  // ════════════════════════════════════════
  function pendant(lx, lz) {
    g.add(p(box(0.008, 0.6, 0.008, metalBlack), lx, H - 0.3, lz));
    g.add(p(box(0.22, 0.12, 0.22, metalBlack), lx, H - 0.66, lz));
    g.add(p(box(0.15, 0.04, 0.15, metalBlack), lx, H - 0.6, lz));
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xffee88, emissive: 0xffcc44, emissiveIntensity: 1.0 })
    );
    bulb.position.set(lx, H - 0.72, lz);
    g.add(bulb);
  }
  pendant(1.55, 1.05);   // t1
  pendant(3.35, 1.15);   // t2
  pendant(4.925, 1.025);  // t3
  pendant(4.925, 3.025);  // t4
  pendant(0.9, 2.2);     // bar
  pendant(2.0, 2.2);     // bar

  // ════════════════════════════════════════
  // BAR TOP DETAILS
  // ════════════════════════════════════════
  g.add(p(box(0.12, 0.12, 0.06, metalBlack), bx + 0.5, bh + 0.08, bz + bd / 2));
  g.add(p(box(0.01, 0.18, 0.1, metalBlack), bx + 2.5, bh + 0.11, bz + bd / 2));
  g.add(p(box(0.08, 0.1, 0.08, vitrinaMat), bx + 1.5, bh + 0.07, bz + bd / 2));

  // ════════════════════════════════════════
  // TABLE DECOR
  // ════════════════════════════════════════
  function tableDecor(tx, tz) {
    g.add(p(box(0.04, 0.12, 0.04, glassMat), tx + 0.1, 0.78, tz - 0.08));
  }
  tableDecor(1.55, 1.05);
  tableDecor(3.35, 1.15);
  tableDecor(4.925, 1.025);
  tableDecor(4.925, 3.025);

  // ════════════════════════════════════════
  // FLAT ROOF
  // ════════════════════════════════════════
  addFlatRoof(g, 0, 0, W, D, H);

  scene.add(g);
}
