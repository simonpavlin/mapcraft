import * as THREE from 'three';

const DS = THREE.FrontSide;

// Materials
const mat = {
  wallOuter: new THREE.MeshLambertMaterial({ color: 0xc0b8a8, side: DS }),
  wallInner: new THREE.MeshLambertMaterial({ color: 0xf5f0e0, side: DS }),
  wallBathroom: new THREE.MeshLambertMaterial({ color: 0xe8e8f0, side: DS }),
  wallKitchen: new THREE.MeshLambertMaterial({ color: 0xfff8e8, side: DS }),
  floor: new THREE.MeshLambertMaterial({ color: 0xc8a882, side: DS }),
  floorBathroom: new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS }),
  floorHallway: new THREE.MeshLambertMaterial({ color: 0xb0a898, side: DS }),
  ceiling: new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS }),
  stairs: new THREE.MeshLambertMaterial({ color: 0x999090, side: DS }),
  stairRail: new THREE.MeshLambertMaterial({ color: 0x444444, side: DS }),
  window: new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.4, transparent: true, side: DS }),
  windowFrame: new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: DS }),
  door: new THREE.MeshLambertMaterial({ color: 0x8b6914, side: DS }),
  doorFrame: new THREE.MeshLambertMaterial({ color: 0x666050, side: DS }),
  roof: new THREE.MeshLambertMaterial({ color: 0x606060, side: DS }),
  bed: new THREE.MeshLambertMaterial({ color: 0x6a4e3a, side: DS }),
  bedSheet: new THREE.MeshLambertMaterial({ color: 0xeee8dd, side: DS }),
  table: new THREE.MeshLambertMaterial({ color: 0x9e7e5a, side: DS }),
  chair: new THREE.MeshLambertMaterial({ color: 0x7a5a3a, side: DS }),
  sofa: new THREE.MeshLambertMaterial({ color: 0x5566aa, side: DS }),
  kitchenCounter: new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS }),
  toilet: new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS }),
  sink: new THREE.MeshLambertMaterial({ color: 0xe8e8e8, side: DS }),
  bathtub: new THREE.MeshLambertMaterial({ color: 0xf5f5f5, side: DS }),
};

// Building dimensions
const FLOORS = 8;
const FLOOR_HEIGHT = 3;
const BUILDING_W = 24; // along X
const BUILDING_D = 12; // along Z
const WALL_THICK = 0.2;
const INNER_WALL = 0.12;

// Apartment layout: 4 apartments per floor (2 on each side of hallway)
// Hallway runs along X in the center
const HALLWAY_W = 2;
const APT_DEPTH = (BUILDING_D - HALLWAY_W) / 2 - WALL_THICK;
const APT_WIDTH = BUILDING_W / 2 - WALL_THICK * 1.5;

// Stairwell is in the center
const STAIR_W = 4;

export function createPanelak(scene, cx = 0, cz = 0) {
  const group = new THREE.Group();
  group.position.set(cx, 0, cz);

  buildExteriorWalls(group);
  buildRoof(group);

  for (let f = 0; f < FLOORS; f++) {
    const y = f * FLOOR_HEIGHT;
    buildFloorSlab(group, y);
    buildHallway(group, y, f);
    buildStairwell(group, y, f);

    // 4 apartments per floor
    // Front-left, front-right, back-left, back-right
    buildApartment(group, -BUILDING_W / 2 + WALL_THICK, y, -BUILDING_D / 2 + WALL_THICK, APT_WIDTH, APT_DEPTH, 1, f);
    buildApartment(group, WALL_THICK / 2 + STAIR_W / 2, y, -BUILDING_D / 2 + WALL_THICK, APT_WIDTH - STAIR_W / 2, APT_DEPTH, 1, f);
    buildApartment(group, -BUILDING_W / 2 + WALL_THICK, y, HALLWAY_W / 2, APT_WIDTH, APT_DEPTH, -1, f);
    buildApartment(group, WALL_THICK / 2 + STAIR_W / 2, y, HALLWAY_W / 2, APT_WIDTH - STAIR_W / 2, APT_DEPTH, -1, f);
  }

  // Exterior windows
  buildExteriorWindows(group);

  scene.add(group);
}

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function plane(w, h, material) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
}

function buildExteriorWalls(group) {
  const h = FLOORS * FLOOR_HEIGHT;

  // Front wall (Z-)
  const front = box(BUILDING_W, h, WALL_THICK, mat.wallOuter);
  front.position.set(0, h / 2, -BUILDING_D / 2);
  group.add(front);

  // Back wall (Z+)
  const back = box(BUILDING_W, h, WALL_THICK, mat.wallOuter);
  back.position.set(0, h / 2, BUILDING_D / 2);
  group.add(back);

  // Left wall (X-)
  const left = box(WALL_THICK, h, BUILDING_D, mat.wallOuter);
  left.position.set(-BUILDING_W / 2, h / 2, 0);
  group.add(left);

  // Right wall (X+)
  const right = box(WALL_THICK, h, BUILDING_D, mat.wallOuter);
  right.position.set(BUILDING_W / 2, h / 2, 0);
  group.add(right);
}

function buildRoof(group) {
  const y = FLOORS * FLOOR_HEIGHT;
  const roof = box(BUILDING_W + 0.5, 0.3, BUILDING_D + 0.5, mat.roof);
  roof.position.set(0, y + 0.15, 0);
  group.add(roof);
}

function buildFloorSlab(group, y) {
  const slab = box(BUILDING_W - WALL_THICK * 2, 0.15, BUILDING_D - WALL_THICK * 2, mat.floor);
  slab.position.set(0, y + 0.075, 0);
  group.add(slab);
}

function buildHallway(group, y, floor) {
  // Hallway floor
  const hallFloor = plane(BUILDING_W - WALL_THICK * 2, HALLWAY_W, mat.floorHallway);
  hallFloor.rotation.x = -Math.PI / 2;
  hallFloor.position.set(0, y + 0.16, 0);
  group.add(hallFloor);

  // Hallway ceiling
  const hallCeiling = plane(BUILDING_W - WALL_THICK * 2, HALLWAY_W, mat.ceiling);
  hallCeiling.rotation.x = Math.PI / 2;
  hallCeiling.position.set(0, y + FLOOR_HEIGHT - 0.01, 0);
  group.add(hallCeiling);

  // Hallway walls (separating hallway from apartments)
  // Front side wall
  const frontWall = box(BUILDING_W - WALL_THICK * 2, FLOOR_HEIGHT, INNER_WALL, mat.wallInner);
  frontWall.position.set(0, y + FLOOR_HEIGHT / 2, -HALLWAY_W / 2);
  group.add(frontWall);

  // Back side wall
  const backWall = box(BUILDING_W - WALL_THICK * 2, FLOOR_HEIGHT, INNER_WALL, mat.wallInner);
  backWall.position.set(0, y + FLOOR_HEIGHT / 2, HALLWAY_W / 2);
  group.add(backWall);

  // Apartment doors along hallway (4 per floor)
  const doorPositions = [
    { x: -BUILDING_W / 4, z: -HALLWAY_W / 2 },
    { x: BUILDING_W / 4, z: -HALLWAY_W / 2 },
    { x: -BUILDING_W / 4, z: HALLWAY_W / 2 },
    { x: BUILDING_W / 4, z: HALLWAY_W / 2 },
  ];

  for (const dp of doorPositions) {
    // Door
    const door = box(0.9, 2.1, INNER_WALL + 0.02, mat.door);
    door.position.set(dp.x, y + 1.05, dp.z);
    group.add(door);

    // Door frame
    const frameTop = box(1.1, 0.08, INNER_WALL + 0.04, mat.doorFrame);
    frameTop.position.set(dp.x, y + 2.14, dp.z);
    group.add(frameTop);

    const frameL = box(0.08, 2.1, INNER_WALL + 0.04, mat.doorFrame);
    frameL.position.set(dp.x - 0.5, y + 1.05, dp.z);
    group.add(frameL);

    const frameR = box(0.08, 2.1, INNER_WALL + 0.04, mat.doorFrame);
    frameR.position.set(dp.x + 0.5, y + 1.05, dp.z);
    group.add(frameR);
  }
}

function buildStairwell(group, y, floor) {
  const stairX = 0;
  const stairZ = 0;

  // Stairwell walls
  const wallL = box(INNER_WALL, FLOOR_HEIGHT, HALLWAY_W, mat.wallInner);
  wallL.position.set(stairX - STAIR_W / 2, y + FLOOR_HEIGHT / 2, stairZ);
  group.add(wallL);

  const wallR = box(INNER_WALL, FLOOR_HEIGHT, HALLWAY_W, mat.wallInner);
  wallR.position.set(stairX + STAIR_W / 2, y + FLOOR_HEIGHT / 2, stairZ);
  group.add(wallR);

  // Stairs - two flights per floor
  const stepsPerFlight = 8;
  const stepH = FLOOR_HEIGHT / (stepsPerFlight * 2);
  const stepD = (HALLWAY_W - 0.3) / stepsPerFlight;

  // First flight (going toward Z-)
  for (let s = 0; s < stepsPerFlight; s++) {
    const step = box(STAIR_W - 0.4, stepH, stepD, mat.stairs);
    step.position.set(stairX, y + s * stepH + stepH / 2, stairZ + HALLWAY_W / 2 - 0.15 - s * stepD - stepD / 2);
    group.add(step);
  }

  // Landing
  const landing = box(STAIR_W - 0.4, 0.15, 0.8, mat.stairs);
  landing.position.set(stairX, y + FLOOR_HEIGHT / 2, stairZ - HALLWAY_W / 2 + 0.2);
  group.add(landing);

  // Second flight (going toward Z+, higher level)
  for (let s = 0; s < stepsPerFlight; s++) {
    const step = box(STAIR_W - 0.4, stepH, stepD, mat.stairs);
    step.position.set(stairX, y + FLOOR_HEIGHT / 2 + s * stepH + stepH / 2, stairZ - HALLWAY_W / 2 + 0.6 + s * stepD + stepD / 2);
    group.add(step);
  }

  // Railings
  const railH = 1;
  for (const side of [-1, 1]) {
    const railX = stairX + side * (STAIR_W / 2 - 0.25);

    // Railing posts along stairs
    for (let s = 0; s <= stepsPerFlight; s += 2) {
      const postY1 = y + s * stepH;
      const post1 = box(0.04, railH, 0.04, mat.stairRail);
      post1.position.set(railX, postY1 + railH / 2, stairZ + HALLWAY_W / 2 - 0.15 - s * stepD);
      group.add(post1);

      const postY2 = y + FLOOR_HEIGHT / 2 + s * stepH;
      const post2 = box(0.04, railH, 0.04, mat.stairRail);
      post2.position.set(railX, postY2 + railH / 2, stairZ - HALLWAY_W / 2 + 0.6 + s * stepD);
      group.add(post2);
    }
  }
}

function buildApartment(group, ax, y, az, aw, ad, zDir, floor) {
  // zDir: 1 = front (Z-), -1 = back (Z+)
  // Apartment interior: divided into rooms
  // Layout: [bedroom | living room | kitchen+bathroom]

  const roomFloor = plane(aw, ad, mat.floor);
  roomFloor.rotation.x = -Math.PI / 2;
  roomFloor.position.set(ax + aw / 2, y + 0.16, az + ad / 2);
  group.add(roomFloor);

  const roomCeiling = plane(aw, ad, mat.ceiling);
  roomCeiling.rotation.x = Math.PI / 2;
  roomCeiling.position.set(ax + aw / 2, y + FLOOR_HEIGHT - 0.01, az + ad / 2);
  group.add(roomCeiling);

  // Divide apartment into 3 sections along X
  const section1W = aw * 0.35; // bedroom
  const section2W = aw * 0.35; // living room
  const section3W = aw * 0.30; // kitchen + bathroom

  // Internal walls
  const wallX1 = ax + section1W;
  const wallX2 = ax + section1W + section2W;

  // Wall between bedroom and living room
  const iw1 = box(INNER_WALL, FLOOR_HEIGHT, ad, mat.wallInner);
  iw1.position.set(wallX1, y + FLOOR_HEIGHT / 2, az + ad / 2);
  group.add(iw1);

  // Wall between living room and kitchen/bathroom
  const iw2 = box(INNER_WALL, FLOOR_HEIGHT, ad, mat.wallInner);
  iw2.position.set(wallX2, y + FLOOR_HEIGHT / 2, az + ad / 2);
  group.add(iw2);

  // Bathroom wall (splits section3 in half along Z)
  const bathDepth = ad * 0.45;
  const bathWall = box(section3W, FLOOR_HEIGHT, INNER_WALL, mat.wallBathroom);
  bathWall.position.set(wallX2 + section3W / 2, y + FLOOR_HEIGHT / 2, az + bathDepth);
  group.add(bathWall);

  // Internal doors (openings between rooms)
  addInternalDoor(group, wallX1, y, az + ad * 0.4);
  addInternalDoor(group, wallX2, y, az + ad * 0.6);

  // === FURNITURE ===

  // BEDROOM
  const bedX = ax + section1W / 2;
  const bedZ = az + ad * 0.3;
  // Bed frame
  const bedFrame = box(1.6, 0.4, 2.0, mat.bed);
  bedFrame.position.set(bedX, y + 0.2, bedZ);
  group.add(bedFrame);
  // Mattress
  const mattress = box(1.5, 0.15, 1.9, mat.bedSheet);
  mattress.position.set(bedX, y + 0.475, bedZ);
  group.add(mattress);
  // Pillow
  const pillow = box(0.5, 0.1, 0.35, mat.bedSheet);
  pillow.position.set(bedX, y + 0.6, bedZ - 0.75);
  group.add(pillow);
  // Nightstand
  const nightstand = box(0.4, 0.5, 0.4, mat.table);
  nightstand.position.set(bedX + 1.0, y + 0.25, bedZ - 0.7);
  group.add(nightstand);

  // LIVING ROOM
  const livX = ax + section1W + section2W / 2;
  const livZ = az + ad * 0.5;
  // Sofa
  const sofaBase = box(2.0, 0.4, 0.8, mat.sofa);
  sofaBase.position.set(livX, y + 0.2, livZ + ad * 0.2);
  group.add(sofaBase);
  const sofaBack = box(2.0, 0.4, 0.15, mat.sofa);
  sofaBack.position.set(livX, y + 0.5, livZ + ad * 0.2 + 0.35);
  group.add(sofaBack);
  // Coffee table
  const coffeeTable = box(1.0, 0.35, 0.5, mat.table);
  coffeeTable.position.set(livX, y + 0.175, livZ - 0.2);
  group.add(coffeeTable);
  // TV stand
  const tvStand = box(1.2, 0.5, 0.3, mat.table);
  tvStand.position.set(livX, y + 0.25, livZ - ad * 0.3);
  group.add(tvStand);

  // KITCHEN (upper part of section3)
  const kitX = wallX2 + section3W / 2;
  const kitZ = az + bathDepth + (ad - bathDepth) / 2;
  // Kitchen counter along outer wall
  const counter = box(section3W - 0.4, 0.9, 0.6, mat.kitchenCounter);
  counter.position.set(kitX, y + 0.45, az + ad - 0.3);
  group.add(counter);
  // Kitchen floor
  const kitFloor = plane(section3W, ad - bathDepth, mat.floorHallway);
  kitFloor.rotation.x = -Math.PI / 2;
  kitFloor.position.set(kitX, y + 0.17, kitZ);
  group.add(kitFloor);
  // Kitchen table
  const kTable = box(0.8, 0.75, 0.8, mat.table);
  kTable.position.set(kitX, y + 0.375, kitZ - 0.2);
  group.add(kTable);
  // Chairs
  for (const cx of [-0.5, 0.5]) {
    const chairSeat = box(0.4, 0.05, 0.4, mat.chair);
    chairSeat.position.set(kitX + cx, y + 0.45, kitZ - 0.2);
    group.add(chairSeat);
    const chairBack = box(0.4, 0.4, 0.05, mat.chair);
    chairBack.position.set(kitX + cx, y + 0.65, kitZ - 0.4);
    group.add(chairBack);
    // Chair legs
    for (const lx of [-0.15, 0.15]) {
      for (const lz of [-0.15, 0.15]) {
        const leg = box(0.03, 0.43, 0.03, mat.chair);
        leg.position.set(kitX + cx + lx, y + 0.215, kitZ - 0.2 + lz);
        group.add(leg);
      }
    }
  }

  // BATHROOM
  const bathX = wallX2 + section3W / 2;
  const bathZ = az + bathDepth / 2;
  // Bathroom floor
  const bFloor = plane(section3W, bathDepth, mat.floorBathroom);
  bFloor.rotation.x = -Math.PI / 2;
  bFloor.position.set(bathX, y + 0.17, bathZ);
  group.add(bFloor);
  // Bathtub
  const tub = box(0.7, 0.5, 1.5, mat.bathtub);
  tub.position.set(wallX2 + 0.55, y + 0.25, az + 0.95);
  group.add(tub);
  // Inner tub (hollow effect)
  const tubInner = box(0.55, 0.45, 1.35, mat.sink);
  tubInner.position.set(wallX2 + 0.55, y + 0.3, az + 0.95);
  group.add(tubInner);
  // Toilet
  const toiletBase = box(0.4, 0.35, 0.5, mat.toilet);
  toiletBase.position.set(wallX2 + section3W - 0.4, y + 0.175, az + 0.45);
  group.add(toiletBase);
  const toiletTank = box(0.35, 0.3, 0.2, mat.toilet);
  toiletTank.position.set(wallX2 + section3W - 0.4, y + 0.35, az + 0.2);
  group.add(toiletTank);
  // Sink
  const sinkPedestal = box(0.15, 0.65, 0.15, mat.sink);
  sinkPedestal.position.set(wallX2 + section3W - 0.4, y + 0.325, az + bathDepth - 0.4);
  group.add(sinkPedestal);
  const sinkBasin = box(0.5, 0.08, 0.4, mat.sink);
  sinkBasin.position.set(wallX2 + section3W - 0.4, y + 0.7, az + bathDepth - 0.4);
  group.add(sinkBasin);
}

function addInternalDoor(group, x, y, z) {
  const door = box(0.8, 2.0, INNER_WALL + 0.02, mat.door);
  door.position.set(x, y + 1.0, z);
  group.add(door);
}

function buildExteriorWindows(group) {
  const winW = 1.2;
  const winH = 1.4;

  for (let f = 0; f < FLOORS; f++) {
    const y = f * FLOOR_HEIGHT + 1.2;

    // Front and back windows
    for (const zSide of [-1, 1]) {
      const z = zSide * BUILDING_D / 2;
      for (let i = 0; i < 6; i++) {
        const x = -BUILDING_W / 2 + 2 + i * 4;

        // Window glass
        const glass = plane(winW, winH, mat.window);
        glass.position.set(x, y + winH / 2, z + zSide * 0.01);
        if (zSide === 1) glass.rotation.y = Math.PI;
        group.add(glass);

        // Window frame
        const frameT = box(winW + 0.1, 0.06, 0.08, mat.windowFrame);
        frameT.position.set(x, y + winH + 0.03, z + zSide * 0.05);
        group.add(frameT);

        const frameB = box(winW + 0.1, 0.06, 0.08, mat.windowFrame);
        frameB.position.set(x, y - 0.03, z + zSide * 0.05);
        group.add(frameB);

        const frameL = box(0.06, winH + 0.1, 0.08, mat.windowFrame);
        frameL.position.set(x - winW / 2 - 0.03, y + winH / 2, z + zSide * 0.05);
        group.add(frameL);

        const frameR = box(0.06, winH + 0.1, 0.08, mat.windowFrame);
        frameR.position.set(x + winW / 2 + 0.03, y + winH / 2, z + zSide * 0.05);
        group.add(frameR);

        // Cross divider
        const crossH = box(winW, 0.04, 0.04, mat.windowFrame);
        crossH.position.set(x, y + winH / 2, z + zSide * 0.03);
        group.add(crossH);

        const crossV = box(0.04, winH, 0.04, mat.windowFrame);
        crossV.position.set(x, y + winH / 2, z + zSide * 0.03);
        group.add(crossV);
      }
    }

    // Side windows (left and right)
    for (const xSide of [-1, 1]) {
      const x = xSide * BUILDING_W / 2;
      for (let i = 0; i < 2; i++) {
        const z = -3 + i * 6;

        const glass = plane(winW, winH, mat.window);
        glass.rotation.y = Math.PI / 2;
        glass.position.set(x + xSide * 0.01, y + winH / 2, z);
        group.add(glass);

        const frameT = box(0.08, 0.06, winW + 0.1, mat.windowFrame);
        frameT.position.set(x + xSide * 0.05, y + winH + 0.03, z);
        group.add(frameT);

        const frameB = box(0.08, 0.06, winW + 0.1, mat.windowFrame);
        frameB.position.set(x + xSide * 0.05, y - 0.03, z);
        group.add(frameB);
      }
    }
  }

  // Entrance door on ground floor
  const entranceDoor = box(1.4, 2.4, WALL_THICK + 0.02, mat.door);
  entranceDoor.position.set(0, 1.2, -BUILDING_D / 2);
  group.add(entranceDoor);

  const entranceFrame = box(1.6, 2.6, WALL_THICK + 0.04, mat.doorFrame);
  entranceFrame.position.set(0, 1.3, -BUILDING_D / 2);
  group.add(entranceFrame);
}
