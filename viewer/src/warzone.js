import * as THREE from 'three';
import { wallWithOpenings, addFloor, addFlatRoof, boxWithOpenings, MAT, box, plane } from './building-utils.js';

// ════════════════════════════════════════════════
// Warzone: Broken Village — 100×80m battlefield
// MCP: warzone_broken_village/battlefield
// ════════════════════════════════════════════════

const DS = THREE.FrontSide;
function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// ── Materials ──────────────────────────────────
const concrete    = new THREE.MeshLambertMaterial({ color: 0x888880, side: DS });
const concreteDk  = new THREE.MeshLambertMaterial({ color: 0x666660, side: DS });
const plaster     = new THREE.MeshLambertMaterial({ color: 0xd0c4a8, side: DS });
const plasterDk   = new THREE.MeshLambertMaterial({ color: 0xb0a488, side: DS });
const stone       = new THREE.MeshLambertMaterial({ color: 0x9a9488, side: DS });
const stoneDk     = new THREE.MeshLambertMaterial({ color: 0x7a7468, side: DS });
const brick       = new THREE.MeshLambertMaterial({ color: 0xa06040, side: DS });
const brickRuined = new THREE.MeshLambertMaterial({ color: 0x887060, side: DS });
const wood        = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const woodDk      = new THREE.MeshLambertMaterial({ color: 0x5a4020, side: DS });
const metal       = new THREE.MeshLambertMaterial({ color: 0x666666, side: DS });
const metalRust   = new THREE.MeshLambertMaterial({ color: 0x8a5a3a, side: DS });
const metalDk     = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const olive       = new THREE.MeshLambertMaterial({ color: 0x556b2f, side: DS });
const khaki       = new THREE.MeshLambertMaterial({ color: 0xbdb76b, side: DS });
const sand        = new THREE.MeshLambertMaterial({ color: 0xc2b280, side: DS });
const canvas      = new THREE.MeshLambertMaterial({ color: 0x8a9a6a, side: DS });
const roofTile    = new THREE.MeshLambertMaterial({ color: 0xaa4422, side: DS });
const roofDark    = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS });
const roofMetal   = new THREE.MeshLambertMaterial({ color: 0x707070, side: DS });
const glass       = new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.3, transparent: true, side: DS });
const glassBroken = new THREE.MeshLambertMaterial({ color: 0x667788, opacity: 0.2, transparent: true, side: DS });
const dirt        = new THREE.MeshLambertMaterial({ color: 0x6b5a40, side: DS });
const mud         = new THREE.MeshLambertMaterial({ color: 0x5a4a30, side: DS });
const water       = new THREE.MeshLambertMaterial({ color: 0x3388aa, opacity: 0.6, transparent: true, side: DS });
const treeTrunk   = new THREE.MeshLambertMaterial({ color: 0x664422, side: DS });
const treeLeaf    = new THREE.MeshLambertMaterial({ color: 0x2d6e1e, side: DS });
const treeLeafLt  = new THREE.MeshLambertMaterial({ color: 0x4a9e3f, side: DS });
const deadWood    = new THREE.MeshLambertMaterial({ color: 0x8a7a60, side: DS });
const grassMat    = new THREE.MeshLambertMaterial({ color: 0x5a8a3a, side: DS });
const bushMat     = new THREE.MeshLambertMaterial({ color: 0x3a6a2a, side: DS });
const hedgeMat    = new THREE.MeshLambertMaterial({ color: 0x2a5a1a, side: DS });
const rockMat     = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const wireMat     = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const fuelTank    = new THREE.MeshLambertMaterial({ color: 0x556655, side: DS });
const barrelMat   = new THREE.MeshLambertMaterial({ color: 0x333333, side: DS });
const cobble      = new THREE.MeshLambertMaterial({ color: 0x888078, side: DS });

// ── Helpers ────────────────────────────────────

function addBuilding(g, x, z, w, d, h, wallMat, roofMat, roofType = 'gable') {
  g.add(p(box(w, h, d, wallMat), x + w/2, h/2, z + d/2));
  const roofH = Math.min(w, d) * 0.3;
  if (roofType === 'flat') {
    g.add(p(box(w + 0.3, 0.25, d + 0.3, roofMat), x + w/2, h + 0.125, z + d/2));
  } else {
    const span = Math.min(w, d), slopeLen = Math.sqrt((span/2)**2 + roofH**2);
    const angle = Math.atan2(roofH, span/2);
    if (w >= d) {
      const r1 = box(w + 0.4, 0.12, slopeLen + 0.2, roofMat);
      r1.position.set(x + w/2, h + roofH/2, z + d/4); r1.rotation.x = -angle; g.add(r1);
      const r2 = box(w + 0.4, 0.12, slopeLen + 0.2, roofMat);
      r2.position.set(x + w/2, h + roofH/2, z + d*3/4); r2.rotation.x = angle; g.add(r2);
    } else {
      const r1 = box(slopeLen + 0.2, 0.12, d + 0.4, roofMat);
      r1.position.set(x + w/4, h + roofH/2, z + d/2); r1.rotation.z = angle; g.add(r1);
      const r2 = box(slopeLen + 0.2, 0.12, d + 0.4, roofMat);
      r2.position.set(x + w*3/4, h + roofH/2, z + d/2); r2.rotation.z = -angle; g.add(r2);
    }
  }
}

function addTent(g, x, z, w, d, h, mat) {
  // Poles at corners
  for (const [px, pz] of [[0.1,0.1],[w-0.1,0.1],[0.1,d-0.1],[w-0.1,d-0.1]])
    g.add(p(box(0.08, h, 0.08, metalDk), x+px, h/2, z+pz));
  // Ridge pole
  g.add(p(box(w, 0.06, 0.06, metalDk), x+w/2, h, z+d/2));
  // Canvas roof — two slopes
  const slopeLen = Math.sqrt((d/2)**2 + (h*0.15)**2);
  const angle = Math.atan2(h*0.15, d/2);
  const r1 = box(w + 0.2, 0.04, slopeLen + 0.1, mat);
  r1.position.set(x+w/2, h - h*0.075, z+d/4); r1.rotation.x = angle; g.add(r1);
  const r2 = box(w + 0.2, 0.04, slopeLen + 0.1, mat);
  r2.position.set(x+w/2, h - h*0.075, z+d*3/4); r2.rotation.x = -angle; g.add(r2);
}

function addTree(g, x, z, size = 1, dead = false) {
  const h = 3 + size * 2;
  const r = 0.8 + size * 0.6;
  g.add(p(box(0.2*size, h*0.6, 0.2*size, dead ? deadWood : treeTrunk), x, h*0.3, z));
  if (!dead) {
    const sg = new THREE.SphereGeometry(r, 8, 6);
    g.add(p(new THREE.Mesh(sg, treeLeaf), x, h*0.7, z));
    g.add(p(new THREE.Mesh(new THREE.SphereGeometry(r*0.7, 7, 5), treeLeafLt), x+r*0.3, h*0.6, z+r*0.2));
  } else {
    // Dead branches
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI/2 + 0.3;
      const br = box(0.06, 0.8, 0.06, deadWood);
      br.position.set(x + Math.cos(angle)*0.5, h*0.5 + i*0.3, z + Math.sin(angle)*0.5);
      br.rotation.z = Math.cos(angle) * 0.5;
      br.rotation.x = Math.sin(angle) * 0.5;
      g.add(br);
    }
  }
}

function addForest(g, x, z, w, d) {
  const count = Math.floor((w * d) / 6);
  for (let i = 0; i < count; i++) {
    const tx = x + 1 + ((i * 7 + 3) % (Math.floor(w) - 2));
    const tz = z + 1 + ((i * 11 + 5) % (Math.floor(d) - 2));
    const s = 0.7 + ((i * 3) % 5) * 0.15;
    addTree(g, tx, tz, s);
  }
  // Undergrowth
  const ug = plane(w, d, grassMat);
  ug.rotation.x = -Math.PI/2;
  ug.position.set(x + w/2, 0.02, z + d/2);
  g.add(ug);
}

function addBush(g, x, z, size = 1) {
  const r = 0.4 * size;
  g.add(p(new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), bushMat), x + r, r*0.7, z + r));
  if (size > 1.2) g.add(p(new THREE.Mesh(new THREE.SphereGeometry(r*0.6, 6, 4), treeLeafLt), x+r+r*0.4, r*0.5, z+r-r*0.3));
}

function addRock(g, x, z, w, d, h) {
  const geo = new THREE.SphereGeometry(1, 6, 5);
  geo.scale(w/2, h || w*0.4, d/2);
  const mesh = new THREE.Mesh(geo, rockMat);
  mesh.position.set(x + w/2, (h || w*0.4) * 0.4, z + d/2);
  g.add(mesh);
}

function addSandbag(g, x, z, w, d, h = 0.8) {
  g.add(p(box(w, h, d, sand), x + w/2, h/2, z + d/2));
  // Top row offset
  g.add(p(box(w*0.9, h*0.3, d*0.8, sand), x + w/2, h + h*0.15, z + d/2));
}

function addContainer(g, x, z, w, d, h = 2.6, mat = metalRust) {
  // Corrugated walls
  g.add(p(box(w, h, d, mat), x + w/2, h/2, z + d/2));
  // Door lines on short end
  if (w > d) {
    g.add(p(box(0.04, h*0.8, d*0.02, metalDk), x + 0.05, h*0.45, z + d/2));
  }
}

function addCrater(g, x, z, size) {
  // Depressed circle in ground
  const geo = new THREE.SphereGeometry(size/2, 10, 8, 0, Math.PI*2, 0, Math.PI/2);
  const mesh = new THREE.Mesh(geo, dirt);
  mesh.rotation.x = Math.PI;
  mesh.position.set(x + size/2, 0.05, z + size/2);
  mesh.scale.y = 0.3;
  g.add(mesh);
  // Rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(size/2, 0.15, 8, 16), mud);
  rim.rotation.x = -Math.PI/2;
  rim.position.set(x + size/2, 0.15, z + size/2);
  g.add(rim);
}

function addTrench(g, x, z, w, d, depth = 1.5) {
  // Floor
  g.add(p(box(w, 0.1, d, mud), x + w/2, -depth + 0.05, z + d/2));
  // Walls
  if (w < d) { // N-S trench
    g.add(p(box(0.15, depth, d, dirt), x, -depth/2, z + d/2));
    g.add(p(box(0.15, depth, d, dirt), x + w, -depth/2, z + d/2));
  } else { // E-W trench
    g.add(p(box(w, depth, 0.15, dirt), x + w/2, -depth/2, z));
    g.add(p(box(w, depth, 0.15, dirt), x + w/2, -depth/2, z + d));
  }
  // Plank walkway
  g.add(p(box(w*0.8, 0.05, d*0.8, wood), x + w/2, -depth + 0.12, z + d/2));
}

function addWreck(g, x, z, w, d, h, mat, type = 'car') {
  // Base hull
  g.add(p(box(w, h*0.5, d, mat), x + w/2, h*0.25, z + d/2));
  if (type === 'tank') {
    // Turret
    g.add(p(box(w*0.5, h*0.4, d*0.6, mat), x + w/2, h*0.7, z + d/2));
    // Barrel
    g.add(p(box(w*0.08, 0.12, d*0.8, metalDk), x + w/2, h*0.7, z - d*0.2));
    // Tracks
    g.add(p(box(w, h*0.25, d*0.15, metalDk), x + w/2, h*0.125, z + 0.1));
    g.add(p(box(w, h*0.25, d*0.15, metalDk), x + w/2, h*0.125, z + d - 0.1));
  } else if (type === 'truck') {
    // Cab
    g.add(p(box(w*0.9, h*0.5, d*0.3, mat), x + w/2, h*0.6, z + d*0.15));
    // Cargo
    g.add(p(box(w*0.95, h*0.6, d*0.6, mat), x + w/2, h*0.5, z + d*0.65));
  } else if (type === 'apc') {
    // Angled top
    g.add(p(box(w*0.8, h*0.3, d*0.7, mat), x + w/2, h*0.55, z + d/2));
    g.add(p(box(w*0.3, h*0.2, d*0.3, metalDk), x + w*0.3, h*0.7, z + d*0.4));
  } else {
    // Car cabin
    g.add(p(box(w*0.7, h*0.4, d*0.5, mat), x + w/2, h*0.55, z + d*0.4));
  }
  // Wheels
  const wheelR = h * 0.2;
  for (const wz of [z + d*0.2, z + d*0.8]) {
    g.add(p(box(w + 0.05, wheelR*2, wheelR*2, metalDk), x + w/2, wheelR, wz));
  }
}

function addBarbedWire(g, x, z, w, d) {
  const along = w > d ? 'x' : 'z';
  const len = Math.max(w, d);
  const posts = Math.floor(len / 2);
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    const px = along === 'x' ? x + t * w : x + w/2;
    const pz = along === 'x' ? z + d/2 : z + t * d;
    g.add(p(box(0.04, 1.0, 0.04, woodDk), px, 0.5, pz));
  }
  // Wire lines
  for (const h of [0.3, 0.6, 0.9]) {
    if (along === 'x') {
      g.add(p(box(w, 0.02, 0.02, wireMat), x + w/2, h, z + d/2));
    } else {
      g.add(p(box(0.02, 0.02, d, wireMat), x + w/2, h, z + d/2));
    }
  }
}

function addWallRuins(g, x, z, w, d, h = 1.5) {
  // Uneven broken wall
  const segments = Math.max(3, Math.floor(Math.max(w, d) / 1.5));
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const sh = h * (0.5 + 0.5 * Math.sin(i * 2.7));
    const sw = Math.max(w, d) / segments;
    if (w > d) {
      g.add(p(box(sw, sh, Math.max(d, 0.3), brickRuined), x + t*w + sw/2, sh/2, z + d/2));
    } else {
      g.add(p(box(Math.max(w, 0.3), sh, sw, brickRuined), x + w/2, sh/2, z + t*d + sw/2));
    }
  }
}

function addRubble(g, x, z, w, d) {
  const count = 5 + Math.floor(w * d);
  for (let i = 0; i < count; i++) {
    const rx = x + ((i * 7 + 2) % Math.floor(w * 10)) / 10;
    const rz = z + ((i * 11 + 3) % Math.floor(d * 10)) / 10;
    const s = 0.15 + (i % 3) * 0.15;
    g.add(p(box(s, s*0.6, s, i % 2 ? brickRuined : concreteDk), rx, s*0.3, rz));
  }
}

// ── ALPHA BASE (north spawn) ───────────────────

function buildAlphaBase(g) {
  // mcp:alpha_hq (40,2) 10×6 — military HQ with rooms
  const hx = 40, hz = 2, hw = 10, hd = 6, hH = 3.5;
  // Walls with window openings
  wallWithOpenings(g, { axis: 'x', x: hx, z: hz, length: hw, height: hH, material: concrete,
    openings: [{ start: 2, end: 4, bottom: 1.0, top: 2.2 }] }); // north — window
  wallWithOpenings(g, { axis: 'x', x: hx, z: hz+hd, length: hw, height: hH, material: concrete,
    openings: [{ start: 2, end: 4, bottom: 1.0, top: 2.2 }, { start: 4.5, end: 5.5, top: 2.1 }] }); // south — window + door
  wallWithOpenings(g, { axis: 'z', x: hx, z: hz, length: hd, height: hH, material: concrete });
  wallWithOpenings(g, { axis: 'z', x: hx+hw, z: hz, length: hd, height: hH, material: concrete });
  // Internal wall cmd/radio
  wallWithOpenings(g, { axis: 'z', x: hx+6, z: hz, length: hd, height: hH, material: concrete,
    openings: [{ start: 2, end: 3, top: 2.1 }] });
  // Internal wall radio/armory
  wallWithOpenings(g, { axis: 'x', x: hx+6, z: hz+3, length: 4, height: hH, material: concrete,
    openings: [{ start: 1.5, end: 2.5, top: 2.1 }] });
  addFloor(g, hx, hz, hw, hd, 0, concrete);
  addFlatRoof(g, hx, hz, hw, hd, hH, 0.2, roofDark);
  // Table
  g.add(p(box(3, 0.05, 2, woodDk), hx+3, 0.8, hz+2.5));
  g.add(p(box(0.06, 0.8, 0.06, metalDk), hx+1.8, 0.4, hz+1.8));
  g.add(p(box(0.06, 0.8, 0.06, metalDk), hx+4.2, 0.4, hz+1.8));
  g.add(p(box(0.06, 0.8, 0.06, metalDk), hx+1.8, 0.4, hz+3.2));
  g.add(p(box(0.06, 0.8, 0.06, metalDk), hx+4.2, 0.4, hz+3.2));

  // mcp:alpha_barracks (55,2) 5×8
  addBuilding(g, 55, 2, 5, 8, 3, olive, roofMetal, 'flat');

  // mcp:alpha_ammo (30,3) 6×4
  addBuilding(g, 30, 3, 6, 4, 2.5, concrete, roofDark, 'flat');

  // mcp:alpha_tower (66,0) 3×3
  buildTower(g, 66, 0, 3, 3, 8, concrete);

  // mcp:alpha_motor (42,9) 8×5
  addTent(g, 42, 9, 8, 5, 3, canvas);
  // Parked vehicle wreck inside
  addWreck(g, 43, 10, 3.5, 1.8, 1.5, olive, 'car');

  // Cover
  addSandbag(g, 48, 8, 4, 0.5);    // mcp:alpha_sb1
  addSandbag(g, 33, 8, 0.5, 3);    // mcp:alpha_sb2
  addSandbag(g, 62, 5, 2, 0.5);    // mcp:alpha_sb3
  g.add(p(box(2, 1.2, 2, woodDk), 38, 0.6, 6));  // mcp:alpha_crates
  addWreck(g, 52, 11, 4.5, 2, 1.6, olive, 'car'); // mcp:alpha_wreck
}

// ── BRAVO BASE (south spawn) ──────────────────

function buildBravoBase(g) {
  // mcp:bravo_hq (42,72) 8×5 — rebel command tent
  addTent(g, 42, 72, 8, 5, 3.2, canvas);
  // Radio equipment inside
  g.add(p(box(1, 1.2, 0.5, metalDk), 45, 0.6, 73));

  // mcp:bravo_barracks (32,72) 5×8
  addBuilding(g, 32, 72, 5, 8, 2.8, metalRust, roofMetal, 'gable');

  // mcp:bravo_supply (55,74) 5×3
  addTent(g, 55, 74, 5, 3, 2.5, canvas);

  // mcp:bravo_tower (64,76) 3×3
  buildTower(g, 64, 76, 3, 3, 7, wood);

  // mcp:bravo_tech (40,78) 6×2
  addTent(g, 40, 78, 6, 2, 2.5, canvas);

  // Cover
  addSandbag(g, 45, 70, 4, 0.5);    // bravo_sb1
  addSandbag(g, 60, 73, 0.5, 3);    // bravo_sb2
  addSandbag(g, 30, 73, 0.5, 3);    // bravo_sb3
  addWreck(g, 52, 70, 4, 2, 1.4, metalRust, 'car'); // bravo_wreck
  g.add(p(box(2, 1, 1.5, woodDk), 59, 0.5, 78.75)); // bravo_crates
}

// ── GUARD TOWER ────────────────────────────────

function buildTower(g, x, z, w, d, h, mat) {
  // Four posts
  for (const [px, pz] of [[0.1,0.1],[w-0.1,0.1],[0.1,d-0.1],[w-0.1,d-0.1]])
    g.add(p(box(0.2, h, 0.2, mat), x+px, h/2, z+pz));
  // Cross braces
  g.add(p(box(w, 0.1, 0.1, mat), x+w/2, h*0.3, z+d/2));
  g.add(p(box(0.1, 0.1, d, mat), x+w/2, h*0.5, z+d/2));
  // Platform
  g.add(p(box(w+0.4, 0.15, d+0.4, wood), x+w/2, h-0.5, z+d/2));
  // Rails
  for (const [rx, rz, rw, rd] of [[x-0.1,z+d/2,0.08,d+0.4],[x+w+0.1,z+d/2,0.08,d+0.4],[x+w/2,z-0.1,w+0.4,0.08],[x+w/2,z+d+0.1,w+0.4,0.08]])
    g.add(p(box(rw, 1.0, rd, wood), rx, h-0.5+0.5, rz));
  // Roof
  g.add(p(box(w+0.6, 0.1, d+0.6, roofMetal), x+w/2, h+0.55, z+d/2));
  // Ladder
  for (let ly = 0; ly < h-0.5; ly += 0.4)
    g.add(p(box(0.6, 0.04, 0.06, wood), x+w+0.15, ly+0.2, z+d/2));
  g.add(p(box(0.04, h-0.5, 0.04, wood), x+w+0.15-0.28, (h-0.5)/2, z+d/2));
  g.add(p(box(0.04, h-0.5, 0.04, wood), x+w+0.15+0.28, (h-0.5)/2, z+d/2));
}

// ── VILLAGE ────────────────────────────────────

function buildVillage(g) {
  buildChurch(g);
  buildPub(g);
  buildWarehouse_village(g); // bakery reuses simple building

  // mcp:village_ruin1 (58,27) 6×5
  buildRuinedHouse(g, 58, 27, 6, 5, 3, 0);

  // mcp:village_house1 (60,37) 5×6
  addBuilding(g, 60, 37, 5, 6, 3, plaster, roofTile, 'gable');
  // Windows
  wallWithOpenings(g, { axis: 'x', x: 60, z: 37, length: 5, height: 3, material: plaster,
    openings: [{ start: 1.5, end: 3, bottom: 0.9, top: 2.2 }] });

  // mcp:village_house2 (33,44) 7×5
  addBuilding(g, 33, 44, 7, 5, 3, plasterDk, roofTile, 'gable');

  // mcp:village_bakery (56,46) 5×4
  addBuilding(g, 56, 46, 5, 4, 2.8, plaster, roofTile, 'gable');

  // mcp:village_ruin2 (34,26) 5×6 rotated 90°
  buildRuinedHouse(g, 34, 26, 5, 6, 3, 90);

  // mcp:village_fountain (47,50) 3×3
  buildFountain(g, 47, 50, 3);

  // mcp:village_stalls (43,49) 3×5
  buildMarketStalls(g, 43, 49, 3, 5);

  // Wrecked cars
  addWreck(g, 40, 42, 4, 2, 1.4, metalDk, 'car');   // village_car1
  addWreck(g, 55, 52, 2, 4, 1.4, metalDk, 'car');   // village_car2

  // Rubble
  addRubble(g, 56, 34, 3, 2);   // village_rubble1
  addRubble(g, 38, 40, 3, 2);   // village_rubble2
  addRubble(g, 44, 55, 3, 2);   // village_rubble3

  // Market square cobblestone
  const sq = plane(14, 7, cobble);
  sq.rotation.x = -Math.PI/2; sq.position.set(49, 0.02, 51.5);
  g.add(sq);
}

function buildChurch(g) {
  // mcp:village_church (45,28) 10×16
  const cx = 45, cz = 28;
  const naveH = 8, altarH = 6, towerH = 15;

  // Nave walls (45,32)-(55,42) = 10×10
  wallWithOpenings(g, { axis: 'x', x: cx, z: cz+4, length: 10, height: naveH, material: stone }); // north nave
  wallWithOpenings(g, { axis: 'x', x: cx, z: cz+14, length: 10, height: naveH, material: stone,
    openings: [{ start: 3.5, end: 6.5, top: 3.5 }] }); // south — main entrance
  wallWithOpenings(g, { axis: 'z', x: cx, z: cz+4, length: 10, height: naveH, material: stone,
    openings: [{ start: 1, end: 3, bottom: 1.5, top: 4 }, { start: 5, end: 7, bottom: 1.5, top: 4 }] }); // west — stained glass
  wallWithOpenings(g, { axis: 'z', x: cx+10, z: cz+4, length: 10, height: naveH, material: stone,
    openings: [{ start: 1, end: 3, bottom: 1.5, top: 4 }, { start: 5, end: 7, bottom: 1.5, top: 4 }] }); // east — stained glass

  // Stained glass windows
  for (const [at, wz, ax] of [[cz+6, cx, 'z'], [cz+10, cx, 'z'], [cz+6, cx+10, 'z'], [cz+10, cx+10, 'z']]) {
    const gl = plane(2, 2.5, glass);
    if (ax === 'z') { gl.rotation.y = Math.PI/2; gl.position.set(wz, 2.75, at); }
    g.add(gl);
  }

  // Altar area (48,29)-(52,32) 4×3
  wallWithOpenings(g, { axis: 'x', x: cx+3, z: cz+1, length: 4, height: altarH, material: stone });
  wallWithOpenings(g, { axis: 'z', x: cx+3, z: cz+1, length: 3, height: altarH, material: stone });
  wallWithOpenings(g, { axis: 'z', x: cx+7, z: cz+1, length: 3, height: altarH, material: stone });
  // Connecting wall altar-nave
  wallWithOpenings(g, { axis: 'x', x: cx, z: cz+4, length: 3, height: altarH, material: stone });
  wallWithOpenings(g, { axis: 'x', x: cx+7, z: cz+4, length: 3, height: altarH, material: stone });

  // Floor
  addFloor(g, cx, cz+4, 10, 10, 0, stoneDk); // nave
  addFloor(g, cx+3, cz+1, 4, 3, 0, stone);   // altar

  // Pews (rows of benches)
  for (let row = 0; row < 6; row++) {
    g.add(p(box(1.8, 0.8, 0.4, woodDk), cx+1.4, 0.4, cz+5.5+row*1.3)); // left
    g.add(p(box(1.8, 0.8, 0.4, woodDk), cx+6.9, 0.4, cz+5.5+row*1.3)); // right
  }

  // Altar table
  g.add(p(box(2, 1, 1, stone), cx+5, 0.5, cz+2));

  // Bell tower (48.5,42)-(51.5,44) 3×2
  const tx = cx+3.5, tz = cz+14;
  for (const [px, pz] of [[0,0],[3,0],[0,2],[3,2]])
    g.add(p(box(0.4, towerH, 0.4, stone), tx+px, towerH/2, tz+pz));
  // Tower walls - partially open at top
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz, length: 3, height: towerH, material: stone,
    openings: [{ start: 0.5, end: 2.5, bottom: towerH-3, top: towerH-0.5 }] });
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz+2, length: 3, height: towerH, material: stone,
    openings: [{ start: 0.5, end: 2.5, bottom: towerH-3, top: towerH-0.5 }] });
  wallWithOpenings(g, { axis: 'z', x: tx, z: tz, length: 2, height: towerH, material: stone,
    openings: [{ start: 0.3, end: 1.7, bottom: towerH-3, top: towerH-0.5 }] });
  wallWithOpenings(g, { axis: 'z', x: tx+3, z: tz, length: 2, height: towerH, material: stone,
    openings: [{ start: 0.3, end: 1.7, bottom: towerH-3, top: towerH-0.5 }] });
  // Tower platform
  g.add(p(box(3.2, 0.15, 2.2, stone), tx+1.5, towerH-3.1, tz+1));
  // Pointed roof
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3, 4), roofTile);
  cone.position.set(tx+1.5, towerH+1.5, tz+1);
  cone.rotation.y = Math.PI/4;
  g.add(cone);

  // Nave roof (gable)
  const roofLen = 10.5, roofSlope = Math.sqrt(5.2**2 + 2.5**2);
  const roofAngle = Math.atan2(2.5, 5.2);
  const r1 = box(roofLen, 0.15, roofSlope, roofTile);
  r1.position.set(cx+5, naveH+1.2, cz+6.7); r1.rotation.x = -roofAngle; g.add(r1);
  const r2 = box(roofLen, 0.15, roofSlope, roofTile);
  r2.position.set(cx+5, naveH+1.2, cz+11.3); r2.rotation.x = roofAngle; g.add(r2);
}

function buildPub(g) {
  // mcp:village_pub (34,34) 8×6
  const px = 34, pz = 34, pw = 8, pd = 6, pH = 3.5;

  // Taproom + Kitchen + Storeroom walls
  wallWithOpenings(g, { axis: 'x', x: px, z: pz, length: pw, height: pH, material: plaster,
    openings: [{ start: 3, end: 4.2, top: 2.1 }, { start: 6, end: 7.5, bottom: 0.8, top: 2.2 }] }); // north — door + window
  wallWithOpenings(g, { axis: 'x', x: px, z: pz+pd, length: pw, height: pH, material: plaster,
    openings: [{ start: 1, end: 2, top: 2.1 }] }); // south — back door
  wallWithOpenings(g, { axis: 'z', x: px, z: pz, length: pd, height: pH, material: plaster });
  wallWithOpenings(g, { axis: 'z', x: px+pw, z: pz, length: pd, height: pH, material: plaster });
  // Internal wall taproom/kitchen
  wallWithOpenings(g, { axis: 'x', x: px, z: pz+4, length: pw, height: pH, material: plaster,
    openings: [{ start: 1, end: 2.2, top: 2.1 }, { start: 5, end: 6.2, top: 2.1 }] });
  // Internal wall kitchen/storeroom
  wallWithOpenings(g, { axis: 'z', x: px+4, z: pz+4, length: 2, height: pH, material: plaster });

  addFloor(g, px, pz, pw, pd, 0, MAT.floorDark);
  addFlatRoof(g, px, pz, pw, pd, pH, 0.2, roofTile);

  // Bar
  g.add(p(box(5, 1.1, 0.5, woodDk), px+3.5, 0.55, pz+1));
  // Tables
  g.add(p(box(1.2, 0.75, 0.8, wood), px+2, 0.375, pz+2.5));
  g.add(p(box(1.2, 0.75, 0.8, wood), px+5, 0.375, pz+2.5));
}

function buildWarehouse_village(g) {
  // This builds the east_warehouse — called from buildEastFlank
}

function buildRuinedHouse(g, x, z, w, d, h, rot) {
  // Half standing, half collapsed
  const hw = w / 2;
  // Standing portion
  if (rot === 0 || rot === 180) {
    wallWithOpenings(g, { axis: 'x', x: x, z: z, length: hw, height: h, material: brickRuined });
    wallWithOpenings(g, { axis: 'x', x: x, z: z+d, length: hw, height: h, material: brickRuined });
    wallWithOpenings(g, { axis: 'z', x: x, z: z, length: d, height: h, material: brickRuined,
      openings: [{ start: d*0.3, end: d*0.3+1, top: 2.1 }] }); // door
    wallWithOpenings(g, { axis: 'z', x: x+hw, z: z, length: d, height: h*0.5, material: brickRuined }); // broken wall
    addFloor(g, x, z, hw, d, 0, dirt);
    // Collapsed part — rubble
    addRubble(g, x+hw, z, hw, d);
    // Partial walls sticking up
    g.add(p(box(0.2, h*0.7, 0.2, brickRuined), x+w-0.1, h*0.35, z+0.1));
    g.add(p(box(0.2, h*0.4, 0.2, brickRuined), x+w-0.1, h*0.2, z+d-0.1));
  } else {
    // Rotated 90° — swap w/d logic
    wallWithOpenings(g, { axis: 'z', x: x, z: z, length: d/2, height: h, material: brickRuined });
    wallWithOpenings(g, { axis: 'z', x: x+w, z: z, length: d/2, height: h, material: brickRuined });
    wallWithOpenings(g, { axis: 'x', x: x, z: z, length: w, height: h, material: brickRuined,
      openings: [{ start: w*0.3, end: w*0.3+1, top: 2.1 }] });
    addFloor(g, x, z, w, d/2, 0, dirt);
    addRubble(g, x, z+d/2, w, d/2);
  }
}

function buildFountain(g, x, z, size) {
  // Circular base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(size/2, size/2+0.1, 0.6, 12), stone);
  base.position.set(x+size/2, 0.3, z+size/2); g.add(base);
  // Basin
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(size/2-0.1, size/2-0.1, 0.1, 12), water);
  basin.position.set(x+size/2, 0.55, z+size/2); g.add(basin);
  // Central column
  g.add(p(box(0.3, 1.5, 0.3, stone), x+size/2, 1.05, z+size/2));
}

function buildMarketStalls(g, x, z, w, d) {
  // Overturned stall frames
  for (let i = 0; i < 3; i++) {
    const sz = z + i * (d/3);
    g.add(p(box(w, 0.04, d/3-0.2, wood), x+w/2, 0.8+i*0.1, sz+d/6));
    // Tilted
    const frame = box(w, 1.2, 0.06, woodDk);
    frame.position.set(x+w/2, 0.6, sz+d/6-0.3);
    frame.rotation.x = 0.2 + i*0.15;
    g.add(frame);
  }
}

// ── WEST FLANK (trenches) ─────────────────────

function buildWestFlank(g) {
  // mcp:west_trench_n (5,18) 2×14
  addTrench(g, 5, 18, 2, 14);
  // mcp:west_trench_s (5,38) 2×14
  addTrench(g, 5, 38, 2, 14);
  // mcp:west_trench_x (7,32) 10×2
  addTrench(g, 7, 32, 10, 2);

  // mcp:west_bunker (8,34) 5×4
  buildBunker(g, 8, 34, 5, 4);

  // mcp:west_mg_n (3,22) 2.5×2.5
  addSandbag(g, 3, 22, 2.5, 2.5, 1.0);
  // mcp:west_mg_s (3,48) 2.5×2.5
  addSandbag(g, 3, 48, 2.5, 2.5, 1.0);

  // mcp:west_cache (10,26) 2×2
  g.add(p(box(2, 1.0, 2, woodDk), 11, 0.5, 27));

  addSandbag(g, 7, 20, 4, 0.5);  // west_sb1
  addSandbag(g, 7, 44, 4, 0.5);  // west_sb2

  // mcp:west_tree (15,30) 1×6 — fallen tree
  const log = box(0.4, 0.4, 6, treeTrunk);
  log.position.set(15.5, 0.3, 33); log.rotation.x = 0.05; g.add(log);
  // Branches
  for (let i = 0; i < 4; i++) {
    const br = box(0.1, 0.8, 0.1, treeTrunk);
    br.position.set(15.5 + (i%2?0.3:-0.3), 0.6, 31 + i*1.2);
    br.rotation.z = (i%2?0.4:-0.4);
    g.add(br);
  }
}

function buildBunker(g, x, z, w, d) {
  const bH = 2.5;
  // Thick concrete walls
  wallWithOpenings(g, { axis: 'x', x: x, z: z, length: w, height: bH, thickness: 0.4, material: concreteDk,
    openings: [{ start: 1.5, end: 3.5, bottom: 0.8, top: 1.1 }] }); // slit north
  wallWithOpenings(g, { axis: 'x', x: x, z: z+3, length: w, height: bH, thickness: 0.4, material: concreteDk }); // internal
  wallWithOpenings(g, { axis: 'x', x: x, z: z+d, length: w, height: bH, thickness: 0.4, material: concreteDk,
    openings: [{ start: 1.5, end: 3.5, top: 2.1 }] }); // entry
  wallWithOpenings(g, { axis: 'z', x: x, z: z, length: d, height: bH, thickness: 0.4, material: concreteDk });
  wallWithOpenings(g, { axis: 'z', x: x+w, z: z, length: d, height: bH, thickness: 0.4, material: concreteDk,
    openings: [{ start: 1, end: 2, bottom: 0.8, top: 1.1 }] }); // slit east
  // Entry corridor
  wallWithOpenings(g, { axis: 'z', x: x+1.5, z: z+3, length: 1, height: bH, thickness: 0.3, material: concreteDk });
  wallWithOpenings(g, { axis: 'z', x: x+3.5, z: z+3, length: 1, height: bH, thickness: 0.3, material: concreteDk });

  addFloor(g, x, z, w, d, 0, concreteDk);
  // Thick roof
  g.add(p(box(w+0.5, 0.5, d+0.5, concreteDk), x+w/2, bH+0.25, z+d/2));
}

// ── EAST FLANK (industrial) ───────────────────

function buildEastFlank(g) {
  // mcp:east_warehouse (78,30) 14×10
  buildWarehouse(g, 78, 30, 14, 10);

  // mcp:east_fuel (80,46) 8×5
  buildFuelDepot(g, 80, 46, 8, 5);

  // Containers
  addContainer(g, 78, 42, 6, 2.5);    // east_cont1
  addContainer(g, 85, 42, 6, 2.5);    // east_cont2
  addContainer(g, 80, 25, 2.5, 6);    // east_cont3
  addContainer(g, 90, 25, 2.5, 6);    // east_cont4

  // mcp:east_stack (93,35) 5×5 — stacked containers
  addContainer(g, 93, 35, 5, 5, 2.6, metalRust);
  addContainer(g, 93.3, 35.3, 4.4, 4.4, 2.6, metalDk);
  // Top container shifted
  const topC = box(4.4, 2.6, 4.4, olive);
  topC.position.set(95.5, 2.6+1.3, 37.5); g.add(topC);

  // mcp:east_crane (93,28) 4×4
  buildCrane(g, 93, 28, 4, 4, 12);

  // mcp:east_barrels (85,48) 2×2
  for (let i = 0; i < 4; i++) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 8), barrelMat);
    barrel.position.set(85.5 + (i%2)*0.7, 0.45, 48.5 + Math.floor(i/2)*0.7);
    g.add(barrel);
  }

  // mcp:east_forklift (83,35) 2×3
  g.add(p(box(1.5, 1.2, 2, olive), 83.75, 0.6, 36.5)); // body
  g.add(p(box(0.1, 1.8, 0.1, metalDk), 83.3, 0.9, 35.2)); // fork left
  g.add(p(box(0.1, 1.8, 0.1, metalDk), 84.2, 0.9, 35.2)); // fork right
  g.add(p(box(1, 0.04, 0.6, metalDk), 83.75, 0.15, 35.1)); // forks
}

function buildWarehouse(g, x, z, w, d) {
  const wH = 6;
  // Main hall walls
  wallWithOpenings(g, { axis: 'x', x: x, z: z, length: w, height: wH, material: metal,
    openings: [{ start: 2, end: 4, bottom: 1, top: 3 }, { start: 5, end: 9, top: 4.5 }] }); // north — window + rolling gate
  wallWithOpenings(g, { axis: 'x', x: x, z: z+d, length: w, height: wH, material: metal });
  wallWithOpenings(g, { axis: 'z', x: x, z: z, length: d, height: wH, material: metal });
  wallWithOpenings(g, { axis: 'z', x: x+w, z: z, length: d, height: wH, material: metal,
    openings: [{ start: 4, end: 5.5, top: 2.1 }, { start: 1, end: 3, bottom: 1.5, top: 3.5 }] }); // east — door + window

  // Internal: office wall
  wallWithOpenings(g, { axis: 'x', x: x, z: z+8, length: 5, height: 3, material: plaster,
    openings: [{ start: 2, end: 3, top: 2.1 }] });
  wallWithOpenings(g, { axis: 'z', x: x+5, z: z+8, length: 2, height: 3, material: plaster,
    openings: [{ start: 0.5, end: 1.5, top: 2.1 }] });

  addFloor(g, x, z, w, d, 0, concreteDk);
  addFlatRoof(g, x, z, w, d, wH, 0.3, roofMetal);

  // Catwalk/galerie (x, z) 2×8 at elevation 3m
  g.add(p(box(2, 0.1, 8, metal), x+1, 3, z+4));
  // Catwalk railing
  g.add(p(box(0.04, 1, 8, metalDk), x+2, 3.5, z+4));
  // Support pillars
  for (const pz of [z+1, z+4, z+7])
    g.add(p(box(0.15, 3, 0.15, metalDk), x+1.5, 1.5, pz));

  // Crates inside
  g.add(p(box(3, 2, 2, woodDk), x+2.5, 1, z+2));   // crates1
  g.add(p(box(2, 2.5, 3, woodDk), x+7, 1.25, z+2.5)); // crates2
  g.add(p(box(3, 1.5, 2, woodDk), x+11.5, 0.75, z+5)); // crates3
}

function buildFuelDepot(g, x, z, w, d) {
  // Chain-link fence (simplified as wireframe)
  addSandbag(g, x, z, w, 0.3, 0.3);
  addSandbag(g, x, z+d, w, 0.3, 0.3);
  addSandbag(g, x, z, 0.3, d, 0.3);
  addSandbag(g, x+w, z, 0.3, d, 0.3);

  // Fuel tanks (cylindrical)
  for (const [tx, tz] of [[x+2, z+2.5], [x+5, z+2.5]]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.5, 10), fuelTank);
    tank.rotation.x = Math.PI/2;
    tank.position.set(tx, 1.3, tz);
    g.add(tank);
    // Supports
    g.add(p(box(0.1, 1.3, 0.1, metalDk), tx-0.8, 0.65, tz-0.5));
    g.add(p(box(0.1, 1.3, 0.1, metalDk), tx+0.8, 0.65, tz-0.5));
    g.add(p(box(0.1, 1.3, 0.1, metalDk), tx-0.8, 0.65, tz+0.5));
    g.add(p(box(0.1, 1.3, 0.1, metalDk), tx+0.8, 0.65, tz+0.5));
  }

  // Pump
  g.add(p(box(0.6, 1.5, 0.4, metalDk), x+3.5, 0.75, z+1));

  // Barrels
  for (let i = 0; i < 3; i++) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8), barrelMat);
    barrel.position.set(x+7, 0.4, z+1.5+i*0.5); g.add(barrel);
  }
}

function buildCrane(g, x, z, w, d, h) {
  // Four legs
  for (const [px, pz] of [[0.2,0.2],[w-0.2,0.2],[0.2,d-0.2],[w-0.2,d-0.2]])
    g.add(p(box(0.3, h, 0.3, metalDk), x+px, h/2, z+pz));
  // Top beam
  g.add(p(box(w, 0.4, 0.4, metalDk), x+w/2, h, z+d/2));
  // Cross beams
  for (let i = 2; i < h; i += 3) {
    g.add(p(box(w, 0.15, 0.15, metalDk), x+w/2, i, z+0.2));
    g.add(p(box(w, 0.15, 0.15, metalDk), x+w/2, i, z+d-0.2));
    g.add(p(box(0.15, 0.15, d, metalDk), x+0.2, i+1.5, z+d/2));
    g.add(p(box(0.15, 0.15, d, metalDk), x+w-0.2, i+1.5, z+d/2));
  }
  // Cabin
  g.add(p(box(1.5, 1.5, 1.5, olive), x+w/2, h-1, z+d-0.5));
}

// ── NO MAN'S LAND ─────────────────────────────

function buildNoMansLand(g) {
  addCrater(g, 42, 17, 5);   // nml_crater1
  addCrater(g, 60, 20, 3);   // nml_crater2
  addCrater(g, 45, 58, 5);   // nml_crater3
  addCrater(g, 62, 60, 3);   // nml_crater4

  addWreck(g, 28, 18, 3, 7, 2.5, metalRust, 'truck');  // nml_truck
  addWreck(g, 25, 55, 6, 3, 2.0, olive, 'tank');        // nml_tank
  addWreck(g, 55, 62, 5, 2.5, 1.8, olive, 'apc');       // nml_apc

  addWallRuins(g, 50, 23, 8, 0.5, 1.5);   // nml_wall1
  addWallRuins(g, 38, 57, 0.5, 8, 1.5);   // nml_wall2

  addBarbedWire(g, 28, 16, 12, 0.3);  // nml_wire_n
  addBarbedWire(g, 35, 64, 12, 0.3);  // nml_wire_s
}

// ── NATURE ────────────────────────────────────

function buildNature(g) {
  // Forests
  addForest(g, 12, 18, 8, 6);   // forest_west_n
  addForest(g, 12, 42, 8, 6);   // forest_west_s
  addForest(g, 2, 4, 8, 6);     // forest_nw
  addForest(g, 2, 58, 8, 6);    // forest_sw

  // Large trees
  addTree(g, 43.5, 26.5, 1.5);  // tree_church_w
  addTree(g, 42, 48, 1.0);      // tree_square_nw
  addTree(g, 63, 48, 1.0);      // tree_square_ne

  // Dead trees
  addTree(g, 32.75, 19.75, 0.8, true);  // dead_tree1
  addTree(g, 68.75, 40.75, 0.8, true);  // dead_tree2
  addTree(g, 48.75, 62.75, 0.8, true);  // dead_tree3

  // Tree rows (alley)
  for (let i = 0; i < 5; i++) {
    addTree(g, 31.75, 31 + i*2, 0.7);  // alley_village_w
    addTree(g, 66.75, 29 + i*2, 0.7);  // alley_village_e
  }

  // Hedges
  g.add(p(box(6, 1.2, 0.5, hedgeMat), 45, 0.6, 56.25));  // hedge_village_s
  g.add(p(box(6, 1.2, 0.5, hedgeMat), 73, 0.6, 35.25));  // hedge_east_road

  // Bushes
  addBush(g, 72, 22, 1.5);   // bush_ne1
  addBush(g, 75, 28, 1.5);   // bush_ne2
  addBush(g, 73, 55, 1.5);   // bush_se
  addBush(g, 28, 1, 0.8);    // bush_alpha1
  addBush(g, 70, 5, 0.8);    // bush_alpha2
  addBush(g, 24, 41, 1.5);   // bush_pond

  // Tall grass (planes at low height)
  for (const [gx, gz, gw, gd] of [[20,15,5,4],[20,60,5,4],[75,52,5,4]]) {
    const grassP = plane(gw, gd, grassMat);
    grassP.rotation.x = -Math.PI/2;
    grassP.position.set(gx+gw/2, 0.03, gz+gd/2);
    g.add(grassP);
    // Grass blades (vertical planes)
    for (let i = 0; i < 8; i++) {
      const blade = plane(0.3, 0.6, grassMat);
      blade.position.set(gx+0.5+((i*3)%(gw-1)), 0.3, gz+0.5+((i*5)%(gd-1)));
      blade.rotation.y = i * 0.8;
      g.add(blade);
    }
  }

  // Rocks
  addRock(g, 18, 36, 3, 3, 1.2);  // rocks_west
  addRock(g, 50, 18, 2, 1.5, 0.8); // rock_nml
  addRock(g, 40, 65, 2, 1.5, 0.8); // rock_south
  addRock(g, 76, 58, 3, 3, 1.2);  // rocks_east

  // Pond
  const pondGeo = new THREE.CircleGeometry(1.8, 16);
  const pond = new THREE.Mesh(pondGeo, water);
  pond.rotation.x = -Math.PI/2;
  pond.position.set(24, 0.05, 39.5);
  g.add(pond);

  // Log piles
  for (const [lx, lz] of [[14,25],[27,68]]) {
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 6), treeTrunk);
      log.rotation.z = Math.PI/2;
      log.position.set(lx+1.5, 0.15+i*0.25, lz+0.3+i*0.15);
      g.add(log);
    }
  }
}

// ── GROUND ────────────────────────────────────

function buildGround(g) {
  // Battlefield ground (dirt/mud with patches)
  const ground = plane(100, 80, dirt);
  ground.rotation.x = -Math.PI/2;
  ground.position.set(50, 0.01, 40);
  g.add(ground);

  // Dirt roads
  const roadN = plane(6, 20, mud);
  roadN.rotation.x = -Math.PI/2;
  roadN.position.set(50, 0.015, 10); g.add(roadN);

  const roadS = plane(6, 15, mud);
  roadS.rotation.x = -Math.PI/2;
  roadS.position.set(47, 0.015, 72); g.add(roadS);

  const roadE = plane(20, 4, mud);
  roadE.rotation.x = -Math.PI/2;
  roadE.position.set(75, 0.015, 40); g.add(roadE);
}

// ── MAIN ──────────────────────────────────────

export function createWarzone(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  buildGround(g);
  buildAlphaBase(g);
  buildBravoBase(g);
  buildVillage(g);
  buildWestFlank(g);
  buildEastFlank(g);
  buildNoMansLand(g);
  buildNature(g);

  scene.add(g);
  return g;
}
