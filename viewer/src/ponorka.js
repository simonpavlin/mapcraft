import * as THREE from 'three';
import { boxWithOpenings, MAT, box, plane } from './building-utils.js';

// Ponorka — 65m long, 8m diameter hull
// MCP x → 3D x (bow=0, stern=65), MCP y → 3D z (centerline at 4.5)
const DS = THREE.DoubleSide;

// Hull
const hullMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });
const hullInner = new THREE.MeshLambertMaterial({ color: 0x445566, side: THREE.BackSide });
const deckMat = new THREE.MeshLambertMaterial({ color: 0x556666, side: DS });
const bulkheadMat = new THREE.MeshLambertMaterial({ color: 0x667788, side: DS });

// Equipment
const metalMat = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const darkMetal = new THREE.MeshLambertMaterial({ color: 0x444455, side: DS });
const copper = new THREE.MeshLambertMaterial({ color: 0xb87333, side: DS });
const brassValve = new THREE.MeshLambertMaterial({ color: 0xc8a84e, side: DS });

// Torpedo
const torpedoMat = new THREE.MeshLambertMaterial({ color: 0x336633, side: DS });
const torpedoNose = new THREE.MeshLambertMaterial({ color: 0xcc4444, side: DS });

// Screens/indicators
const screenGreen = new THREE.MeshLambertMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.3, side: DS });
const screenAmber = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.2, side: DS });
const screenRed = new THREE.MeshLambertMaterial({ color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 0.2, side: DS });
const ledGreen = new THREE.MeshLambertMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 0.5, side: DS });
const ledRed = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5, side: DS });

// Furniture
const bunkMat = new THREE.MeshLambertMaterial({ color: 0x334455, side: DS });
const sheetMat = new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS });
const woodTable = new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS });
const whiteMat = new THREE.MeshLambertMaterial({ color: 0xdddddd, side: DS });
const batteryMat = new THREE.MeshLambertMaterial({ color: 0x222244, side: DS });
const batteryGlow = new THREE.MeshLambertMaterial({ color: 0x4444ff, emissive: 0x2222aa, emissiveIntensity: 0.15, side: DS });
const dieselMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const sailMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS });
const propMat = new THREE.MeshLambertMaterial({ color: 0xb87333, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createPonorka(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  buildOuterHull(g);
  buildSail(g);
  buildInternalDeck(g);
  buildBulkheads(g);
  buildOverheadLighting(g);
  buildCeilingPipes(g);

  // Compartments
  buildSonar(g);
  buildTorpedoRoom(g);
  buildForwardQuarters(g);
  buildControlCenter(g);
  buildOfficerQuarters(g);
  buildGalleyMess(g);
  buildBatteryRoom(g);
  buildEngineRoom(g);
  buildMotorRoom(g);
  buildStern(g);
  buildExternalFeatures(g);

  scene.add(g);
}

// ═══════════════════════════════════════════
// OUTER HULL
// ═══════════════════════════════════════════
function buildOuterHull(g) {
  const CL = 4.5; // centerline z
  const HC = 4;   // hull center y

  // Main pressure hull — cylinder x=5..58, length=53
  const hullGeo = new THREE.CylinderGeometry(4, 4, 53, 24, 1, true);
  hullGeo.rotateZ(Math.PI / 2);
  const hullOuter = new THREE.Mesh(hullGeo, hullMat);
  hullOuter.position.set(31.5, HC, CL);
  g.add(hullOuter);

  const hullInnerMesh = new THREE.Mesh(hullGeo.clone(), hullInner);
  hullInnerMesh.position.set(31.5, HC, CL);
  g.add(hullInnerMesh);

  // Bow hemisphere — x=0..5
  const bowGeo = new THREE.SphereGeometry(4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  bowGeo.rotateZ(Math.PI / 2); // face forward (toward -x)
  const bowOuter = new THREE.Mesh(bowGeo, hullMat);
  bowOuter.position.set(5, HC, CL);
  g.add(bowOuter);

  const bowInnerMesh = new THREE.Mesh(bowGeo.clone(), hullInner);
  bowInnerMesh.position.set(5, HC, CL);
  g.add(bowInnerMesh);

  // Stern cone — x=58..65
  const sternGeo = new THREE.ConeGeometry(4, 7, 24);
  sternGeo.rotateZ(-Math.PI / 2); // point aft (+x)
  const sternOuter = new THREE.Mesh(sternGeo, hullMat);
  sternOuter.position.set(61.5, HC, CL);
  g.add(sternOuter);

  const sternInnerMesh = new THREE.Mesh(sternGeo.clone(), hullInner);
  sternInnerMesh.position.set(61.5, HC, CL);
  g.add(sternInnerMesh);
}

// ═══════════════════════════════════════════
// SAIL (CONNING TOWER)
// ═══════════════════════════════════════════
function buildSail(g) {
  const CL = 4.5;
  // Sail: x=20..24, z centered on CL, rises from hull top (y=8) to y=14
  // Base sits at hull top y=8, 4m long, 2.5m wide, 6m tall
  const sailGeo = new THREE.BoxGeometry(4, 6, 2.5);
  g.add(p(new THREE.Mesh(sailGeo, sailMat), 22, 11, CL));

  // Inner sail walls
  const sailInnerMat = new THREE.MeshLambertMaterial({ color: 0x445566, side: THREE.BackSide });
  g.add(p(new THREE.Mesh(sailGeo.clone(), sailInnerMat), 22, 11, CL));

  // Sail top deck
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 2.5), darkMetal), 22, 14, CL));

  // Bridge windscreen
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 1.8), metalMat), 20, 13.5, CL));

  // Access hatch on top
  const hatchGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16);
  g.add(p(new THREE.Mesh(hatchGeo, metalMat), 22, 14.1, CL));
  // Hatch rim
  const hatchRim = new THREE.TorusGeometry(0.4, 0.05, 8, 16);
  hatchRim.rotateX(Math.PI / 2);
  g.add(p(new THREE.Mesh(hatchRim, metalMat), 22, 14.15, CL));

  // Periscope wells — two thin cylinders going through sail
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 9, 8), metalMat), 21.5, 9.5, CL));
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 9, 8), metalMat), 22.5, 9.5, CL));

  // Periscope heads (small cylinders on top)
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.08, 0.4, 8), metalMat), 21.5, 14.2, CL));
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.08, 0.4, 8), metalMat), 22.5, 14.2, CL));

  // Fairwater planes (horizontal fins on sides of sail)
  for (const side of [-1, 1]) {
    const planeGeo = new THREE.BoxGeometry(1.5, 0.1, 1.2);
    g.add(p(new THREE.Mesh(planeGeo, hullMat), 22, 9, CL + side * 2.2));
  }

  // Mast array on top of sail
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), metalMat), 23, 15.2, CL));
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), metalMat), 23.5, 14.9, CL));
  // ESM antenna
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.05, 0.5, 8), darkMetal), 23, 16.5, CL));
}

// ═══════════════════════════════════════════
// INTERNAL DECK
// ═══════════════════════════════════════════
function buildInternalDeck(g) {
  const CL = 4.5;
  const deckY = 1.5;

  // Main deck spans x=4..60, the walkable width is about 6m (hull is 8m diam but floor is narrower)
  // At y=1.5, the hull cross-section width is 2*sqrt(4^2 - 2.5^2) = 2*sqrt(9.75) ~= 6.24m
  // So deck width ~ 6m centered on CL
  const deckGeo = new THREE.BoxGeometry(56, 0.08, 6);
  g.add(p(new THREE.Mesh(deckGeo, deckMat), 32, deckY, CL));

  // Lower deck / bilge floor at y=0.4
  const bilgeGeo = new THREE.BoxGeometry(50, 0.05, 4);
  g.add(p(new THREE.Mesh(bilgeGeo, darkMetal), 30, 0.4, CL));
}

// ═══════════════════════════════════════════
// BULKHEADS
// ═══════════════════════════════════════════
function buildBulkheads(g) {
  const CL = 4.5;
  const HC = 4;
  const bulkheadPositions = [4, 12, 18, 26, 31, 37, 43, 53];

  for (const bx of bulkheadPositions) {
    // Circular bulkhead disc — using a ring shape (full disc minus hatch hole)
    // Outer ring
    const ringGeo = new THREE.RingGeometry(1.0, 3.9, 24);
    const bm = new THREE.Mesh(ringGeo, bulkheadMat);
    bm.position.set(bx, HC, CL);
    bm.rotation.y = Math.PI / 2;
    g.add(bm);

    // Hatch rim (torus around the opening)
    const torusGeo = new THREE.TorusGeometry(1.0, 0.08, 8, 24);
    const torus = new THREE.Mesh(torusGeo, metalMat);
    torus.position.set(bx, HC, CL);
    torus.rotation.y = Math.PI / 2;
    g.add(torus);

    // Valve wheel on bulkhead (one per bulkhead, alternating sides)
    const valveGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 12);
    const valve = new THREE.Mesh(valveGeo, brassValve);
    const vSide = (bulkheadPositions.indexOf(bx) % 2 === 0) ? 1 : -1;
    valve.position.set(bx + 0.05, HC + 1.5, CL + vSide * 1.8);
    valve.rotation.y = Math.PI / 2;
    g.add(valve);

    // Valve spoke (cross)
    const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4);
    const spoke1 = new THREE.Mesh(spokeGeo, brassValve);
    spoke1.position.set(bx + 0.05, HC + 1.5, CL + vSide * 1.8);
    spoke1.rotation.z = Math.PI / 2;
    spoke1.rotation.x = Math.PI / 2;
    g.add(spoke1);
    const spoke2 = spoke1.clone();
    spoke2.rotation.z = 0;
    g.add(spoke2);
  }
}

// ═══════════════════════════════════════════
// OVERHEAD LIGHTING
// ═══════════════════════════════════════════
function buildOverheadLighting(g) {
  const CL = 4.5;
  const lightMat = new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.4, side: DS });

  // Light strips along ceiling every 3m
  for (let x = 6; x < 58; x += 3) {
    const lightGeo = new THREE.BoxGeometry(0.8, 0.05, 0.15);
    g.add(p(new THREE.Mesh(lightGeo, lightMat), x, 6.8, CL));
  }
}

// ═══════════════════════════════════════════
// CEILING PIPES
// ═══════════════════════════════════════════
function buildCeilingPipes(g) {
  const CL = 4.5;

  // Main pipe runs along port and starboard ceiling
  for (const zOff of [-2.0, 2.0]) {
    // Long pipe
    const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 50, 6);
    pipeGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(pipeGeo, copper), 30, 6.5, CL + zOff));
  }

  // Secondary pipe (thinner, different height)
  const pipe2Geo = new THREE.CylinderGeometry(0.04, 0.04, 45, 6);
  pipe2Geo.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(pipe2Geo, metalMat), 30, 6.2, CL + 1.2));

  // Hydraulic line
  const pipe3Geo = new THREE.CylinderGeometry(0.03, 0.03, 40, 6);
  pipe3Geo.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(pipe3Geo, darkMetal), 30, 6.0, CL - 1.5));

  // Cross-pipe connectors every ~8m
  for (let x = 10; x < 55; x += 8) {
    const crossGeo = new THREE.CylinderGeometry(0.04, 0.04, 4, 6);
    crossGeo.rotateX(Math.PI / 2);
    g.add(p(new THREE.Mesh(crossGeo, copper), x, 6.5, CL));
  }
}

// ═══════════════════════════════════════════
// SONÁR (x=0..4)
// ═══════════════════════════════════════════
function buildSonar(g) {
  const CL = 4.5;

  // Sonar dome — large sphere at bow
  const sonarGeo = new THREE.SphereGeometry(1.5, 16, 12);
  g.add(p(new THREE.Mesh(sonarGeo, darkMetal), 2, 4, CL));

  // Sonar array — cylindrical transducer ring
  const arrayGeo = new THREE.TorusGeometry(1.2, 0.15, 8, 24);
  const arr = new THREE.Mesh(arrayGeo, copper);
  arr.position.set(2, 4, CL);
  arr.rotation.y = Math.PI / 2;
  g.add(arr);

  // Hydrophone array — small cylinders around dome
  for (let a = 0; a < 8; a++) {
    const angle = (a / 8) * Math.PI * 2;
    const hx = 1.5 + Math.cos(angle) * 1.0;
    const hy = 4 + Math.sin(angle) * 1.0;
    const hGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6);
    const hMesh = new THREE.Mesh(hGeo, metalMat);
    hMesh.position.set(hx, hy, CL);
    hMesh.rotation.z = angle;
    g.add(hMesh);
  }
}

// ═══════════════════════════════════════════
// TORPÉDOVÝ SÁL (x=4..12)
// ═══════════════════════════════════════════
function buildTorpedoRoom(g) {
  const CL = 4.5;
  const tubeLen = 6;
  const tubeDiam = 0.533;

  // 6 torpedo tubes — 3 upper-left, 3 lower-right
  const tubePositions = [
    // upper port row
    { y: 4.5, z: CL - 1.5 },
    { y: 4.5, z: CL },
    { y: 4.5, z: CL + 1.5 },
    // lower starboard row
    { y: 3.0, z: CL - 1.5 },
    { y: 3.0, z: CL },
    { y: 3.0, z: CL + 1.5 },
  ];

  for (const tp of tubePositions) {
    // Tube outer shell
    const tubeGeo = new THREE.CylinderGeometry(tubeDiam / 2 + 0.05, tubeDiam / 2 + 0.05, tubeLen, 12);
    tubeGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(tubeGeo, darkMetal), 7, tp.y, tp.z));

    // Tube inner
    const tubeInGeo = new THREE.CylinderGeometry(tubeDiam / 2, tubeDiam / 2, tubeLen, 12, 1, true);
    tubeInGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(tubeInGeo, metalMat), 7, tp.y, tp.z));

    // Breach door — ring at back end
    const doorGeo = new THREE.TorusGeometry(tubeDiam / 2 + 0.05, 0.04, 8, 12);
    const door = new THREE.Mesh(doorGeo, brassValve);
    door.position.set(10, tp.y, tp.z);
    door.rotation.y = Math.PI / 2;
    g.add(door);
  }

  // Torpedo storage racks — 4 torpedoes on racks
  for (let i = 0; i < 4; i++) {
    const tx = 8 + i * 0.1;
    const tz = CL + (i < 2 ? -2.4 : 2.4);
    const ty = 1.8 + (i % 2) * 0.7;

    // Rack frame
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(5, 0.06, 0.06), metalMat), 8, ty - 0.3, tz));
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(5, 0.06, 0.06), metalMat), 8, ty + 0.3, tz));

    // Torpedo body (green)
    const torpGeo = new THREE.CylinderGeometry(0.22, 0.22, 5.2, 10);
    torpGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(torpGeo, torpedoMat), 8, ty, tz));

    // Torpedo nose (red warhead)
    const noseGeo = new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    noseGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(noseGeo, torpedoNose), 5.4, ty, tz));

    // Torpedo tail fins
    for (let f = 0; f < 4; f++) {
      const finGeo = new THREE.BoxGeometry(0.4, 0.15, 0.02);
      const fin = new THREE.Mesh(finGeo, torpedoMat);
      const fAngle = (f / 4) * Math.PI * 2;
      fin.position.set(10.6, ty + Math.sin(fAngle) * 0.18, tz + Math.cos(fAngle) * 0.18);
      g.add(fin);
    }
  }

  // Hydraulic loading ram
  const ramGeo = new THREE.CylinderGeometry(0.12, 0.12, 4, 8);
  ramGeo.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(ramGeo, metalMat), 9, 2.2, CL));
  // Ram piston
  const pistonGeo = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
  pistonGeo.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(pistonGeo, brassValve), 8, 2.2, CL));

  // Torpedo firing panel
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.1), darkMetal), 11, 3.5, CL + 2.5));
  // Panel indicator lights (6 — one per tube)
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), i < 3 ? ledGreen : ledRed),
      11.05, 3.8 - row * 0.3, CL + 2.2 + col * 0.2));
  }
}

// ═══════════════════════════════════════════
// PŘEDNÍ KAJUTY (x=12..18)
// ═══════════════════════════════════════════
function buildForwardQuarters(g) {
  const CL = 4.5;

  // Port side — triple bunks
  for (let stack = 0; stack < 2; stack++) {
    const bx = 13.5 + stack * 2.5;
    for (let level = 0; level < 3; level++) {
      const by = 1.7 + level * 1.2;
      // Bunk frame
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.8), bunkMat), bx, by, CL - 2.2));
      // Mattress / sheet
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.7), sheetMat), bx, by + 0.07, CL - 2.2));
      // Bunk side rail
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.03), bunkMat), bx, by + 0.15, CL - 1.8));
      // Vertical support
      if (level < 2) {
        g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), metalMat), bx - 0.95, by + 0.6, CL - 2.5));
        g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), metalMat), bx + 0.95, by + 0.6, CL - 2.5));
      }
    }
  }

  // Starboard side — triple bunks
  for (let stack = 0; stack < 2; stack++) {
    const bx = 13.5 + stack * 2.5;
    for (let level = 0; level < 3; level++) {
      const by = 1.7 + level * 1.2;
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.8), bunkMat), bx, by, CL + 2.2));
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.7), sheetMat), bx, by + 0.07, CL + 2.2));
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.03), bunkMat), bx, by + 0.15, CL + 1.8));
      if (level < 2) {
        g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), metalMat), bx - 0.95, by + 0.6, CL + 2.5));
        g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), metalMat), bx + 0.95, by + 0.6, CL + 2.5));
      }
    }
  }

  // Personal lockers (between bunks)
  for (let i = 0; i < 4; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.4), darkMetal),
      14.7 + (i % 2) * 0.5, 2.3, CL + (i < 2 ? -0.8 : 0.8)));
  }

  // Head (small toilet compartment) at aft end
  // Partition wall
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 2), bulkheadMat), 17, 3.5, CL + 1.5));
  // Toilet
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), whiteMat), 17.4, 1.8, CL + 2.0));
  // Tiny sink
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.35), whiteMat), 17.4, 2.5, CL + 2.5));
}

// ═══════════════════════════════════════════
// VELITELSKÉ CENTRUM (x=18..26)
// ═══════════════════════════════════════════
function buildControlCenter(g) {
  const CL = 4.5;

  // Helm station — forward center
  // Helm wheel
  const wheelGeo = new THREE.TorusGeometry(0.35, 0.03, 8, 16);
  const wheel = new THREE.Mesh(wheelGeo, brassValve);
  wheel.position.set(18.8, 3.2, CL);
  wheel.rotation.x = Math.PI * 0.15; // tilted slightly
  g.add(wheel);
  // Wheel spokes
  for (let s = 0; s < 4; s++) {
    const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4);
    const spoke = new THREE.Mesh(spokeGeo, brassValve);
    spoke.position.set(18.8, 3.2, CL);
    spoke.rotation.z = (s / 4) * Math.PI;
    spoke.rotation.x = Math.PI * 0.15;
    g.add(spoke);
  }
  // Helm console
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 1.5), darkMetal), 18.6, 2.5, CL));

  // Depth gauge (circular)
  const depthGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 16);
  g.add(p(new THREE.Mesh(depthGeo, screenAmber), 18.2, 3.8, CL));
  // Depth gauge rim
  const depthRim = new THREE.TorusGeometry(0.25, 0.03, 8, 16);
  depthRim.rotateY(Math.PI / 2);
  g.add(p(new THREE.Mesh(depthRim, brassValve), 18.2, 3.8, CL));

  // Navigation table — port side
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.2), woodTable), 20, 2.8, CL - 2.0));
  // Chart on table
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.01, 0.9), sheetMat), 20, 2.84, CL - 2.0));
  // Table legs
  for (const dx of [-0.65, 0.65]) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), metalMat), 20 + dx, 2.2, CL - 2.5));
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), metalMat), 20 + dx, 2.2, CL - 1.5));
  }

  // Dividers / chart tools
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), metalMat), 20.3, 2.86, CL - 1.8));

  // Sonar display consoles — 4 green screens in a row (starboard)
  for (let i = 0; i < 4; i++) {
    const sx = 20 + i * 0.9;
    // Console body
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.4), darkMetal), sx, 2.8, CL + 2.5));
    // Screen
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), screenGreen), sx, 3.2, CL + 2.28));
    // Knobs below screen
    for (let k = 0; k < 3; k++) {
      g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8), brassValve),
        sx - 0.15 + k * 0.15, 2.7, CL + 2.28));
    }
  }

  // Weapons control console — center
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.6), darkMetal), 22, 2.5, CL + 0.8));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.05), screenAmber), 22, 3.0, CL + 0.5));
  // Fire control buttons
  for (let b = 0; b < 6; b++) {
    g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8), b < 3 ? ledGreen : ledRed),
      21.6 + b * 0.13, 2.7, CL + 0.5));
  }

  // 2 periscopes — tall thin cylinders from deck through ceiling
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 8), metalMat), 21.5, 4.5, CL));
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 8), metalMat), 22.5, 4.5, CL));
  // Periscope eyepiece handles
  for (const px of [21.5, 22.5]) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), metalMat), px, 3.5, CL));
    // Eyepiece
    g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.2, 8), darkMetal), px, 3.4, CL));
  }

  // Radio equipment racks — port side aft
  for (let i = 0; i < 2; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.5), darkMetal), 24 + i * 0.8, 3.0, CL - 2.3));
    // Radio dials
    for (let d = 0; d < 3; d++) {
      g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), brassValve),
        24 + i * 0.8, 3.5 - d * 0.4, CL - 2.0));
    }
    // LED indicators
    for (let l = 0; l < 4; l++) {
      g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), l % 2 === 0 ? ledGreen : ledRed),
        24 + i * 0.8 - 0.15 + l * 0.1, 2.3, CL - 2.0));
    }
  }

  // ESM station — starboard aft
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), darkMetal), 25, 2.8, CL + 2.5));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.05), screenGreen), 25, 3.2, CL + 2.28));

  // Tactical plot table — horizontal screen center
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.0), darkMetal), 23, 2.6, CL));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 0.8), screenGreen), 23, 2.64, CL));
  // Table legs
  for (const dx of [-0.65, 0.65]) {
    for (const dz of [-0.4, 0.4]) {
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 0.04), metalMat), 23 + dx, 2.0, CL + dz));
    }
  }

  // Captain's chair
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), bunkMat), 22, 2.0, CL - 0.8));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), bunkMat), 22, 2.3, CL - 1.0));
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8), metalMat), 22, 1.75, CL - 0.8));
}

// ═══════════════════════════════════════════
// DŮSTOJNICKÉ KAJUTY (x=26..31)
// ═══════════════════════════════════════════
function buildOfficerQuarters(g) {
  const CL = 4.5;

  // Captain's cabin — port side forward (x=26..28)
  // Partition wall
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.08, 4, 2.5), bulkheadMat), 28, 3.5, CL - 1.75));

  // Captain's bunk
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.8), bunkMat), 27, 1.8, CL - 2.2));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.7), sheetMat), 27, 1.87, CL - 2.2));
  // Pillow
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.5), sheetMat), 26.2, 1.93, CL - 2.2));

  // Captain's desk
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.6), woodTable), 27.5, 2.6, CL - 2.3));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.6), woodTable), 27.9, 2.1, CL - 2.3));
  // Desk lamp
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 8), brassValve), 27.3, 2.65, CL - 2.1));
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), brassValve), 27.3, 2.8, CL - 2.1));
  g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshLambertMaterial({
    color: 0xffffaa, emissive: 0xffff66, emissiveIntensity: 0.3, side: DS
  })), 27.3, 2.95, CL - 2.1));

  // XO cabin — port side aft (x=28..30)
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.8), bunkMat), 29, 1.8, CL - 2.2));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.7), sheetMat), 29, 1.87, CL - 2.2));
  // XO desk
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.5), woodTable), 29.5, 2.6, CL - 2.3));

  // Officers' bunks — starboard side (double stacks)
  for (let stack = 0; stack < 2; stack++) {
    const bx = 27 + stack * 2;
    for (let level = 0; level < 2; level++) {
      const by = 1.7 + level * 1.3;
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.8), bunkMat), bx, by, CL + 2.2));
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.7), sheetMat), bx, by + 0.07, CL + 2.2));
      // Side rail
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.03), bunkMat), bx, by + 0.12, CL + 1.8));
    }
    // Vertical supports
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.6, 0.05), metalMat), bx - 0.85, 3.0, CL + 2.5));
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.6, 0.05), metalMat), bx + 0.85, 3.0, CL + 2.5));
  }

  // Wardroom — small table at center-aft
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.6), woodTable), 30, 2.5, CL));
  // Table legs
  for (const dx of [-0.4, 0.4]) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 0.04), metalMat), 30 + dx, 2.0, CL - 0.25));
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 0.04), metalMat), 30 + dx, 2.0, CL + 0.25));
  }
  // Bench seats
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.3), bunkMat), 30, 2.0, CL - 0.6));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.3), bunkMat), 30, 2.0, CL + 0.6));
}

// ═══════════════════════════════════════════
// KUCHYNĚ & JÍDELNA (x=31..37)
// ═══════════════════════════════════════════
function buildGalleyMess(g) {
  const CL = 4.5;

  // Galley area (x=31..34) port side
  // Stove
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.6), darkMetal), 32, 2.0, CL - 2.3));
  // Stove top with burners
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.6), metalMat), 32, 2.45, CL - 2.3));
  for (let b = 0; b < 4; b++) {
    const bGeo = new THREE.TorusGeometry(0.08, 0.015, 6, 12);
    bGeo.rotateX(Math.PI / 2);
    g.add(p(new THREE.Mesh(bGeo, darkMetal),
      31.8 + (b % 2) * 0.4, 2.48, CL - 2.45 + Math.floor(b / 2) * 0.3));
  }

  // Counter / prep surface
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.6), metalMat), 33.5, 2.45, CL - 2.3));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.55), darkMetal), 33.5, 2.0, CL - 2.3));

  // Sink
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.4), metalMat), 31.5, 2.35, CL - 2.3));
  // Faucet
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), metalMat), 31.5, 2.6, CL - 2.1));
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6), metalMat), 31.5, 2.72, CL - 2.2));

  // Fridge
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), whiteMat), 31.3, 2.3, CL - 1.4));
  // Fridge handle
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.03), metalMat), 31.3, 2.8, CL - 1.1));

  // Freezer (next to fridge)
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), whiteMat), 31.3, 2.1, CL - 0.7));

  // Food storage cabinets — above
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 0.4), woodTable), 33, 4.5, CL - 2.5));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 0.4), woodTable), 33, 4.5, CL - 1.5));

  // Mess tables — 3 small tables starboard side and center (x=34..37)
  for (let t = 0; t < 3; t++) {
    const tx = 34.5 + t * 0.9;
    // Table
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 1.2), woodTable), tx, 2.4, CL + 1.0));
    // Table legs
    for (const dx of [-0.3, 0.3]) {
      for (const dz of [-0.5, 0.5]) {
        g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.03), metalMat), tx + dx, 1.95, CL + 1.0 + dz));
      }
    }
    // Bench seats (port & starboard of table)
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.3), bunkMat), tx, 1.8, CL + 0.2));
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.3), bunkMat), tx, 1.8, CL + 1.8));
  }

  // Coffee machine
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.25), darkMetal), 34.2, 2.62, CL - 2.3));
  g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), ledRed), 34.2, 2.82, CL - 2.17));
}

// ═══════════════════════════════════════════
// AKUMULÁTOROVNA (x=37..43)
// ═══════════════════════════════════════════
function buildBatteryRoom(g) {
  const CL = 4.5;

  // Two battery banks — port and starboard
  for (const side of [-1, 1]) {
    const bz = CL + side * 1.8;

    // Battery bank — rows of cells
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        const cellX = 37.8 + col * 0.6;
        const cellZ = bz + row * side * 0.4;
        // Battery cell
        g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.35), batteryMat), cellX, 1.9, cellZ));
        // Blue glow strip on top
        g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.25), batteryGlow), cellX, 2.32, cellZ));
        // Terminal posts
        g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 6), copper), cellX - 0.1, 2.35, cellZ));
        g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 6), copper), cellX + 0.1, 2.35, cellZ));
      }
    }

    // Battery rack frame
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 0.06), metalMat), 40, 1.5, bz - side * 0.5));
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 0.06), metalMat), 40, 1.5, bz + side * 0.8));
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 0.06), metalMat), 40, 2.35, bz - side * 0.5));
  }

  // Bus bars connecting cells (copper strips)
  for (const side of [-1, 1]) {
    const bz = CL + side * 1.8;
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.02, 0.06), copper), 40, 2.4, bz));
  }

  // BMS panel (Battery Management System) — aft wall center
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.15), darkMetal), 42.5, 3.5, CL));
  // Status display
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.05), screenGreen), 42.5, 4.0, CL - 0.06));
  // Status LEDs — row of indicators
  for (let i = 0; i < 8; i++) {
    const ledMat = i < 6 ? ledGreen : (i < 7 ? screenAmber : ledRed);
    g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), ledMat),
      42.5 - 0.3 + i * 0.08, 3.5, CL - 0.06));
  }
  // Breaker switches
  for (let i = 0; i < 4; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.06), metalMat),
      42.5 - 0.2 + i * 0.15, 3.1, CL - 0.06));
  }

  // Ventilation ducts above
  for (const side of [-1, 1]) {
    const ductGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 8, 1, true);
    ductGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(ductGeo, metalMat), 40, 6.2, CL + side * 1.5));
  }

  // Hydrogen detector
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), whiteMat), 39, 5.5, CL));
  g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), ledGreen), 39, 5.65, CL - 0.04));

  // Temperature sensor
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.05), metalMat), 41, 5.0, CL + 0.5));
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.03), screenAmber), 41, 5.15, CL + 0.47));
}

// ═══════════════════════════════════════════
// STROJOVNA (x=43..53) — Engine Room
// ═══════════════════════════════════════════
function buildEngineRoom(g) {
  const CL = 4.5;

  // 2 large diesel engines — port and starboard
  for (const side of [-1, 1]) {
    const ez = CL + side * 1.6;

    // Main engine block (large cylinder)
    const engGeo = new THREE.CylinderGeometry(0.9, 0.9, 7, 12);
    engGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(engGeo, dieselMat), 48, 2.8, ez));

    // Engine head (box on top)
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 1.2), darkMetal), 48, 3.7, ez));

    // Cylinder heads — protrusions along top
    for (let c = 0; c < 6; c++) {
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 1.0), metalMat), 45.5 + c * 1.0, 4.0, ez));
    }

    // Exhaust manifold
    const exhGeo = new THREE.CylinderGeometry(0.12, 0.12, 6, 8);
    exhGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(exhGeo, darkMetal), 48, 4.3, ez + side * 0.3));

    // Exhaust runners to manifold
    for (let c = 0; c < 6; c++) {
      const runnerGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);
      g.add(p(new THREE.Mesh(runnerGeo, darkMetal), 45.5 + c * 1.0, 4.15, ez + side * 0.15));
    }

    // Engine base / mounting
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 1.5), metalMat), 48, 1.65, ez));
    // Mounting bolts
    for (let b = 0; b < 4; b++) {
      g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6), metalMat),
        45 + b * 2, 1.58, ez - side * 0.6));
      g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6), metalMat),
        45 + b * 2, 1.58, ez + side * 0.6));
    }

    // Generator coupled to engine (aft end)
    const genGeo = new THREE.CylinderGeometry(0.6, 0.6, 2, 10);
    genGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(genGeo, copper), 52, 2.8, ez));
    // Generator housing
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 1.4), darkMetal), 52, 2.8, ez));

    // Flywheel between engine and generator
    const fwGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16);
    fwGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(fwGeo, metalMat), 51, 2.8, ez));
  }

  // Exhaust trunk / snorkel connection (going up through hull)
  const snorkelGeo = new THREE.CylinderGeometry(0.25, 0.25, 4, 8);
  g.add(p(new THREE.Mesh(snorkelGeo, darkMetal), 48, 5.5, CL));
  // Snorkel valve
  const svGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 12);
  g.add(p(new THREE.Mesh(svGeo, brassValve), 48, 6.5, CL));

  // Coolant system — pipe runs and heat exchanger
  for (const side of [-1, 1]) {
    const cpGeo = new THREE.CylinderGeometry(0.08, 0.08, 8, 6);
    cpGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(cpGeo, copper), 48, 1.9, CL + side * 0.3));
  }
  // Heat exchanger box
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.4), copper), 44, 1.9, CL));

  // Engine control panel — forward bulkhead
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.0, 3.0), darkMetal), 43.3, 3.5, CL));
  // Gauges (circular) — RPM, oil pressure, temperature, exhaust temp
  const gaugeLabels = [screenGreen, screenAmber, screenGreen, screenRed];
  for (let i = 0; i < 4; i++) {
    const gaugeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12);
    gaugeGeo.rotateY(Math.PI / 2);
    g.add(p(new THREE.Mesh(gaugeGeo, gaugeLabels[i]),
      43.2, 4.0, CL - 1.0 + i * 0.7));
    // Gauge rim
    const gRim = new THREE.TorusGeometry(0.12, 0.02, 8, 12);
    gRim.rotateY(Math.PI / 2);
    g.add(p(new THREE.Mesh(gRim, brassValve), 43.2, 4.0, CL - 1.0 + i * 0.7));
  }

  // Throttle levers
  for (let i = 0; i < 2; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), metalMat),
      43.2, 3.0, CL - 0.3 + i * 0.6));
    g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), brassValve),
      43.2, 3.15, CL - 0.3 + i * 0.6));
  }

  // Oil sump drain valves
  for (const side of [-1, 1]) {
    const vGeo = new THREE.TorusGeometry(0.1, 0.02, 6, 8);
    g.add(p(new THREE.Mesh(vGeo, brassValve), 47, 1.55, CL + side * 1.6));
  }
}

// ═══════════════════════════════════════════
// MOTOROVNA (x=53..60) — Motor Room
// ═══════════════════════════════════════════
function buildMotorRoom(g) {
  const CL = 4.5;

  // Large electric motor (main propulsion)
  const motorGeo = new THREE.CylinderGeometry(1.2, 1.2, 4, 16);
  motorGeo.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(motorGeo, darkMetal), 55, 2.8, CL));

  // Motor housing endcaps
  for (const dx of [-2, 2]) {
    const capGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
    capGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(capGeo, metalMat), 55 + dx, 2.8, CL));
  }

  // Motor cooling fins
  for (let i = 0; i < 8; i++) {
    const finGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.04, 16);
    finGeo.rotateZ(Math.PI / 2);
    g.add(p(new THREE.Mesh(finGeo, metalMat), 53.5 + i * 0.5, 2.8, CL));
  }

  // Motor terminal box
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), darkMetal), 55, 4.1, CL));

  // Thick cables from terminal box
  for (const dz of [-0.2, 0.2]) {
    const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6);
    g.add(p(new THREE.Mesh(cableGeo, new THREE.MeshLambertMaterial({ color: 0x111111, side: DS })),
      55, 4.8, CL + dz));
  }

  // Reduction gearbox
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 1.8), metalMat), 57.5, 2.5, CL));
  // Gearbox inspection plate
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.6), brassValve), 58.25, 2.8, CL));
  // Gearbox mounting bolts
  for (const dy of [-0.6, 0.6]) {
    for (const dz of [-0.6, 0.6]) {
      g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 6), metalMat),
        58.26, 2.8 + dy, CL + dz));
    }
  }

  // Propeller shaft extending aft from gearbox
  const shaftGeo = new THREE.CylinderGeometry(0.15, 0.15, 7, 8);
  shaftGeo.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(shaftGeo, metalMat), 61.5, 2.5, CL));

  // Shaft bearing blocks
  for (let i = 0; i < 3; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.5), metalMat), 59 + i * 1.5, 2.5, CL));
  }

  // Shaft seal
  const sealGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 12);
  sealGeo.rotateY(Math.PI / 2);
  g.add(p(new THREE.Mesh(sealGeo, darkMetal), 58.5, 2.5, CL));

  // Frequency converter (large electrical cabinet)
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.8), darkMetal), 54, 2.8, CL + 2.2));
  // Converter display
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.05), screenAmber), 54, 3.5, CL + 1.8));
  // Indicator LEDs
  for (let i = 0; i < 5; i++) {
    g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), ledGreen),
      53.7 + i * 0.15, 3.1, CL + 1.8));
  }

  // Main switchboard — port side
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.5, 0.4), darkMetal), 55, 3.0, CL - 2.3));
  // Bus bars
  for (let i = 0; i < 3; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.03), copper),
      55, 2.2 + i * 0.8, CL - 2.08));
  }
  // Circuit breakers
  for (let i = 0; i < 6; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.08), metalMat),
      54.3 + i * 0.25, 3.8, CL - 2.08));
  }
  // Ammeter / voltmeter (circular gauges)
  for (let i = 0; i < 3; i++) {
    const gGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12);
    gGeo.rotateX(Math.PI / 2);
    g.add(p(new THREE.Mesh(gGeo, i < 2 ? screenGreen : screenAmber),
      54.5 + i * 0.5, 4.0, CL - 2.08));
  }

  // Motor room ventilation fan
  const fanGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12);
  g.add(p(new THREE.Mesh(fanGeo, metalMat), 56, 6.5, CL));
  // Fan blades (simplified as box cross)
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.06), metalMat), 56, 6.5, CL));
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.5), metalMat);
  blade2.position.set(56, 6.5, CL);
  g.add(blade2);
}

// ═══════════════════════════════════════════
// ZÁĎÍ (x=60..65) — Stern
// ═══════════════════════════════════════════
function buildStern(g) {
  const CL = 4.5;
  const HC = 4;

  // Stern planes (horizontal fins)
  for (const side of [-1, 1]) {
    const planeGeo = new THREE.BoxGeometry(2.0, 0.1, 2.5);
    g.add(p(new THREE.Mesh(planeGeo, hullMat), 63, HC, CL + side * 4.5));
    // Plane actuator rod
    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6);
    rodGeo.rotateX(Math.PI / 2);
    g.add(p(new THREE.Mesh(rodGeo, metalMat), 63, HC, CL + side * 3.2));
  }

  // Rudder (vertical fin)
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.5, 0.1), hullMat), 63, HC, CL));
  // Rudder hinge
  g.add(p(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8), metalMat), 62, HC, CL));

  // Propeller — 7-blade bronze
  const propHub = new THREE.CylinderGeometry(0.25, 0.2, 0.4, 12);
  propHub.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(propHub, propMat), 65, HC - 1.5, CL));

  for (let blade = 0; blade < 7; blade++) {
    const angle = (blade / 7) * Math.PI * 2;
    // Each blade is an elongated box, angled
    const bladeGeo = new THREE.BoxGeometry(0.1, 1.3, 0.35);
    const bMesh = new THREE.Mesh(bladeGeo, propMat);
    bMesh.position.set(65, HC - 1.5 + Math.sin(angle) * 0.8, CL + Math.cos(angle) * 0.8);
    bMesh.rotation.x = angle;
    bMesh.rotation.z = 0.3; // blade pitch
    g.add(bMesh);
  }

  // Propeller shaft stub
  const stubGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8);
  stubGeo.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(stubGeo, metalMat), 64.5, HC - 1.5, CL));

  // Stern light (red)
  g.add(p(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), ledRed), 65, HC + 1, CL));
}

// ═══════════════════════════════════════════
// EXTERNAL FEATURES
// ═══════════════════════════════════════════
function buildExternalFeatures(g) {
  const CL = 4.5;
  const HC = 4;

  // Bow planes (horizontal fins near x=5)
  for (const side of [-1, 1]) {
    const bpGeo = new THREE.BoxGeometry(1.5, 0.08, 1.8);
    g.add(p(new THREE.Mesh(bpGeo, hullMat), 5, HC, CL + side * 4.5));
    // Actuator housing
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), darkMetal), 5, HC, CL + side * 3.5));
  }

  // Flood ports along hull (small rectangular openings) — represented as dark recesses
  for (let i = 0; i < 8; i++) {
    const fpx = 8 + i * 6;
    for (const side of [-1, 1]) {
      g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x111111, side: DS })),
        fpx, 0.5, CL + side * 4.45));
    }
  }

  // Anchor recess — starboard bow
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.4), darkMetal), 3, 4, CL + 3.8));
  // Anchor
  g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.3), metalMat), 3, 3.5, CL + 3.8));

  // Hull identification numbers (simplified as small boxes)
  const numMat = new THREE.MeshLambertMaterial({ color: 0xcccccc, side: DS });
  // "S" + 3 digits on sail
  for (let i = 0; i < 4; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.3), numMat),
      20.5 + i * 0.4, 10.5, CL + 1.26));
  }

  // Deck cleats
  for (let i = 0; i < 4; i++) {
    const cleatGeo = new THREE.BoxGeometry(0.15, 0.08, 0.08);
    g.add(p(new THREE.Mesh(cleatGeo, metalMat), 10 + i * 10, 8.0, CL - 0.3));
    g.add(p(new THREE.Mesh(cleatGeo, metalMat), 10 + i * 10, 8.0, CL + 0.3));
  }

  // Towed array dispenser (small cylinder at stern bottom)
  const towedGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
  towedGeo.rotateZ(Math.PI / 2);
  g.add(p(new THREE.Mesh(towedGeo, darkMetal), 60, 0.5, CL));

  // Limber holes (drainage slots along keel)
  for (let i = 0; i < 12; i++) {
    g.add(p(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x0a0a0a, side: DS })),
      8 + i * 4, 0.1, CL));
  }

  // Sonar dome fairing (smooth over bow sonar)
  const fairGeo = new THREE.SphereGeometry(2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  fairGeo.rotateZ(Math.PI / 2);
  const fairMat = new THREE.MeshLambertMaterial({ color: 0x333333, side: DS, transparent: true, opacity: 0.6 });
  g.add(p(new THREE.Mesh(fairGeo, fairMat), 1, HC, CL));
}
