import * as THREE from 'three';
import {
  wallWithOpenings, addFloor, addCeiling,
  MAT, box, plane
} from './building-utils.js';

// Palácové schodiště — MCP space "palacove_schodiste" 16×14m
// Imperiální schodiště: lobby → centrální rameno → podesta → 2 boční ramena → galerie
// Výška podlaží: 5m, podesta na 2.5m, galerie na 5m, strop 6m

const DS = THREE.FrontSide;
const GALLERY_Y = 5;     // gallery floor height
const LANDING_Y = 2.5;   // mid-landing height
const CEILING_H = 8;     // grand ceiling height
const STEP_RISE_C = LANDING_Y / 14;   // ~0.179m per step (central)
const STEP_DEPTH_C = 4 / 14;          // ~0.286m tread depth (central)
const STEP_RISE_S = LANDING_Y / 14;   // ~0.179m per step (side)
const STEP_DEPTH_S = 3 / 14;          // ~0.214m tread depth (side)

// Materials — palace marble & gold
const marble = new THREE.MeshLambertMaterial({ color: 0xf0e8d8, side: DS });
const marbleDark = new THREE.MeshLambertMaterial({ color: 0xc8bca8, side: DS });
const marbleGrey = new THREE.MeshLambertMaterial({ color: 0xd0c8b8, side: DS });
const marbleFloor = new THREE.MeshLambertMaterial({ color: 0xe8dcc8, side: DS });
const marbleAccent = new THREE.MeshLambertMaterial({ color: 0x8a7a68, side: DS });
const gold = new THREE.MeshLambertMaterial({ color: 0xc8a830, side: DS });
const goldDark = new THREE.MeshLambertMaterial({ color: 0x9a7a18, side: DS });
const redCarpet = new THREE.MeshLambertMaterial({ color: 0x8a1818, side: DS });
const ironBlack = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e5, side: DS });
const wallMat = new THREE.MeshLambertMaterial({ color: 0xf0e8d8, side: DS });

export function createPalacSchodiste(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  buildShell(g);
  buildLobbyFloor(g);
  buildCentralFlight(g);
  buildLanding(g);
  buildLeftFlight(g);
  buildRightFlight(g);
  buildGalleries(g);
  buildBalustrades(g);
  buildColumns(g);
  buildChandelier(g);

  scene.add(g);
}

// ── Shell (walls, ceiling) ──────────────────────────────

function buildShell(g) {
  // mcp: lobby (0,0) 16×5 + full building extends to y=14
  // West wall
  wallWithOpenings(g, { axis: 'z', x: 0, z: 0, length: 14, height: CEILING_H, thickness: 0.4, material: wallMat });
  // East wall
  wallWithOpenings(g, { axis: 'z', x: 16, z: 0, length: 14, height: CEILING_H, thickness: 0.4, material: wallMat });
  // North wall (entrance) — large arched opening
  wallWithOpenings(g, { axis: 'x', x: 0, z: 0, length: 16, height: CEILING_H, thickness: 0.4, material: wallMat,
    openings: [{ start: 5, end: 11, top: 4.5 }]
  });
  // South wall
  wallWithOpenings(g, { axis: 'x', x: 0, z: 14, length: 16, height: CEILING_H, thickness: 0.4, material: wallMat });

  // Ceiling
  addCeiling(g, 0, 0, 16, 14, CEILING_H, 0, ceilingMat);
}

// ── Lobby floor ─────────────────────────────────────────

function buildLobbyFloor(g) {
  // mcp: lobby (0,0) 16×5
  addFloor(g, 0, 0, 16, 5, 0, marbleFloor);

  // Checker pattern accent strips
  for (let i = 0; i < 16; i += 2) {
    for (let j = 0; j < 5; j += 2) {
      const tile = plane(1, 1, marbleAccent);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(i + 0.5, 0.14, j + 0.5);
      g.add(tile);
    }
  }
}

// ── Central flight (lobby → landing) ────────────────────

function buildCentralFlight(g) {
  // mcp:rameno_c (6,5) 4×4 — 14 steps, 3.5m wide, going south (z+), rising 0→2.5m
  const sx = 6, sw = 3.5, offsetX = sx + (4 - sw) / 2; // center in 4m slot
  const zStart = 5;

  for (let s = 0; s < 14; s++) {
    const sz = zStart + s * STEP_DEPTH_C + STEP_DEPTH_C / 2;
    const sy = s * STEP_RISE_C;

    // Tread
    const tread = box(sw, 0.05, STEP_DEPTH_C, marble);
    tread.position.set(offsetX + sw / 2, sy + STEP_RISE_C, sz);
    g.add(tread);

    // Riser
    const riser = box(sw, STEP_RISE_C, 0.03, marbleDark);
    riser.position.set(offsetX + sw / 2, sy + STEP_RISE_C / 2, sz - STEP_DEPTH_C / 2 + 0.015);
    g.add(riser);

    // Red carpet runner (centered, 2m wide)
    const carpet = plane(2, STEP_DEPTH_C - 0.02, redCarpet);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(offsetX + sw / 2, sy + STEP_RISE_C + 0.026, sz);
    g.add(carpet);
  }

  // Soffit under central flight
  const flightLen = Math.sqrt(16 + LANDING_Y * LANDING_Y);
  const angle = Math.atan2(LANDING_Y, 4);
  const soffit = box(sw, 0.1, flightLen, marbleGrey);
  soffit.rotation.x = -angle;
  soffit.position.set(offsetX + sw / 2, LANDING_Y / 2, zStart + 2);
  g.add(soffit);
}

// ── Main landing ────────────────────────────────────────

function buildLanding(g) {
  // mcp:podesta (1,9) 14×2 at elevation 2.5m
  const slab = box(14, 0.2, 2, marble);
  slab.position.set(8, LANDING_Y, 10);
  g.add(slab);

  // Landing carpet
  const carpet = plane(12, 1.5, redCarpet);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(8, LANDING_Y + 0.11, 10);
  g.add(carpet);
}

// ── Left flight (landing → gallery) ─────────────────────

function buildLeftFlight(g) {
  // mcp:rameno_l (1,11) 3×3 — going south, rising 2.5→5m, 2.5m wide
  const sx = 1, sw = 2.5, offsetX = sx + (3 - sw) / 2;
  const zStart = 11;

  for (let s = 0; s < 14; s++) {
    const sz = zStart + s * STEP_DEPTH_S + STEP_DEPTH_S / 2;
    const sy = LANDING_Y + s * STEP_RISE_S;

    const tread = box(sw, 0.05, STEP_DEPTH_S, marble);
    tread.position.set(offsetX + sw / 2, sy + STEP_RISE_S, sz);
    g.add(tread);

    const riser = box(sw, STEP_RISE_S, 0.03, marbleDark);
    riser.position.set(offsetX + sw / 2, sy + STEP_RISE_S / 2, sz - STEP_DEPTH_S / 2 + 0.015);
    g.add(riser);

    // Carpet
    const carpet = plane(1.5, STEP_DEPTH_S - 0.02, redCarpet);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(offsetX + sw / 2, sy + STEP_RISE_S + 0.026, sz);
    g.add(carpet);
  }

  // Soffit
  const flightLen = Math.sqrt(9 + LANDING_Y * LANDING_Y);
  const angle = Math.atan2(LANDING_Y, 3);
  const soffit = box(sw, 0.1, flightLen, marbleGrey);
  soffit.rotation.x = -angle;
  soffit.position.set(offsetX + sw / 2, LANDING_Y + LANDING_Y / 2, zStart + 1.5);
  g.add(soffit);
}

// ── Right flight (landing → gallery) ────────────────────

function buildRightFlight(g) {
  // mcp:rameno_r (12,11) 3×3 — going south, rising 2.5→5m, 2.5m wide
  const sx = 12, sw = 2.5, offsetX = sx + (3 - sw) / 2;
  const zStart = 11;

  for (let s = 0; s < 14; s++) {
    const sz = zStart + s * STEP_DEPTH_S + STEP_DEPTH_S / 2;
    const sy = LANDING_Y + s * STEP_RISE_S;

    const tread = box(sw, 0.05, STEP_DEPTH_S, marble);
    tread.position.set(offsetX + sw / 2, sy + STEP_RISE_S, sz);
    g.add(tread);

    const riser = box(sw, STEP_RISE_S, 0.03, marbleDark);
    riser.position.set(offsetX + sw / 2, sy + STEP_RISE_S / 2, sz - STEP_DEPTH_S / 2 + 0.015);
    g.add(riser);

    const carpet = plane(1.5, STEP_DEPTH_S - 0.02, redCarpet);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(offsetX + sw / 2, sy + STEP_RISE_S + 0.026, sz);
    g.add(carpet);
  }

  // Soffit
  const flightLen = Math.sqrt(9 + LANDING_Y * LANDING_Y);
  const angle = Math.atan2(LANDING_Y, 3);
  const soffit = box(sw, 0.1, flightLen, marbleGrey);
  soffit.rotation.x = -angle;
  soffit.position.set(offsetX + sw / 2, LANDING_Y + LANDING_Y / 2, zStart + 1.5);
  g.add(soffit);
}

// ── Galleries (upper floor) ─────────────────────────────

function buildGalleries(g) {
  // mcp:galerie_l (0,5) 3×9 at elevation 5m
  const galSlab = box(3, 0.2, 9, marbleFloor);
  galSlab.position.set(1.5, GALLERY_Y, 9.5);
  g.add(galSlab);

  // mcp:galerie_r (13,5) 3×9 at elevation 5m
  const galSlab2 = box(3, 0.2, 9, marbleFloor);
  galSlab2.position.set(14.5, GALLERY_Y, 9.5);
  g.add(galSlab2);

  // mcp:galerie_top (3,11) 10×3 at elevation 5m
  const galSlab3 = box(10, 0.2, 3, marbleFloor);
  galSlab3.position.set(8, GALLERY_Y, 12.5);
  g.add(galSlab3);

  // Gallery floor accent tiles
  for (const gx of [0, 13]) {
    for (let j = 5; j < 14; j += 1.5) {
      const accent = plane(1, 1, marbleAccent);
      accent.rotation.x = -Math.PI / 2;
      accent.position.set(gx + 1.5, GALLERY_Y + 0.11, j + 0.75);
      g.add(accent);
    }
  }
}

// ── Balustrades ─────────────────────────────────────────

function buildBalustrades(g) {
  const RAIL_H = 0.95;
  const BALUSTER_SPACING = 0.35;

  // Central flight — balustrades on both sides
  buildStairBalustrade(g, {
    x: 6.25, zStart: 5, zEnd: 9, yStart: 0, yEnd: LANDING_Y,
    side: 'line', railH: RAIL_H
  });
  buildStairBalustrade(g, {
    x: 6.25 + 3.5, zStart: 5, zEnd: 9, yStart: 0, yEnd: LANDING_Y,
    side: 'line', railH: RAIL_H
  });

  // Left flight — balustrade on right side (inner)
  buildStairBalustrade(g, {
    x: 1.25 + 2.5, zStart: 11, zEnd: 14, yStart: LANDING_Y, yEnd: GALLERY_Y,
    side: 'line', railH: RAIL_H
  });
  // Left flight — balustrade on left side (outer, along wall)
  buildStairBalustrade(g, {
    x: 1.25, zStart: 11, zEnd: 14, yStart: LANDING_Y, yEnd: GALLERY_Y,
    side: 'line', railH: RAIL_H
  });

  // Right flight — both sides
  buildStairBalustrade(g, {
    x: 12.25, zStart: 11, zEnd: 14, yStart: LANDING_Y, yEnd: GALLERY_Y,
    side: 'line', railH: RAIL_H
  });
  buildStairBalustrade(g, {
    x: 12.25 + 2.5, zStart: 11, zEnd: 14, yStart: LANDING_Y, yEnd: GALLERY_Y,
    side: 'line', railH: RAIL_H
  });

  // Landing balustrade — front edge facing lobby
  buildHorizontalBalustrade(g, 1, 15, 9, LANDING_Y, RAIL_H, 'x');

  // Gallery balustrades — inner edges overlooking lobby
  // Left gallery inner edge (x=3)
  buildHorizontalBalustrade(g, 3, 3, 5, GALLERY_Y, RAIL_H, 'z', 9);
  // Right gallery inner edge (x=13)
  buildHorizontalBalustrade(g, 13, 13, 5, GALLERY_Y, RAIL_H, 'z', 9);
  // Top gallery inner edge (z=11)
  buildHorizontalBalustrade(g, 3, 13, 11, GALLERY_Y, RAIL_H, 'x');
}

function buildStairBalustrade(g, opts) {
  const { x, zStart, zEnd, yStart, yEnd, railH } = opts;
  const len = Math.abs(zEnd - zStart);
  const rise = yEnd - yStart;
  const dir = Math.sign(zEnd - zStart);
  const numBalusters = Math.ceil(len / 0.35);

  for (let i = 0; i <= numBalusters; i++) {
    const t = i / numBalusters;
    const bz = zStart + dir * t * len;
    const by = yStart + t * rise;

    // Baluster — decorative square post
    const baluster = box(0.06, railH - 0.05, 0.06, marbleDark);
    baluster.position.set(x, by + (railH - 0.05) / 2, bz);
    g.add(baluster);

    // Top ornament ball every 4th baluster
    if (i % 4 === 0) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), gold);
      ball.position.set(x, by + railH + 0.06, bz);
      g.add(ball);
    }
  }

  // Handrail
  const handrailLen = Math.sqrt(len * len + rise * rise);
  const angle = Math.atan2(rise, len) * dir;
  const handrail = box(0.08, 0.06, handrailLen, goldDark);
  handrail.rotation.x = -angle;
  handrail.position.set(x, (yStart + yEnd) / 2 + railH, (zStart + zEnd) / 2);
  g.add(handrail);

  // Bottom rail
  const bottomRail = box(0.06, 0.04, handrailLen, marbleDark);
  bottomRail.rotation.x = -angle;
  bottomRail.position.set(x, (yStart + yEnd) / 2 + 0.05, (zStart + zEnd) / 2);
  g.add(bottomRail);
}

function buildHorizontalBalustrade(g, x1, x2, z, y, railH, axis, zEnd) {
  const len = axis === 'x' ? Math.abs(x2 - x1) : Math.abs(zEnd - z);
  const numBalusters = Math.ceil(len / 0.35);

  for (let i = 0; i <= numBalusters; i++) {
    const t = i / numBalusters;
    const bx = axis === 'x' ? x1 + t * (x2 - x1) : x1;
    const bz = axis === 'z' ? z + t * (zEnd - z) : z;

    const baluster = box(0.06, railH - 0.05, 0.06, marbleDark);
    baluster.position.set(bx, y + (railH - 0.05) / 2, bz);
    g.add(baluster);

    if (i % 4 === 0) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), gold);
      ball.position.set(bx, y + railH + 0.06, bz);
      g.add(ball);
    }
  }

  // Handrail
  if (axis === 'x') {
    const hr = box(len, 0.06, 0.08, goldDark);
    hr.position.set((x1 + x2) / 2, y + railH, z);
    g.add(hr);
  } else {
    const hr = box(0.08, 0.06, len, goldDark);
    hr.position.set(x1, y + railH, z + len / 2);
    g.add(hr);
  }
}

// ── Columns ─────────────────────────────────────────────

function buildColumns(g) {
  // Grand columns flanking the central staircase at lobby level
  const colPositions = [
    [5.5, 5], [10.5, 5],      // at base of central stairs
    [0.8, 5], [15.2, 5],      // lobby corners
  ];

  for (const [cx, cz] of colPositions) {
    // Column shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.28, GALLERY_Y - 0.6, 12),
      marble
    );
    shaft.position.set(cx, GALLERY_Y / 2, cz);
    g.add(shaft);

    // Base
    const base = box(0.7, 0.3, 0.7, marbleDark);
    base.position.set(cx, 0.15, cz);
    g.add(base);

    // Capital
    const capital = box(0.65, 0.3, 0.65, marbleDark);
    capital.position.set(cx, GALLERY_Y - 0.15, cz);
    g.add(capital);
  }

  // Upper columns on gallery level (decorative, supporting ceiling)
  for (const [cx, cz] of [[0.8, 5], [15.2, 5], [0.8, 13.5], [15.2, 13.5]]) {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, CEILING_H - GALLERY_Y - 0.6, 12),
      marble
    );
    shaft.position.set(cx, GALLERY_Y + (CEILING_H - GALLERY_Y) / 2, cz);
    g.add(shaft);

    const base = box(0.55, 0.25, 0.55, marbleDark);
    base.position.set(cx, GALLERY_Y + 0.125, cz);
    g.add(base);

    const capital = box(0.5, 0.25, 0.5, marbleDark);
    capital.position.set(cx, CEILING_H - 0.125, cz);
    g.add(capital);
  }
}

// ── Chandelier ──────────────────────────────────────────

function buildChandelier(g) {
  const chY = CEILING_H - 1.5;
  const chX = 8, chZ = 7;

  // Chain
  const chain = box(0.03, 1.5, 0.03, ironBlack);
  chain.position.set(chX, CEILING_H - 0.75, chZ);
  g.add(chain);

  // Central ring
  const ringGeo = new THREE.TorusGeometry(0.8, 0.04, 8, 20);
  const ring = new THREE.Mesh(ringGeo, gold);
  ring.position.set(chX, chY, chZ);
  g.add(ring);

  // Inner ring
  const ring2Geo = new THREE.TorusGeometry(0.4, 0.03, 8, 16);
  const ring2 = new THREE.Mesh(ring2Geo, gold);
  ring2.position.set(chX, chY - 0.15, chZ);
  g.add(ring2);

  // Candles around the ring
  const flameMat = new THREE.MeshLambertMaterial({ color: 0xffdd44, emissive: 0xff8800, side: DS });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const fx = chX + Math.cos(angle) * 0.8;
    const fz = chZ + Math.sin(angle) * 0.8;

    const candle = box(0.04, 0.2, 0.04, marble);
    candle.position.set(fx, chY + 0.1, fz);
    g.add(candle);

    const flame = box(0.06, 0.1, 0.06, flameMat);
    flame.position.set(fx, chY + 0.25, fz);
    g.add(flame);
  }
}

function pos(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }
