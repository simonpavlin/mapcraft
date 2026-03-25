import * as THREE from 'three';
import { wallWithOpenings, addWindow, addDoor, addFloor, addCeiling, addFlatRoof, MAT, box, plane } from './building-utils.js';

// ════════════════════════════════════════════════
// MATERIALS
// ════════════════════════════════════════════════

const water = new THREE.MeshLambertMaterial({ color: 0x2299cc, opacity: 0.6, transparent: true, side: THREE.DoubleSide });
const waterDeep = new THREE.MeshLambertMaterial({ color: 0x1177aa, opacity: 0.7, transparent: true, side: THREE.DoubleSide });
const waterKids = new THREE.MeshLambertMaterial({ color: 0x44ccee, opacity: 0.5, transparent: true, side: THREE.DoubleSide });
const waterHot = new THREE.MeshLambertMaterial({ color: 0x33aacc, opacity: 0.65, transparent: true, side: THREE.DoubleSide });
const waterCold = new THREE.MeshLambertMaterial({ color: 0x88ddff, opacity: 0.5, transparent: true, side: THREE.DoubleSide });
const tile = new THREE.MeshLambertMaterial({ color: 0xd0d8e0, side: THREE.FrontSide });
const tileBlue = new THREE.MeshLambertMaterial({ color: 0x8899bb, side: THREE.FrontSide });
const tileDark = new THREE.MeshLambertMaterial({ color: 0x607080, side: THREE.FrontSide });
const poolEdge = new THREE.MeshLambertMaterial({ color: 0xc0c8d0, side: THREE.FrontSide });
const glass = new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.25, transparent: true, side: THREE.DoubleSide });
const steel = new THREE.MeshLambertMaterial({ color: 0x888899, side: THREE.FrontSide });
const steelRed = new THREE.MeshLambertMaterial({ color: 0xcc3333, side: THREE.FrontSide });
const steelYellow = new THREE.MeshLambertMaterial({ color: 0xddaa22, side: THREE.FrontSide });
const steelBlue = new THREE.MeshLambertMaterial({ color: 0x3366cc, side: THREE.FrontSide });
const wood = new THREE.MeshLambertMaterial({ color: 0xaa8855, side: THREE.FrontSide });
const woodDark = new THREE.MeshLambertMaterial({ color: 0x665533, side: THREE.FrontSide });
const concrete = new THREE.MeshLambertMaterial({ color: 0x999999, side: THREE.FrontSide });
const wallExt = new THREE.MeshLambertMaterial({ color: 0xe8e0d0, side: THREE.FrontSide });
const wallInt = new THREE.MeshLambertMaterial({ color: 0xf0ece4, side: THREE.FrontSide });
const roofMat = new THREE.MeshLambertMaterial({ color: 0x556688, side: THREE.FrontSide });
const saunaMat = new THREE.MeshLambertMaterial({ color: 0x996633, side: THREE.FrontSide });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// ════════════════════════════════════════════════
// POOL HELPER — basin with water surface
// ════════════════════════════════════════════════

function addPool(g, x, z, w, d, depth, waterMat = water) {
  // Pool basin (sunken floor)
  const basinH = 0.15;
  g.add(p(box(w, basinH, d, tileDark), x + w / 2, -depth + basinH / 2, z + d / 2));
  // Pool walls (4 sides)
  g.add(p(box(w, depth, 0.15, tileBlue), x + w / 2, -depth / 2, z));
  g.add(p(box(w, depth, 0.15, tileBlue), x + w / 2, -depth / 2, z + d));
  g.add(p(box(0.15, depth, d, tileBlue), x, -depth / 2, z + d / 2));
  g.add(p(box(0.15, depth, d, tileBlue), x + w, -depth / 2, z + d / 2));
  // Pool edge/coping
  g.add(p(box(w + 0.4, 0.08, 0.3, poolEdge), x + w / 2, 0.04, z - 0.05));
  g.add(p(box(w + 0.4, 0.08, 0.3, poolEdge), x + w / 2, 0.04, z + d + 0.05));
  g.add(p(box(0.3, 0.08, d + 0.4, poolEdge), x - 0.05, 0.04, z + d / 2));
  g.add(p(box(0.3, 0.08, d + 0.4, poolEdge), x + w + 0.05, 0.04, z + d / 2));
  // Water surface
  const ws = plane(w, d, waterMat);
  ws.rotation.x = -Math.PI / 2;
  ws.position.set(x + w / 2, -0.05, z + d / 2);
  g.add(ws);
}

// Circular pool (for whirlpools)
function addCircularPool(g, cx, cz, radius, depth, waterMat = waterHot) {
  // Basin
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 24),
    tileBlue
  );
  cyl.position.set(cx, -depth / 2, cz);
  g.add(cyl);
  // Water surface
  const ws = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 0.1, 24),
    waterMat.clone()
  );
  ws.material.side = THREE.DoubleSide;
  ws.rotation.x = -Math.PI / 2;
  ws.position.set(cx, -0.05, cz);
  g.add(ws);
  // Edge
  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.12, 8, 24),
    poolEdge
  );
  edge.rotation.x = Math.PI / 2;
  edge.position.set(cx, 0.06, cz);
  g.add(edge);
}

// ════════════════════════════════════════════════
// TOBOGÁN TUBE — spiral/curve from tower to landing pool
// ════════════════════════════════════════════════

function addSlide(g, startX, startZ, startY, endX, endZ, endY, mat, radius = 0.5) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(startX, startY, startZ),
    new THREE.Vector3(
      startX + (endX - startX) * 0.3,
      startY * 0.7,
      startZ + (endZ - startZ) * 0.15
    ),
    new THREE.Vector3(
      startX + (endX - startX) * 0.6,
      startY * 0.35,
      startZ + (endZ - startZ) * 0.5
    ),
    new THREE.Vector3(endX, endY + 0.5, endZ),
  ]);
  const tubeGeom = new THREE.TubeGeometry(curve, 40, radius, 12, false);
  const tube = new THREE.Mesh(tubeGeom, mat);
  g.add(tube);
}

// ════════════════════════════════════════════════
// WILD RIVER — curved channel following shape points
// ════════════════════════════════════════════════

function addWildRiver(g, ox, oz, shapePoints, depth) {
  // Build top/bottom edge paths from shape polygon
  const half = shapePoints.length / 2;
  const topEdge = shapePoints.slice(0, half);
  const bottomEdge = shapePoints.slice(half).reverse();

  // Create river channel segments between consecutive shape points
  for (let i = 0; i < topEdge.length - 1; i++) {
    const t0 = topEdge[i], t1 = topEdge[i + 1];
    const b0 = bottomEdge[i], b1 = bottomEdge[i + 1];

    // Average center line
    const cx0 = ox + (t0[0] + b0[0]) / 2;
    const cz0 = oz + (t0[1] + b0[1]) / 2;
    const cx1 = ox + (t1[0] + b1[0]) / 2;
    const cz1 = oz + (t1[1] + b1[1]) / 2;

    const dx = cx1 - cx0;
    const dz = cz1 - cz0;
    const len = Math.sqrt(dx * dx + dz * dz);
    const w0 = Math.sqrt((t0[0] - b0[0]) ** 2 + (t0[1] - b0[1]) ** 2);
    const w1 = Math.sqrt((t1[0] - b1[0]) ** 2 + (t1[1] - b1[1]) ** 2);
    const avgW = (w0 + w1) / 2;
    const angle = Math.atan2(dx, dz);

    // Channel floor
    const floor = box(avgW, 0.12, len, tileDark);
    floor.position.set((cx0 + cx1) / 2, -depth + 0.06, (cz0 + cz1) / 2);
    floor.rotation.y = -angle;
    g.add(floor);

    // Channel walls (left/right)
    const wallL = box(0.12, depth + 0.15, len, tileBlue);
    wallL.position.set((cx0 + cx1) / 2 - Math.cos(angle) * avgW / 2, -depth / 2 + 0.075, (cz0 + cz1) / 2 + Math.sin(angle) * avgW / 2);
    wallL.rotation.y = -angle;
    g.add(wallL);

    const wallR = box(0.12, depth + 0.15, len, tileBlue);
    wallR.position.set((cx0 + cx1) / 2 + Math.cos(angle) * avgW / 2, -depth / 2 + 0.075, (cz0 + cz1) / 2 - Math.sin(angle) * avgW / 2);
    wallR.rotation.y = -angle;
    g.add(wallR);

    // Water surface
    const ws = plane(avgW - 0.2, len, water);
    ws.rotation.x = -Math.PI / 2;
    ws.rotation.z = angle;
    ws.position.set((cx0 + cx1) / 2, -0.05, (cz0 + cz1) / 2);
    g.add(ws);
  }
}

// ════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════

export function createAquapark(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 1, oz);

  buildFloor(g);
  buildVstup(g);
  buildSatny(g);
  buildHlavnibazen(g);
  buildVlnovyBazen(g);
  buildDetskyBazen(g);
  buildTobogany(g);
  buildDivokaReka(g);
  buildBar(g);
  buildWellness(g);
  buildRestaurace(g);
  buildTechnicka(g);
  buildRoof(g);

  scene.add(g);
}

// ════════════════════════════════════════════════
// FLOOR — tile deck across the whole aquapark
// ════════════════════════════════════════════════

function buildFloor(g) {
  // Main tile floor
  g.add(p(box(80, 0.15, 60, tile), 40, -0.075, 30));
}

// ════════════════════════════════════════════════
// VSTUPNÍ HALA — mcp:vstup (0,0) 20×12
// ════════════════════════════════════════════════

function buildVstup(g) {
  const vx = 0, vz = 0;
  const W = 20, D = 12, H = 5;

  // Outer walls
  wallWithOpenings(g, { axis: 'x', x: vx, z: vz, length: W, height: H, material: wallExt,
    openings: [{ start: 6, end: 14, bottom: 0, top: 3.5 }] }); // north — entrance
  wallWithOpenings(g, { axis: 'x', x: vx, z: vz + D, length: W, height: H, material: wallExt,
    openings: [{ start: 3, end: 8, bottom: 0, top: 3 }, { start: 12, end: 17, bottom: 0, top: 3 }] }); // south — to pools
  wallWithOpenings(g, { axis: 'z', x: vx, z: vz, length: D, height: H, material: wallExt });
  wallWithOpenings(g, { axis: 'z', x: vx + W, z: vz, length: D, height: H, material: wallExt });

  // Entrance glass doors
  addDoor(g, { axis: 'x', x: vx, z: vz, at: 10, width: 8, doorHeight: 3.5, material: glass });
  // Doors to pool area
  addDoor(g, { axis: 'x', x: vx, z: vz + D, at: 5.5, width: 5, doorHeight: 3, material: glass });
  addDoor(g, { axis: 'x', x: vx, z: vz + D, at: 14.5, width: 5, doorHeight: 3, material: glass });

  // mcp:vstup/recepce (2,2) 8×3 — reception desk
  g.add(p(box(8, 1.1, 0.6, woodDark), vx + 2 + 4, 0.55, vz + 2 + 0.3));
  g.add(p(box(8, 0.05, 1.2, woodDark), vx + 2 + 4, 1.1, vz + 2 + 0.6));

  // Turnikety
  for (let i = 0; i < 4; i++) {
    g.add(p(box(0.1, 1.0, 1.2, steel), vx + 4 + i * 3, 0.5, vz + 8));
  }

  addFloor(g, vx, vz, W, D, 0, tile);
}

// ════════════════════════════════════════════════
// ŠATNY — mcp:satny_muzi (20,0) 12×12, satny_zeny (32,0) 12×12
// ════════════════════════════════════════════════

function buildSatny(g) {
  // Muži
  const mx = 20, mz = 0, mW = 12, mD = 12, H = 4;
  wallWithOpenings(g, { axis: 'x', x: mx, z: mz, length: mW, height: H, material: wallInt });
  wallWithOpenings(g, { axis: 'x', x: mx, z: mz + mD, length: mW, height: H, material: wallInt,
    openings: [{ start: 4, end: 8, bottom: 0, top: 2.5 }] });
  wallWithOpenings(g, { axis: 'z', x: mx, z: mz, length: mD, height: H, material: wallInt,
    openings: [{ start: 4, end: 8, bottom: 0, top: 2.5 }] });
  wallWithOpenings(g, { axis: 'z', x: mx + mW, z: mz, length: mD, height: H, material: wallInt });

  // Skříňky (lockers)
  for (let row = 0; row < 3; row++) {
    g.add(p(box(0.4, 1.8, 8, steel), mx + 2 + row * 3.5, 0.9, mz + 4));
  }

  addFloor(g, mx, mz, mW, mD, 0, MAT.floorBath);

  // Ženy
  const zx = 32, zz = 0, zW = 12, zD = 12;
  wallWithOpenings(g, { axis: 'x', x: zx, z: zz, length: zW, height: H, material: wallInt });
  wallWithOpenings(g, { axis: 'x', x: zx, z: zz + zD, length: zW, height: H, material: wallInt,
    openings: [{ start: 4, end: 8, bottom: 0, top: 2.5 }] });
  wallWithOpenings(g, { axis: 'z', x: zx, z: zz, length: zD, height: H, material: wallInt });
  wallWithOpenings(g, { axis: 'z', x: zx + zW, z: zz, length: zD, height: H, material: wallInt,
    openings: [{ start: 4, end: 8, bottom: 0, top: 2.5 }] });

  for (let row = 0; row < 3; row++) {
    g.add(p(box(0.4, 1.8, 8, steel), zx + 2 + row * 3.5, 0.9, zz + 4));
  }

  addFloor(g, zx, zz, zW, zD, 0, MAT.floorBath);

  // mcp:sprchy_m (20,8) 6×4 — sprchy muži
  wallWithOpenings(g, { axis: 'x', x: 20, z: 8, length: 6, height: 3, material: MAT.wallBathroom });
  for (let i = 0; i < 5; i++) {
    g.add(p(box(0.15, 0.15, 0.15, steel), 20.6 + i * 1.1, 2.2, 8.3));
  }

  // mcp:sprchy_z (38,8) 6×4 — sprchy ženy
  wallWithOpenings(g, { axis: 'x', x: 38, z: 8, length: 6, height: 3, material: MAT.wallBathroom });
  for (let i = 0; i < 5; i++) {
    g.add(p(box(0.15, 0.15, 0.15, steel), 38.6 + i * 1.1, 2.2, 8.3));
  }
}

// ════════════════════════════════════════════════
// HLAVNÍ BAZÉN 25m — mcp:hlavni_bazen (10,18) 25×14
// ════════════════════════════════════════════════

function buildHlavnibazen(g) {
  // mcp:hlavni_bazen (10,18) 25×14
  const bx = 10, bz = 18;
  // mcp:hlavni_bazen/voda (2,2) 21×10 → absolute (12,20) 21×10
  addPool(g, bx + 2, bz + 2, 21, 10, 1.5, water);

  // Lane dividers (6 lanes in 21m = 3.5m each)
  for (let i = 1; i < 6; i++) {
    const rope = box(0.05, 0.05, 10, steelYellow);
    rope.position.set(bx + 2 + i * 3.5, -0.1, bz + 2 + 5);
    g.add(rope);
  }

  // Starting blocks
  for (let i = 0; i < 6; i++) {
    g.add(p(box(0.5, 0.4, 0.6, concrete), bx + 2 + i * 3.5 + 1.75, 0.2, bz + 1.8));
  }
}

// ════════════════════════════════════════════════
// VLNOVÝ BAZÉN — mcp:vlnovy_bazen (42,18) 22×16
// ════════════════════════════════════════════════

function buildVlnovyBazen(g) {
  const bx = 42, bz = 18;
  // mcp:vlnovy_bazen/voda (2,2) 18×12 → absolute (44,20) 18×12
  addPool(g, bx + 2, bz + 2, 18, 12, 1.4, waterDeep);

  // Wave machine wall (south side)
  g.add(p(box(18, 2, 0.5, concrete), bx + 2 + 9, 0, bz + 2 + 12));
}

// ════════════════════════════════════════════════
// DĚTSKÝ BAZÉN — mcp:detsky_bazen (2,36) 16×12
// ════════════════════════════════════════════════

function buildDetskyBazen(g) {
  const bx = 2, bz = 36;
  // mcp:detsky_bazen/voda (2,2) 12×8 → absolute (4,38) 12×8
  addPool(g, bx + 2, bz + 2, 12, 8, 0.4, waterKids);

  // Mushroom fountain
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 12), steelYellow);
  stem.position.set(bx + 8, 0.75, bz + 6);
  g.add(stem);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.4, 16), steelRed);
  cap.position.set(bx + 8, 1.7, bz + 6);
  g.add(cap);

  // Small slide
  addSlide(g, bx + 12, bz + 4, 2.5, bx + 10, bz + 5, 0.2, steelYellow, 0.3);
}

// ════════════════════════════════════════════════
// TOBOGÁNY — mcp:tobogan_vez (56,0) 10×10, dojezdy
// ════════════════════════════════════════════════

function buildTobogany(g) {
  // mcp:tobogan_vez (56,0) 10×10
  const tx = 56, tz = 0;
  const towerH = 15;

  // Tower structure — 4 concrete pillars + platforms
  const pillarPos = [[tx + 1, tz + 1], [tx + 9, tz + 1], [tx + 1, tz + 9], [tx + 9, tz + 9]];
  for (const [px, pz] of pillarPos) {
    g.add(p(box(0.8, towerH, 0.8, concrete), px, towerH / 2, pz));
  }

  // Platforms every 5m
  for (let h = 5; h <= towerH; h += 5) {
    g.add(p(box(10, 0.2, 10, concrete), tx + 5, h, tz + 5));
  }

  // Stairs inside tower (spiral)
  const steps = 80;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 6; // 3 full turns
    const r = 3;
    const sx = tx + 5 + Math.cos(angle) * r;
    const sz = tz + 5 + Math.sin(angle) * r;
    const sy = (i / steps) * towerH;
    g.add(p(box(1.5, 0.18, 0.35, steel), sx, sy, sz));
  }

  // Safety railings on top
  for (let side = 0; side < 4; side++) {
    const railing = box(side % 2 === 0 ? 10 : 0.05, 1.2, side % 2 === 0 ? 0.05 : 10, steel);
    railing.position.set(
      tx + 5 + (side === 1 ? 5 : side === 3 ? -5 : 0),
      towerH + 0.6,
      tz + 5 + (side === 0 ? -5 : side === 2 ? 5 : 0)
    );
    g.add(railing);
  }

  // SLIDE 1 (red) — tower → mcp:dojezd_1 (44,5) 10×4
  addSlide(g, tx + 3, tz + 5, towerH, 44 + 5, 5 + 2, 0.5, steelRed, 0.6);

  // SLIDE 2 (yellow) — tower → mcp:dojezd_1 (different path)
  addSlide(g, tx + 5, tz + 3, towerH - 2, 44 + 3, 5 + 2, 0.5, steelYellow, 0.5);

  // SLIDE 3 (blue) — tower → mcp:dojezd_2 (66,5) 10×6
  addSlide(g, tx + 8, tz + 5, towerH, 66 + 5, 5 + 3, 0.5, steelBlue, 0.6);

  // Landing pools
  // mcp:dojezd_1 (44,5) 10×4
  addPool(g, 44, 5, 10, 4, 0.8, water);
  // mcp:dojezd_2 (66,5) 10×6
  addPool(g, 66, 5, 10, 6, 1.0, water);
}

// ════════════════════════════════════════════════
// DIVOKÁ ŘEKA — mcp:divoka_reka (5,32) shape
// ════════════════════════════════════════════════

function buildDivokaReka(g) {
  const shape = [
    [0, 1], [6, 0], [12, 2], [18, 0], [24, 2], [30, 0], [36, 1],
    [36, 3], [30, 2], [24, 4], [18, 2], [12, 4], [6, 2], [0, 3]
  ];
  addWildRiver(g, 5, 32, shape, 1.0);
}

// ════════════════════════════════════════════════
// SWIM-UP BAR — mcp:bar (36,18) 5×6
// ════════════════════════════════════════════════

function buildBar(g) {
  const bx = 36, bz = 18;
  // Bar counter
  g.add(p(box(5, 1.2, 0.5, woodDark), bx + 2.5, 0.6, bz + 1));
  // Bar top
  g.add(p(box(5, 0.05, 1.5, wood), bx + 2.5, 1.2, bz + 1.5));
  // Bar stools (in water side)
  for (let i = 0; i < 4; i++) {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 8), steel);
    stool.position.set(bx + 1 + i * 1.2, 0.35, bz + 2.5);
    g.add(stool);
  }
  // Shelves behind bar
  g.add(p(box(4, 0.08, 0.4, wood), bx + 2.5, 1.8, bz + 0.3));
  g.add(p(box(4, 0.08, 0.4, wood), bx + 2.5, 2.3, bz + 0.3));
  // Roof over bar
  g.add(p(box(6, 0.15, 5, wood), bx + 2.5, 3.5, bz + 3));
  // Support poles
  g.add(p(box(0.15, 3.5, 0.15, wood), bx + 0.3, 1.75, bz + 0.3));
  g.add(p(box(0.15, 3.5, 0.15, wood), bx + 4.7, 1.75, bz + 0.3));
  g.add(p(box(0.15, 3.5, 0.15, wood), bx + 0.3, 1.75, bz + 5.7));
  g.add(p(box(0.15, 3.5, 0.15, wood), bx + 4.7, 1.75, bz + 5.7));
}

// ════════════════════════════════════════════════
// WELLNESS — mcp:wellness (42,38) 24×18
// ════════════════════════════════════════════════

function buildWellness(g) {
  const wx = 42, wz = 38, W = 24, D = 18, H = 4;

  // Outer walls with glass panels
  wallWithOpenings(g, { axis: 'x', x: wx, z: wz, length: W, height: H, material: wallExt,
    openings: [{ start: 8, end: 16, bottom: 0.5, top: 3.5 }] });
  wallWithOpenings(g, { axis: 'x', x: wx, z: wz + D, length: W, height: H, material: wallExt });
  wallWithOpenings(g, { axis: 'z', x: wx, z: wz, length: D, height: H, material: wallExt,
    openings: [{ start: 3, end: 7, bottom: 0, top: 2.5 }] });
  wallWithOpenings(g, { axis: 'z', x: wx + W, z: wz, length: D, height: H, material: wallExt });

  // Glass window on north
  addWindow(g, { axis: 'x', x: wx, z: wz, at: 12, width: 8, sillHeight: 0.5, winHeight: 3 });
  // Entry door from pool area
  addDoor(g, { axis: 'z', x: wx, z: wz, at: 5, width: 4, doorHeight: 2.5, material: glass });

  addFloor(g, wx, wz, W, D, 0, MAT.floorBath);

  // mcp:wellness/virivka_1 (2,2) 4×4 → absolute (44,40)
  addCircularPool(g, wx + 2 + 2, wz + 2 + 2, 2, 0.8, waterHot);

  // mcp:wellness/virivka_2 (8,2) 4×4 → absolute (50,40)
  addCircularPool(g, wx + 8 + 2, wz + 2 + 2, 2, 0.8, waterHot);

  // mcp:wellness/sauna_finska (14,2) 5×5 → absolute (56,40)
  const sx = wx + 14, sz = wz + 2, sW = 5, sD = 5, sH = 2.8;
  wallWithOpenings(g, { axis: 'x', x: sx, z: sz, length: sW, height: sH, material: saunaMat });
  wallWithOpenings(g, { axis: 'x', x: sx, z: sz + sD, length: sW, height: sH, material: saunaMat,
    openings: [{ start: 1.5, end: 3.5, bottom: 0, top: 2.1 }] });
  wallWithOpenings(g, { axis: 'z', x: sx, z: sz, length: sD, height: sH, material: saunaMat });
  wallWithOpenings(g, { axis: 'z', x: sx + sW, z: sz, length: sD, height: sH, material: saunaMat });
  addDoor(g, { axis: 'x', x: sx, z: sz + sD, at: 2.5, width: 2, doorHeight: 2.1, material: glass });
  // Sauna benches (3 tiers)
  for (let tier = 0; tier < 3; tier++) {
    g.add(p(box(4, 0.08, 0.6, wood), sx + 2.5, 0.4 + tier * 0.5, sz + 0.5 + tier * 0.7));
  }

  // mcp:wellness/sauna_parna (2,8) 5×5 → absolute (44,46)
  const px = wx + 2, pz = wz + 8, pW = 5, pD = 5, pH = 2.5;
  wallWithOpenings(g, { axis: 'x', x: px, z: pz, length: pW, height: pH, material: MAT.wallBathroom });
  wallWithOpenings(g, { axis: 'x', x: px, z: pz + pD, length: pW, height: pH, material: MAT.wallBathroom });
  wallWithOpenings(g, { axis: 'z', x: px, z: pz, length: pD, height: pH, material: MAT.wallBathroom,
    openings: [{ start: 1.5, end: 3.5, bottom: 0, top: 2.1 }] });
  wallWithOpenings(g, { axis: 'z', x: px + pW, z: pz, length: pD, height: pH, material: MAT.wallBathroom });
  addDoor(g, { axis: 'z', x: px, z: pz, at: 2.5, width: 2, doorHeight: 2.1, material: glass });

  // mcp:wellness/ochlazovaci (14,8) 4×4 → absolute (56,46)
  addPool(g, wx + 14, wz + 8, 4, 4, 1.2, waterCold);

  // mcp:wellness/odpocinarna (8,12) 10×5 → absolute (50,50)
  const rx = wx + 8, rz = wz + 12;
  // Loungers
  for (let i = 0; i < 4; i++) {
    g.add(p(box(0.7, 0.35, 1.8, wood), rx + 1 + i * 2.2, 0.175, rz + 2.5));
  }
}

// ════════════════════════════════════════════════
// RESTAURACE — mcp:restaurace (0,50) 20×10
// ════════════════════════════════════════════════

function buildRestaurace(g) {
  const rx = 0, rz = 50, W = 20, D = 10, H = 4;

  wallWithOpenings(g, { axis: 'x', x: rx, z: rz, length: W, height: H, material: wallExt,
    openings: [{ start: 2, end: 8, bottom: 0.8, top: 3.5 }, { start: 12, end: 18, bottom: 0.8, top: 3.5 }] });
  wallWithOpenings(g, { axis: 'x', x: rx, z: rz + D, length: W, height: H, material: wallExt,
    openings: [{ start: 5, end: 15, bottom: 0.5, top: 3.5 }] });
  wallWithOpenings(g, { axis: 'z', x: rx, z: rz, length: D, height: H, material: wallExt });
  wallWithOpenings(g, { axis: 'z', x: rx + W, z: rz, length: D, height: H, material: wallExt,
    openings: [{ start: 3, end: 7, bottom: 0, top: 2.5 }] });

  // Windows
  addWindow(g, { axis: 'x', x: rx, z: rz, at: 5, width: 6, sillHeight: 0.8, winHeight: 2.7 });
  addWindow(g, { axis: 'x', x: rx, z: rz, at: 15, width: 6, sillHeight: 0.8, winHeight: 2.7 });
  addWindow(g, { axis: 'x', x: rx, z: rz + D, at: 10, width: 10, sillHeight: 0.5, winHeight: 3 });
  addDoor(g, { axis: 'z', x: rx + W, z: rz, at: 5, width: 4, doorHeight: 2.5, material: glass });

  addFloor(g, rx, rz, W, D, 0, MAT.floor);

  // Tables and chairs
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const tx = rx + 2.5 + col * 4.5;
      const tz = rz + 2 + row * 3;
      // Table
      g.add(p(box(1.2, 0.05, 0.8, woodDark), tx, 0.75, tz));
      g.add(p(box(0.08, 0.7, 0.08, steel), tx, 0.35, tz));
      // Chairs
      g.add(p(box(0.45, 0.45, 0.45, wood), tx - 0.7, 0.225, tz));
      g.add(p(box(0.45, 0.45, 0.45, wood), tx + 0.7, 0.225, tz));
    }
  }

  // Bar counter
  g.add(p(box(6, 1.1, 0.6, woodDark), rx + 17, 0.55, rz + 2));
}

// ════════════════════════════════════════════════
// TECHNICKÁ MÍSTNOST — mcp:technicka (68,50) 12×10
// ════════════════════════════════════════════════

function buildTechnicka(g) {
  const tx = 68, tz = 50, W = 12, D = 10, H = 4;

  wallWithOpenings(g, { axis: 'x', x: tx, z: tz, length: W, height: H, material: concrete });
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz + D, length: W, height: H, material: concrete });
  wallWithOpenings(g, { axis: 'z', x: tx, z: tz, length: D, height: H, material: concrete,
    openings: [{ start: 3, end: 7, bottom: 0, top: 3 }] });
  wallWithOpenings(g, { axis: 'z', x: tx + W, z: tz, length: D, height: H, material: concrete });

  addDoor(g, { axis: 'z', x: tx, z: tz, at: 5, width: 4, doorHeight: 3, material: MAT.door });

  addFloor(g, tx, tz, W, D, 0, concrete);

  // Filtration tanks
  for (let i = 0; i < 3; i++) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.5, 12), steel);
    tank.position.set(tx + 3 + i * 3.5, 1.25, tz + 5);
    g.add(tank);
  }
}

// ════════════════════════════════════════════════
// ROOF — glass/steel structure over pool hall
// ════════════════════════════════════════════════

function buildRoof(g) {
  // Main hall glass roof over pool area (10-66, 12-36)
  const roofY = 12;
  // Steel trusses
  for (let x = 10; x <= 66; x += 8) {
    g.add(p(box(0.2, 0.8, 24, steel), x, roofY - 0.4, 24));
  }
  // Cross beams
  for (let z = 12; z <= 36; z += 6) {
    g.add(p(box(56, 0.3, 0.15, steel), 38, roofY - 0.15, z));
  }
  // Glass roof panels
  const roofGlass = plane(56, 24, glass);
  roofGlass.rotation.x = -Math.PI / 2;
  roofGlass.position.set(38, roofY, 24);
  g.add(roofGlass);

  // Solid roofs for enclosed spaces
  addFlatRoof(g, 0, 0, 20, 12, 5, 0.2, roofMat);      // vstup
  addFlatRoof(g, 20, 0, 24, 12, 4, 0.2, roofMat);      // šatny
  addFlatRoof(g, 42, 38, 24, 18, 4, 0.2, roofMat);     // wellness
  addFlatRoof(g, 0, 50, 20, 10, 4, 0.2, roofMat);      // restaurace
  addFlatRoof(g, 68, 50, 12, 10, 4, 0.2, roofMat);     // technická
}
