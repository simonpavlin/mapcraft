import * as THREE from 'three';
import {
  wallWithOpenings, addFloor,
  MAT, box, plane
} from './building-utils.js';

// Schodiště — MCP space "schodiste" 5×7m
// U-turn schodiště, 4 podlaží (přízemí + 3 patra)
// Dvě ramena po stranách, otevřené jádro uprostřed, podesty S a J

const DS = THREE.FrontSide;
const FH = 3.2;          // floor height
const FLOORS = 4;        // ground + 3 upper
const STEPS_PER_FLIGHT = 9;
const STEP_H = FH / (STEPS_PER_FLIGHT * 2);  // ~0.178m
const STEP_D = 0.28;     // tread depth
const STEP_W = 1.2;      // step width
const WALL_T = 0.3;      // wall thickness

// Stairwell inner bounds (from MCP)
const IX = 0.3;          // inner x start
const IZ = 0.3;          // inner z start
const IW = 4.4;          // inner width
const ID = 6.4;          // inner depth

// Flight positions
const LEFT_CX = IX + STEP_W / 2;           // left flight center x = 0.9
const RIGHT_CX = IX + IW - STEP_W / 2;     // right flight center x = 4.1
const FLIGHT_Z_START = IZ + 1.0;           // flights start after north landing
const FLIGHT_Z_END = IZ + ID - 1.0;        // flights end before south landing

const concrete = new THREE.MeshLambertMaterial({ color: 0xc8c0b8, side: DS });
const concreteDark = new THREE.MeshLambertMaterial({ color: 0x9a9490, side: DS });
const concreteLight = new THREE.MeshLambertMaterial({ color: 0xd8d0c8, side: DS });
const metalRail = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS });
const metalLight = new THREE.MeshLambertMaterial({ color: 0x606060, side: DS });
const rubber = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });

export function createSchodiste(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  buildWalls(g);
  buildFloors(g);
  buildAllFlights(g);
  buildRailings(g);

  scene.add(g);
}

// ── Walls ───────────────────────────────────────────────

function buildWalls(g) {
  const totalH = FLOORS * FH;

  // mcp:stena_s (0,0) 5×0.3 — north wall, door openings at each floor
  const northOpenings = [];
  for (let f = 0; f < FLOORS; f++) {
    northOpenings.push({ start: 1.5, end: 3.5, bottom: f * FH, top: f * FH + 2.2 });
  }
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 0, length: 5, height: totalH,
    thickness: WALL_T, material: concrete,
    openings: northOpenings
  });

  // mcp:stena_j (0,6.7) 5×0.3 — south wall, solid
  wallWithOpenings(g, {
    axis: 'x', x: 0, z: 7, length: 5, height: totalH,
    thickness: WALL_T, material: concrete
  });

  // mcp:stena_z (0,0) 0.3×7 — west wall
  wallWithOpenings(g, {
    axis: 'z', x: 0, z: 0, length: 7, height: totalH,
    thickness: WALL_T, material: concrete
  });

  // mcp:stena_v (4.7,0) 0.3×7 — east wall
  wallWithOpenings(g, {
    axis: 'z', x: 5, z: 0, length: 7, height: totalH,
    thickness: WALL_T, material: concrete
  });
}

// ── Floor slabs at each level ───────────────────────────

function buildFloors(g) {
  for (let f = 0; f < FLOORS; f++) {
    const y = f * FH;
    // Only the north landing at each full floor level (where doors are)
    addFloor(g, IX, IZ, IW, 1.0, y, concreteLight);
  }
  // Roof slab (solid top)
  addFloor(g, IX, IZ, IW, ID, FLOORS * FH, concreteLight);
}

// ── All flights across all floors ───────────────────────

function buildAllFlights(g) {
  // Pattern per floor (from floor f to floor f+1):
  //   1st half: LEFT flight going SOUTH (north landing → south landing), rises FH/2
  //   2nd half: RIGHT flight going NORTH (south landing → north landing), rises FH/2
  //
  // So at south landing you're at half-floor height, north landing = full floor

  for (let f = 0; f < FLOORS - 1; f++) {
    const baseY = f * FH;

    // Half-floor landings (south podesta at mid-height)
    const midY = baseY + FH / 2;
    buildLanding(g, IX, IZ + ID - 1.0, IW, 1.0, midY);

    // Flight 1: LEFT side, going south (z increasing)
    buildFlight(g, {
      cx: LEFT_CX,
      zStart: FLIGHT_Z_START,
      zEnd: FLIGHT_Z_END,
      yStart: baseY,
      yEnd: midY,
      direction: 1, // +z
    });

    // Flight 2: RIGHT side, going north (z decreasing)
    buildFlight(g, {
      cx: RIGHT_CX,
      zStart: FLIGHT_Z_END,
      zEnd: FLIGHT_Z_START,
      yStart: midY,
      yEnd: baseY + FH,
      direction: -1, // -z
    });
  }
}

// ── Single flight of steps ──────────────────────────────

function buildFlight(g, opts) {
  const { cx, zStart, zEnd, yStart, yEnd, direction } = opts;
  const rise = yEnd - yStart;
  const stepH = rise / STEPS_PER_FLIGHT;
  const totalRun = Math.abs(zEnd - zStart);
  const stepD = totalRun / STEPS_PER_FLIGHT;

  for (let s = 0; s < STEPS_PER_FLIGHT; s++) {
    const sz = zStart + direction * (s * stepD + stepD / 2);
    const sy = yStart + s * stepH;

    // Step tread (horizontal part)
    const tread = box(STEP_W, 0.04, stepD, concreteLight);
    tread.position.set(cx, sy + stepH, sz);
    g.add(tread);

    // Step riser (vertical front face)
    const riser = box(STEP_W, stepH, 0.03, concrete);
    const riserZ = sz - direction * (stepD / 2 - 0.015);
    riser.position.set(cx, sy + stepH / 2, riserZ);
    g.add(riser);

    // Rubber nosing strip on tread front edge
    const nosing = box(STEP_W, 0.008, 0.03, rubber);
    nosing.position.set(cx, sy + stepH + 0.02, sz - direction * (stepD / 2 - 0.015));
    g.add(nosing);
  }

  // Soffit — thin inclined slab under the flight (underside of staircase)
  const soffitThickness = 0.12;
  const flightLen = Math.sqrt(totalRun * totalRun + rise * rise);
  const angle = Math.atan2(rise, totalRun);
  const midZ = (zStart + zEnd) / 2;
  const midY = (yStart + yEnd) / 2;
  const soffit = box(STEP_W, soffitThickness, flightLen, concreteDark);
  soffit.rotation.x = -angle * direction;
  soffit.position.set(cx, midY, midZ);
  g.add(soffit);
}

// ── Half-floor landing ──────────────────────────────────

function buildLanding(g, x, z, w, d, y) {
  // Landing slab
  const slab = box(w, 0.15, d, concreteLight);
  slab.position.set(x + w / 2, y, z + d / 2);
  g.add(slab);
}

// ── Railings ────────────────────────────────────────────

function buildRailings(g) {
  const RAIL_H = 1.0;      // railing height above step
  const POST_SPACING = 0.6; // distance between balusters
  const POST_SIZE = 0.035;
  const HANDRAIL_SIZE = 0.05;

  for (let f = 0; f < FLOORS - 1; f++) {
    const baseY = f * FH;
    const midY = baseY + FH / 2;
    const totalRun = FLIGHT_Z_END - FLIGHT_Z_START;

    // LEFT flight (going south) — railing on inner side (right side of flight = toward center)
    buildFlightRailing(g, {
      x: LEFT_CX + STEP_W / 2,
      zStart: FLIGHT_Z_START,
      zEnd: FLIGHT_Z_END,
      yStart: baseY,
      yEnd: midY,
      direction: 1,
    });

    // RIGHT flight (going north) — railing on inner side (left side of flight = toward center)
    buildFlightRailing(g, {
      x: RIGHT_CX - STEP_W / 2,
      zStart: FLIGHT_Z_END,
      zEnd: FLIGHT_Z_START,
      yStart: midY,
      yEnd: baseY + FH,
      direction: -1,
    });

    // Landing railings (south landing — inner edge facing the void)
    const landY = midY;
    const landZ1 = IZ + ID - 1.0;
    const landZ2 = IZ + ID;
    // Railing along north edge of south landing (facing void)
    buildHorizontalRailing(g, {
      x1: LEFT_CX + STEP_W / 2, x2: RIGHT_CX - STEP_W / 2,
      z: landZ1, y: landY, axis: 'x'
    });
  }

  // Void railings on each full floor (north landings looking down into void)
  for (let f = 1; f < FLOORS; f++) {
    const y = f * FH;
    // South edge of north landing
    buildHorizontalRailing(g, {
      x1: LEFT_CX + STEP_W / 2, x2: RIGHT_CX - STEP_W / 2,
      z: IZ + 1.0, y: y, axis: 'x'
    });
  }
}

function buildFlightRailing(g, opts) {
  const { x, zStart, zEnd, yStart, yEnd, direction } = opts;
  const RAIL_H = 1.0;
  const totalRun = Math.abs(zEnd - zStart);
  const rise = yEnd - yStart;
  const numPosts = Math.ceil(totalRun / 0.55);

  for (let i = 0; i <= numPosts; i++) {
    const t = i / numPosts;
    const pz = zStart + direction * t * totalRun;
    const py = yStart + t * rise;

    // Baluster
    const post = box(0.035, RAIL_H, 0.035, metalLight);
    post.position.set(x, py + RAIL_H / 2, pz);
    g.add(post);
  }

  // Handrail — angled box approximation
  const handrailLen = Math.sqrt(totalRun * totalRun + rise * rise);
  const angle = Math.atan2(rise, totalRun) * direction;
  const midZ = (zStart + zEnd) / 2;
  const midY = (yStart + yEnd) / 2 + RAIL_H;

  const handrail = box(HANDRAIL_W, 0.05, handrailLen, metalRail);
  handrail.rotation.x = -angle;
  handrail.position.set(x, midY, midZ);
  g.add(handrail);
}

const HANDRAIL_W = 0.05;

function buildHorizontalRailing(g, opts) {
  const { x1, x2, z, y, axis } = opts;
  const RAIL_H = 1.0;
  const len = Math.abs(x2 - x1);
  const numPosts = Math.ceil(len / 0.55);

  for (let i = 0; i <= numPosts; i++) {
    const t = i / numPosts;
    const px = x1 + t * (x2 - x1);
    const post = box(0.035, RAIL_H, 0.035, metalLight);
    post.position.set(px, y + RAIL_H / 2, z);
    g.add(post);
  }

  // Handrail
  const handrail = box(len, 0.05, 0.05, metalRail);
  handrail.position.set((x1 + x2) / 2, y + RAIL_H, z);
  g.add(handrail);
}
