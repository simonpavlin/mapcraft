import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof, boxWithOpenings,
  MAT, box, plane
} from './building-utils.js';

const DS = THREE.FrontSide;
const FH = 2.8;

// Deterministic pseudo-random
const pr = (i) => ((i * 7 + 3) % 11) / 11;

// ── Materials — warm cottage palette ──

// Walls & structure
const wallWood = new THREE.MeshLambertMaterial({ color: 0xc8a878, side: DS });
const wallInt = new THREE.MeshLambertMaterial({ color: 0xd4bc96, side: DS });
const floorOak = new THREE.MeshLambertMaterial({ color: 0xb8935a, side: DS });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0xd4c4a8, side: DS });
const beamMat = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });

// Furniture
const oak = new THREE.MeshLambertMaterial({ color: 0x8a6a3a, side: DS });
const oakDark = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const stone = new THREE.MeshLambertMaterial({ color: 0x887766, side: DS });
const stoneDark = new THREE.MeshLambertMaterial({ color: 0x665544, side: DS });
const fabricBrown = new THREE.MeshLambertMaterial({ color: 0x6b5b4a, side: DS });
const fabricGreen = new THREE.MeshLambertMaterial({ color: 0x5a6b5a, side: DS });
const cushionRed = new THREE.MeshLambertMaterial({ color: 0xcc4433, side: DS });
const cushionGold = new THREE.MeshLambertMaterial({ color: 0xaa8855, side: DS });
const woolRug = new THREE.MeshLambertMaterial({ color: 0x8b5e3c, side: DS });
const rugBorder = new THREE.MeshLambertMaterial({ color: 0x4a3020, side: DS });
const ironMat = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });
const birchLog = new THREE.MeshLambertMaterial({ color: 0xc8a878, side: DS });
const glassMat = new THREE.MeshLambertMaterial({ color: 0xaaccdd, opacity: 0.3, transparent: true, side: DS });

// Glow
const fireGlow = new THREE.MeshLambertMaterial({ color: 0xff6622, emissive: 0xff4400, emissiveIntensity: 0.5, side: DS });
const candleGlow = new THREE.MeshLambertMaterial({ color: 0xffcc44, emissive: 0xffaa22, emissiveIntensity: 0.3, side: DS });
const lampGlow = new THREE.MeshLambertMaterial({ color: 0xffe8c8, emissive: 0xffcc88, emissiveIntensity: 0.2, side: DS });

// Books
const bookRed = new THREE.MeshLambertMaterial({ color: 0x8b0000, side: DS });
const bookGreen = new THREE.MeshLambertMaterial({ color: 0x006400, side: DS });
const bookBrown = new THREE.MeshLambertMaterial({ color: 0x8b6914, side: DS });
const bookDark = new THREE.MeshLambertMaterial({ color: 0x2f4f4f, side: DS });

// Door & window frame
const doorMat = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const frameWin = new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS });

// ── Helper ──

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// ════════════════════════════════════════════════
// Main export
// ════════════════════════════════════════════════

export function createChalupaObyvak(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // ── Walls ──

  // North wall (z=0): 8m long, door at x=3.5..4.5
  wallWithOpenings(g, { axis: 'x', x: 0, z: 0, length: 8, height: FH, material: wallWood,
    openings: [{ start: 3.5, end: 4.5, top: 2.1 }]
  });
  addDoor(g, { axis: 'x', x: 0, z: 0, at: 4, width: 1, doorHeight: 2.1, material: doorMat });

  // South wall (z=6): 8m long, 2 windows
  wallWithOpenings(g, { axis: 'x', x: 0, z: 6, length: 8, height: FH, material: wallWood,
    openings: [
      { start: 1.5, end: 3, bottom: 0.6, top: 2.0 },
      { start: 5, end: 6.5, bottom: 0.6, top: 2.0 },
    ]
  });
  addWindow(g, { axis: 'x', x: 0, z: 6, at: 2.25, width: 1.5, sillHeight: 0.6, winHeight: 1.4, glassMat, frameMat: frameWin });
  addWindow(g, { axis: 'x', x: 0, z: 6, at: 5.75, width: 1.5, sillHeight: 0.6, winHeight: 1.4, glassMat, frameMat: frameWin });

  // West wall (x=0): 6m long, no openings
  wallWithOpenings(g, { axis: 'z', x: 0, z: 0, length: 6, height: FH, material: wallWood });

  // East wall (x=8): 6m long, 1 window
  wallWithOpenings(g, { axis: 'z', x: 8, z: 0, length: 6, height: FH, material: wallWood,
    openings: [{ start: 2, end: 3.5, bottom: 0.8, top: 2.0 }]
  });
  addWindow(g, { axis: 'z', x: 8, z: 0, at: 2.75, width: 1.5, sillHeight: 0.8, winHeight: 1.2, glassMat, frameMat: frameWin });

  // ── Floor, ceiling, beams ──

  addFloor(g, 0, 0, 8, 6, 0, floorOak);
  addCeiling(g, 0, 0, 8, 6, FH, 0, ceilingMat);

  // Exposed ceiling beams — 6 beams running east-west
  for (let i = 0; i < 6; i++) {
    g.add(p(box(8, 0.2, 0.15, beamMat), 4, FH - 0.1, 0.5 + i * 1.1));
  }

  // ── Fireplace — mcp:krb (0, 2) 0.8×2 ──

  const kx = 0, kz = 2;
  // Fireplace body — using boxWithOpenings for the firebox opening
  boxWithOpenings(g, {
    x: kx, y: 0.15, z: kz,
    width: 0.8, height: 1.3, depth: 2,
    material: stone,
    openings: [
      { face: 'right', start: 0.45, end: 1.55, bottom: 0, top: 0.9 }  // firebox opening on room-facing side
    ]
  });
  // Hearth floor (raised stone base, extends slightly forward)
  g.add(p(box(0.9, 0.15, 2.1, stoneDark), kx + 0.45, 0.075, kz + 1));
  // Firebox interior — dark back wall
  g.add(p(box(0.02, 0.7, 0.9, stoneDark), kx + 0.16, 0.5, kz + 1));
  // Fire glow — visible through the opening
  g.add(p(box(0.1, 0.25, 0.5, fireGlow), kx + 0.2, 0.3, kz + 1));
  // Burning logs
  const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), oakDark);
  log1.rotation.y = 0.3;
  g.add(p(log1, kx + 0.25, 0.19, kz + 0.9));
  const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 6), oakDark);
  log2.rotation.y = -0.2;
  g.add(p(log2, kx + 0.25, 0.22, kz + 1.1));
  // Mantel shelf
  g.add(p(box(0.9, 0.08, 2.2, oak), kx + 0.45, 1.5, kz + 1));
  // Chimney breast going up to ceiling
  g.add(p(box(0.5, FH - 1.5, 1.2, stone), kx + 0.25, 1.5 + (FH - 1.5) / 2, kz + 1));

  // ── Painting above fireplace — mcp:obraz (0, 2.5) ──

  // Frame
  g.add(p(box(0.04, 0.6, 0.8, oak), 0.02, 1.7, 2.9));
  // Canvas
  g.add(p(box(0.02, 0.5, 0.7, new THREE.MeshLambertMaterial({ color: 0x4a6a3a, side: DS })), 0.04, 1.7, 2.9));

  // ── Bookshelf — mcp:knihovna (0, 0) 1.5×1.8, height_3d=2.2 ──

  const bx = 0, bz = 0;
  // Back panel
  g.add(p(box(0.05, 2.2, 1.8, oakDark), bx + 0.025, 1.1, bz + 0.9));
  // Side panels
  g.add(p(box(1.5, 2.2, 0.04, oakDark), bx + 0.75, 1.1, bz + 0.02));
  g.add(p(box(1.5, 2.2, 0.04, oakDark), bx + 0.75, 1.1, bz + 1.78));
  // 5 shelves
  for (let s = 0; s < 5; s++) {
    g.add(p(box(1.45, 0.03, 1.76, oak), bx + 0.75, 0.1 + s * 0.44, bz + 0.9));
  }
  // Books on shelves
  const bookMats = [bookRed, bookGreen, bookBrown, bookDark, oak];
  for (let s = 0; s < 4; s++) {
    let bxOff = 0.1;
    for (let b = 0; b < 5; b++) {
      const bw = 0.12 + pr(s * 5 + b) * 0.15;
      const bh = 0.28 + pr(s * 5 + b + 20) * 0.12;
      const mat = bookMats[(s * 3 + b) % bookMats.length];
      g.add(p(box(bw, bh, 0.18, mat), bx + bxOff + bw / 2, 0.13 + s * 0.44 + bh / 2, bz + 0.5));
      bxOff += bw + 0.02;
      if (bxOff > 1.3) break;
    }
  }
  // Decorations on top shelf
  g.add(p(box(0.12, 0.2, 0.12, whiteMat), bx + 0.3, 1.86 + 0.1, bz + 0.5)); // vase
  g.add(p(box(0.15, 0.18, 0.04, oak), bx + 0.9, 1.86 + 0.09, bz + 0.15)); // photo frame

  // ── Rug — mcp:koberec (1, 2.2) 3.5×3 ──

  const rugPlane = plane(3.5, 3, woolRug);
  rugPlane.rotation.x = -Math.PI / 2;
  g.add(p(rugPlane, 1 + 1.75, 0.16, 2.2 + 1.5));
  // Border lines (4 edges)
  g.add(p(box(3.5, 0.005, 0.08, rugBorder), 2.75, 0.165, 2.2));
  g.add(p(box(3.5, 0.005, 0.08, rugBorder), 2.75, 0.165, 5.2));
  g.add(p(box(0.08, 0.005, 3, rugBorder), 1, 0.165, 3.7));
  g.add(p(box(0.08, 0.005, 3, rugBorder), 4.5, 0.165, 3.7));

  // ── Coffee table — mcp:stolek (2, 3) 1×0.6 ──

  const tx = 2, tz = 3;
  // Thick slab top
  g.add(p(box(1, 0.06, 0.6, oak), tx + 0.5, 0.42, tz + 0.3));
  // 4 chunky legs
  for (const [lx, lz] of [[0.08, 0.08], [0.92, 0.08], [0.08, 0.52], [0.92, 0.52]]) {
    g.add(p(box(0.08, 0.39, 0.08, oakDark), tx + lx, 0.195, tz + lz));
  }
  // Lower shelf
  g.add(p(box(0.84, 0.03, 0.44, oak), tx + 0.5, 0.15, tz + 0.3));
  // Items on table
  g.add(p(box(0.06, 0.15, 0.06, whiteMat), tx + 0.7, 0.52, tz + 0.3)); // candle
  g.add(p(box(0.02, 0.04, 0.02, candleGlow), tx + 0.7, 0.6, tz + 0.3)); // flame
  g.add(p(box(0.08, 0.08, 0.08, stoneDark), tx + 0.3, 0.49, tz + 0.2)); // mug
  g.add(p(box(0.2, 0.03, 0.15, bookRed), tx + 0.5, 0.465, tz + 0.4)); // book

  // ── Sofa — mcp:pohovka (5, 2.5) 0.9×2.2 ──

  const sx = 5, sz = 2.5;
  // Base frame
  g.add(p(box(0.85, 0.35, 2.1, fabricBrown), sx + 0.45, 0.22, sz + 1.1));
  // Seat cushions (3)
  for (let i = 0; i < 3; i++) {
    g.add(p(box(0.7, 0.12, 0.65, fabricBrown), sx + 0.4, 0.46, sz + 0.35 + i * 0.7));
  }
  // Backrest
  g.add(p(box(0.15, 0.45, 2.1, fabricBrown), sx + 0.82, 0.62, sz + 1.1));
  // Armrests
  g.add(p(box(0.7, 0.25, 0.12, fabricBrown), sx + 0.4, 0.52, sz + 0.05));
  g.add(p(box(0.7, 0.25, 0.12, fabricBrown), sx + 0.4, 0.52, sz + 2.15));
  // Throw blanket draped over armrest
  g.add(p(box(0.3, 0.04, 0.5, cushionRed), sx + 0.5, 0.55, sz + 2.0));
  g.add(p(box(0.15, 0.3, 0.04, cushionRed), sx + 0.3, 0.4, sz + 2.15));
  // Decorative cushions
  g.add(p(box(0.06, 0.3, 0.3, cushionGold), sx + 0.75, 0.6, sz + 0.3));
  g.add(p(box(0.06, 0.3, 0.3, cushionRed), sx + 0.75, 0.6, sz + 1.9));

  // ── Armchair — mcp:kreslo (1, 4.8) 0.9×0.9, wingback ──

  const ax = 1, az = 4.8;
  // Seat
  g.add(p(box(0.7, 0.35, 0.7, fabricGreen), ax + 0.45, 0.22, az + 0.45));
  // Seat cushion
  g.add(p(box(0.6, 0.1, 0.6, fabricGreen), ax + 0.45, 0.45, az + 0.48));
  // Backrest — on south side, person faces north toward fireplace
  g.add(p(box(0.7, 0.5, 0.12, fabricGreen), ax + 0.45, 0.65, az + 0.8));
  // Wings (wingback style)
  g.add(p(box(0.12, 0.45, 0.35, fabricGreen), ax + 0.1, 0.6, az + 0.62));
  g.add(p(box(0.12, 0.45, 0.35, fabricGreen), ax + 0.8, 0.6, az + 0.62));
  // Legs (turned wood)
  for (const [lx, lz] of [[0.15, 0.15], [0.75, 0.15], [0.15, 0.75], [0.75, 0.75]]) {
    g.add(p(box(0.05, 0.05, 0.05, oakDark), ax + lx, 0.025, az + lz));
  }
  // Cushion on seat
  g.add(p(box(0.35, 0.08, 0.35, cushionGold), ax + 0.45, 0.5, az + 0.5));

  // ── Dining table — mcp:jidelni_stul (5.5, 0.3) 2.2×1.2, farmhouse ──

  const dx = 5.5, dz = 0.3;
  // Thick plank top
  g.add(p(box(2.2, 0.05, 1.2, oak), dx + 1.1, 0.735, dz + 0.6));
  // Trestle-style legs (2 H-frames)
  for (const lx of [0.25, 1.95]) {
    // Vertical posts
    g.add(p(box(0.08, 0.7, 0.08, oakDark), dx + lx, 0.35, dz + 0.2));
    g.add(p(box(0.08, 0.7, 0.08, oakDark), dx + lx, 0.35, dz + 1.0));
    // Cross bar
    g.add(p(box(0.06, 0.06, 0.8, oakDark), dx + lx, 0.25, dz + 0.6));
  }
  // Stretcher bar connecting trestles
  g.add(p(box(1.5, 0.06, 0.06, oakDark), dx + 1.1, 0.15, dz + 0.6));
  // Items on table
  g.add(p(box(0.25, 0.02, 0.25, whiteMat), dx + 0.6, 0.77, dz + 0.6)); // plate
  g.add(p(box(0.25, 0.02, 0.25, whiteMat), dx + 1.6, 0.77, dz + 0.6)); // plate

  // ── 4 Dining chairs — farmhouse style ──

  const chairPositions = [
    { x: 6.2, z: 0, facing: 'south' },
    { x: 6.2, z: 1.5, facing: 'north' },
    { x: 5.2, z: 0.7, facing: 'east' },
    { x: 7.5, z: 0.7, facing: 'west' },
  ];
  for (const ch of chairPositions) {
    const chx2 = ch.x, chz2 = ch.z;
    // Seat
    g.add(p(box(0.42, 0.04, 0.42, oak), chx2 + 0.225, 0.45, chz2 + 0.225));
    // 4 legs
    for (const [lx, lz] of [[0.05, 0.05], [0.4, 0.05], [0.05, 0.4], [0.4, 0.4]]) {
      g.add(p(box(0.04, 0.45, 0.04, oakDark), chx2 + lx, 0.225, chz2 + lz));
    }
    // Backrest
    if (ch.facing === 'south') g.add(p(box(0.42, 0.45, 0.04, oak), chx2 + 0.225, 0.7, chz2 + 0.02));
    if (ch.facing === 'north') g.add(p(box(0.42, 0.45, 0.04, oak), chx2 + 0.225, 0.7, chz2 + 0.43));
    if (ch.facing === 'east') g.add(p(box(0.04, 0.45, 0.42, oak), chx2 + 0.02, 0.7, chz2 + 0.225));
    if (ch.facing === 'west') g.add(p(box(0.04, 0.45, 0.42, oak), chx2 + 0.43, 0.7, chz2 + 0.225));
  }

  // ── Kredenc (hutch) — mcp:kredenc (6.5, 5) 1.5×0.5 ──

  const rx = 6.5, rz = 5;
  // Lower cabinet
  g.add(p(box(1.5, 0.85, 0.48, oakDark), rx + 0.75, 0.425, rz + 0.25));
  // 3 drawer handles
  for (let i = 0; i < 3; i++) {
    g.add(p(box(0.1, 0.03, 0.03, ironMat), rx + 0.25 + i * 0.5, 0.5, rz + 0.02));
  }
  // Counter surface
  g.add(p(box(1.5, 0.04, 0.5, oak), rx + 0.75, 0.87, rz + 0.25));
  // Upper cabinet with glass
  g.add(p(box(1.5, 0.95, 0.35, oakDark), rx + 0.75, 1.37, rz + 0.2));
  // Glass door panels
  g.add(p(box(0.65, 0.8, 0.02, glassMat), rx + 0.37, 1.37, rz + 0.04));
  g.add(p(box(0.65, 0.8, 0.02, glassMat), rx + 1.12, 1.37, rz + 0.04));
  // Items visible through glass
  g.add(p(box(0.3, 0.02, 0.15, whiteMat), rx + 0.4, 1.1, rz + 0.2));
  g.add(p(box(0.3, 0.02, 0.15, whiteMat), rx + 1.0, 1.1, rz + 0.2));

  // ── Standing lamp — mcp:lampa (0.9, 1.8) 0.3×0.3 ──

  const lx = 0.9, lz = 1.8;
  // Iron pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), ironMat);
  g.add(p(pole, lx + 0.15, 0.8, lz + 0.15));
  // Iron base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.05, 8), ironMat);
  g.add(p(base, lx + 0.15, 0.175, lz + 0.15));
  // Linen shade
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.22, 12), lampGlow);
  g.add(p(shade, lx + 0.15, 1.55, lz + 0.15));

  // ── Firewood stack — mcp:drevo (0, 4.5) 0.6×0.8 ──

  const wx = 0, wz = 4.5;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6), birchLog
      );
      log.rotation.z = Math.PI / 2;
      g.add(p(log, wx + 0.3, 0.08 + row * 0.13, wz + 0.15 + col * 0.22));
    }
  }
  // Stray bark pieces
  g.add(p(box(0.1, 0.04, 0.08, oakDark), wx + 0.15, 0.02, wz + 0.7));

  // ── Chandelier — mcp:lustre (2.5, 2.5) wrought iron, 6 candles ──

  const chx = 2.5 + 0.3, chz = 2.5 + 0.3;
  const chY = 2.1;
  // Chain from ceiling
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, FH - chY, 4), ironMat);
  g.add(p(chain, chx, chY + (FH - chY) / 2, chz));
  // Central hub ring
  const hub = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.015, 6, 16), ironMat);
  hub.rotation.x = Math.PI / 2;
  g.add(p(hub, chx, chY, chz));
  // 6 candle arms
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const armX = chx + Math.cos(angle) * 0.25;
    const armZ = chz + Math.sin(angle) * 0.25;
    // Arm
    g.add(p(box(0.02, 0.02, 0.15, ironMat), armX, chY, armZ));
    // Candle holder
    const candleX = chx + Math.cos(angle) * 0.32;
    const candleZ = chz + Math.sin(angle) * 0.32;
    g.add(p(box(0.03, 0.1, 0.03, whiteMat), candleX, chY + 0.05, candleZ));
    // Flame
    g.add(p(box(0.015, 0.04, 0.015, candleGlow), candleX, chY + 0.12, candleZ));
  }

  // ── Wall clock — mcp:hodiny (3.5, 0) pendulum ──

  // Clock body
  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), oak);
  clockFace.rotation.x = Math.PI / 2;
  g.add(p(clockFace, 3.7, 2.0, 0.05));
  // Clock face (white disc)
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 16), whiteMat);
  face.rotation.x = Math.PI / 2;
  g.add(p(face, 3.7, 2.0, 0.04));
  // Pendulum case
  g.add(p(box(0.12, 0.35, 0.05, oak), 3.7, 1.62, 0.05));
  // Pendulum rod + disc
  g.add(p(box(0.01, 0.25, 0.01, ironMat), 3.7, 1.55, 0.03));
  const pendDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 8), ironMat);
  pendDisc.rotation.x = Math.PI / 2;
  g.add(p(pendDisc, 3.7, 1.42, 0.03));

  scene.add(g);
}
