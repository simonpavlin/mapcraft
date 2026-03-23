import * as THREE from 'three';
import { box, plane } from './building-utils.js';

const DS = THREE.DoubleSide;

// ════════════════════════════════════════════════
// MATERIALS
// ════════════════════════════════════════════════

const wallMat = new THREE.MeshLambertMaterial({ color: 0xd0c8b8, side: DS });
const floorMat = new THREE.MeshLambertMaterial({ color: 0x999999, side: DS });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0xc8c0b0, side: DS });
const metalShelf = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const metalFrame = new THREE.MeshLambertMaterial({ color: 0x666666, side: DS });
const railMat = new THREE.MeshLambertMaterial({ color: 0x777777, side: DS });
const cartMat = new THREE.MeshLambertMaterial({ color: 0x4466aa, side: DS });
const doorMat = new THREE.MeshLambertMaterial({ color: 0x8a6a3a, side: DS });
const doorFrameMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a, side: DS });
const boxCardboard = new THREE.MeshLambertMaterial({ color: 0xc8a050, side: DS });
const boxLabel = new THREE.MeshLambertMaterial({ color: 0x228822, side: DS });
const labelMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: DS });
const ropeMat = new THREE.MeshLambertMaterial({ color: 0x886644, side: DS });
const netMat = new THREE.MeshLambertMaterial({ color: 0x667766, side: DS });
const poleMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const bearingMat = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const platformMat = new THREE.MeshLambertMaterial({ color: 0x777799, side: DS });
const cleatMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const bulbMat = new THREE.MeshLambertMaterial({ color: 0xffffaa, emissive: 0xffff66, emissiveIntensity: 0.8, side: DS });
const wireMat = new THREE.MeshLambertMaterial({ color: 0x222222, side: DS });
const ladderMat = new THREE.MeshLambertMaterial({ color: 0xaa8855, side: DS });
const jarMat = new THREE.MeshLambertMaterial({ color: 0x88aa44, side: DS });
const canMat = new THREE.MeshLambertMaterial({ color: 0xcc4444, side: DS });
const trayLipMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const wheelMat = new THREE.MeshLambertMaterial({ color: 0x333333, side: DS });
const handleMat = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const pulleyMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const shelfWoodMat = new THREE.MeshLambertMaterial({ color: 0xb89060, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// ─── Banana box: 60×40×30 cm (yellow cardboard with green label) ───
function addBananaBox(g, x, y, z, rotated = false) {
  const w = rotated ? 0.4 : 0.6;
  const d = rotated ? 0.6 : 0.4;
  g.add(p(box(w, 0.28, d, boxCardboard), x + w / 2, y + 0.14, z + d / 2));
  g.add(p(box(w * 0.6, 0.12, 0.01, boxLabel), x + w / 2, y + 0.14, z + 0.01));
}

// ─── Small item on top of a box ───
function addSmallItem(g, x, y, z, type) {
  if (type === 'jar') {
    const geo = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8);
    const jar = new THREE.Mesh(geo, jarMat);
    jar.position.set(x, y + 0.04, z);
    g.add(jar);
  } else if (type === 'can') {
    const geo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8);
    const can = new THREE.Mesh(geo, canMat);
    can.position.set(x, y + 0.03, z);
    g.add(can);
  }
}

// ─── Light bulb hanging from ceiling ───
function addLightBulb(g, cx, cz) {
  // Wire
  g.add(p(box(0.005, 0.3, 0.005, wireMat), cx, 2.85, cz));
  // Bulb
  const bulbGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(cx, 2.66, cz);
  g.add(bulb);
}

// ─── Label above each variant ───
function addLabel(g, ox, text) {
  g.add(p(box(1, 0.3, 0.02, labelMat), ox + 0.5, 3.35, 1.3));
}

// ─── Ceiling plane ───
function addCeiling(g, ox) {
  g.add(p(box(1, 0.02, 2.6, ceilingMat), ox + 0.5, 2.99, 1.3));
}

// ─── Closet shell: 3 walls + floor + ceiling + door frame ───
function addClosetShell(g, ox, showDoor = false) {
  const W = 1.0, D = 2.6, H = 3.0;
  const T = 0.08; // wall thickness

  // Left wall
  g.add(p(box(T, H, D, wallMat), ox + T / 2, H / 2, D / 2));
  // Right wall
  g.add(p(box(T, H, D, wallMat), ox + W - T / 2, H / 2, D / 2));
  // Back wall
  g.add(p(box(W, H, T, wallMat), ox + W / 2, H / 2, D - T / 2));
  // Floor
  g.add(p(box(W, 0.02, D, floorMat), ox + W / 2, 0.01, D / 2));
  // Ceiling
  addCeiling(g, ox);

  // Door frame at front (z=0): 80cm wide × 190cm tall opening
  // Centered in 1m width: from x=0.10 to x=0.90
  const doorW = 0.80;
  const doorH = 1.90;
  const frameW = 0.06;
  const postLeft = ox + (W - doorW) / 2;
  const postRight = ox + (W + doorW) / 2;

  // Left post
  g.add(p(box(frameW, H, frameW, doorFrameMat), postLeft - frameW / 2, H / 2, frameW / 2));
  // Right post
  g.add(p(box(frameW, H, frameW, doorFrameMat), postRight + frameW / 2, H / 2, frameW / 2));
  // Lintel
  g.add(p(box(doorW + frameW * 2, frameW, frameW, doorFrameMat),
    ox + W / 2, doorH + frameW / 2, frameW / 2));

  // Show door (half open) if requested
  if (showDoor) {
    const doorGroup = new THREE.Group();
    const doorPanel = box(doorW, doorH, 0.04, doorMat);
    doorPanel.position.set(doorW / 2, doorH / 2, 0);
    doorGroup.add(doorPanel);
    // Pivot at hinge (left side of door opening)
    doorGroup.position.set(postLeft, 0, 0);
    doorGroup.rotation.y = -Math.PI / 4; // 45 degrees open
    g.add(doorGroup);
  }

  // Light bulb
  addLightBulb(g, ox + 0.5, 1.3);
}

// ═══════════════════════════════════════════════
// Variant A — Simple shelves one side (x=0)
// ═══════════════════════════════════════════════
function buildVariantA(g, ox) {
  addClosetShell(g, ox, true); // show door on this one
  addLabel(g, ox, 'A: Jednoduché police');

  const shelfW = 0.40;
  const shelfHeights = [0.02, 0.40, 0.78, 1.16, 1.54, 1.92, 2.30];

  // 7 metal shelves on left wall (x=ox+0.08 .. ox+0.08+0.40)
  const shelfX = ox + 0.08; // just inside left wall
  for (const sy of shelfHeights) {
    g.add(p(box(shelfW, 0.025, 2.4, metalShelf),
      shelfX + shelfW / 2, sy + 0.0125, 0.1 + 2.4 / 2));
  }

  // 3 vertical support posts (metal angle iron) at z=0.1, z=1.3, z=2.5
  const postZs = [0.1, 1.3, 2.5];
  for (const pz of postZs) {
    // Front angle
    g.add(p(box(0.025, 2.8, 0.025, metalFrame), shelfX + 0.0125, 1.4, pz));
    // Back angle
    g.add(p(box(0.025, 2.8, 0.025, metalFrame), shelfX + shelfW - 0.0125, 1.4, pz));
  }

  // Banana boxes: variable fill — some shelves 3, some 2, some 1
  const boxCounts = [3, 2, 3, 3, 2, 1, 2];
  for (let si = 0; si < shelfHeights.length; si++) {
    const sy = shelfHeights[si] + 0.025;
    const count = boxCounts[si];
    for (let bi = 0; bi < count; bi++) {
      addBananaBox(g, shelfX, sy, 0.1 + bi * 0.62, true); // rotated: 40cm x, 60cm z
    }
    // Small items on top of some boxes
    if (si === 1 && count > 0) addSmallItem(g, shelfX + 0.2, sy + 0.28, 0.4, 'jar');
    if (si === 4 && count > 0) addSmallItem(g, shelfX + 0.15, sy + 0.28, 0.3, 'can');
  }
}

// ═══════════════════════════════════════════════
// Variant B — Slide-out individual shelves 75cm (x=3)
// ═══════════════════════════════════════════════
function buildVariantB(g, ox) {
  addClosetShell(g, ox, false);
  addLabel(g, ox, 'B: Výsuvné police 75cm');

  const trayW = 0.75;
  const trayD = 2.4; // depth of each tray
  const trayHeights = [0.02, 0.40, 0.78, 1.16, 1.54, 1.92, 2.30];
  const pulledOutIndex = 2; // tray index 2 pulled out halfway

  const trayX = ox + 0.08; // left wall thickness offset

  for (let ti = 0; ti < trayHeights.length; ti++) {
    const ty = trayHeights[ti];
    const pullOut = (ti === pulledOutIndex) ? -1.3 : 0; // extends 1.3m past door
    const trayZ = 0.1 + trayD / 2 + pullOut;

    // Tray base
    g.add(p(box(trayW, 0.02, trayD, metalShelf),
      trayX + trayW / 2, ty + 0.01, trayZ));

    // Raised lips on tray (front, back, sides)
    const lipH = 0.04;
    // Left lip
    g.add(p(box(0.015, lipH, trayD, trayLipMat),
      trayX + 0.0075, ty + 0.02 + lipH / 2, trayZ));
    // Right lip
    g.add(p(box(0.015, lipH, trayD, trayLipMat),
      trayX + trayW - 0.0075, ty + 0.02 + lipH / 2, trayZ));
    // Front lip
    g.add(p(box(trayW, lipH, 0.015, trayLipMat),
      trayX + trayW / 2, ty + 0.02 + lipH / 2, trayZ - trayD / 2 + 0.0075));
    // Back lip
    g.add(p(box(trayW, lipH, 0.015, trayLipMat),
      trayX + trayW / 2, ty + 0.02 + lipH / 2, trayZ + trayD / 2 - 0.0075));

    // Banana boxes on tray: 3 along depth (every ~80cm)
    const boxCountsB = [3, 2, 3, 3, 2, 1, 3];
    const count = boxCountsB[ti];
    for (let bi = 0; bi < count; bi++) {
      addBananaBox(g, trayX + 0.02, ty + 0.02,
        0.1 + bi * 0.75 + pullOut, false); // 60cm wide along x
    }
    // Small items
    if (ti === 0) addSmallItem(g, trayX + 0.35, ty + 0.02 + 0.28, 0.5 + pullOut, 'can');
    if (ti === 3) addSmallItem(g, trayX + 0.4, ty + 0.02 + 0.28, 0.9, 'jar');
  }

  // Rail guides on both walls (thin metal strips at each tray height)
  for (const ty of trayHeights) {
    // Left wall rail
    g.add(p(box(0.01, 0.03, 2.5, metalFrame),
      ox + 0.085, ty + 0.005, 1.35));
    // Right wall rail
    g.add(p(box(0.01, 0.03, 2.5, metalFrame),
      ox + 0.08 + trayW + 0.005, ty + 0.005, 1.35));
  }
}

// ═══════════════════════════════════════════════
// Variant C — Rolling cart 75cm + fixed rear shelving (x=6)
// ═══════════════════════════════════════════════
function buildVariantC(g, ox) {
  addClosetShell(g, ox, false);
  addLabel(g, ox, 'C: Vozík + police');

  // ── Floor rails ──
  g.add(p(box(0.03, 0.015, 1.2, railMat), ox + 0.2, 0.02 + 0.0075, 0.6));
  g.add(p(box(0.03, 0.015, 1.2, railMat), ox + 0.8, 0.02 + 0.0075, 0.6));

  // ── Rolling cart: 75cm wide, 60cm deep, 150cm tall ──
  // Pulled out 40cm (partially outside door)
  const cartZ = -0.40;
  const cartW = 0.75, cartD = 0.60, cartH = 1.50;
  const cartX = ox + 0.125; // centered in 1m width

  // Cart frame — 4 vertical posts
  const postPositions = [
    [cartX + 0.015, cartZ + 0.015],
    [cartX + cartW - 0.015, cartZ + 0.015],
    [cartX + 0.015, cartZ + cartD - 0.015],
    [cartX + cartW - 0.015, cartZ + cartD - 0.015],
  ];
  for (const [px, pz] of postPositions) {
    g.add(p(box(0.025, cartH, 0.025, metalFrame), px, cartH / 2, pz));
  }

  // Cart shelves — 4 levels
  const cartShelfHeights = [0.06, 0.42, 0.78, 1.14];
  for (const csy of cartShelfHeights) {
    g.add(p(box(cartW - 0.04, 0.02, cartD - 0.04, metalShelf),
      cartX + cartW / 2, csy + 0.01, cartZ + cartD / 2));
  }

  // Cart wheels (4)
  const wheelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8);
  for (const wx of [cartX + 0.06, cartX + cartW - 0.06]) {
    for (const wz of [cartZ + 0.06, cartZ + cartD - 0.06]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, 0.03, wz);
      g.add(wheel);
    }
  }

  // Cart handle at front
  g.add(p(box(cartW - 0.1, 0.025, 0.025, handleMat),
    cartX + cartW / 2, cartH + 0.1, cartZ + 0.015));
  // Handle uprights
  g.add(p(box(0.025, 0.25, 0.025, handleMat),
    cartX + 0.06, cartH - 0.02, cartZ + 0.015));
  g.add(p(box(0.025, 0.25, 0.025, handleMat),
    cartX + cartW - 0.06, cartH - 0.02, cartZ + 0.015));

  // Banana boxes on cart — 2 per shelf = 8 total (some variation)
  const cartBoxCounts = [2, 2, 2, 2];
  for (let si = 0; si < cartShelfHeights.length; si++) {
    const sy = cartShelfHeights[si] + 0.02;
    const count = cartBoxCounts[si];
    for (let bi = 0; bi < count; bi++) {
      addBananaBox(g, cartX + 0.04 + bi * 0.35, sy, cartZ + 0.05, true); // rotated: 40x, 60z... but cart depth only 60cm
    }
    if (si === 1) addSmallItem(g, cartX + 0.35, sy + 0.28, cartZ + 0.3, 'can');
  }

  // ── Fixed rear shelving (z=0.8 to z=2.55) ──
  const rearZStart = 0.80;
  const rearZEnd = 2.55;
  const rearD = rearZEnd - rearZStart;
  const rearW = 0.75;
  const rearX = ox + 0.125;
  const rearShelfHeights = [0.02, 0.40, 0.78, 1.16, 1.54, 1.92, 2.30];

  // Vertical supports
  g.add(p(box(0.025, 2.8, 0.025, metalFrame), rearX + 0.0125, 1.4, rearZStart));
  g.add(p(box(0.025, 2.8, 0.025, metalFrame), rearX + rearW - 0.0125, 1.4, rearZStart));
  g.add(p(box(0.025, 2.8, 0.025, metalFrame), rearX + 0.0125, 1.4, rearZEnd));
  g.add(p(box(0.025, 2.8, 0.025, metalFrame), rearX + rearW - 0.0125, 1.4, rearZEnd));

  for (const rsy of rearShelfHeights) {
    g.add(p(box(rearW - 0.03, 0.02, rearD, metalShelf),
      rearX + rearW / 2, rsy + 0.01, rearZStart + rearD / 2));
  }

  // Boxes on rear shelves — 2 per shelf along depth
  const rearBoxCounts = [2, 2, 2, 2, 1, 1, 1];
  for (let si = 0; si < rearShelfHeights.length; si++) {
    const sy = rearShelfHeights[si] + 0.02;
    const count = rearBoxCounts[si];
    for (let bi = 0; bi < count; bi++) {
      addBananaBox(g, rearX + 0.04, sy, rearZStart + 0.05 + bi * 0.75, false);
    }
    if (si === 2) addSmallItem(g, rearX + 0.35, sy + 0.28, rearZStart + 0.3, 'jar');
  }

  // ── Folding stepladder stored flat behind door (against left wall) ──
  // Thin profile leaning against wall
  g.add(p(box(0.04, 1.4, 0.12, ladderMat), ox + 0.10, 0.72, 0.15));
}

// ═══════════════════════════════════════════════
// Variant D — Lazy Susan rotating shelves (x=9)
// ═══════════════════════════════════════════════
function buildVariantD(g, ox) {
  addClosetShell(g, ox, false);
  addLabel(g, ox, 'D: Otočné police (Lazy Susan)');

  const centerX = ox + 0.5;
  const centerZ = 1.3;

  // Central pole (floor to ceiling)
  const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 3.0, 12);
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(centerX, 1.5, centerZ);
  g.add(pole);

  // 6 circular platforms
  const platformHeights = [0.05, 0.50, 0.95, 1.40, 1.85, 2.30];
  const platformRadius = 0.44; // diameter ~88cm, fits in 100cm width
  const rotationAngles = [0, Math.PI / 6, -Math.PI / 4, Math.PI / 3, -Math.PI / 6, Math.PI / 5];
  const boxCountsD = [3, 2, 3, 2, 2, 1];

  for (let pi = 0; pi < platformHeights.length; pi++) {
    const py = platformHeights[pi];
    const angle = rotationAngles[pi];

    // Platform disc
    const discGeo = new THREE.CylinderGeometry(platformRadius, platformRadius, 0.025, 24);
    const disc = new THREE.Mesh(discGeo, platformMat);
    disc.position.set(centerX, py + 0.0125, centerZ);
    g.add(disc);

    // Bearing ring (smaller cylinder below platform)
    const bearGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12);
    const bearing = new THREE.Mesh(bearGeo, bearingMat);
    bearing.position.set(centerX, py - 0.01, centerZ);
    g.add(bearing);

    // Banana boxes arranged radially on the platform
    const count = boxCountsD[pi];
    const boxGroup = new THREE.Group();
    boxGroup.position.set(centerX, 0, centerZ);
    boxGroup.rotation.y = angle;

    for (let bi = 0; bi < count; bi++) {
      // Place boxes around center — offset from center radially
      const bAngle = (bi / count) * Math.PI * 2;
      const bRadius = 0.18;
      const bx = Math.cos(bAngle) * bRadius - 0.2;
      const bz = Math.sin(bAngle) * bRadius - 0.2;
      addBananaBox(boxGroup, bx, py + 0.025, bz, true);
    }
    g.add(boxGroup);

    // Small items on some platforms
    if (pi === 0) {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(centerX, 0, centerZ);
      itemGroup.rotation.y = angle;
      addSmallItem(itemGroup, 0.15, py + 0.025 + 0.28, 0.1, 'jar');
      g.add(itemGroup);
    }
    if (pi === 3) {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(centerX, 0, centerZ);
      itemGroup.rotation.y = angle;
      addSmallItem(itemGroup, -0.1, py + 0.025 + 0.28, 0.15, 'can');
      g.add(itemGroup);
    }
  }
}

// ═══════════════════════════════════════════════
// Variant E — Ceiling-mounted pulley hooks (x=12)
// ═══════════════════════════════════════════════
function buildVariantE(g, ox) {
  addClosetShell(g, ox, false);
  addLabel(g, ox, 'E: Kladky na stropě');

  // ── Rear wall: fixed shallow shelves (30cm deep) from floor to 2m ──
  const shelfW = 0.84; // inside wall thickness
  const shelfD = 0.30;
  const shelfX = ox + 0.08;
  const shelfZStart = 2.6 - 0.08 - shelfD; // against back wall
  const rearShelfHeights = [0.02, 0.35, 0.68, 1.01, 1.34, 1.67];

  // Vertical supports for rear shelves
  g.add(p(box(0.02, 2.0, 0.02, metalFrame), shelfX + 0.01, 1.0, shelfZStart));
  g.add(p(box(0.02, 2.0, 0.02, metalFrame), shelfX + shelfW - 0.01, 1.0, shelfZStart));

  for (const sy of rearShelfHeights) {
    g.add(p(box(shelfW, 0.02, shelfD, shelfWoodMat),
      shelfX + shelfW / 2, sy + 0.01, shelfZStart + shelfD / 2));
  }

  // Some small items on rear shelves (jars, cans — not banana boxes)
  addSmallItem(g, shelfX + 0.15, rearShelfHeights[0] + 0.02, shelfZStart + 0.15, 'jar');
  addSmallItem(g, shelfX + 0.30, rearShelfHeights[0] + 0.02, shelfZStart + 0.15, 'can');
  addSmallItem(g, shelfX + 0.50, rearShelfHeights[1] + 0.02, shelfZStart + 0.15, 'jar');
  addSmallItem(g, shelfX + 0.20, rearShelfHeights[2] + 0.02, shelfZStart + 0.15, 'can');
  addSmallItem(g, shelfX + 0.60, rearShelfHeights[3] + 0.02, shelfZStart + 0.15, 'jar');

  // ── Ceiling beams (3 beams across width for mounting pulleys) ──
  const beamZs = [0.5, 1.1, 1.7];
  for (const bz of beamZs) {
    g.add(p(box(0.84, 0.06, 0.08, metalFrame), ox + 0.5, 2.95, bz));
  }

  // ── 3 rope pulleys ──
  const pulleyZs = [0.5, 1.1, 1.7];
  const platformYs = [0.02, 1.5, 2.5]; // floor, mid, near ceiling
  const platformW = 0.60, platformD = 0.40;
  const platformBoxCounts = [3, 2, 2]; // stacked boxes on each

  for (let pi = 0; pi < 3; pi++) {
    const pz = pulleyZs[pi];
    const py = platformYs[pi];
    const pulleyX = ox + 0.5;

    // Pulley wheel at ceiling
    const pulleyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
    const pulleyWheel = new THREE.Mesh(pulleyGeo, pulleyMat);
    pulleyWheel.rotation.z = Math.PI / 2;
    pulleyWheel.position.set(pulleyX, 2.92, pz);
    g.add(pulleyWheel);

    // Pulley bracket
    g.add(p(box(0.06, 0.04, 0.04, metalFrame), pulleyX, 2.94, pz));

    // Rope from ceiling down to platform (thin cylinder)
    const ropeLen = 2.92 - py - 0.02;
    const ropeGeo = new THREE.CylinderGeometry(0.008, 0.008, ropeLen, 6);
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.set(pulleyX, py + 0.02 + ropeLen / 2, pz);
    g.add(rope);

    // Rope going to wall (from pulley down to cleat)
    // Diagonal rope segment to wall cleat
    const cleatY = 1.2;
    const cleatX = ox + 0.92 - 0.08; // right wall inside face
    const diagLen = Math.sqrt((2.92 - cleatY) ** 2 + (cleatX - pulleyX) ** 2);
    const diagAngle = Math.atan2(cleatX - pulleyX, 2.92 - cleatY);
    const diagRope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, diagLen, 6),
      ropeMat
    );
    diagRope.position.set(
      (pulleyX + cleatX) / 2,
      (2.92 + cleatY) / 2,
      pz
    );
    diagRope.rotation.z = diagAngle;
    g.add(diagRope);

    // Cleat on right wall to tie off rope
    g.add(p(box(0.06, 0.03, 0.03, cleatMat), cleatX, cleatY, pz));
    g.add(p(box(0.02, 0.06, 0.02, cleatMat), cleatX, cleatY, pz)); // horn

    // Platform / net
    g.add(p(box(platformW, 0.015, platformD, netMat),
      pulleyX, py + 0.0075, pz));

    // Platform frame edges
    g.add(p(box(platformW, 0.03, 0.015, metalFrame),
      pulleyX, py + 0.015, pz - platformD / 2 + 0.0075));
    g.add(p(box(platformW, 0.03, 0.015, metalFrame),
      pulleyX, py + 0.015, pz + platformD / 2 - 0.0075));
    g.add(p(box(0.015, 0.03, platformD, metalFrame),
      pulleyX - platformW / 2 + 0.0075, py + 0.015, pz));
    g.add(p(box(0.015, 0.03, platformD, metalFrame),
      pulleyX + platformW / 2 - 0.0075, py + 0.015, pz));

    // Corner rope attachment points (4 thin ropes from platform corners to main rope)
    const cornerOffsets = [
      [-platformW / 2 + 0.02, -platformD / 2 + 0.02],
      [platformW / 2 - 0.02, -platformD / 2 + 0.02],
      [-platformW / 2 + 0.02, platformD / 2 - 0.02],
      [platformW / 2 - 0.02, platformD / 2 - 0.02],
    ];
    for (const [cox, coz] of cornerOffsets) {
      const thinRopeLen = 0.15;
      const thinRope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, thinRopeLen, 4),
        ropeMat
      );
      thinRope.position.set(pulleyX + cox * 0.3, py + 0.02 + thinRopeLen / 2, pz + coz * 0.3);
      g.add(thinRope);
    }

    // Banana boxes on platform
    const bCount = platformBoxCounts[pi];
    if (bCount >= 1) {
      addBananaBox(g, pulleyX - 0.3, py + 0.015, pz - 0.2, false);
    }
    if (bCount >= 2) {
      // Stack second on top of first
      addBananaBox(g, pulleyX - 0.3, py + 0.015 + 0.30, pz - 0.2, false);
    }
    if (bCount >= 3) {
      // Third stacked
      addBananaBox(g, pulleyX - 0.3, py + 0.015 + 0.60, pz - 0.2, false);
    }

    // Small items
    if (pi === 0) addSmallItem(g, pulleyX + 0.1, py + 0.015 + 0.28, pz, 'jar');
  }
}

// ═══════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════
export function createSklep(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();

  buildVariantA(g, 0);    // x=0
  buildVariantB(g, 3);    // x=3
  buildVariantC(g, 6);    // x=6
  buildVariantD(g, 9);    // x=9
  buildVariantE(g, 12);   // x=12

  g.position.set(cx, 0, cz);
  scene.add(g);
}
