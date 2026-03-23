import * as THREE from 'three';

const DS = THREE.FrontSide;

const mat = {
  wallOuter: new THREE.MeshLambertMaterial({ color: 0xb0a898, side: DS }),
  wallInner: new THREE.MeshLambertMaterial({ color: 0xf0ebe0, side: DS }),
  wallBathroom: new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS }),
  floor: new THREE.MeshLambertMaterial({ color: 0xc0a070, side: DS }),
  floorHallway: new THREE.MeshLambertMaterial({ color: 0xa89880, side: DS }),
  floorBathroom: new THREE.MeshLambertMaterial({ color: 0xc8c8d0, side: DS }),
  ceiling: new THREE.MeshLambertMaterial({ color: 0xede8dc, side: DS }),
  stairs: new THREE.MeshLambertMaterial({ color: 0x909088, side: DS }),
  stairRail: new THREE.MeshLambertMaterial({ color: 0x333333, side: DS }),
  window: new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.4, transparent: true, side: DS }),
  windowFrame: new THREE.MeshLambertMaterial({ color: 0xdddddd, side: DS }),
  door: new THREE.MeshLambertMaterial({ color: 0x8b6914, side: DS }),
  doorFrame: new THREE.MeshLambertMaterial({ color: 0x555548, side: DS }),
  roof: new THREE.MeshLambertMaterial({ color: 0x555555, side: DS }),
  bed: new THREE.MeshLambertMaterial({ color: 0x6a4e3a, side: DS }),
  bedSheet: new THREE.MeshLambertMaterial({ color: 0xe8e0d0, side: DS }),
  table: new THREE.MeshLambertMaterial({ color: 0x9e7e5a, side: DS }),
  chair: new THREE.MeshLambertMaterial({ color: 0x7a5a3a, side: DS }),
  sofa: new THREE.MeshLambertMaterial({ color: 0xaa5555, side: DS }),
  kitchenCounter: new THREE.MeshLambertMaterial({ color: 0xcccccc, side: DS }),
  toilet: new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS }),
  sink: new THREE.MeshLambertMaterial({ color: 0xe0e0e0, side: DS }),
  bathtub: new THREE.MeshLambertMaterial({ color: 0xf2f2f2, side: DS }),
};

// Based on MCP plan: building at grid (65,15), size 28x14 → real coords offset from center
// Site plan is 100x100 centered at 0,0 → grid(65,15) = real(65-50, 15-50) = (15, -35)
// But the building is 28x14 meters
const FLOORS = 10;
const FLOOR_H = 3;
const W = 28; // along X
const D = 14; // along Z
const WALL = 0.2;
const IWALL = 0.12;
const HALLWAY_W = 2;

// 6 apartments per floor: 3 front, 3 back
// Stairwell in the center
const STAIR_W = 4;
const APT_W = (W - WALL * 2 - 0.5) / 3; // ~9m each

export function createPanelak2(scene, cx = 27, cz = -30) {
  const group = new THREE.Group();
  group.position.set(cx, 0, cz);

  buildExterior(group);

  for (let f = 0; f < FLOORS; f++) {
    const y = f * FLOOR_H;
    buildFloorSlab(group, y);
    buildHallway(group, y);
    buildStairwell(group, y);

    // 3 front apartments (Z-)
    for (let a = 0; a < 3; a++) {
      const ax = -W / 2 + WALL + a * APT_W + a * 0.15;
      const az = -D / 2 + WALL;
      const ad = (D - HALLWAY_W) / 2 - WALL;
      buildApartment(group, ax, y, az, APT_W, ad, 1, f, a);
    }

    // 3 back apartments (Z+)
    for (let a = 0; a < 3; a++) {
      const ax = -W / 2 + WALL + a * APT_W + a * 0.15;
      const az = HALLWAY_W / 2;
      const ad = (D - HALLWAY_W) / 2 - WALL;
      buildApartment(group, ax, y, az, APT_W, ad, -1, f, a + 3);
    }
  }

  buildExteriorWindows(group);
  scene.add(group);
}

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function plane(w, h, material) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
}

function buildExterior(group) {
  const h = FLOORS * FLOOR_H;

  // 4 outer walls
  const front = box(W, h, WALL, mat.wallOuter);
  front.position.set(0, h / 2, -D / 2);
  group.add(front);

  const back = box(W, h, WALL, mat.wallOuter);
  back.position.set(0, h / 2, D / 2);
  group.add(back);

  const left = box(WALL, h, D, mat.wallOuter);
  left.position.set(-W / 2, h / 2, 0);
  group.add(left);

  const right = box(WALL, h, D, mat.wallOuter);
  right.position.set(W / 2, h / 2, 0);
  group.add(right);

  // Roof
  const roof = box(W + 0.6, 0.3, D + 0.6, mat.roof);
  roof.position.set(0, h + 0.15, 0);
  group.add(roof);

  // Entrance door
  const eDoor = box(1.4, 2.4, WALL + 0.02, mat.door);
  eDoor.position.set(0, 1.2, -D / 2);
  group.add(eDoor);
  const eFrame = box(1.6, 2.5, WALL + 0.04, mat.doorFrame);
  eFrame.position.set(0, 1.25, -D / 2);
  group.add(eFrame);
}

function buildFloorSlab(group, y) {
  const slab = box(W - WALL * 2, 0.15, D - WALL * 2, mat.floor);
  slab.position.set(0, y + 0.075, 0);
  group.add(slab);
}

function buildHallway(group, y) {
  // Floor
  const hFloor = plane(W - WALL * 2, HALLWAY_W, mat.floorHallway);
  hFloor.rotation.x = -Math.PI / 2;
  hFloor.position.set(0, y + 0.16, 0);
  group.add(hFloor);

  // Ceiling
  const hCeil = plane(W - WALL * 2, HALLWAY_W, mat.ceiling);
  hCeil.rotation.x = Math.PI / 2;
  hCeil.position.set(0, y + FLOOR_H - 0.01, 0);
  group.add(hCeil);

  // Hallway walls (front and back)
  const wFront = box(W - WALL * 2, FLOOR_H, IWALL, mat.wallInner);
  wFront.position.set(0, y + FLOOR_H / 2, -HALLWAY_W / 2);
  group.add(wFront);

  const wBack = box(W - WALL * 2, FLOOR_H, IWALL, mat.wallInner);
  wBack.position.set(0, y + FLOOR_H / 2, HALLWAY_W / 2);
  group.add(wBack);

  // 6 apartment doors
  for (let a = 0; a < 3; a++) {
    const dx = -W / 2 + WALL + a * APT_W + APT_W / 2 + a * 0.15;
    for (const zSide of [-1, 1]) {
      const dz = zSide * HALLWAY_W / 2;
      const door = box(0.9, 2.1, IWALL + 0.02, mat.door);
      door.position.set(dx, y + 1.05, dz);
      group.add(door);

      const ft = box(1.05, 0.06, IWALL + 0.04, mat.doorFrame);
      ft.position.set(dx, y + 2.13, dz);
      group.add(ft);
    }
  }
}

function buildStairwell(group, y) {
  // Stairwell walls
  const wL = box(IWALL, FLOOR_H, HALLWAY_W + 0.5, mat.wallInner);
  wL.position.set(-STAIR_W / 2, y + FLOOR_H / 2, 0);
  group.add(wL);

  const wR = box(IWALL, FLOOR_H, HALLWAY_W + 0.5, mat.wallInner);
  wR.position.set(STAIR_W / 2, y + FLOOR_H / 2, 0);
  group.add(wR);

  // Stair steps - two flights
  const stepsPerFlight = 9;
  const stepH = FLOOR_H / (stepsPerFlight * 2);
  const stepD = (HALLWAY_W - 0.2) / stepsPerFlight;

  for (let s = 0; s < stepsPerFlight; s++) {
    const step1 = box(STAIR_W - 0.5, stepH, stepD, mat.stairs);
    step1.position.set(0, y + s * stepH + stepH / 2, HALLWAY_W / 2 - 0.1 - s * stepD - stepD / 2);
    group.add(step1);

    const step2 = box(STAIR_W - 0.5, stepH, stepD, mat.stairs);
    step2.position.set(0, y + FLOOR_H / 2 + s * stepH + stepH / 2, -HALLWAY_W / 2 + 0.1 + s * stepD + stepD / 2);
    group.add(step2);
  }

  // Railing posts
  for (const sx of [-1, 1]) {
    for (let s = 0; s <= stepsPerFlight; s += 3) {
      const rx = sx * (STAIR_W / 2 - 0.3);
      const post1 = box(0.04, 0.9, 0.04, mat.stairRail);
      post1.position.set(rx, y + s * stepH + 0.45, HALLWAY_W / 2 - 0.1 - s * stepD);
      group.add(post1);
    }
  }
}

function buildApartment(group, ax, y, az, aw, ad, zDir, floor, aptIdx) {
  // Interior floor + ceiling
  const aFloor = plane(aw, ad, mat.floor);
  aFloor.rotation.x = -Math.PI / 2;
  aFloor.position.set(ax + aw / 2, y + 0.16, az + ad / 2);
  group.add(aFloor);

  const aCeil = plane(aw, ad, mat.ceiling);
  aCeil.rotation.x = Math.PI / 2;
  aCeil.position.set(ax + aw / 2, y + FLOOR_H - 0.01, az + ad / 2);
  group.add(aCeil);

  // Divide into: bedroom (35%) | living (35%) | kitchen+bath (30%)
  const s1 = aw * 0.35;
  const s2 = aw * 0.35;
  const s3 = aw * 0.30;

  // Internal walls
  const w1 = box(IWALL, FLOOR_H, ad, mat.wallInner);
  w1.position.set(ax + s1, y + FLOOR_H / 2, az + ad / 2);
  group.add(w1);

  const w2 = box(IWALL, FLOOR_H, ad, mat.wallInner);
  w2.position.set(ax + s1 + s2, y + FLOOR_H / 2, az + ad / 2);
  group.add(w2);

  // Bathroom partition
  const bathD = ad * 0.45;
  const bw = box(s3, FLOOR_H, IWALL, mat.wallBathroom);
  bw.position.set(ax + s1 + s2 + s3 / 2, y + FLOOR_H / 2, az + bathD);
  group.add(bw);

  // Doors between rooms
  for (const wx of [ax + s1, ax + s1 + s2]) {
    const d = box(0.75, 2.0, IWALL + 0.02, mat.door);
    d.position.set(wx, y + 1.0, az + ad * 0.45);
    group.add(d);
  }

  // === BEDROOM ===
  const bedX = ax + s1 / 2;
  const bedZ = az + ad * 0.35;

  // Bed
  const bedFrame = box(1.5, 0.35, 1.9, mat.bed);
  bedFrame.position.set(bedX - 0.3, y + 0.175, bedZ);
  group.add(bedFrame);
  const mattress = box(1.4, 0.12, 1.8, mat.bedSheet);
  mattress.position.set(bedX - 0.3, y + 0.41, bedZ);
  group.add(mattress);
  // Pillow
  const pillow = box(0.45, 0.08, 0.3, mat.bedSheet);
  pillow.position.set(bedX - 0.3, y + 0.52, bedZ - 0.7);
  group.add(pillow);
  // Nightstand
  const ns = box(0.35, 0.45, 0.35, mat.table);
  ns.position.set(bedX + 0.65, y + 0.225, bedZ - 0.6);
  group.add(ns);
  // Wardrobe
  const wardrobe = box(1.0, 2.0, 0.5, mat.chair);
  wardrobe.position.set(bedX + 0.7, y + 1.0, az + 0.35);
  group.add(wardrobe);

  // === LIVING ROOM ===
  const livX = ax + s1 + s2 / 2;
  const livZ = az + ad * 0.5;

  // Sofa
  const sofaBase = box(1.8, 0.35, 0.7, mat.sofa);
  sofaBase.position.set(livX, y + 0.175, livZ + ad * 0.15);
  group.add(sofaBase);
  const sofaBack = box(1.8, 0.35, 0.12, mat.sofa);
  sofaBack.position.set(livX, y + 0.45, livZ + ad * 0.15 + 0.32);
  group.add(sofaBack);
  const sofaArmL = box(0.12, 0.25, 0.7, mat.sofa);
  sofaArmL.position.set(livX - 0.85, y + 0.35, livZ + ad * 0.15);
  group.add(sofaArmL);
  const sofaArmR = box(0.12, 0.25, 0.7, mat.sofa);
  sofaArmR.position.set(livX + 0.85, y + 0.35, livZ + ad * 0.15);
  group.add(sofaArmR);

  // Coffee table
  const ct = box(0.8, 0.3, 0.45, mat.table);
  ct.position.set(livX, y + 0.15, livZ - 0.3);
  group.add(ct);
  // Table legs
  for (const lx of [-0.3, 0.3]) {
    for (const lz of [-0.15, 0.15]) {
      const leg = box(0.03, 0.3, 0.03, mat.chair);
      leg.position.set(livX + lx, y + 0.15, livZ - 0.3 + lz);
      group.add(leg);
    }
  }

  // TV stand
  const tv = box(1.0, 0.4, 0.25, mat.table);
  tv.position.set(livX, y + 0.2, az + 0.2);
  group.add(tv);
  // TV (thin black box)
  const tvScreen = box(0.9, 0.5, 0.04, new THREE.MeshLambertMaterial({ color: 0x111111, side: DS }));
  tvScreen.position.set(livX, y + 0.65, az + 0.2);
  group.add(tvScreen);

  // === KITCHEN ===
  const kitX = ax + s1 + s2 + s3 / 2;
  const kitZ = az + bathD + (ad - bathD) / 2;

  // Counter along outer wall
  const counter = box(s3 - 0.3, 0.85, 0.55, mat.kitchenCounter);
  counter.position.set(kitX, y + 0.425, az + ad - 0.3);
  group.add(counter);

  // Stove (dark top on counter)
  const stove = box(0.6, 0.03, 0.5, new THREE.MeshLambertMaterial({ color: 0x222222, side: DS }));
  stove.position.set(kitX - 0.5, y + 0.87, az + ad - 0.3);
  group.add(stove);

  // Kitchen table
  const kt = box(0.7, 0.7, 0.7, mat.table);
  kt.position.set(kitX, y + 0.35, kitZ);
  group.add(kt);

  // 2 chairs
  for (const cSide of [-0.55, 0.55]) {
    const seat = box(0.35, 0.04, 0.35, mat.chair);
    seat.position.set(kitX + cSide, y + 0.42, kitZ);
    group.add(seat);
    const cBack = box(0.35, 0.35, 0.04, mat.chair);
    cBack.position.set(kitX + cSide, y + 0.6, kitZ + (cSide > 0 ? 0.17 : -0.17));
    group.add(cBack);
    for (const lx of [-0.12, 0.12]) {
      for (const lz of [-0.12, 0.12]) {
        const leg = box(0.025, 0.4, 0.025, mat.chair);
        leg.position.set(kitX + cSide + lx, y + 0.2, kitZ + lz);
        group.add(leg);
      }
    }
  }

  // === BATHROOM ===
  const bathX = ax + s1 + s2 + s3 / 2;

  // Bathroom floor
  const bFloor = plane(s3, bathD, mat.floorBathroom);
  bFloor.rotation.x = -Math.PI / 2;
  bFloor.position.set(bathX, y + 0.17, az + bathD / 2);
  group.add(bFloor);

  // Bathtub
  const tub = box(0.6, 0.45, 1.3, mat.bathtub);
  tub.position.set(ax + s1 + s2 + 0.45, y + 0.225, az + 0.8);
  group.add(tub);

  // Toilet
  const toiletBase = box(0.35, 0.3, 0.45, mat.toilet);
  toiletBase.position.set(ax + s1 + s2 + s3 - 0.3, y + 0.15, az + 0.35);
  group.add(toiletBase);
  const tank = box(0.3, 0.25, 0.18, mat.toilet);
  tank.position.set(ax + s1 + s2 + s3 - 0.3, y + 0.3, az + 0.15);
  group.add(tank);

  // Sink
  const sinkP = box(0.12, 0.6, 0.12, mat.sink);
  sinkP.position.set(ax + s1 + s2 + s3 - 0.3, y + 0.3, az + bathD - 0.3);
  group.add(sinkP);
  const sinkB = box(0.45, 0.06, 0.35, mat.sink);
  sinkB.position.set(ax + s1 + s2 + s3 - 0.3, y + 0.65, az + bathD - 0.3);
  group.add(sinkB);
}

function buildExteriorWindows(group) {
  const winW = 1.2;
  const winH = 1.3;

  for (let f = 0; f < FLOORS; f++) {
    const y = f * FLOOR_H + 1.1;

    // Front and back
    for (const zSide of [-1, 1]) {
      const z = zSide * D / 2;
      // 7 windows per side
      for (let i = 0; i < 7; i++) {
        const x = -W / 2 + 2 + i * 3.7;

        const glass = plane(winW, winH, mat.window);
        glass.position.set(x, y + winH / 2, z + zSide * 0.01);
        if (zSide === 1) glass.rotation.y = Math.PI;
        group.add(glass);

        // Frame
        const fT = box(winW + 0.08, 0.05, 0.06, mat.windowFrame);
        fT.position.set(x, y + winH + 0.025, z + zSide * 0.04);
        group.add(fT);
        const fB = box(winW + 0.08, 0.05, 0.06, mat.windowFrame);
        fB.position.set(x, y - 0.025, z + zSide * 0.04);
        group.add(fB);
        const fL = box(0.05, winH + 0.08, 0.06, mat.windowFrame);
        fL.position.set(x - winW / 2 - 0.025, y + winH / 2, z + zSide * 0.04);
        group.add(fL);
        const fR = box(0.05, winH + 0.08, 0.06, mat.windowFrame);
        fR.position.set(x + winW / 2 + 0.025, y + winH / 2, z + zSide * 0.04);
        group.add(fR);

        // Cross
        const cH = box(winW, 0.03, 0.03, mat.windowFrame);
        cH.position.set(x, y + winH / 2, z + zSide * 0.02);
        group.add(cH);
        const cV = box(0.03, winH, 0.03, mat.windowFrame);
        cV.position.set(x, y + winH / 2, z + zSide * 0.02);
        group.add(cV);
      }
    }

    // Side windows
    for (const xSide of [-1, 1]) {
      const x = xSide * W / 2;
      for (let i = 0; i < 3; i++) {
        const z = -D / 3 + i * D / 3;
        const glass = plane(winW, winH, mat.window);
        glass.rotation.y = Math.PI / 2;
        glass.position.set(x + xSide * 0.01, y + winH / 2, z);
        group.add(glass);

        const fT = box(0.06, 0.05, winW + 0.08, mat.windowFrame);
        fT.position.set(x + xSide * 0.04, y + winH + 0.025, z);
        group.add(fT);
        const fB = box(0.06, 0.05, winW + 0.08, mat.windowFrame);
        fB.position.set(x + xSide * 0.04, y - 0.025, z);
        group.add(fB);
      }
    }
  }
}
