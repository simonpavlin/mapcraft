import * as THREE from 'three';
import { box, plane, wallWithOpenings, addWindow, addDoor, addFloor, MAT, boxWithOpenings } from '../../building-utils.js';

// ════════════════════════════════════════════════
// MATERIALS
// ════════════════════════════════════════════════

const DS = THREE.FrontSide;

// Ground surfaces
const grass = new THREE.MeshLambertMaterial({ color: 0x4a8c2e, side: DS });
const grassLight = new THREE.MeshLambertMaterial({ color: 0x5aaa38, side: DS });
const grassMeadow = new THREE.MeshLambertMaterial({ color: 0x6ab848, side: DS });
const gravel = new THREE.MeshLambertMaterial({ color: 0xc8b898, side: DS });
const brick = new THREE.MeshLambertMaterial({ color: 0xa05030, side: DS });
const brickWall = new THREE.MeshLambertMaterial({ color: 0x8b4533, side: DS });
const stone = new THREE.MeshLambertMaterial({ color: 0x999088, side: DS });
const stonePaving = new THREE.MeshLambertMaterial({ color: 0xb0a898, side: DS });
const dirt = new THREE.MeshLambertMaterial({ color: 0x6b5030, side: DS });

// Vegetation
const hedge = new THREE.MeshLambertMaterial({ color: 0x2d6b1e, side: DS });
const hedgeBox = new THREE.MeshLambertMaterial({ color: 0x3a7a28, side: DS });
const hedgeYew = new THREE.MeshLambertMaterial({ color: 0x1a4a12, side: DS });
const treeTrunk = new THREE.MeshLambertMaterial({ color: 0x5a3a1a, side: DS });
const treeCanopy = new THREE.MeshLambertMaterial({ color: 0x2e7d20, side: DS });
const treeCanopyLight = new THREE.MeshLambertMaterial({ color: 0x4a9a3a, side: DS });
const treeCanopyCopper = new THREE.MeshLambertMaterial({ color: 0x8a3040, side: DS });
const treeCanopyWillow = new THREE.MeshLambertMaterial({ color: 0x5aaa40, side: DS });
const treeCanopyHolly = new THREE.MeshLambertMaterial({ color: 0x1a5a10, side: DS });
const flowerRose = new THREE.MeshLambertMaterial({ color: 0xcc2244, side: DS });
const flowerPink = new THREE.MeshLambertMaterial({ color: 0xdd6688, side: DS });
const flowerBlue = new THREE.MeshLambertMaterial({ color: 0x4466cc, side: DS });
const flowerYellow = new THREE.MeshLambertMaterial({ color: 0xddcc22, side: DS });
const flowerPurple = new THREE.MeshLambertMaterial({ color: 0x8844aa, side: DS });
const flowerWhite = new THREE.MeshLambertMaterial({ color: 0xeeeedd, side: DS });
const flowerOrange = new THREE.MeshLambertMaterial({ color: 0xdd7722, side: DS });
const lavender = new THREE.MeshLambertMaterial({ color: 0x7755aa, side: DS });
const plantGreen = new THREE.MeshLambertMaterial({ color: 0x448833, side: DS });
const vegGreen = new THREE.MeshLambertMaterial({ color: 0x55aa44, side: DS });

// Structures
const wood = new THREE.MeshLambertMaterial({ color: 0x8b6b3a, side: DS });
const woodDark = new THREE.MeshLambertMaterial({ color: 0x5a4020, side: DS });
const woodLight = new THREE.MeshLambertMaterial({ color: 0xaa8855, side: DS });
const iron = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const ironGate = new THREE.MeshLambertMaterial({ color: 0x333333, side: DS });
const glassMat = new THREE.MeshLambertMaterial({ color: 0xaaddee, opacity: 0.4, transparent: true, side: DS });
const glassFrame = new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: DS });
const roofTile = new THREE.MeshLambertMaterial({ color: 0x664433, side: DS });

// Water
const water = new THREE.MeshLambertMaterial({ color: 0x3388aa, opacity: 0.7, transparent: true, side: DS });
const waterLily = new THREE.MeshLambertMaterial({ color: 0x44aa44, side: DS });
const waterLilyFlower = new THREE.MeshLambertMaterial({ color: 0xffccdd, side: DS });

// Stone features
const stoneFeature = new THREE.MeshLambertMaterial({ color: 0xaaa898, side: DS });
const stoneLight = new THREE.MeshLambertMaterial({ color: 0xccbba8, side: DS });
const bronzeMat = new THREE.MeshLambertMaterial({ color: 0x8a7a40, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }
function cyl(r, h, mat, segs = 16) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), mat); }
function cone(r, h, mat, segs = 16) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), mat); }
function sphere(r, mat, segs = 12) { return new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat); }

// ════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════

export function createEnglishGarden(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  buildGroundSurfaces(g);
  buildPaths(g);
  buildHaHa(g);
  buildBoundaryHedges(g);
  buildLawnHedges(g);
  buildTerrace(g);
  buildHerbaceousBorder(g);
  buildRoseGarden(g);
  buildKitchenGarden(g);
  buildLawn(g);
  buildTopiaryGarden(g);
  buildPergolaWalk(g);
  buildPond(g);
  buildOrchard(g);
  buildWildflowerMeadow(g);
  buildGreenhouse(g);
  buildGardenShed(g);
  buildGazebo(g);
  buildBenches(g);
  buildBirdBath(g);
  buildArches(g);
  buildGates(g);
  buildBeehives(g);
  buildSpecimenTrees(g);

  scene.add(g);
}

// ════════════════════════════════════════════════
// GROUND SURFACES — different textures per zone
// ════════════════════════════════════════════════

function buildGroundSurfaces(g) {
  // mcp:garden (0,0) 60×50 — main grass ground
  const gardenGround = plane(60, 50, grass);
  gardenGround.rotation.x = -Math.PI / 2;
  gardenGround.position.set(30, 0.01, 25);
  g.add(gardenGround);

  // mcp:terrace (10,44) 20×6 — stone paving
  const terraceGround = plane(20, 6, stonePaving);
  terraceGround.rotation.x = -Math.PI / 2;
  terraceGround.position.set(20, 0.02, 47);
  g.add(terraceGround);

  // mcp:lawn (5,14) 24×10 — lighter grass
  const lawnGround = plane(24, 10, grassLight);
  lawnGround.rotation.x = -Math.PI / 2;
  lawnGround.position.set(17, 0.02, 19);
  g.add(lawnGround);

  // mcp:wildflower_meadow (22,1.5) 10×6.5 — meadow grass
  const meadowGround = plane(10, 6.5, grassMeadow);
  meadowGround.rotation.x = -Math.PI / 2;
  meadowGround.position.set(27, 0.02, 4.75);
  g.add(meadowGround);

  // mcp:rose_garden (13,24) 16×13 — gravel base
  const roseGardenGround = plane(16, 13, gravel);
  roseGardenGround.rotation.x = -Math.PI / 2;
  roseGardenGround.position.set(21, 0.015, 30.5);
  g.add(roseGardenGround);

  // mcp:kitchen_garden (40,22) 16×16 — dirt base
  const kitchenGround = plane(16, 16, dirt);
  kitchenGround.rotation.x = -Math.PI / 2;
  kitchenGround.position.set(48, 0.015, 30);
  g.add(kitchenGround);

  // mcp:topiary_garden (32,14) 8×8 — lawn
  const topiaryGround = plane(8, 8, grassLight);
  topiaryGround.rotation.x = -Math.PI / 2;
  topiaryGround.position.set(36, 0.02, 18);
  g.add(topiaryGround);

  // mcp:orchard (2,2) 18×11 — grass with dappled feel
  const orchardGround = plane(18, 11, grassLight);
  orchardGround.rotation.x = -Math.PI / 2;
  orchardGround.position.set(11, 0.015, 7.5);
  g.add(orchardGround);
}

// ════════════════════════════════════════════════
// PATHS — gravel and brick
// ════════════════════════════════════════════════

function buildPaths(g) {
  // mcp:path_main_axis (19,8) 2×35 — Main N-S gravel path
  g.add(p(box(2, 0.05, 35, gravel), 20, 0.025, 25.5));

  // mcp:path_ew_south (10,38) 34×1.5
  g.add(p(box(34, 0.05, 1.5, gravel), 27, 0.025, 38.75));

  // mcp:path_ew_north (5,13) 35×1
  g.add(p(box(35, 0.05, 1, gravel), 22.5, 0.025, 13.5));

  // mcp:path_to_kitchen (35,24) 5×1.5
  g.add(p(box(5, 0.05, 1.5, gravel), 37.5, 0.025, 24.75));

  // mcp:path_to_pond (32,8) 1.5×5
  g.add(p(box(1.5, 0.05, 5, gravel), 32.75, 0.025, 10.5));

  // mcp:path_to_gazebo (4,14) 1×8
  g.add(p(box(1, 0.05, 8, gravel), 4.5, 0.025, 18));

  // mcp:path_terrace_east (30,40) 14×1.5
  g.add(p(box(14, 0.05, 1.5, gravel), 37, 0.025, 40.75));

  // Kitchen garden brick paths
  // mcp:brick_path_ns (45,22) 1×12 (relative 5,0)
  g.add(p(box(1, 0.06, 12, brick), 45.5, 0.03, 28));
  // mcp:brick_path_ew (40,33) 16×1 (relative 0,11)
  g.add(p(box(16, 0.06, 1, brick), 48, 0.03, 33.5));

  // Pergola path
  // mcp:pergola_path — inside pergola walk
  g.add(p(box(9.4, 0.05, 2, gravel), 35.3, 0.025, 11.5));

  // Rose garden paths
  // mcp:rose_path_ns (20,24) 2×13
  g.add(p(box(2, 0.05, 13, gravel), 21, 0.025, 30.5));
  // mcp:rose_path_ew (13,29) 16×2
  g.add(p(box(16, 0.05, 2, gravel), 21, 0.025, 30));

  // Mown path through meadow
  // mcp:mown_path (22,4.5) 10×0.8
  g.add(p(box(10, 0.03, 0.8, grassLight), 27, 0.02, 4.9));
}

// ════════════════════════════════════════════════
// HA-HA — sunken ditch at north boundary
// ════════════════════════════════════════════════

function buildHaHa(g) {
  // mcp:ha_ha (0,0) 60×1.5 — sunken retaining wall
  // Ditch — sunken area
  g.add(p(box(60, 1.2, 1.5, dirt), 30, -0.6, 0.75));
  // Retaining wall on garden side (south face)
  g.add(p(box(60, 1.5, 0.3, stone), 30, -0.05, 1.5));
  // Grass slope on field side
  g.add(p(box(60, 0.05, 1.2, grass), 30, 0.01, 0.6));
}

// ════════════════════════════════════════════════
// BOUNDARY HEDGES
// ════════════════════════════════════════════════

function buildBoundaryHedges(g) {
  // mcp:hedge_boundary_w (0,0) 1×50
  g.add(p(box(1, 2.5, 50, hedge), 0.5, 1.25, 25));
  // mcp:hedge_boundary_e (59,0) 1×50
  g.add(p(box(1, 2.5, 50, hedge), 59.5, 1.25, 25));
}

function buildLawnHedges(g) {
  // mcp:hedge_lawn_south (5,24) 24×0.6
  g.add(p(box(24, 1.2, 0.6, hedgeYew), 17, 0.6, 24.3));
  // mcp:hedge_lawn_west (4.4,14) 0.6×10
  g.add(p(box(0.6, 1.2, 10, hedgeYew), 4.7, 0.6, 19));
  // mcp:hedge_lawn_east (29,14) 0.6×10
  g.add(p(box(0.6, 1.2, 10, hedgeYew), 29.3, 0.6, 19));

  // Rose garden hedges
  // mcp:hedge_rose_north (13,23.5) 16×0.5
  g.add(p(box(16, 1.0, 0.5, hedgeBox), 21, 0.5, 23.75));
  // mcp:hedge_rose_west (12.5,24) 0.5×13
  g.add(p(box(0.5, 1.0, 13, hedgeBox), 12.75, 0.5, 30.5));
  // mcp:hedge_rose_east (29,24) 0.5×13
  g.add(p(box(0.5, 1.0, 13, hedgeBox), 29.25, 0.5, 30.5));
}

// ════════════════════════════════════════════════
// TERRACE — stone paved area with furniture
// ════════════════════════════════════════════════

function buildTerrace(g) {
  const tx = 10, tz = 44;

  // Raised terrace edge (low wall)
  g.add(p(box(20, 0.3, 0.2, stone), tx + 10, 0.15, tz));       // north edge
  g.add(p(box(0.2, 0.3, 6, stone), tx, 0.15, tz + 3));         // west edge
  g.add(p(box(0.2, 0.3, 6, stone), tx + 20, 0.15, tz + 3));    // east edge

  // mcp:terrace_steps (18,44) 4×1
  for (let i = 0; i < 3; i++) {
    g.add(p(box(4, 0.1, 0.33, stone), tx + 10, 0.05 + i * 0.1, tz - 0.17 + i * 0.33));
  }

  // mcp:dining_table (14,45.5) 2.5×1.5
  // Table
  g.add(p(box(2.5, 0.05, 1.5, woodDark), tx + 5.25, 0.75, tz + 2.25));
  // Table legs
  for (const [dx, dz] of [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]]) {
    g.add(p(box(0.06, 0.7, 0.06, woodDark), tx + 5.25 + dx, 0.35, tz + 2.25 + dz));
  }
  // Chairs
  for (let i = 0; i < 6; i++) {
    const cx = tx + 4 + (i % 3) * 1.1;
    const cz = tz + 1.6 + Math.floor(i / 3) * 1.8;
    g.add(p(box(0.45, 0.05, 0.45, wood), cx, 0.45, cz));
    g.add(p(box(0.45, 0.4, 0.05, wood), cx, 0.65, cz + (i < 3 ? -0.2 : 0.2)));
  }

  // mcp:parasol (24,45.5) 3×3
  // Pole
  g.add(p(cyl(0.04, 2.5, iron), tx + 15.5, 1.25, tz + 3));
  // Canopy
  g.add(p(cone(1.5, 0.3, new THREE.MeshLambertMaterial({ color: 0xeedd99, side: DS })), tx + 15.5, 2.4, tz + 3));

  // mcp:planter_1..4 — stone planters with lavender/agapanthus
  const planterPositions = [
    [tx + 1.25, tz + 1.25], [tx + 18.75, tz + 1.25],
    [tx + 1.25, tz + 4.75], [tx + 18.75, tz + 4.75],
  ];
  for (const [px, pz] of planterPositions) {
    // Stone planter box
    g.add(p(box(1.4, 0.5, 1.4, stoneLight), px, 0.25, pz));
    // Soil
    g.add(p(box(1.2, 0.1, 1.2, dirt), px, 0.5, pz));
    // Plants (small spheres)
    for (let i = 0; i < 3; i++) {
      g.add(p(sphere(0.25, lavender), px - 0.3 + i * 0.3, 0.75, pz));
    }
  }

  // mcp:wall_trellis (10,49.5) 20×0.5 — clematis on trellis
  for (let i = 0; i < 10; i++) {
    const wx = tx + 1 + i * 2;
    // Trellis lattice
    g.add(p(box(0.04, 2, 0.04, wood), wx, 1, tz + 5.75));
    g.add(p(box(1.6, 0.04, 0.04, wood), wx, 0.6, tz + 5.75));
    g.add(p(box(1.6, 0.04, 0.04, wood), wx, 1.2, tz + 5.75));
    g.add(p(box(1.6, 0.04, 0.04, wood), wx, 1.8, tz + 5.75));
    // Climbing plants
    g.add(p(sphere(0.3, plantGreen), wx + 0.3, 1.1, tz + 5.7));
    if (i % 2 === 0) g.add(p(sphere(0.15, flowerPurple), wx + 0.2, 1.4, tz + 5.65));
  }

  // mcp:wisteria_tree (8,43.5) 2×2
  addTree(g, 9, 44.5, 3, 2, treeTrunk, flowerPurple);

  // mcp:climbing_rose_wall (5,43) 5×0.5
  for (let i = 0; i < 5; i++) {
    g.add(p(sphere(0.3, plantGreen), 5.5 + i, 0.8, 43.25));
    if (i % 2 === 0) g.add(p(sphere(0.12, flowerRose), 5.5 + i, 1.1, 43.2));
  }

  // mcp:lavender_walk (10,43) 7×0.8
  for (let i = 0; i < 7; i++) {
    g.add(p(sphere(0.3, lavender), 10.5 + i, 0.35, 43.4));
  }
}

// ════════════════════════════════════════════════
// HERBACEOUS BORDER — 6 seasonal sections
// ════════════════════════════════════════════════

function buildHerbaceousBorder(g) {
  const bx = 5, bz = 38;
  // mcp:herbaceous_border (5,38) 30×5

  // Soil bed
  g.add(p(box(30, 0.15, 5, dirt), bx + 15, 0.075, bz + 2.5));

  const sections = [
    { name: 'delphiniums', x: 0, w: 5, colors: [flowerBlue, flowerPurple, flowerPink], heights: [1.5, 1.8, 1.2] },
    { name: 'peonies', x: 5, w: 5, colors: [flowerPink, flowerWhite, flowerRose], heights: [0.8, 0.9, 0.7] },
    { name: 'geraniums', x: 10, w: 5, colors: [flowerPurple, flowerBlue, flowerPink], heights: [0.5, 0.6, 0.45] },
    { name: 'asters', x: 15, w: 5, colors: [flowerPurple, flowerYellow, flowerOrange], heights: [0.7, 0.8, 0.6] },
    { name: 'grasses', x: 20, w: 5, colors: [plantGreen, treeCanopyLight, grassMeadow], heights: [1.0, 1.2, 0.8] },
    { name: 'climbers', x: 25, w: 5, colors: [flowerRose, plantGreen, flowerPink], heights: [1.5, 1.8, 1.3] },
  ];

  for (const sec of sections) {
    // Plant clusters — random-ish distribution
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const px = bx + sec.x + 0.6 + col * 1.2;
        const pz = bz + 0.8 + row * 1.5;
        const ci = (row + col) % sec.colors.length;
        const hi = (row + col) % sec.heights.length;
        const h = sec.heights[hi] * (0.8 + Math.random() * 0.4);
        // Foliage
        g.add(p(sphere(0.35, plantGreen), px, h * 0.4, pz));
        // Flowers on top
        g.add(p(sphere(0.2, sec.colors[ci]), px, h * 0.7, pz));
      }
    }
  }
}

// ════════════════════════════════════════════════
// ROSE GARDEN — formal, with fountain and sundial
// ════════════════════════════════════════════════

function buildRoseGarden(g) {
  const rx = 13, rz = 24;
  // mcp:rose_garden (13,24) 16×13

  // mcp:fountain (19.5,29) 3×3 — central fountain
  const fx = rx + 8, fz = rz + 6.5;
  // Basin
  g.add(p(cyl(1.5, 0.5, stoneLight, 24), fx, 0.25, fz));
  // Inner basin
  g.add(p(cyl(1.2, 0.1, water, 24), fx, 0.45, fz));
  // Central column
  g.add(p(cyl(0.15, 1.2, stoneLight), fx, 0.9, fz));
  // Top bowl
  g.add(p(cyl(0.5, 0.2, stoneLight, 16), fx, 1.5, fz));
  // Water in top bowl
  g.add(p(cyl(0.4, 0.05, water, 16), fx, 1.55, fz));

  // Rose beds — raised with flowers
  const beds = [
    { x: 1, y: 1, w: 5, h: 3.5 },    // NW
    { x: 10, y: 1, w: 5, h: 3.5 },   // NE
    { x: 1, y: 8.5, w: 5, h: 3.5 },  // SW
    { x: 10, y: 8.5, w: 5, h: 3.5 }, // SE
  ];
  for (const bed of beds) {
    const bx2 = rx + bed.x, bz2 = rz + bed.y;
    // Raised bed edge
    g.add(p(box(bed.w, 0.25, 0.1, stone), bx2 + bed.w / 2, 0.125, bz2));
    g.add(p(box(bed.w, 0.25, 0.1, stone), bx2 + bed.w / 2, 0.125, bz2 + bed.h));
    g.add(p(box(0.1, 0.25, bed.h, stone), bx2, 0.125, bz2 + bed.h / 2));
    g.add(p(box(0.1, 0.25, bed.h, stone), bx2 + bed.w, 0.125, bz2 + bed.h / 2));
    // Soil
    g.add(p(box(bed.w - 0.2, 0.15, bed.h - 0.2, dirt), bx2 + bed.w / 2, 0.1, bz2 + bed.h / 2));
    // Rose bushes (3×2 grid per bed)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const rpx = bx2 + 0.8 + c * 1.5;
        const rpz = bz2 + 0.8 + r * 1.5;
        // Bush foliage
        g.add(p(sphere(0.4, plantGreen), rpx, 0.5, rpz));
        // Rose blooms
        g.add(p(sphere(0.15, flowerRose), rpx + 0.1, 0.8, rpz));
        g.add(p(sphere(0.12, flowerPink), rpx - 0.15, 0.7, rpz + 0.1));
      }
    }
  }

  // mcp:sundial (20.25,35.5) 1.5×1
  g.add(p(cyl(0.2, 1, stoneFeature), rx + 8, 0.5, rz + 12));
  g.add(p(cyl(0.4, 0.08, stoneFeature), rx + 8, 1.04, rz + 12));
  // Gnomon
  g.add(p(box(0.02, 0.25, 0.3, bronzeMat), rx + 8, 1.2, rz + 12));
}

// ════════════════════════════════════════════════
// KITCHEN GARDEN — walled, with raised beds
// ════════════════════════════════════════════════

function buildKitchenGarden(g) {
  const kx = 40, kz = 22;
  // mcp:kitchen_garden (40,22) 16×16

  // Walls — brick, 2.2m high
  // mcp:hedge_kitchen_n (40,21.5) 16×0.5
  wallWithOpenings(g, { axis: 'x', x: kx, z: kz - 0.5, length: 16, height: 2.2, material: brickWall,
    openings: [{ start: 4, end: 5.2, top: 2.1 }] }); // gate opening
  // mcp:hedge_kitchen_s (40,38) 16×0.5
  g.add(p(box(16, 2.2, 0.3, brickWall), kx + 8, 1.1, kz + 16.25));
  // mcp:hedge_kitchen_w (39.5,22) 0.5×16
  g.add(p(box(0.3, 2.2, 16, brickWall), kx - 0.25, 1.1, kz + 8));
  // mcp:hedge_kitchen_e (56,22) 0.5×16
  g.add(p(box(0.3, 2.2, 16, brickWall), kx + 16.25, 1.1, kz + 8));

  // Vegetable beds — raised wooden edges with plants
  const vegBeds = [
    { x: 1, y: 1, w: 4, h: 2.5, color: vegGreen },       // Root veg
    { x: 1, y: 4.5, w: 4, h: 2.5, color: plantGreen },    // Brassicas
    { x: 1, y: 8, w: 4, h: 2.5, color: vegGreen },        // Legumes
    { x: 6, y: 1, w: 4, h: 2.5, color: treeCanopyLight },  // Salad
    { x: 6, y: 4.5, w: 4, h: 2.5, color: vegGreen },      // Squash
    { x: 6, y: 8, w: 4, h: 2.5, color: plantGreen },      // Alliums
  ];
  for (const bed of vegBeds) {
    const bx2 = kx + bed.x, bz2 = kz + bed.y;
    // Wooden raised bed frame
    g.add(p(box(bed.w, 0.3, 0.08, woodLight), bx2 + bed.w / 2, 0.15, bz2));
    g.add(p(box(bed.w, 0.3, 0.08, woodLight), bx2 + bed.w / 2, 0.15, bz2 + bed.h));
    g.add(p(box(0.08, 0.3, bed.h, woodLight), bx2, 0.15, bz2 + bed.h / 2));
    g.add(p(box(0.08, 0.3, bed.h, woodLight), bx2 + bed.w, 0.15, bz2 + bed.h / 2));
    // Soil
    g.add(p(box(bed.w - 0.16, 0.2, bed.h - 0.16, dirt), bx2 + bed.w / 2, 0.1, bz2 + bed.h / 2));
    // Crop rows
    for (let row = 0; row < 3; row++) {
      const rz2 = bz2 + 0.4 + row * 0.8;
      g.add(p(box(bed.w - 0.5, 0.25, 0.3, bed.color), bx2 + bed.w / 2, 0.35, rz2));
    }
  }

  // mcp:herb_spiral (51.5,23) 2.5×2.5
  g.add(p(cyl(1.2, 0.8, stone, 8), kx + 12.75, 0.4, kz + 1.25 + 1.25));
  g.add(p(cyl(0.8, 0.5, dirt, 8), kx + 12.75, 0.65, kz + 1.25 + 1.25));
  for (let a = 0; a < 6; a++) {
    const angle = a * Math.PI / 3;
    g.add(p(sphere(0.2, plantGreen), kx + 12.75 + Math.cos(angle) * 0.5, 0.9, kz + 2.5 + Math.sin(angle) * 0.5));
  }

  // mcp:espalier_wall (40,34) 16×1 — fruit trees on wall
  for (let i = 0; i < 8; i++) {
    const ex = kx + 1 + i * 2;
    // Vertical stem
    g.add(p(box(0.04, 1.5, 0.04, treeTrunk), ex, 0.75, kz + 12.5));
    // Horizontal branches
    g.add(p(box(1.2, 0.03, 0.03, treeTrunk), ex, 0.6, kz + 12.5));
    g.add(p(box(1.4, 0.03, 0.03, treeTrunk), ex, 1.0, kz + 12.5));
    // Leaves
    g.add(p(sphere(0.25, plantGreen), ex - 0.3, 0.9, kz + 12.5));
    g.add(p(sphere(0.25, plantGreen), ex + 0.3, 0.9, kz + 12.5));
  }

  // mcp:compost_area (52,30) 3×3
  g.add(p(box(3, 1, 0.08, woodDark), kx + 13.5, 0.5, kz + 8));    // back
  g.add(p(box(0.08, 1, 3, woodDark), kx + 12, 0.5, kz + 9.5));    // left
  g.add(p(box(0.08, 1, 3, woodDark), kx + 15, 0.5, kz + 9.5));    // right
  g.add(p(box(3, 0.8, 0.08, woodDark), kx + 13.5, 0.4, kz + 11)); // front

  // mcp:rhubarb_patch (51.5,26.5) 2.5×2.5
  for (let i = 0; i < 4; i++) {
    const rpx = kx + 12.25 + (i % 2) * 1;
    const rpz = kz + 5.25 + Math.floor(i / 2) * 1;
    g.add(p(sphere(0.4, plantGreen), rpx, 0.4, rpz));
    g.add(p(box(0.04, 0.4, 0.04, flowerRose), rpx, 0.2, rpz));  // red stem
  }

  // mcp:cold_frame_1,2 (52,35.5), (54,35.5)
  for (const cfx of [kx + 12, kx + 14]) {
    g.add(p(box(1.5, 0.4, 1, woodLight), cfx + 0.75, 0.2, kz + 14));
    // Glass lid (angled)
    const lid = box(1.5, 0.05, 1, glassMat);
    lid.position.set(cfx + 0.75, 0.45, kz + 14);
    lid.rotation.x = -0.15;
    g.add(lid);
  }
}

// ════════════════════════════════════════════════
// LAWN — open grass with croquet area & cedar
// ════════════════════════════════════════════════

function buildLawn(g) {
  // mcp:lawn (5,14) 24×10
  // mcp:croquet_lawn (10,16) 10×6 — subtle markings
  // Just lighter ground overlay — already done in buildGroundSurfaces

  // Croquet hoops (subtle)
  for (let i = 0; i < 6; i++) {
    const hx = 11 + i * 1.8;
    g.add(p(cyl(0.01, 0.3, iron), hx, 0.15, 18));
    g.add(p(cyl(0.01, 0.3, iron), hx + 0.15, 0.15, 18));
    g.add(p(box(0.15, 0.01, 0.01, iron), hx + 0.075, 0.3, 18));
  }

  // mcp:specimen_cedar (23,17) 4×4 — Cedar of Lebanon
  addCedar(g, 25, 19);
}

// ════════════════════════════════════════════════
// TOPIARY GARDEN
// ════════════════════════════════════════════════

function buildTopiaryGarden(g) {
  const tx = 32, tz = 14;
  // mcp:topiary_garden (32,14) 8×8

  // Box hedge borders
  // mcp:box_hedge_border_n/s/w/e
  g.add(p(box(8, 0.6, 0.4, hedgeBox), tx + 4, 0.3, tz + 0.2));   // N
  g.add(p(box(8, 0.6, 0.4, hedgeBox), tx + 4, 0.3, tz + 7.8));   // S
  g.add(p(box(0.4, 0.6, 8, hedgeBox), tx + 0.2, 0.3, tz + 4));   // W
  g.add(p(box(0.4, 0.6, 8, hedgeBox), tx + 7.8, 0.3, tz + 4));   // E

  // Yew cones at corners
  const cones = [[0.5, 0.5], [6.5, 0.5], [0.5, 6.5], [6.5, 6.5]];
  for (const [cx, cz] of cones) {
    g.add(p(cone(0.4, 1.8, hedgeYew), tx + cx + 0.5, 0.9, tz + cz + 0.5));
  }

  // Box spheres at midpoints
  const spheres = [[3.4, 1], [3.4, 5.8], [1, 3.4], [5.8, 3.4]];
  for (const [sx, sz] of spheres) {
    g.add(p(sphere(0.5, hedgeBox), tx + sx + 0.6, 0.55, tz + sz + 0.6));
  }

  // mcp:topiary_center (35,17) 2×2 — Central Yew Obelisk
  g.add(p(box(0.6, 2.5, 0.6, hedgeYew), tx + 4, 1.25, tz + 4));
  g.add(p(cone(0.4, 0.6, hedgeYew), tx + 4, 2.8, tz + 4));
}

// ════════════════════════════════════════════════
// PERGOLA WALK — oak pillars with cross beams
// ════════════════════════════════════════════════

function buildPergolaWalk(g) {
  const px = 30, pz = 10;
  // mcp:pergola_walk (30,10) 10×3

  // 5 pairs of pillars
  for (let i = 0; i < 5; i++) {
    const pillarX = px + i * 2;
    // North pillar
    g.add(p(box(0.2, 2.8, 0.2, wood), pillarX + 0.15, 1.4, pz + 0.15));
    // South pillar
    g.add(p(box(0.2, 2.8, 0.2, wood), pillarX + 0.15, 1.4, pz + 2.85));
    // Cross beam
    g.add(p(box(0.12, 0.15, 3, wood), pillarX + 0.15, 2.75, pz + 1.5));
  }

  // Longitudinal beams
  g.add(p(box(10, 0.12, 0.12, wood), px + 5, 2.85, pz + 0.15));
  g.add(p(box(10, 0.12, 0.12, wood), px + 5, 2.85, pz + 2.85));

  // Climbing roses/wisteria on pergola
  for (let i = 0; i < 5; i++) {
    const vx = px + 0.3 + i * 2;
    // Vine on pillars
    g.add(p(sphere(0.3, plantGreen), vx, 2.0, pz + 0.15));
    g.add(p(sphere(0.3, plantGreen), vx, 2.0, pz + 2.85));
    // Flowers on top
    g.add(p(sphere(0.25, flowerPurple), vx + 0.5, 2.7, pz + 1));
    g.add(p(sphere(0.2, flowerRose), vx + 0.5, 2.7, pz + 2));
  }
}

// ════════════════════════════════════════════════
// POND — naturalistic water garden
// ════════════════════════════════════════════════

function buildPond(g) {
  const px = 32, pz = 2;
  // mcp:pond (32,2) 12×8

  // Pond water surface (irregular shape approximated with overlapping planes)
  const pondShape = new THREE.Shape();
  // mcp:pond_water shape: [[0,1],[2,0],[8,0],[10,0.5],[10,4],[8,5],[3,5],[0,3.5]]
  pondShape.moveTo(0, 1);
  pondShape.lineTo(2, 0);
  pondShape.lineTo(8, 0);
  pondShape.lineTo(10, 0.5);
  pondShape.lineTo(10, 4);
  pondShape.lineTo(8, 5);
  pondShape.lineTo(3, 5);
  pondShape.lineTo(0, 3.5);
  pondShape.lineTo(0, 1);

  const pondGeo = new THREE.ShapeGeometry(pondShape);
  const pondMesh = new THREE.Mesh(pondGeo, water);
  pondMesh.rotation.x = -Math.PI / 2;
  pondMesh.position.set(px + 1, -0.1, pz + 1.5);
  g.add(pondMesh);

  // Pond bank/edge — ring of stones
  const bankPoints = [
    [0, 1], [1, 0.5], [2, 0], [5, -0.2], [8, 0], [9.5, 0.3],
    [10, 0.5], [10.3, 2], [10, 4], [9, 4.8], [8, 5],
    [5, 5.2], [3, 5], [1, 4], [0, 3.5], [-0.2, 2.5],
  ];
  for (const [bx, bz2] of bankPoints) {
    g.add(p(box(0.5, 0.15, 0.4, stone), px + 1 + bx, 0.05, pz + 1.5 + bz2));
  }

  // Water lilies
  for (const [lx, lz] of [[4, 2], [6, 3], [5, 1.5], [7, 2.5], [3, 3.5]]) {
    // Lily pad
    g.add(p(cyl(0.3, 0.02, waterLily, 8), px + 1 + lx, -0.05, pz + 1.5 + lz));
    // Flower
    if (lx % 2 === 0) g.add(p(sphere(0.1, waterLilyFlower), px + 1 + lx, 0.02, pz + 1.5 + lz));
  }

  // mcp:bridge (36,3.5) 3×1
  g.add(p(box(3, 0.12, 1.2, wood), px + 5.5, 0.2, pz + 2));
  // Bridge railings
  g.add(p(box(3, 0.6, 0.06, wood), px + 5.5, 0.5, pz + 1.4));
  g.add(p(box(3, 0.6, 0.06, wood), px + 5.5, 0.5, pz + 2.6));
  // Railing posts
  for (const dx of [-1.2, 0, 1.2]) {
    g.add(p(box(0.06, 0.7, 0.06, wood), px + 5.5 + dx, 0.35, pz + 1.4));
    g.add(p(box(0.06, 0.7, 0.06, wood), px + 5.5 + dx, 0.35, pz + 2.6));
  }

  // mcp:bog_garden (32.5,2) 5×1.5
  for (let i = 0; i < 5; i++) {
    g.add(p(sphere(0.35, plantGreen), px + 1 + i, 0.3, pz + 0.75));
    if (i % 2 === 0) g.add(p(sphere(0.2, flowerYellow), px + 1 + i, 0.55, pz + 0.8));
  }

  // mcp:iris_bed (39,8.5) 4×1.5
  for (let i = 0; i < 4; i++) {
    g.add(p(sphere(0.3, plantGreen), px + 7.5 + i, 0.3, pz + 7));
    g.add(p(sphere(0.15, flowerPurple), px + 7.5 + i, 0.5, pz + 7));
  }

  // mcp:willow_tree (41,2) 3×3 — weeping willow
  addWeepingWillow(g, px + 10.5, pz + 1.5);

  // mcp:pond_bench (32,5.5) 1.5×0.5
  addBench(g, px, pz + 4);
}

// ════════════════════════════════════════════════
// ORCHARD — fruit trees in grid
// ════════════════════════════════════════════════

function buildOrchard(g) {
  const ox = 2, oz = 2;
  // mcp:orchard (2,2) 18×11 — 4×3 grid of fruit trees

  const treePositions = [
    [1.5, 1], [5.5, 1], [9.5, 1], [13.5, 1],
    [1.5, 4.5], [5.5, 4.5], [9.5, 4.5], [13.5, 4.5],
    [1.5, 8], [5.5, 8], [9.5, 8], [13.5, 8],
  ];

  for (let i = 0; i < treePositions.length; i++) {
    const [tx, tz] = treePositions[i];
    const height = 3 + Math.random() * 1.5;
    const canopyR = 1.2 + Math.random() * 0.4;
    addFruitTree(g, ox + tx + 1.5, oz + tz + 1.5, height, canopyR);
  }
}

// ════════════════════════════════════════════════
// WILDFLOWER MEADOW
// ════════════════════════════════════════════════

function buildWildflowerMeadow(g) {
  const mx = 22, mz = 1.5;
  // mcp:wildflower_meadow (22,1.5) 10×6.5

  const wildflowers = [flowerRose, flowerYellow, flowerBlue, flowerPurple, flowerWhite, flowerOrange, flowerPink];

  // Scatter wildflowers
  for (let i = 0; i < 60; i++) {
    const fx = mx + 0.5 + Math.random() * 9;
    const fz = mz + 0.5 + Math.random() * 5.5;
    const h = 0.3 + Math.random() * 0.5;
    const ci = Math.floor(Math.random() * wildflowers.length);
    // Stem
    g.add(p(box(0.02, h, 0.02, plantGreen), fx, h / 2, fz));
    // Flower head
    g.add(p(sphere(0.08 + Math.random() * 0.06, wildflowers[ci]), fx, h + 0.05, fz));
  }

  // Tall grasses
  for (let i = 0; i < 20; i++) {
    const gx = mx + 6 + Math.random() * 4;
    const gz = mz + 3.5 + Math.random() * 3;
    const h = 0.5 + Math.random() * 0.5;
    g.add(p(box(0.05, h, 0.05, grassMeadow), gx, h / 2, gz));
    g.add(p(sphere(0.08, grassMeadow), gx, h + 0.05, gz));
  }
}

// ════════════════════════════════════════════════
// GREENHOUSE — glass structure
// ════════════════════════════════════════════════

function buildGreenhouse(g) {
  const gx = 44, gz = 40;
  // mcp:greenhouse (44,40) 8×4

  const wallH = 2.5;

  // Glass walls
  wallWithOpenings(g, { axis: 'x', x: gx, z: gz, length: 8, height: wallH, thickness: 0.08, material: glassMat,
    openings: [{ start: 3, end: 5, top: 2.1 }] }); // front door
  g.add(p(box(8, wallH, 0.08, glassMat), gx + 4, wallH / 2, gz + 4));    // back
  g.add(p(box(0.08, wallH, 4, glassMat), gx, wallH / 2, gz + 2));        // left
  g.add(p(box(0.08, wallH, 4, glassMat), gx + 8, wallH / 2, gz + 2));    // right

  // White frame structure
  // Corners
  for (const [cx, cz] of [[0, 0], [8, 0], [0, 4], [8, 4]]) {
    g.add(p(box(0.06, wallH, 0.06, glassFrame), gx + cx, wallH / 2, gz + cz));
  }
  // Ridge beam
  g.add(p(box(8, 0.06, 0.06, glassFrame), gx + 4, wallH + 0.5, gz + 2));
  // Roof glass (two slopes)
  const roofL = plane(8, 2.3, glassMat);
  roofL.rotation.x = -Math.PI / 2 + 0.25;
  roofL.position.set(gx + 4, wallH + 0.25, gz + 1);
  g.add(roofL);
  const roofR = plane(8, 2.3, glassMat);
  roofR.rotation.x = -Math.PI / 2 - 0.25;
  roofR.position.set(gx + 4, wallH + 0.25, gz + 3);
  g.add(roofR);

  // Floor
  g.add(p(box(8, 0.05, 4, brick), gx + 4, 0.025, gz + 2));

  // mcp:staging_bench_l (44.3,40.5) 0.8×3
  g.add(p(box(0.8, 0.8, 3, woodLight), gx + 0.7, 0.4, gz + 2));
  // mcp:staging_bench_r (50.9,40.5) 0.8×3
  g.add(p(box(0.8, 0.8, 3, woodLight), gx + 7.3, 0.4, gz + 2));
  // mcp:potting_area (46,43) 4×1
  g.add(p(box(4, 0.8, 1, woodLight), gx + 4, 0.4, gz + 3.5));
  // mcp:citrus_trees (46,40.5) 4×1.5 — potted citrus
  for (let i = 0; i < 3; i++) {
    const cx = gx + 2.5 + i * 1.5;
    g.add(p(cyl(0.25, 0.3, stoneLight), cx, 0.15, gz + 1.25)); // pot
    g.add(p(box(0.05, 0.8, 0.05, treeTrunk), cx, 0.6, gz + 1.25));
    g.add(p(sphere(0.35, treeCanopyLight), cx, 1.2, gz + 1.25));
  }

  // Door
  addDoor(g, { axis: 'x', x: gx, z: gz, at: 4, width: 1.8, doorHeight: 2.1, material: glassFrame });
}

// ════════════════════════════════════════════════
// GARDEN SHED
// ════════════════════════════════════════════════

function buildGardenShed(g) {
  const sx = 54, sz = 44;
  // mcp:garden_shed (54,44) 4×3

  const wallH = 2.3;

  // Walls
  wallWithOpenings(g, { axis: 'x', x: sx, z: sz, length: 4, height: wallH, material: woodDark,
    openings: [{ start: 1, end: 2.2, top: 2 }] }); // door
  g.add(p(box(4, wallH, 0.15, woodDark), sx + 2, wallH / 2, sz + 3));
  g.add(p(box(0.15, wallH, 3, woodDark), sx, wallH / 2, sz + 1.5));
  g.add(p(box(0.15, wallH, 3, woodDark), sx + 4, wallH / 2, sz + 1.5));

  // Roof
  g.add(p(box(4.4, 0.1, 3.4, roofTile), sx + 2, wallH + 0.4, sz + 1.5));
  // Pitched roof
  g.add(p(box(4.4, 0.08, 1.8, roofTile), sx + 2, wallH + 0.15, sz + 0.8));
  const roofP = box(4.4, 0.08, 1.8, roofTile);
  roofP.position.set(sx + 2, wallH + 0.15, sz + 2.2);
  g.add(roofP);

  // Door
  addDoor(g, { axis: 'x', x: sx, z: sz, at: 1.6, width: 1.1, doorHeight: 2, material: woodDark });

  // Floor
  g.add(p(box(4, 0.05, 3, stone), sx + 2, 0.025, sz + 1.5));
}

// ════════════════════════════════════════════════
// GAZEBO — octagonal, with roof
// ════════════════════════════════════════════════

function buildGazebo(g) {
  const gx = 0, gz = 20;
  // mcp:gazebo (0,20) 4×4

  const cx = gx + 2, cz = gz + 2;

  // Floor platform
  g.add(p(cyl(2.2, 0.15, woodLight, 8), cx, 0.15, cz));

  // 8 pillars
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const px2 = cx + Math.cos(angle) * 1.8;
    const pz2 = cz + Math.sin(angle) * 1.8;
    g.add(p(box(0.12, 2.5, 0.12, wood), px2, 1.4, pz2));
  }

  // Roof — cone
  g.add(p(cone(2.5, 1.5, roofTile, 8), cx, 3.4, cz));

  // Ridge finial
  g.add(p(sphere(0.1, iron), cx, 4.2, cz));

  // mcp:gazebo_bench_1 (0.3,20.3) 3.4×0.5
  g.add(p(box(3, 0.05, 0.4, wood), cx, 0.5, gz + 0.8));
  g.add(p(box(3, 0.4, 0.05, wood), cx, 0.7, gz + 0.6));
  // mcp:gazebo_bench_2 (0.3,23.2) 3.4×0.5
  g.add(p(box(3, 0.05, 0.4, wood), cx, 0.5, gz + 3.2));
  g.add(p(box(3, 0.4, 0.05, wood), cx, 0.7, gz + 3.4));

  // mcp:gazebo_table (1.3,21.3) 1.4×1.4
  g.add(p(cyl(0.6, 0.05, woodDark, 12), cx, 0.65, cz));
  g.add(p(cyl(0.08, 0.6, woodDark), cx, 0.35, cz));
}

// ════════════════════════════════════════════════
// BENCHES — scattered around garden
// ════════════════════════════════════════════════

function buildBenches(g) {
  // mcp:bench_lawn_w (5.5,18) 1.5×0.5
  addBench(g, 6.25, 18.25);
  // mcp:bench_lawn_e (27,18) 1.5×0.5
  addBench(g, 27.75, 18.25);
  // mcp:bench_rose_s (19,36) 1.5×0.5
  addBench(g, 19.75, 36.25);
  // mcp:bench_orchard (8,5) 1.5×0.5
  addBench(g, 8.75, 5.25);
  // mcp:bench_ha_ha (28,1.5) 1.5×0.5
  addBench(g, 28.75, 1.75);
}

function addBench(g, x, z) {
  // Seat
  g.add(p(box(1.5, 0.05, 0.45, wood), x, 0.45, z));
  // Legs
  for (const dx of [-0.55, 0.55]) {
    g.add(p(box(0.06, 0.4, 0.4, iron), x + dx, 0.22, z));
  }
  // Back
  g.add(p(box(1.5, 0.5, 0.04, wood), x, 0.7, z - 0.2));
}

// ════════════════════════════════════════════════
// BIRD BATH
// ════════════════════════════════════════════════

function buildBirdBath(g) {
  // mcp:bird_bath (15,16) 0.8×0.8
  const bx = 15.4, bz = 16.4;
  g.add(p(cyl(0.15, 0.7, stoneFeature), bx, 0.35, bz));
  g.add(p(cyl(0.35, 0.1, stoneFeature, 12), bx, 0.75, bz));
  g.add(p(cyl(0.3, 0.03, water, 12), bx, 0.78, bz));
}

// ════════════════════════════════════════════════
// ARCHES — rose arch, pergola arches, terrace arch
// ════════════════════════════════════════════════

function buildArches(g) {
  // mcp:arch_rose_entry (19.3,23.5) 1.5×0.5
  addArch(g, 20.05, 23.75, 'z', flowerRose);

  // mcp:arch_pergola_w (30,10) 1.5×0.5
  addArch(g, 30.75, 10.25, 'z', flowerPurple);

  // mcp:arch_pergola_e (38.5,10) 1.5×0.5
  addArch(g, 39.25, 10.25, 'z', flowerPurple);

  // mcp:arch_terrace (17,43) 1.5×0.5
  addArch(g, 17.75, 43.25, 'z', flowerRose);
}

function addArch(g, x, z, axis, flowerMat) {
  const h = 2.4, w = 1.4;
  // Two pillars
  g.add(p(box(0.08, h, 0.08, iron), x - w / 2, h / 2, z));
  g.add(p(box(0.08, h, 0.08, iron), x + w / 2, h / 2, z));
  // Arch top (simplified as box)
  g.add(p(box(w + 0.08, 0.08, 0.08, iron), x, h, z));
  g.add(p(box(w + 0.08, 0.08, 0.08, iron), x, h - 0.3, z));
  // Cross bars
  g.add(p(box(0.08, 0.08, 0.08, iron), x, h - 0.15, z));
  // Climbing flowers
  g.add(p(sphere(0.25, plantGreen), x - w / 2, h * 0.6, z));
  g.add(p(sphere(0.25, plantGreen), x + w / 2, h * 0.6, z));
  g.add(p(sphere(0.2, flowerMat), x - w / 2 + 0.1, h * 0.8, z));
  g.add(p(sphere(0.2, flowerMat), x + w / 2 - 0.1, h * 0.8, z));
  g.add(p(sphere(0.3, plantGreen), x, h + 0.1, z));
  g.add(p(sphere(0.18, flowerMat), x + 0.15, h + 0.15, z));
}

// ════════════════════════════════════════════════
// GATES
// ════════════════════════════════════════════════

function buildGates(g) {
  // mcp:gate_kitchen (44,21.5) 1.2×0.5
  g.add(p(box(1.2, 1.8, 0.06, ironGate), 44.6, 0.9, 21.75));
  // Gate posts
  g.add(p(box(0.15, 2.2, 0.15, brickWall), 44, 1.1, 21.75));
  g.add(p(box(0.15, 2.2, 0.15, brickWall), 45.2, 1.1, 21.75));
  // Post caps
  g.add(p(box(0.2, 0.1, 0.2, stoneLight), 44, 2.25, 21.75));
  g.add(p(box(0.2, 0.1, 0.2, stoneLight), 45.2, 2.25, 21.75));

  // mcp:gate_orchard (10,13) 1.2×0.3
  g.add(p(box(1.2, 1.2, 0.06, wood), 10.6, 0.6, 13.15));
  // Gate posts
  g.add(p(box(0.12, 1.4, 0.12, wood), 10, 0.7, 13.15));
  g.add(p(box(0.12, 1.4, 0.12, wood), 11.2, 0.7, 13.15));
}

// ════════════════════════════════════════════════
// BEEHIVES
// ════════════════════════════════════════════════

function buildBeehives(g) {
  // mcp:beehive_1,2,3 at (1,14), (2,14), (3,14)
  for (let i = 0; i < 3; i++) {
    const bx = 1.4 + i * 1;
    const bz = 14.25;
    // Base
    g.add(p(box(0.5, 0.1, 0.5, woodLight), bx, 0.3, bz));
    // Hive body (stacked boxes)
    g.add(p(box(0.45, 0.2, 0.45, woodLight), bx, 0.45, bz));
    g.add(p(box(0.45, 0.2, 0.45, woodLight), bx, 0.65, bz));
    // Roof
    g.add(p(box(0.55, 0.06, 0.55, iron), bx, 0.78, bz));
    // Stand legs
    g.add(p(box(0.04, 0.2, 0.04, wood), bx - 0.2, 0.1, bz - 0.2));
    g.add(p(box(0.04, 0.2, 0.04, wood), bx + 0.2, 0.1, bz - 0.2));
    g.add(p(box(0.04, 0.2, 0.04, wood), bx - 0.2, 0.1, bz + 0.2));
    g.add(p(box(0.04, 0.2, 0.04, wood), bx + 0.2, 0.1, bz + 0.2));
  }
}

// ════════════════════════════════════════════════
// SPECIMEN TREES — scattered around garden
// ════════════════════════════════════════════════

function buildSpecimenTrees(g) {
  // mcp:oak_tree (0,28) 4×4
  addTree(g, 2, 30, 8, 3, treeTrunk, treeCanopy);

  // mcp:copper_beech (48,2) 4×4
  addTree(g, 50, 4, 7, 3, treeTrunk, treeCanopyCopper);

  // mcp:silver_birch_1 (46,10) 3×3 — group of 3 birches
  const birchTrunk = new THREE.MeshLambertMaterial({ color: 0xddddcc, side: DS });
  addTree(g, 47, 11, 5, 1.5, birchTrunk, treeCanopyLight);
  addTree(g, 48, 11.5, 4.5, 1.3, birchTrunk, treeCanopyLight);
  addTree(g, 47.5, 12, 4, 1.2, birchTrunk, treeCanopyLight);

  // mcp:magnolia (36,42) 3×3
  addTree(g, 37.5, 43.5, 4, 2, treeTrunk, flowerPink);

  // mcp:holly_tree (56,10) 2.5×2.5
  addTree(g, 57.25, 11.25, 4, 1.5, treeTrunk, treeCanopyHolly);
}

// ════════════════════════════════════════════════
// TREE HELPERS
// ════════════════════════════════════════════════

function addTree(g, x, z, height, canopyR, trunkMat, canopyMat) {
  // Trunk
  const trunkH = height * 0.45;
  g.add(p(cyl(0.15 + canopyR * 0.05, trunkH, trunkMat), x, trunkH / 2, z));
  // Main canopy
  g.add(p(sphere(canopyR, canopyMat), x, trunkH + canopyR * 0.6, z));
  // Secondary canopy clusters
  g.add(p(sphere(canopyR * 0.6, canopyMat), x + canopyR * 0.4, trunkH + canopyR * 0.3, z));
  g.add(p(sphere(canopyR * 0.5, canopyMat), x - canopyR * 0.3, trunkH + canopyR * 0.4, z + canopyR * 0.3));
}

function addFruitTree(g, x, z, height, canopyR) {
  const trunkH = height * 0.4;
  g.add(p(cyl(0.08, trunkH, treeTrunk), x, trunkH / 2, z));
  // Canopy
  g.add(p(sphere(canopyR, treeCanopy), x, trunkH + canopyR * 0.5, z));
  g.add(p(sphere(canopyR * 0.7, treeCanopyLight), x + canopyR * 0.3, trunkH + canopyR * 0.2, z - canopyR * 0.2));
  // A few fruits
  for (let i = 0; i < 3; i++) {
    const angle = i * 2.1;
    g.add(p(sphere(0.06, flowerRose),
      x + Math.cos(angle) * canopyR * 0.5,
      trunkH + canopyR * 0.1 + Math.random() * canopyR * 0.3,
      z + Math.sin(angle) * canopyR * 0.5));
  }
}

function addCedar(g, x, z) {
  // Cedar of Lebanon — wide, flat canopy
  const trunkH = 3;
  g.add(p(cyl(0.3, trunkH, treeTrunk), x, trunkH / 2, z));
  // Main branches — horizontal spread
  for (let layer = 0; layer < 4; layer++) {
    const ly = trunkH + layer * 0.8;
    const r = 3.5 - layer * 0.5;
    g.add(p(cyl(r, 0.4, hedgeYew, 12), x, ly, z));
  }
  // Top
  g.add(p(cone(1, 1.5, hedgeYew), x, trunkH + 3.8, z));
}

function addWeepingWillow(g, x, z) {
  const trunkH = 3;
  g.add(p(cyl(0.2, trunkH, treeTrunk), x, trunkH / 2, z));
  // Canopy dome
  g.add(p(sphere(2, treeCanopyWillow), x, trunkH + 1, z));
  // Hanging branches (vertical strands)
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const br = 1.5 + Math.random() * 0.5;
    const bx = x + Math.cos(angle) * br;
    const bz2 = z + Math.sin(angle) * br;
    g.add(p(box(0.03, 2.5, 0.03, treeCanopyWillow), bx, 2, bz2));
  }
}
