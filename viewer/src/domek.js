import * as THREE from 'three';

const DS = THREE.FrontSide;
const CELL = 0.5; // meters per grid cell
const WALL = 0.15;
const IWALL = 0.1;
const FLOOR_H = 2.8;

const mat = {
  wallOuter: new THREE.MeshLambertMaterial({ color: 0xd4c8a0, side: DS }),
  wallInner: new THREE.MeshLambertMaterial({ color: 0xf5f0e5, side: DS }),
  wallBathroom: new THREE.MeshLambertMaterial({ color: 0xe8e8f2, side: DS }),
  floor: new THREE.MeshLambertMaterial({ color: 0xc8a878, side: DS }),
  floorHallway: new THREE.MeshLambertMaterial({ color: 0xb0a080, side: DS }),
  floorBathroom: new THREE.MeshLambertMaterial({ color: 0xd0d0d8, side: DS }),
  ceiling: new THREE.MeshLambertMaterial({ color: 0xf0ece0, side: DS }),
  roof: new THREE.MeshLambertMaterial({ color: 0x8b4513, side: DS }),
  roofTrim: new THREE.MeshLambertMaterial({ color: 0xf5f0e0, side: DS }),
  window: new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.4, transparent: true, side: DS }),
  windowFrame: new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: DS }),
  door: new THREE.MeshLambertMaterial({ color: 0x8b6914, side: DS }),
  doorEntrance: new THREE.MeshLambertMaterial({ color: 0x5a3a1a, side: DS }),
  doorFrame: new THREE.MeshLambertMaterial({ color: 0x555548, side: DS }),
  bed: new THREE.MeshLambertMaterial({ color: 0x6a4e3a, side: DS }),
  bedSheet: new THREE.MeshLambertMaterial({ color: 0xe8e0d0, side: DS }),
  pillow: new THREE.MeshLambertMaterial({ color: 0xf0e8d8, side: DS }),
  table: new THREE.MeshLambertMaterial({ color: 0x9e7e5a, side: DS }),
  chair: new THREE.MeshLambertMaterial({ color: 0x7a5a3a, side: DS }),
  sofa: new THREE.MeshLambertMaterial({ color: 0x557766, side: DS }),
  sofaCushion: new THREE.MeshLambertMaterial({ color: 0x668877, side: DS }),
  tv: new THREE.MeshLambertMaterial({ color: 0x111111, side: DS }),
  counter: new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS }),
  stove: new THREE.MeshLambertMaterial({ color: 0x222222, side: DS }),
  fridge: new THREE.MeshLambertMaterial({ color: 0xe8e8e8, side: DS }),
  toilet: new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS }),
  sink: new THREE.MeshLambertMaterial({ color: 0xe0e0e0, side: DS }),
  shower: new THREE.MeshLambertMaterial({ color: 0xccddee, opacity: 0.3, transparent: true, side: DS }),
  showerTray: new THREE.MeshLambertMaterial({ color: 0xdddde0, side: DS }),
  wardrobe: new THREE.MeshLambertMaterial({ color: 0x8a6a4a, side: DS }),
  shelf: new THREE.MeshLambertMaterial({ color: 0x9a7a5a, side: DS }),
  carpet: new THREE.MeshLambertMaterial({ color: 0xaa8866, side: DS }),
  mirror: new THREE.MeshLambertMaterial({ color: 0xaaccdd, side: DS }),
};

// Grid → real world coords (grid origin = top-left of building)
// X axis = grid X, Z axis = grid Y (inverted)
function gx(gridX) { return gridX * CELL; }
function gz(gridY) { return gridY * CELL; }

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}
function plane(w, h, material) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
}

// Building real dimensions from grid: 24×20 cells × 0.5m = 12m × 10m
const BW = 24 * CELL; // 12m
const BD = 20 * CELL; // 10m

export function createDomek(scene, cx = -40, cz = 20) {
  const group = new THREE.Group();
  group.position.set(cx, 0, cz);

  buildOuterWalls(group);
  buildRoof(group);
  buildFloorAndCeiling(group);
  buildInnerWalls(group);
  buildDoors(group);
  buildWindows(group);

  // Rooms
  buildObyvak(group);
  buildKuchyn(group);
  buildChodba(group);
  buildLoznice(group);
  buildKoupelna(group);
  buildSatna(group);

  scene.add(group);
}

function buildOuterWalls(group) {
  // Front (Z=0, gridY=0)
  const front = box(BW, FLOOR_H, WALL, mat.wallOuter);
  front.position.set(BW / 2, FLOOR_H / 2, 0);
  group.add(front);

  // Back (Z=BD, gridY=20)
  const back = box(BW, FLOOR_H, WALL, mat.wallOuter);
  back.position.set(BW / 2, FLOOR_H / 2, BD);
  group.add(back);

  // Left (X=0, gridX=0)
  const left = box(WALL, FLOOR_H, BD, mat.wallOuter);
  left.position.set(0, FLOOR_H / 2, BD / 2);
  group.add(left);

  // Right (X=BW, gridX=24) — with cutout for entrance
  // Top part (above entrance)
  const rightTop = box(WALL, FLOOR_H - 2.2, BD, mat.wallOuter);
  rightTop.position.set(BW, FLOOR_H - (FLOOR_H - 2.2) / 2, BD / 2);
  group.add(rightTop);
  // Right wall below entrance - above door
  const rightBelow1 = box(WALL, 2.2, gx(10) - WALL, mat.wallOuter);
  rightBelow1.position.set(BW, 1.1, (gx(10) - WALL) / 2);
  group.add(rightBelow1);
  // Right wall below entrance - below door
  const rightBelow2 = box(WALL, 2.2, BD - gz(12), mat.wallOuter);
  rightBelow2.position.set(BW, 1.1, gz(12) + (BD - gz(12)) / 2);
  group.add(rightBelow2);
}

function buildRoof(group) {
  // Simple gabled roof
  const roofLen = BW + 0.6;
  const roofWidth = Math.sqrt((BD / 2 + 0.3) ** 2 + 2.5 ** 2);

  // Left slope
  const roofL = plane(roofLen, roofWidth, mat.roof);
  const angle = Math.atan2(2.5, BD / 2 + 0.3);
  roofL.rotation.set(0, 0, 0);
  roofL.rotation.order = 'YXZ';
  roofL.rotation.x = -(Math.PI / 2 - angle);
  roofL.rotation.y = Math.PI / 2;
  roofL.position.set(BW / 2, FLOOR_H + 2.5 / 2, BD / 4 - 0.15);
  group.add(roofL);

  // Right slope
  const roofR = plane(roofLen, roofWidth, mat.roof);
  roofR.rotation.order = 'YXZ';
  roofR.rotation.x = (Math.PI / 2 - angle);
  roofR.rotation.y = Math.PI / 2;
  roofR.position.set(BW / 2, FLOOR_H + 2.5 / 2, BD * 3 / 4 + 0.15);
  group.add(roofR);

  // Gable triangles (front and back)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-0.3, 0);
  gableShape.lineTo(BD / 2, 2.5);
  gableShape.lineTo(BD + 0.3, 0);
  gableShape.lineTo(-0.3, 0);

  const gableGeo = new THREE.ShapeGeometry(gableShape);

  const gableFront = new THREE.Mesh(gableGeo, mat.wallOuter);
  gableFront.rotation.y = Math.PI / 2;
  gableFront.position.set(0, FLOOR_H, 0);
  group.add(gableFront);

  const gableBack = new THREE.Mesh(gableGeo, mat.wallOuter);
  gableBack.rotation.y = -Math.PI / 2;
  gableBack.position.set(BW, FLOOR_H, BD);
  group.add(gableBack);
}

function buildFloorAndCeiling(group) {
  // Main floor
  const floor = box(BW, 0.15, BD, mat.floor);
  floor.position.set(BW / 2, 0.075, BD / 2);
  group.add(floor);

  // Ceiling
  const ceil = plane(BW - WALL * 2, BD - WALL * 2, mat.ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(BW / 2, FLOOR_H - 0.01, BD / 2);
  group.add(ceil);

  // Hallway floor overlay
  const hallFloor = plane(gx(22), gz(2), mat.floorHallway);
  hallFloor.rotation.x = -Math.PI / 2;
  hallFloor.position.set(gx(1) + gx(22) / 2, 0.16, gz(10) + gz(2) / 2);
  group.add(hallFloor);

  // Bathroom floor
  const bathFloor = plane(gx(5), gz(7), mat.floorBathroom);
  bathFloor.rotation.x = -Math.PI / 2;
  bathFloor.position.set(gx(12) + gx(5) / 2, 0.16, gz(12) + gz(7) / 2);
  group.add(bathFloor);
}

function buildInnerWalls(group) {
  // Wall between obývák and kuchyně (x=12, y=1..9)
  // With gap for průchod at y=4..6
  // Top section y=1..4
  const wallOK1 = box(IWALL, FLOOR_H, gz(3), mat.wallInner);
  wallOK1.position.set(gx(12), FLOOR_H / 2, gz(1) + gz(3) / 2);
  group.add(wallOK1);
  // Bottom section y=7..10
  const wallOK2 = box(IWALL, FLOOR_H, gz(3), mat.wallInner);
  wallOK2.position.set(gx(12), FLOOR_H / 2, gz(7) + gz(3) / 2);
  group.add(wallOK2);

  // Wall between upper rooms and hallway (y=10)
  // Obývák side (x=1..5) — before door
  wallSegment(group, 1, 5, 10, true);
  // Between doors (x=7..13)
  wallSegment(group, 7, 13, 10, true);
  // After door (x=15..17) — skip, door kuchyně
  wallSegment(group, 15, 17, 10, true);
  // After kuchyně door (x=19..23)
  wallSegment(group, 19, 23, 10, true);

  // Wall between hallway and lower rooms (y=12)
  // Before ložnice door (x=1..5)
  wallSegment(group, 1, 5, 12, true);
  // Between ložnice door and koupelna door (x=7..13)
  wallSegment(group, 7, 13, 12, true);
  // Between koupelna door and šatna door (x=15..19)
  wallSegment(group, 15, 19, 12, true);
  // After šatna door (x=21..23)
  wallSegment(group, 21, 23, 12, true);

  // Wall between ložnice and koupelna (x=11, y=12..19)
  const wallLB = box(IWALL, FLOOR_H, gz(7), mat.wallInner);
  wallLB.position.set(gx(11), FLOOR_H / 2, gz(12) + gz(7) / 2);
  group.add(wallLB);

  // Wall between koupelna and šatna (x=17, y=12..19)
  const wallBS = box(IWALL, FLOOR_H, gz(7), mat.wallBathroom);
  wallBS.position.set(gx(17), FLOOR_H / 2, gz(12) + gz(7) / 2);
  group.add(wallBS);
}

function wallSegment(group, fromX, toX, gridY, horizontal) {
  const len = gx(toX - fromX);
  const w = box(len, FLOOR_H, IWALL, mat.wallInner);
  w.position.set(gx(fromX) + len / 2, FLOOR_H / 2, gz(gridY));
  group.add(w);
}

function buildDoors(group) {
  // Door obývák→chodba (x=5..6, y=10)
  addDoor(group, gx(5), gz(10), gx(2), true);
  // Door kuchyně→chodba (x=17..18, y=10)
  addDoor(group, gx(17), gz(10), gx(2), true);
  // Door ložnice→chodba (x=5..6, y=12)
  addDoor(group, gx(5), gz(12), gx(2), true);
  // Door koupelna→chodba (x=13..14, y=12)
  addDoor(group, gx(13), gz(12), gx(2), true);
  // Door šatna→chodba (x=19..20, y=12)
  addDoor(group, gx(19), gz(12), gx(2), true);

  // Entrance door (x=24, y=10..11) — in the right outer wall
  const eDoor = box(WALL + 0.02, 2.2, gz(2), mat.doorEntrance);
  eDoor.position.set(BW, 1.1, gz(10) + gz(2) / 2);
  group.add(eDoor);
  // Entrance frame
  const eFrame = box(WALL + 0.04, 2.3, gz(2) + 0.08, mat.doorFrame);
  eFrame.position.set(BW, 1.15, gz(10) + gz(2) / 2);
  group.add(eFrame);
}

function addDoor(group, x, z, width, horizontal) {
  const door = box(width, 2.1, IWALL + 0.02, mat.door);
  door.position.set(x + width / 2, 1.05, z);
  group.add(door);

  const frame = box(width + 0.06, 2.15, IWALL + 0.04, mat.doorFrame);
  frame.position.set(x + width / 2, 1.075, z);
  group.add(frame);
}

function buildWindows(group) {
  const winW = 1.0;
  const winH = 1.2;
  const sillY = 0.9;

  // Front wall (Z=0) — 3 windows
  for (let i = 0; i < 3; i++) {
    const x = 1.5 + i * 4;
    addWindow(group, x, sillY, 0, winW, winH, 'z');
  }

  // Back wall (Z=BD) — 3 windows
  for (let i = 0; i < 3; i++) {
    const x = 1.5 + i * 4;
    addWindow(group, x, sillY, BD, winW, winH, 'z');
  }

  // Left wall (X=0) — 2 windows
  for (let i = 0; i < 2; i++) {
    const z = 2 + i * 5.5;
    addWindow(group, 0, sillY, z, winW, winH, 'x');
  }

  // Right wall (X=BW) — 1 window (above entrance area)
  addWindow(group, BW, sillY, 2.5, winW, winH, 'x');
  addWindow(group, BW, sillY, 7.5, winW, winH, 'x');
}

function addWindow(group, x, y, z, w, h, axis) {
  if (axis === 'z') {
    // Window in Z-facing wall
    const zOff = z < BD / 2 ? 0.01 : -0.01;
    const glass = plane(w, h, mat.window);
    glass.position.set(x, y + h / 2, z + zOff);
    group.add(glass);
    // Frame
    const fT = box(w + 0.06, 0.04, 0.06, mat.windowFrame);
    fT.position.set(x, y + h, z + zOff * 3);
    group.add(fT);
    const fB = box(w + 0.06, 0.04, 0.06, mat.windowFrame);
    fB.position.set(x, y, z + zOff * 3);
    group.add(fB);
    const fL = box(0.04, h, 0.06, mat.windowFrame);
    fL.position.set(x - w / 2, y + h / 2, z + zOff * 3);
    group.add(fL);
    const fR = box(0.04, h, 0.06, mat.windowFrame);
    fR.position.set(x + w / 2, y + h / 2, z + zOff * 3);
    group.add(fR);
    // Cross
    const cH = box(w, 0.03, 0.03, mat.windowFrame);
    cH.position.set(x, y + h / 2, z + zOff * 2);
    group.add(cH);
    const cV = box(0.03, h, 0.03, mat.windowFrame);
    cV.position.set(x, y + h / 2, z + zOff * 2);
    group.add(cV);
  } else {
    // Window in X-facing wall
    const xOff = x < BW / 2 ? 0.01 : -0.01;
    const glass = plane(w, h, mat.window);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(x + xOff, y + h / 2, z);
    group.add(glass);
    const fT = box(0.06, 0.04, w + 0.06, mat.windowFrame);
    fT.position.set(x + xOff * 3, y + h, z);
    group.add(fT);
    const fB = box(0.06, 0.04, w + 0.06, mat.windowFrame);
    fB.position.set(x + xOff * 3, y, z);
    group.add(fB);
    const fL = box(0.06, h, 0.04, mat.windowFrame);
    fL.position.set(x + xOff * 3, y + h / 2, z - w / 2);
    group.add(fL);
    const fR = box(0.06, h, 0.04, mat.windowFrame);
    fR.position.set(x + xOff * 3, y + h / 2, z + w / 2);
    group.add(fR);
  }
}

// === ROOM INTERIORS ===

function buildObyvak(group) {
  // Obývák: grid x:1,y:1, 11×9 → real: x:0.5..6, z:0.5..5
  const rx = gx(1);
  const rz = gz(1);

  // Sofa against left wall
  const sofaBase = box(0.8, 0.35, 2.0, mat.sofa);
  sofaBase.position.set(rx + 0.5, 0.325, rz + 2.5);
  group.add(sofaBase);
  const sofaBack = box(0.15, 0.35, 2.0, mat.sofa);
  sofaBack.position.set(rx + 0.15, 0.55, rz + 2.5);
  group.add(sofaBack);
  // Cushions
  for (const dz of [-0.5, 0.5]) {
    const c = box(0.55, 0.08, 0.6, mat.sofaCushion);
    c.position.set(rx + 0.5, 0.53, rz + 2.5 + dz);
    group.add(c);
  }

  // Coffee table in front of sofa
  const ct = box(0.5, 0.05, 1.0, mat.table);
  ct.position.set(rx + 1.6, 0.4, rz + 2.5);
  group.add(ct);
  // Table legs
  for (const dx of [-0.2, 0.2]) {
    for (const dz of [-0.4, 0.4]) {
      const leg = box(0.03, 0.38, 0.03, mat.table);
      leg.position.set(rx + 1.6 + dx, 0.19, rz + 2.5 + dz);
      group.add(leg);
    }
  }

  // TV stand against the front wall
  const tvStand = box(1.4, 0.45, 0.35, mat.table);
  tvStand.position.set(rx + 3.0, 0.225, rz + 0.25);
  group.add(tvStand);
  // TV
  const tvScreen = box(1.2, 0.7, 0.04, mat.tv);
  tvScreen.position.set(rx + 3.0, 0.75, rz + 0.25);
  group.add(tvScreen);

  // Carpet
  const carpet = plane(2.0, 1.5, mat.carpet);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(rx + 2.5, 0.16, rz + 2.5);
  group.add(carpet);

  // Bookshelf on right side
  const shelf = box(1.2, 1.8, 0.3, mat.shelf);
  shelf.position.set(rx + 4.8, 0.9, rz + 4.2);
  group.add(shelf);
  // Shelf boards
  for (let i = 1; i <= 3; i++) {
    const board = box(1.15, 0.03, 0.28, mat.shelf);
    board.position.set(rx + 4.8, i * 0.45, rz + 4.2);
    group.add(board);
  }
}

function buildKuchyn(group) {
  // Kuchyně: grid x:13,y:1, 10×9 → real: x:6.5..11.5, z:0.5..5
  const rx = gx(13);
  const rz = gz(1);

  // Kitchen counter along front wall (z low)
  const counter = box(3.5, 0.85, 0.55, mat.counter);
  counter.position.set(rx + 2.0, 0.425, rz + 0.35);
  group.add(counter);

  // Stove on counter
  const stove = box(0.6, 0.03, 0.5, mat.stove);
  stove.position.set(rx + 1.2, 0.87, rz + 0.35);
  group.add(stove);

  // Sink basin
  const sinkB = box(0.5, 0.08, 0.4, mat.sink);
  sinkB.position.set(rx + 2.8, 0.87, rz + 0.35);
  group.add(sinkB);

  // Fridge against right wall
  const fridge = box(0.6, 1.8, 0.6, mat.fridge);
  fridge.position.set(rx + 4.5, 0.9, rz + 0.4);
  group.add(fridge);

  // Dining table in center
  const dTable = box(1.2, 0.04, 0.8, mat.table);
  dTable.position.set(rx + 2.5, 0.74, rz + 2.8);
  group.add(dTable);
  // Table legs
  for (const dx of [-0.5, 0.5]) {
    for (const dz of [-0.3, 0.3]) {
      const leg = box(0.04, 0.72, 0.04, mat.table);
      leg.position.set(rx + 2.5 + dx, 0.36, rz + 2.8 + dz);
      group.add(leg);
    }
  }

  // 4 chairs
  const chairPos = [
    { x: rx + 1.5, z: rz + 2.8, rot: Math.PI / 2 },
    { x: rx + 3.5, z: rz + 2.8, rot: -Math.PI / 2 },
    { x: rx + 2.5, z: rz + 2.0, rot: 0 },
    { x: rx + 2.5, z: rz + 3.6, rot: Math.PI },
  ];
  for (const cp of chairPos) {
    const seat = box(0.4, 0.04, 0.4, mat.chair);
    seat.position.set(cp.x, 0.44, cp.z);
    group.add(seat);
    // Legs
    for (const lx of [-0.15, 0.15]) {
      for (const lz of [-0.15, 0.15]) {
        const leg = box(0.025, 0.42, 0.025, mat.chair);
        leg.position.set(cp.x + lx, 0.21, cp.z + lz);
        group.add(leg);
      }
    }
  }
}

function buildChodba(group) {
  // Chodba: grid x:1,y:10, 22×2 → real: x:0.5..11.5, z:5..6
  // Just floor overlay (already done) and a shoe rack
  const rx = gx(1);
  const rz = gz(10);

  // Shoe rack near entrance
  const rack = box(0.8, 0.4, 0.3, mat.shelf);
  rack.position.set(gx(22), 0.2, rz + gz(2) / 2);
  group.add(rack);

  // Coat hooks on wall (small boxes)
  for (let i = 0; i < 3; i++) {
    const hook = box(0.05, 0.05, 0.08, mat.doorFrame);
    hook.position.set(gx(20) + i * 0.3, 1.5, gz(10) + 0.08);
    group.add(hook);
  }
}

function buildLoznice(group) {
  // Ložnice: grid x:1,y:12, 10×7 → real: x:0.5..5.5, z:6..9.5
  const rx = gx(1);
  const rz = gz(12);

  // Bed against back wall
  const bedFrame = box(1.6, 0.35, 2.0, mat.bed);
  bedFrame.position.set(rx + 2.5, 0.275, rz + 2.8);
  group.add(bedFrame);
  // Headboard
  const headboard = box(1.6, 0.5, 0.08, mat.bed);
  headboard.position.set(rx + 2.5, 0.5, rz + 3.3);
  group.add(headboard);
  // Mattress
  const mattress = box(1.5, 0.12, 1.85, mat.bedSheet);
  mattress.position.set(rx + 2.5, 0.51, rz + 2.75);
  group.add(mattress);
  // Pillows
  const p1 = box(0.5, 0.08, 0.3, mat.pillow);
  p1.position.set(rx + 2.15, 0.62, rz + 3.15);
  group.add(p1);
  const p2 = box(0.5, 0.08, 0.3, mat.pillow);
  p2.position.set(rx + 2.85, 0.62, rz + 3.15);
  group.add(p2);

  // Nightstands
  for (const side of [-1, 1]) {
    const ns = box(0.4, 0.45, 0.35, mat.table);
    ns.position.set(rx + 2.5 + side * 1.1, 0.225, rz + 3.0);
    group.add(ns);
  }

  // Wardrobe against left wall
  const ward = box(0.55, 2.0, 1.5, mat.wardrobe);
  ward.position.set(rx + 0.35, 1.0, rz + 1.0);
  group.add(ward);
}

function buildKoupelna(group) {
  // Koupelna: grid x:12,y:12, 5×7 → real: x:6..8.5, z:6..9.5
  const rx = gx(12);
  const rz = gz(12);

  // Shower tray in corner
  const tray = box(0.9, 0.08, 0.9, mat.showerTray);
  tray.position.set(rx + 0.55, 0.04, rz + 3.0);
  group.add(tray);
  // Shower glass panel
  const glass = plane(0.9, 2.0, mat.shower);
  glass.position.set(rx + 1.0, 1.0, rz + 2.55);
  group.add(glass);

  // Toilet
  const toiletBase = box(0.38, 0.35, 0.5, mat.toilet);
  toiletBase.position.set(rx + 2.0, 0.175, rz + 3.0);
  group.add(toiletBase);
  const tank = box(0.33, 0.28, 0.18, mat.toilet);
  tank.position.set(rx + 2.0, 0.32, rz + 3.3);
  group.add(tank);

  // Sink with mirror
  const sinkPed = box(0.12, 0.6, 0.12, mat.sink);
  sinkPed.position.set(rx + 1.25, 0.3, rz + 0.4);
  group.add(sinkPed);
  const sinkBasin = box(0.5, 0.06, 0.4, mat.sink);
  sinkBasin.position.set(rx + 1.25, 0.65, rz + 0.4);
  group.add(sinkBasin);

  // Mirror above sink
  const mirror = plane(0.5, 0.7, mat.mirror);
  mirror.position.set(rx + 1.25, 1.4, gz(12) + 0.06);
  group.add(mirror);
}

function buildSatna(group) {
  // Šatna: grid x:18,y:12, 5×7 → real: x:9..11.5, z:6..9.5
  const rx = gx(18);
  const rz = gz(12);

  // Shelves along back wall
  for (let i = 0; i < 3; i++) {
    const shelf = box(2.0, 0.04, 0.45, mat.shelf);
    shelf.position.set(rx + 1.25, 0.5 + i * 0.6, rz + 3.0);
    group.add(shelf);
  }

  // Clothes rod
  const rod = box(2.0, 0.03, 0.03, mat.doorFrame);
  rod.position.set(rx + 1.25, 1.7, rz + 1.5);
  group.add(rod);

  // A few boxes on bottom shelf
  for (let i = 0; i < 3; i++) {
    const bx = box(0.4, 0.3, 0.35, mat.wardrobe);
    bx.position.set(rx + 0.4 + i * 0.55, 0.15, rz + 3.0);
    group.add(bx);
  }
}
