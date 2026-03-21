import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addStairs, addFlatRoof,
  MAT, box, plane
} from './building-utils.js';

// Hrad — MCP (130,20) in 200×200 → 3D (30, -80)
// 40×40m, hradby 2m, 4 rohové věže, brána na severu
// Palác (3,22) 16×15, Velký sál (20,22) 17×10, Kuchyně (20,33) 10×5, Zbrojnice (31,33) 6×5

const DS = THREE.DoubleSide;
const FH = 4; // taller medieval floors

const stone = new THREE.MeshLambertMaterial({ color: 0x8a8478, side: DS });
const stoneDark = new THREE.MeshLambertMaterial({ color: 0x6a6460, side: DS });
const stoneLight = new THREE.MeshLambertMaterial({ color: 0xa09888, side: DS });
const wood = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const woodDark = new THREE.MeshLambertMaterial({ color: 0x5a4020, side: DS });
const woodFloor = new THREE.MeshLambertMaterial({ color: 0x9a7a50, side: DS });
const cobble = new THREE.MeshLambertMaterial({ color: 0x787068, side: DS });
const roofTile = new THREE.MeshLambertMaterial({ color: 0x6a3030, side: DS });
const iron = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const fabric = new THREE.MeshLambertMaterial({ color: 0x8a2020, side: DS });
const fabricBlue = new THREE.MeshLambertMaterial({ color: 0x2a3a6a, side: DS });
const gold = new THREE.MeshLambertMaterial({ color: 0xc8a820, side: DS });
const water = new THREE.MeshLambertMaterial({ color: 0x4a6a8a, side: DS });

export function createHrad(scene, cx = 30, cz = -80) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  buildHradby(g);
  buildVeze(g);
  buildBrana(g);
  buildNadvori(g);
  buildVelkySal(g);
  buildKuchyne(g);
  buildZbrojnice(g);
  buildPalac(g);

  scene.add(g);
}

function buildHradby(g) {
  const W = 2, H = 6; // hradby 2m silné, 6m vysoké

  // Severní hradba — s otvorem pro bránu (17..23m)
  wallWithOpenings(g, { axis: 'x', x: 0, z: 0, length: 40, height: H, thickness: W, material: stone,
    openings: [{ start: 17, end: 23, top: 5 }] // brána — otvor 6m široký, 5m vysoký
  });
  // Jižní
  wallWithOpenings(g, { axis: 'x', x: 0, z: 40, length: 40, height: H, thickness: W, material: stone });
  // Západní
  wallWithOpenings(g, { axis: 'z', x: 0, z: 0, length: 40, height: H, thickness: W, material: stone });
  // Východní
  wallWithOpenings(g, { axis: 'z', x: 40, z: 0, length: 40, height: H, thickness: W, material: stone });

  // Crenelations (cimbuří) on top
  for (const wall of [
    { axis: 'x', x: 0, z: 0, len: 40 },
    { axis: 'x', x: 0, z: 40, len: 40 },
    { axis: 'z', x: 0, z: 0, len: 40 },
    { axis: 'z', x: 40, z: 0, len: 40 },
  ]) {
    for (let i = 0; i < wall.len; i += 2) {
      const merlon = wall.axis === 'x'
        ? box(1, 1, W + 0.1, stoneDark)
        : box(W + 0.1, 1, 1, stoneDark);
      if (wall.axis === 'x') merlon.position.set(wall.x + i + 0.5, H + 0.5, wall.z);
      else merlon.position.set(wall.x, H + 0.5, wall.z + i + 0.5);
      g.add(merlon);
    }
  }
}

function buildVeze(g) {
  const TH = 9; // věže vyšší než hradby
  const positions = [[0, 0], [35, 0], [0, 35], [35, 35]];

  for (const [tx, tz] of positions) {
    // Cylindrical tower (octagonal approximation)
    const radius = 2.5;
    const towerGeo = new THREE.CylinderGeometry(radius, radius + 0.3, TH, 8);
    const tower = new THREE.Mesh(towerGeo, stone);
    tower.position.set(tx + 2.5, TH / 2, tz + 2.5);
    g.add(tower);

    // Cone roof
    const roofGeo = new THREE.ConeGeometry(radius + 0.5, 3, 8);
    const roof = new THREE.Mesh(roofGeo, roofTile);
    roof.position.set(tx + 2.5, TH + 1.5, tz + 2.5);
    g.add(roof);

    // Arrow slits
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const sx = tx + 2.5 + Math.cos(angle) * (radius + 0.01);
      const sz = tz + 2.5 + Math.sin(angle) * (radius + 0.01);
      const slit = box(0.15, 1.0, 0.08, stoneDark);
      slit.rotation.y = -angle;
      slit.position.set(sx, 4, sz);
      g.add(slit);
    }
  }
}

function buildBrana(g) {
  // Gate structure at (17, 0) 6×3m
  // Pillars
  const pillarL = box(1, 6, 3, stoneDark);
  pillarL.position.set(17.5, 3, 1.5);
  g.add(pillarL);
  const pillarR = box(1, 6, 3, stoneDark);
  pillarR.position.set(22.5, 3, 1.5);
  g.add(pillarR);

  // Arch above gate
  const arch = box(6, 1.5, 3, stoneDark);
  arch.position.set(20, 5.5, 1.5);
  g.add(arch);

  // Portcullis (iron gate)
  for (let i = 0; i < 5; i++) {
    const bar = box(0.08, 4.5, 0.08, iron);
    bar.position.set(18 + i * 1, 2.25, 0);
    g.add(bar);
  }
  for (let i = 0; i < 3; i++) {
    const hbar = box(4, 0.08, 0.08, iron);
    hbar.position.set(20, 1 + i * 1.5, 0);
    g.add(hbar);
  }
}

function buildNadvori(g) {
  // Cobblestone courtyard floor
  addFloor(g, 2, 2, 36, 36, 0, cobble);

  // Well at (18, 12) 2×2
  const wellGeo = new THREE.CylinderGeometry(1, 1, 0.8, 12);
  const well = new THREE.Mesh(wellGeo, stoneDark);
  well.position.set(19, 0.4, 13);
  g.add(well);
  // Well water
  const wellWater = new THREE.Mesh(new THREE.CircleGeometry(0.8, 12), water);
  wellWater.rotation.x = -Math.PI / 2;
  wellWater.position.set(19, 0.35, 13);
  g.add(wellWater);
  // Well roof structure
  const postL = box(0.1, 2.5, 0.1, wood);
  postL.position.set(18.2, 1.6, 13);
  g.add(postL);
  const postR = box(0.1, 2.5, 0.1, wood);
  postR.position.set(19.8, 1.6, 13);
  g.add(postR);
  const beam = box(2, 0.1, 0.1, wood);
  beam.position.set(19, 2.9, 13);
  g.add(beam);
}

function buildVelkySal(g) {
  // Velký sál: (20, 22) 17×10m
  const sx = 20, sz = 22, sw = 17, sd = 10;

  addFloor(g, sx, sz, sw, sd, 0, woodFloor);
  addCeiling(g, sx, sz, sw, sd, FH, 0);

  // Walls with openings
  // North wall — door to nádvoří at (24,22) 2.5m wide
  wallWithOpenings(g, { axis: 'x', x: sx, z: sz, length: sw, height: FH, thickness: 0.5, material: stone,
    openings: [{ start: 4, end: 6.5 }] // door (24-20=4, 26.5-20=6.5 relative)
  });
  addDoor(g, { axis: 'x', x: sx, z: sz, at: 5.25, width: 2.5, material: woodDark });

  // South wall — door to kuchyně at (24,32) relative: y=32-22=10
  wallWithOpenings(g, { axis: 'x', x: sx, z: sz + sd, length: sw, height: FH, thickness: 0.5, material: stone,
    openings: [{ start: 4, end: 5.5 }]
  });
  addDoor(g, { axis: 'x', x: sx, z: sz + sd, at: 4.75, width: 1.5, material: wood });

  // West wall (shared with palác area)
  wallWithOpenings(g, { axis: 'z', x: sx, z: sz, length: sd, height: FH, thickness: 0.5, material: stone });

  // East wall — windows
  wallWithOpenings(g, { axis: 'z', x: sx + sw, z: sz, length: sd, height: FH, thickness: 0.5, material: stone,
    openings: [
      { start: 2, end: 4, bottom: 1, top: 3.5 },
      { start: 6, end: 8, bottom: 1, top: 3.5 },
    ]
  });
  addWindow(g, { axis: 'z', x: sx + sw, z: sz, at: 3, width: 2, sillHeight: 1, winHeight: 2.5 });
  addWindow(g, { axis: 'z', x: sx + sw, z: sz, at: 7, width: 2, sillHeight: 1, winHeight: 2.5 });

  // Roof
  addFlatRoof(g, sx, sz, sw, sd, FH, 0.3, roofTile);

  // === Furniture (from MCP) ===
  // Trůn (7.5, 0.5) 2×1.5 → absolute (27.5, 22.5)
  const throne = box(1.2, 2, 0.8, gold);
  throne.position.set(sx + 8.5, 1, sz + 1.25);
  g.add(throne);
  const throneBack = box(1.2, 1.5, 0.1, fabric);
  throneBack.position.set(sx + 8.5, 1.5, sz + 0.8);
  g.add(throneBack);

  // Hlavní hodovní stůl (3, 3) 11×2
  const mainTable = box(11, 0.1, 2, wood);
  mainTable.position.set(sx + 8.5, 0.8, sz + 4);
  g.add(mainTable);
  for (const dx of [-4.5, -1.5, 1.5, 4.5]) {
    const leg = box(0.15, 0.78, 0.15, woodDark);
    leg.position.set(sx + 8.5 + dx, 0.39, sz + 4);
    g.add(leg);
  }

  // Boční stoly (1, 3) 1.5×5 a (14.5, 3) 1.5×5
  for (const bx of [1.75, 15.25]) {
    const sideTable = box(1.5, 0.1, 5, wood);
    sideTable.position.set(sx + bx, 0.8, sz + 5.5);
    g.add(sideTable);
    for (const dz of [-2, 2]) {
      const leg = box(0.15, 0.78, 0.15, woodDark);
      leg.position.set(sx + bx, 0.39, sz + 5.5 + dz);
      g.add(leg);
    }
  }

  // Krb (8, 9) 3×1
  const fireplaceBack = box(3, 2.5, 0.3, stoneDark);
  fireplaceBack.position.set(sx + 9.5, 1.25, sz + 9.8);
  g.add(fireplaceBack);
  const fireplaceBase = box(3.2, 0.3, 0.8, stoneDark);
  fireplaceBase.position.set(sx + 9.5, 0.15, sz + 9.5);
  g.add(fireplaceBase);
  const mantle = box(3.5, 0.15, 0.5, stone);
  mantle.position.set(sx + 9.5, 2.5, sz + 9.6);
  g.add(mantle);

  // Torch holders on walls
  for (const [tx, tz] of [[sx + 1, sz + 2], [sx + 1, sz + 8], [sx + 16, sz + 2], [sx + 16, sz + 8]]) {
    const torch = box(0.08, 0.5, 0.08, iron);
    torch.position.set(tx, 2.5, tz);
    g.add(torch);
    const flame = box(0.1, 0.15, 0.1, new THREE.MeshLambertMaterial({ color: 0xff8800, emissive: 0xff4400, side: DS }));
    flame.position.set(tx, 2.85, tz);
    g.add(flame);
  }
}

function buildKuchyne(g) {
  // Kuchyně: (20, 33) 10×5m
  const kx = 20, kz = 33, kw = 10, kd = 5;

  addFloor(g, kx, kz, kw, kd, 0, cobble);
  addCeiling(g, kx, kz, kw, kd, FH, 0);

  // North wall (shared with sál) — already built with door
  // South wall
  wallWithOpenings(g, { axis: 'x', x: kx, z: kz + kd, length: kw, height: FH, thickness: 0.5, material: stone,
    openings: [{ start: 3, end: 5, bottom: 1, top: 3 }]
  });
  addWindow(g, { axis: 'x', x: kx, z: kz + kd, at: 4, width: 2, sillHeight: 1, winHeight: 2 });

  // West wall
  wallWithOpenings(g, { axis: 'z', x: kx, z: kz, length: kd, height: FH, thickness: 0.5, material: stone });
  // East wall — door to zbrojnice area at (30,33) not direct, just wall
  wallWithOpenings(g, { axis: 'z', x: kx + kw, z: kz, length: kd, height: FH, thickness: 0.5, material: stone });

  addFlatRoof(g, kx, kz, kw, kd, FH, 0.2, roofTile);

  // Pec (0.5, 3.5) 3×1.5 → absolute
  const oven = box(3, 1.8, 1.5, stoneDark);
  oven.position.set(kx + 2, 0.9, kz + 4.25);
  g.add(oven);
  const chimney = box(1, 2, 1, stoneDark);
  chimney.position.set(kx + 2, FH - 0.5, kz + 4.25);
  g.add(chimney);

  // Přípravný stůl (4, 1.5) 3×1
  const kTable = box(3, 0.1, 1, wood);
  kTable.position.set(kx + 5.5, 0.85, kz + 2);
  g.add(kTable);
  for (const dx of [-1.2, 1.2]) {
    const leg = box(0.12, 0.83, 0.12, woodDark);
    leg.position.set(kx + 5.5 + dx, 0.415, kz + 2);
    g.add(leg);
  }

  // Sudy (8, 3) 1.5×1.5
  for (let i = 0; i < 3; i++) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8), woodDark);
    barrel.position.set(kx + 8.5 + i * 0.4, 0.4, kz + 3.75 + (i % 2) * 0.3);
    g.add(barrel);
  }
}

function buildZbrojnice(g) {
  // Zbrojnice: (31, 33) 6×5m
  const zx = 31, zz = 33, zw = 6, zd = 5;

  addFloor(g, zx, zz, zw, zd, 0, cobble);
  addCeiling(g, zx, zz, zw, zd, FH, 0);

  // Walls
  // North — door at (33, 33) 1.5m → relative start=2
  wallWithOpenings(g, { axis: 'x', x: zx, z: zz, length: zw, height: FH, thickness: 0.5, material: stone,
    openings: [{ start: 2, end: 3.5 }]
  });
  addDoor(g, { axis: 'x', x: zx, z: zz, at: 2.75, width: 1.5, material: wood });

  wallWithOpenings(g, { axis: 'x', x: zx, z: zz + zd, length: zw, height: FH, thickness: 0.5, material: stone });
  wallWithOpenings(g, { axis: 'z', x: zx, z: zz, length: zd, height: FH, thickness: 0.5, material: stone });
  wallWithOpenings(g, { axis: 'z', x: zx + zw, z: zz, length: zd, height: FH, thickness: 0.5, material: stone,
    openings: [{ start: 1.5, end: 3, bottom: 1, top: 3 }]
  });
  addWindow(g, { axis: 'z', x: zx + zw, z: zz, at: 2.25, width: 1.5, sillHeight: 1, winHeight: 2 });

  addFlatRoof(g, zx, zz, zw, zd, FH, 0.2, roofTile);

  // Weapon racks — (0.5, 0.5) 5×0.5
  const rack = box(5, 2, 0.3, wood);
  rack.position.set(zx + 3, 1.2, zz + 0.8);
  g.add(rack);
  // Swords on rack
  for (let i = 0; i < 5; i++) {
    const sword = box(0.05, 1.2, 0.05, iron);
    sword.position.set(zx + 1.2 + i * 0.9, 1.2, zz + 0.65);
    g.add(sword);
  }

  // Armor stands — (0.5, 3.5) 5×0.5
  for (let i = 0; i < 3; i++) {
    const stand = box(0.1, 1.8, 0.1, woodDark);
    stand.position.set(zx + 1.5 + i * 1.5, 0.9, zz + 3.75);
    g.add(stand);
    // Armor piece
    const armor = box(0.5, 0.8, 0.3, iron);
    armor.position.set(zx + 1.5 + i * 1.5, 1.3, zz + 3.75);
    g.add(armor);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), iron);
    helmet.position.set(zx + 1.5 + i * 1.5, 1.85, zz + 3.75);
    g.add(helmet);
  }
}

function buildPalac(g) {
  // Palác: (3, 22) 16×15m
  const px = 3, pz = 22, pw = 16, pd = 15;

  addFloor(g, px, pz, pw, pd, 0, woodFloor);
  addCeiling(g, px, pz, pw, pd, FH, 0);
  // 2nd floor
  addFloor(g, px, pz, pw, pd, FH, woodFloor);
  addCeiling(g, px, pz, pw, pd, FH, FH);

  // Outer walls
  // North — door at (10,22) 2m wide → relative start=7
  wallWithOpenings(g, { axis: 'x', x: px, z: pz, length: pw, height: FH * 2, thickness: 0.5, material: stone,
    openings: [{ start: 7, end: 9, top: FH }] // only ground floor door
  });
  addDoor(g, { axis: 'x', x: px, z: pz, at: 8, width: 2, material: woodDark });

  // South — windows
  wallWithOpenings(g, { axis: 'x', x: px, z: pz + pd, length: pw, height: FH * 2, thickness: 0.5, material: stone,
    openings: [
      { start: 3, end: 4.5, bottom: 0.8, top: 2.2 },    // knihovna window (floor 0)
      { start: 11, end: 12.5, bottom: 0.6, top: 2.6 },   // kaple window (floor 0)
      { start: 3, end: 4.5, bottom: FH + 0.8, top: FH + 2.2 },  // 2nd floor
      { start: 11, end: 12.5, bottom: FH + 0.8, top: FH + 2.2 },
    ]
  });
  addWindow(g, { axis: 'x', x: px, z: pz + pd, at: 3.75, width: 1.5, sillHeight: 0.8, winHeight: 1.4 });
  addWindow(g, { axis: 'x', x: px, z: pz + pd, at: 11.75, width: 1.5, sillHeight: 0.6, winHeight: 2.0 });
  addWindow(g, { axis: 'x', x: px, z: pz + pd, at: 3.75, width: 1.5, sillHeight: FH + 0.8, winHeight: 1.4 });
  addWindow(g, { axis: 'x', x: px, z: pz + pd, at: 11.75, width: 1.5, sillHeight: FH + 0.8, winHeight: 1.4 });

  // West — windows
  wallWithOpenings(g, { axis: 'z', x: px, z: pz, length: pd, height: FH * 2, thickness: 0.5, material: stone,
    openings: [
      { start: 5, end: 6.5, bottom: 0.8, top: 2.3 },    // komnata window
      { start: 11, end: 12.5, bottom: 0.8, top: 2.3 },   // knihovna window
      { start: 5, end: 6.5, bottom: FH + 0.8, top: FH + 2.3 },
      { start: 11, end: 12.5, bottom: FH + 0.8, top: FH + 2.3 },
    ]
  });
  addWindow(g, { axis: 'z', x: px, z: pz, at: 5.75, width: 1.5, sillHeight: 0.8, winHeight: 1.5 });
  addWindow(g, { axis: 'z', x: px, z: pz, at: 11.75, width: 1.5, sillHeight: 0.8, winHeight: 1.5 });
  addWindow(g, { axis: 'z', x: px, z: pz, at: 5.75, width: 1.5, sillHeight: FH + 0.8, winHeight: 1.5 });
  addWindow(g, { axis: 'z', x: px, z: pz, at: 11.75, width: 1.5, sillHeight: FH + 0.8, winHeight: 1.5 });

  // East
  wallWithOpenings(g, { axis: 'z', x: px + pw, z: pz, length: pd, height: FH * 2, thickness: 0.5, material: stone });

  // Interior walls — ground floor
  // Chodba (0, 0) 16×2.5 — wall at y=2.5 from palác origin
  wallWithOpenings(g, { axis: 'x', x: px, z: pz + 2.5, length: pw, height: FH, thickness: 0.15, material: stoneLight,
    openings: [{ start: 3, end: 4.5 }, { start: 11, end: 12.5 }] // doors to komnaty
  });
  addDoor(g, { axis: 'x', x: px, z: pz + 2.5, at: 3.75, width: 1.5, material: wood });
  addDoor(g, { axis: 'x', x: px, z: pz + 2.5, at: 11.75, width: 1.5, material: wood });

  // Wall between komnaty at x=8.5 from palác → absolute px+8.5
  wallWithOpenings(g, { axis: 'z', x: px + 8.5, z: pz + 2.5, length: 6.5, height: FH, thickness: 0.15, material: stoneLight });

  // Wall at y=9 from palác (between komnaty and knihovna/kaple)
  wallWithOpenings(g, { axis: 'x', x: px, z: pz + 9, length: pw, height: FH, thickness: 0.15, material: stoneLight,
    openings: [{ start: 3, end: 4.5 }, { start: 11, end: 12.5 }]
  });
  addDoor(g, { axis: 'x', x: px, z: pz + 9, at: 3.75, width: 1.5, material: wood });
  addDoor(g, { axis: 'x', x: px, z: pz + 9, at: 11.75, width: 1.5, material: wood });

  // Wall between knihovna and kaple
  wallWithOpenings(g, { axis: 'z', x: px + 8.5, z: pz + 9.5, length: 5.5, height: FH, thickness: 0.15, material: stoneLight });

  // Roof
  addFlatRoof(g, px, pz, pw, pd, FH * 2, 0.3, roofTile);

  // Stairs at (13, 0.5) relative → absolute (px+13, pz+0.5)
  addStairs(g, {
    x: px + 13, z: pz + 0.5,
    width: 2.5, depth: 4,
    floorHeight: FH,
    direction: 'south',
    material: stone,
    railMaterial: iron,
  });

  // === Furniture ===

  // Královská komnata — postel (3,1) 2.2×2.5 relative to komnata (0,3) relative to palác
  const bedX = px + 3 + 1.1, bedZ = pz + 3 + 2.25;
  const bed = box(2.2, 0.5, 2.5, woodDark);
  bed.position.set(bedX, 0.25, bedZ);
  g.add(bed);
  const mattress = box(2, 0.15, 2.3, fabric);
  mattress.position.set(bedX, 0.575, bedZ);
  g.add(mattress);
  const headboard = box(2.2, 0.8, 0.12, woodDark);
  headboard.position.set(bedX, 0.6, pz + 3.2);
  g.add(headboard);
  // Canopy posts
  for (const [dx, dz] of [[-1, -1.1], [1, -1.1], [-1, 1.1], [1, 1.1]]) {
    const post = box(0.08, 2.2, 0.08, woodDark);
    post.position.set(bedX + dx, 1.1, bedZ + dz);
    g.add(post);
  }
  const canopyTop = box(2.3, 0.05, 2.6, fabricBlue);
  canopyTop.position.set(bedX, 2.2, bedZ);
  g.add(canopyTop);

  // Krb v komnatě (6.5, 2) relative to komnata
  const krbX = px + 6.5 + 0.75, krbZ = pz + 3 + 2.5;
  const krbBack = box(1.5, 2, 0.3, stoneDark);
  krbBack.position.set(krbX, 1, pz + 3 + 2);
  g.add(krbBack);

  // Stolek (1, 4)
  const stolek = box(1.2, 0.08, 0.8, wood);
  stolek.position.set(px + 1.6, 0.7, pz + 7.4);
  g.add(stolek);

  // Knihovna — regály
  const regX = px + 0.3;
  for (const rz of [pz + 9.8, pz + 14]) {
    const regal = box(7, 2.5, 0.4, wood);
    regal.position.set(regX + 3.5, 1.25, rz);
    g.add(regal);
    for (let i = 0; i < 5; i++) {
      const shelf = box(6.8, 0.04, 0.38, wood);
      shelf.position.set(regX + 3.5, 0.5 + i * 0.5, rz);
      g.add(shelf);
    }
  }
  // Čtecí stůl
  const readTable = box(2, 0.08, 1, wood);
  readTable.position.set(px + 3.5, 0.75, pz + 11.5);
  g.add(readTable);

  // Kaple — oltář
  const altar = box(2, 0.9, 0.8, stoneLight);
  altar.position.set(px + 12, 0.45, pz + 14);
  g.add(altar);
  const cross = box(0.08, 1.2, 0.08, gold);
  cross.position.set(px + 12, 1.5, pz + 14.5);
  g.add(cross);
  const crossArm = box(0.6, 0.08, 0.08, gold);
  crossArm.position.set(px + 12, 1.8, pz + 14.5);
  g.add(crossArm);
}
