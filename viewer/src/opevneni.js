import * as THREE from 'three';
import {
  wallWithOpenings, addFloor,
  boxWithOpenings, MAT, box, plane
} from './building-utils.js';

// Opevnění — MCP space "opevneni" 24×20m
// Hradby 1.5m silné, 5m vysoké, ochoz na 3.5m
// Věž SZ (0,0) 5×5, Věž JV (19,15) 5×5
// Brána na jihu (10,18.5) 3m, schody u obou věží

const DS = THREE.FrontSide;
const WALL_H = 5;       // wall height
const WALL_T = 1.5;     // wall thickness
const WALK_Y = 3.5;     // wall walk height (ochoz)
const WALK_W = 1.5;     // walk width = wall thickness
const TOWER_H = 8;      // tower height
const MERLON_H = 0.8;   // merlon height
const MERLON_W = 0.6;   // merlon width
const MERLON_GAP = 0.5; // gap between merlons (crenel)

const stone = new THREE.MeshLambertMaterial({ color: 0x8a8478, side: DS });
const stoneDark = new THREE.MeshLambertMaterial({ color: 0x6a6460, side: DS });
const stoneLight = new THREE.MeshLambertMaterial({ color: 0xa09888, side: DS });
const stoneWalk = new THREE.MeshLambertMaterial({ color: 0x908878, side: DS });
const wood = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const woodDark = new THREE.MeshLambertMaterial({ color: 0x5a4020, side: DS });
const iron = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const roofTile = new THREE.MeshLambertMaterial({ color: 0x6a3030, side: DS });
const cobble = new THREE.MeshLambertMaterial({ color: 0x787068, side: DS });

export function createOpevneni(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  buildHradby(g);
  buildOchoz(g);
  buildCimburi(g);
  buildVezSZ(g);
  buildVezJV(g);
  buildBrana(g);
  buildSchodySZ(g);
  buildSchodyJV(g);
  buildNadvori(g);

  scene.add(g);
}

// ── Hradby (walls) ──────────────────────────────────────

function buildHradby(g) {
  // mcp:hradba_sever (5,0) 14×1.5
  wallWithOpenings(g, {
    axis: 'x', x: 5, z: 0, length: 14, height: WALL_H,
    thickness: WALL_T, material: stone
  });

  // mcp:hradba_jih (5,18.5) 14×1.5 — with gate opening at x=10..13
  wallWithOpenings(g, {
    axis: 'x', x: 5, z: 18.5, length: 14, height: WALL_H,
    thickness: WALL_T, material: stone,
    openings: [{ start: 5, end: 8, top: 3.5 }] // gate: mcp branka at x=10, relative to wall start x=5 → 10-5=5
  });

  // mcp:hradba_zapad (0,5) 1.5×10
  wallWithOpenings(g, {
    axis: 'z', x: 0, z: 5, length: 10, height: WALL_H,
    thickness: WALL_T, material: stone
  });

  // mcp:hradba_vychod (22.5,5) 1.5×10
  wallWithOpenings(g, {
    axis: 'z', x: 22.5, z: 5, length: 10, height: WALL_H,
    thickness: WALL_T, material: stone
  });
}

// ── Ochoz (wall walk) ───────────────────────────────────

function buildOchoz(g) {
  // Walking surface on top of walls at WALK_Y
  const T = 0.15; // slab thickness

  // North wall walk: x=5..19, z=0..1.5
  g.add(pos(box(14, T, WALK_W, stoneWalk), 12, WALK_Y, 0.75));

  // South wall walk: x=5..19, z=18.5..20
  g.add(pos(box(14, T, WALK_W, stoneWalk), 12, WALK_Y, 19.25));

  // West wall walk: x=0..1.5, z=5..15
  g.add(pos(box(WALK_W, T, 10, stoneWalk), 0.75, WALK_Y, 10));

  // East wall walk: x=22.5..24, z=5..15
  g.add(pos(box(WALK_W, T, 10, stoneWalk), 23.25, WALK_Y, 10));

  // Corner connections — NW tower to walls
  g.add(pos(box(5, T, 5, stoneWalk), 2.5, WALK_Y, 2.5));   // tower floor at walk level
  // SE tower to walls
  g.add(pos(box(5, T, 5, stoneWalk), 21.5, WALK_Y, 17.5));  // tower floor at walk level
}

// ── Cimbuří (crenellations/merlons) ─────────────────────

function buildCimburi(g) {
  const mStep = MERLON_W + MERLON_GAP;

  // North wall outer crenellations (z=0 side, outer)
  for (let i = 5; i < 19; i += mStep) {
    g.add(pos(box(MERLON_W, MERLON_H, 0.3, stoneDark), i + MERLON_W / 2, WALL_H + MERLON_H / 2, -0.15));
  }
  // North wall inner parapet (lower, z=1.5 side)
  wallWithOpenings(g, {
    axis: 'x', x: 5, z: WALK_W, length: 14, height: 0.9,
    y: WALK_Y, thickness: 0.2, material: stoneLight
  });

  // South wall outer crenellations
  for (let i = 5; i < 19; i += mStep) {
    g.add(pos(box(MERLON_W, MERLON_H, 0.3, stoneDark), i + MERLON_W / 2, WALL_H + MERLON_H / 2, 20.15));
  }
  wallWithOpenings(g, {
    axis: 'x', x: 5, z: 18.5, length: 14, height: 0.9,
    y: WALK_Y, thickness: 0.2, material: stoneLight
  });

  // West wall outer crenellations (x=0 side)
  for (let i = 5; i < 15; i += mStep) {
    g.add(pos(box(0.3, MERLON_H, MERLON_W, stoneDark), -0.15, WALL_H + MERLON_H / 2, i + MERLON_W / 2));
  }
  wallWithOpenings(g, {
    axis: 'z', x: WALK_W, z: 5, length: 10, height: 0.9,
    y: WALK_Y, thickness: 0.2, material: stoneLight
  });

  // East wall outer crenellations
  for (let i = 5; i < 15; i += mStep) {
    g.add(pos(box(0.3, MERLON_H, MERLON_W, stoneDark), 24.15, WALL_H + MERLON_H / 2, i + MERLON_W / 2));
  }
  wallWithOpenings(g, {
    axis: 'z', x: 22.5, z: 5, length: 10, height: 0.9,
    y: WALK_Y, thickness: 0.2, material: stoneLight
  });
}

// ── Věž SZ (NW tower) ──────────────────────────────────

function buildVezSZ(g) {
  // mcp:vez_sz (0,0) 5×5
  const tx = 0, tz = 0;

  // Tower walls — 0.6m thick, full height
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz, length: 5, height: TOWER_H, thickness: 0.6, material: stone,
    openings: [
      { start: 1.5, end: 3.5, bottom: 4, top: 5.5 }, // arrow slit upper
      { start: 2, end: 3, bottom: 1.5, top: 2.5 },    // arrow slit lower
    ]
  });
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz + 5, length: 5, height: TOWER_H, thickness: 0.6, material: stone,
    openings: [{ start: 1.5, end: 3.5, bottom: 0, top: 2.5 }] // archway to courtyard
  });
  wallWithOpenings(g, { axis: 'z', x: tx, z: tz, length: 5, height: TOWER_H, thickness: 0.6, material: stone,
    openings: [
      { start: 1.5, end: 3.5, bottom: 4, top: 5.5 },
    ]
  });
  wallWithOpenings(g, { axis: 'z', x: tx + 5, z: tz, length: 5, height: TOWER_H, thickness: 0.6, material: stone,
    openings: [{ start: 1.5, end: 3.5, bottom: 0, top: 2.5 }] // archway to courtyard
  });

  // Tower floor at walk level
  addFloor(g, tx + 0.6, tz + 0.6, 3.8, 3.8, WALK_Y, stoneWalk);

  // Tower upper floor
  addFloor(g, tx + 0.6, tz + 0.6, 3.8, 3.8, TOWER_H - 1.5, stoneWalk);

  // Tower crenellations on top
  for (let i = 0; i < 5; i += MERLON_W + MERLON_GAP) {
    g.add(pos(box(MERLON_W, MERLON_H, 0.3, stoneDark), tx + i + MERLON_W / 2, TOWER_H + MERLON_H / 2, tz - 0.15));
    g.add(pos(box(MERLON_W, MERLON_H, 0.3, stoneDark), tx + i + MERLON_W / 2, TOWER_H + MERLON_H / 2, tz + 5.15));
    g.add(pos(box(0.3, MERLON_H, MERLON_W, stoneDark), tx - 0.15, TOWER_H + MERLON_H / 2, tz + i + MERLON_W / 2));
    g.add(pos(box(0.3, MERLON_H, MERLON_W, stoneDark), tx + 5.15, TOWER_H + MERLON_H / 2, tz + i + MERLON_W / 2));
  }

  // Conical roof
  const roofGeo = new THREE.ConeGeometry(3.5, 3, 4);
  const roof = new THREE.Mesh(roofGeo, roofTile);
  roof.position.set(tx + 2.5, TOWER_H + MERLON_H + 1.5, tz + 2.5);
  roof.rotation.y = Math.PI / 4; // align square base with tower
  g.add(roof);
}

// ── Věž JV (SE tower) ──────────────────────────────────

function buildVezJV(g) {
  // mcp:vez_jv (19,15) 5×5
  const tx = 19, tz = 15;

  // Tower walls
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz, length: 5, height: TOWER_H, thickness: 0.6, material: stone,
    openings: [{ start: 1.5, end: 3.5, bottom: 0, top: 2.5 }] // archway
  });
  wallWithOpenings(g, { axis: 'x', x: tx, z: tz + 5, length: 5, height: TOWER_H, thickness: 0.6, material: stone,
    openings: [
      { start: 1.5, end: 3.5, bottom: 4, top: 5.5 },
      { start: 2, end: 3, bottom: 1.5, top: 2.5 },
    ]
  });
  wallWithOpenings(g, { axis: 'z', x: tx, z: tz, length: 5, height: TOWER_H, thickness: 0.6, material: stone,
    openings: [{ start: 1.5, end: 3.5, bottom: 0, top: 2.5 }] // archway
  });
  wallWithOpenings(g, { axis: 'z', x: tx + 5, z: tz, length: 5, height: TOWER_H, thickness: 0.6, material: stone,
    openings: [
      { start: 1.5, end: 3.5, bottom: 4, top: 5.5 },
    ]
  });

  // Tower floor at walk level
  addFloor(g, tx + 0.6, tz + 0.6, 3.8, 3.8, WALK_Y, stoneWalk);
  // Tower upper floor
  addFloor(g, tx + 0.6, tz + 0.6, 3.8, 3.8, TOWER_H - 1.5, stoneWalk);

  // Tower crenellations
  for (let i = 0; i < 5; i += MERLON_W + MERLON_GAP) {
    g.add(pos(box(MERLON_W, MERLON_H, 0.3, stoneDark), tx + i + MERLON_W / 2, TOWER_H + MERLON_H / 2, tz - 0.15));
    g.add(pos(box(MERLON_W, MERLON_H, 0.3, stoneDark), tx + i + MERLON_W / 2, TOWER_H + MERLON_H / 2, tz + 5.15));
    g.add(pos(box(0.3, MERLON_H, MERLON_W, stoneDark), tx - 0.15, TOWER_H + MERLON_H / 2, tz + i + MERLON_W / 2));
    g.add(pos(box(0.3, MERLON_H, MERLON_W, stoneDark), tx + 5.15, TOWER_H + MERLON_H / 2, tz + i + MERLON_W / 2));
  }

  // Conical roof
  const roofGeo = new THREE.ConeGeometry(3.5, 3, 4);
  const roof = new THREE.Mesh(roofGeo, roofTile);
  roof.position.set(tx + 2.5, TOWER_H + MERLON_H + 1.5, tz + 2.5);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
}

// ── Brána (gate) ────────────────────────────────────────

function buildBrana(g) {
  // mcp:branka_jih (10,18.5) 3×1.5
  const gx = 10, gz = 18.5, gw = 3;

  // Arch stones above gate
  const arch = box(gw + 0.6, 0.8, WALL_T + 0.2, stoneDark);
  arch.position.set(gx + gw / 2, 3.5 + 0.4, gz + WALL_T / 2);
  g.add(arch);

  // Gate pillars (thicker sides)
  const pillarL = box(0.4, 3.5, WALL_T + 0.2, stoneDark);
  pillarL.position.set(gx - 0.1, 1.75, gz + WALL_T / 2);
  g.add(pillarL);
  const pillarR = box(0.4, 3.5, WALL_T + 0.2, stoneDark);
  pillarR.position.set(gx + gw + 0.1, 1.75, gz + WALL_T / 2);
  g.add(pillarR);

  // Iron portcullis
  for (let i = 0; i < 5; i++) {
    const bar = box(0.06, 3.2, 0.06, iron);
    bar.position.set(gx + 0.3 + i * 0.6, 1.6, gz + WALL_T / 2);
    g.add(bar);
  }
  for (let j = 0; j < 3; j++) {
    const hbar = box(2.6, 0.06, 0.06, iron);
    hbar.position.set(gx + gw / 2, 0.8 + j * 1.0, gz + WALL_T / 2);
    g.add(hbar);
  }

  // Ochoz continues above gate (bridge)
  g.add(pos(box(gw + 1, 0.15, WALK_W, stoneWalk), gx + gw / 2, WALK_Y, gz + WALK_W / 2));
}

// ── Schodiště SZ (NW stairs) ────────────────────────────

function buildSchodySZ(g) {
  // mcp:schody_sz (2,5) 2×4 — stairs along inner west wall, going up from south to north
  // From ground at courtyard side up to wall walk

  // Flight goes from (2, 9) at y=0 northward to (2, 5) at y=WALK_Y
  // addStairFlight(g, {
  //   startX: 3, startZ: 9, startY: 0,
  //   endX: 3, endZ: 5.5, endY: WALK_Y,
  //   width: 1.6,
  //   material: stoneLight,
  //   railMaterial: iron,
  // });

  // Stone support wall under stairs (triangular fill with boxes)
  for (let i = 0; i < 7; i++) {
    const frac = i / 7;
    const h = WALK_Y * (1 - frac);
    if (h < 0.2) break;
    const support = box(1.6, h, 0.5, stone);
    support.position.set(3, h / 2, 9 - i * 0.5 - 0.25);
    g.add(support);
  }
}

// ── Schodiště JV (SE stairs) ────────────────────────────

function buildSchodyJV(g) {
  // mcp:schody_jv (20,11) 2×4 — stairs along inner east wall
  // From ground at (21, 11) going north to (21, 15) at y=WALK_Y

  // addStairFlight(g, {
  //   startX: 21, startZ: 11, startY: 0,
  //   endX: 21, endZ: 14.5, endY: WALK_Y,
  //   width: 1.6,
  //   material: stoneLight,
  //   railMaterial: iron,
  // });

  // Stone support wall
  for (let i = 0; i < 7; i++) {
    const frac = i / 7;
    const h = WALK_Y * (1 - frac);
    if (h < 0.2) break;
    const support = box(1.6, h, 0.5, stone);
    support.position.set(21, h / 2, 11 + i * 0.5 + 0.25);
    g.add(support);
  }
}

// ── Nádvoří (courtyard) ────────────────────────────────

function buildNadvori(g) {
  // Cobblestone floor for the entire inner area
  addFloor(g, 1.5, 1.5, 21, 17, 0, cobble);

  // Torch holders on inner wall faces
  const torchMat = new THREE.MeshLambertMaterial({ color: 0xff8800, emissive: 0xff4400, side: DS });
  const torchPositions = [
    [1.2, 8], [1.2, 12],    // west wall inner
    [22.8, 8], [22.8, 12],  // east wall inner
    [8, 1.2], [16, 1.2],    // north wall inner
    [8, 18.8], [16, 18.8],  // south wall inner
  ];
  for (const [tx, tz] of torchPositions) {
    const bracket = box(0.06, 0.4, 0.06, iron);
    bracket.position.set(tx, 2.5, tz);
    g.add(bracket);
    const flame = box(0.1, 0.15, 0.1, torchMat);
    flame.position.set(tx, 2.85, tz);
    g.add(flame);
  }
}

function pos(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }
