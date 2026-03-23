import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof,
  MAT, box, plane
} from './building-utils.js';

// ═══════════════════════════════════════════════════════════
// LOD ARTEMIS — Spaceship, 30×14m, single deck, FH=3
// MCP coords: x → 3D x, y → 3D z
// ═══════════════════════════════════════════════════════════

const DS = THREE.FrontSide;
const FH = 3.0;

// ── Hull & walls ──
const hullMat = new THREE.MeshLambertMaterial({ color: 0x556677, side: DS });
const wallInt = new THREE.MeshLambertMaterial({ color: 0x667788, side: DS });
const wallDark = new THREE.MeshLambertMaterial({ color: 0x334455, side: DS });
const floorMat = new THREE.MeshLambertMaterial({ color: 0x445566, side: DS });
const ceilingMat = new THREE.MeshLambertMaterial({ color: 0x556666, side: DS });

// ── Furniture ──
const metalMat = new THREE.MeshLambertMaterial({ color: 0x555566, side: DS });
const darkMetal = new THREE.MeshLambertMaterial({ color: 0x333344, side: DS });
const bedMat = new THREE.MeshLambertMaterial({ color: 0x2244aa, side: DS });
const bedFrame = new THREE.MeshLambertMaterial({ color: 0x334455, side: DS });
const leatherMat = new THREE.MeshLambertMaterial({ color: 0x222222, side: DS });
const premiumLeather = new THREE.MeshLambertMaterial({ color: 0x111111, side: DS });
const woodMat = new THREE.MeshLambertMaterial({ color: 0x887766, side: DS });
const whiteMat = new THREE.MeshLambertMaterial({ color: 0xccdddd, side: DS });
const redMat = new THREE.MeshLambertMaterial({ color: 0xcc0000, side: DS });
const steelMat = new THREE.MeshLambertMaterial({ color: 0xaabbcc, side: DS });

// ── Screens & glowing elements ──
const screenMat = new THREE.MeshLambertMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.3, side: DS });
const screenBlue = new THREE.MeshLambertMaterial({ color: 0x0088ff, emissive: 0x0088ff, emissiveIntensity: 0.3, side: DS });
const screenRed = new THREE.MeshLambertMaterial({ color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 0.3, side: DS });
const screenOrange = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.3, side: DS });
const holoMat = new THREE.MeshLambertMaterial({ color: 0x00ddff, emissive: 0x00ddff, emissiveIntensity: 0.5, transparent: true, opacity: 0.3, side: DS });
const reactorGlow = new THREE.MeshLambertMaterial({ color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 0.6, transparent: true, opacity: 0.6, side: DS });
const exhaustGlow = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.4, transparent: true, opacity: 0.5, side: DS });

// ── Glass ──
const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccee, opacity: 0.25, transparent: true, side: DS });
const glassFrame = new THREE.MeshLambertMaterial({ color: 0x445566, side: DS });

// ── Warning ──
const hazardYellow = new THREE.MeshLambertMaterial({ color: 0xffcc00, side: DS });
const hazardBlack = new THREE.MeshLambertMaterial({ color: 0x222222, side: DS });

// ── Door ──
const doorMat = new THREE.MeshLambertMaterial({ color: 0x556677, side: DS });
const blastDoor = new THREE.MeshLambertMaterial({ color: 0x445566, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createLodArtemis(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  // ═══════════════════════════════════════════════════════════
  // FLOORS & CEILINGS — per room
  // ═══════════════════════════════════════════════════════════

  // mcp:kokpit (0,3) 6×8
  addFloor(g, 0, 3, 6, 8, 0, floorMat);
  addCeiling(g, 0, 3, 6, 8, FH, 0, ceilingMat);

  // mcp:chodba (6,5.5) 16×3
  addFloor(g, 6, 5.5, 16, 3, 0, darkMetal);
  addCeiling(g, 6, 5.5, 16, 3, FH, 0, ceilingMat);

  // mcp:life_support (6,0.5) 2×5
  addFloor(g, 6, 0.5, 2, 5, 0, floorMat);
  addCeiling(g, 6, 0.5, 2, 5, FH, 0, ceilingMat);

  // mcp:kajuty (8,0.5) 6×5
  addFloor(g, 8, 0.5, 6, 5, 0, floorMat);
  addCeiling(g, 8, 0.5, 6, 5, FH, 0, ceilingMat);

  // mcp:wc (14.5,0.5) 0.5×5
  addFloor(g, 14.5, 0.5, 0.5, 5, 0, floorMat);
  addCeiling(g, 14.5, 0.5, 0.5, 5, FH, 0, ceilingMat);

  // mcp:medical (15,0.5) 5×5
  addFloor(g, 15, 0.5, 5, 5, 0, floorMat);
  addCeiling(g, 15, 0.5, 5, 5, FH, 0, ceilingMat);

  // mcp:jidelna (8,8.5) 6×5
  addFloor(g, 8, 8.5, 6, 5, 0, floorMat);
  addCeiling(g, 8, 8.5, 6, 5, FH, 0, ceilingMat);

  // mcp:armory (6,8.5) 2×5
  addFloor(g, 6, 8.5, 2, 5, 0, floorMat);
  addCeiling(g, 6, 8.5, 2, 5, FH, 0, ceilingMat);

  // mcp:cargo (15,8.5) 5×5
  addFloor(g, 15, 8.5, 5, 5, 0, floorMat);
  addCeiling(g, 15, 8.5, 5, 5, FH, 0, ceilingMat);

  // mcp:strojovna (22,1) 8×12
  addFloor(g, 22, 1, 8, 12, 0, darkMetal);
  addCeiling(g, 22, 1, 8, 12, FH, 0, ceilingMat);

  // mcp:airlock (15,13.5) 3×0.5
  addFloor(g, 15, 13.5, 3, 0.5, 0, hazardYellow);

  // mcp:escape_pod_l (20,0) 2×1
  addFloor(g, 20, 0, 2, 1, 0, steelMat);
  addCeiling(g, 20, 0, 2, 1, FH, 0, ceilingMat);

  // mcp:escape_pod_r (20,13) 2×1
  addFloor(g, 20, 13, 2, 1, 0, steelMat);
  addCeiling(g, 20, 13, 2, 1, FH, 0, ceilingMat);

  // ═══════════════════════════════════════════════════════════
  // OUTER HULL WALLS
  // ═══════════════════════════════════════════════════════════

  // ── WEST (x=0) — kokpit front with viewports ──
  // mcp:kokpit west wall x=0, z=3..11, length=8, with 3 viewports
  // Viewports at z positions (absolute): 4, 6.5, 7.5
  // In wall-local coords (relative to z=3): 1, 3.5, 4.5
  wallWithOpenings(g, { axis: 'z', x: 0, z: 3, length: 8, height: FH, material: hullMat,
    openings: [
      { start: 1, end: 3.5, bottom: 0.8, top: 2.6 },   // w_front1: 2.5m wide
      { start: 3.5, end: 4.5, bottom: 0.8, top: 2.6 },  // w_front2: 1m wide
      { start: 4.5, end: 7, bottom: 0.8, top: 2.6 },    // w_front3: 2.5m wide
    ]
  });
  // Viewport glass
  addWindow(g, { axis: 'z', x: 0, z: 3, at: 2.25, width: 2.5, sillHeight: 0.8, winHeight: 1.8, glassMat, frameMat: glassFrame });
  addWindow(g, { axis: 'z', x: 0, z: 3, at: 4, width: 1, sillHeight: 0.8, winHeight: 1.8, glassMat, frameMat: glassFrame });
  addWindow(g, { axis: 'z', x: 0, z: 3, at: 5.75, width: 2.5, sillHeight: 0.8, winHeight: 1.8, glassMat, frameMat: glassFrame });

  // ── NORTH SIDE (z=min for each section) ──

  // kokpit north wall: z=3, x=0..6
  wallWithOpenings(g, { axis: 'x', x: 0, z: 3, length: 6, height: FH, material: hullMat });

  // life_support north wall: z=0.5, x=6..8
  wallWithOpenings(g, { axis: 'x', x: 6, z: 0.5, length: 2, height: FH, material: hullMat });

  // kajuty north wall: z=0.5, x=8..14
  wallWithOpenings(g, { axis: 'x', x: 8, z: 0.5, length: 6, height: FH, material: hullMat });

  // wc north wall: z=0.5, x=14..15 (wc starts at 14.5 but we need continuity)
  wallWithOpenings(g, { axis: 'x', x: 14, z: 0.5, length: 1, height: FH, material: hullMat });

  // medical north wall: z=0.5, x=15..20
  wallWithOpenings(g, { axis: 'x', x: 15, z: 0.5, length: 5, height: FH, material: hullMat });

  // escape_pod_l north wall: z=0, x=20..22
  wallWithOpenings(g, { axis: 'x', x: 20, z: 0, length: 2, height: FH, material: hullMat });

  // strojovna north wall: z=1, x=22..30
  wallWithOpenings(g, { axis: 'x', x: 22, z: 1, length: 8, height: FH, material: hullMat });

  // ── SOUTH SIDE (z=max for each section) ──

  // kokpit south wall: z=11, x=0..6
  wallWithOpenings(g, { axis: 'x', x: 0, z: 11, length: 6, height: FH, material: hullMat });

  // armory south wall: z=13.5, x=6..8
  wallWithOpenings(g, { axis: 'x', x: 6, z: 13.5, length: 2, height: FH, material: hullMat });

  // jidelna south wall: z=13.5, x=8..14
  wallWithOpenings(g, { axis: 'x', x: 8, z: 13.5, length: 6, height: FH, material: hullMat });

  // Between jidelna and airlock south: no wall needed at z=13.5 from x=14..15 (cargo continues)

  // airlock south wall: z=14, x=15..18 — with airlock opening
  wallWithOpenings(g, { axis: 'x', x: 15, z: 14, length: 3, height: FH, material: hullMat,
    openings: [
      { start: 0.5, end: 2.5, top: 2.2 }  // airlock hatch
    ]
  });
  addDoor(g, { axis: 'x', x: 15, z: 14, at: 1.5, width: 2, doorHeight: 2.2, material: blastDoor });

  // cargo south wall: z=13.5, x=15..20 (but airlock cuts into x=15..18 at z=14)
  // Wall at z=13.5 from x=18..20
  wallWithOpenings(g, { axis: 'x', x: 18, z: 13.5, length: 2, height: FH, material: hullMat });
  // Wall at z=13.5 from x=15..15 (already covered by airlock walls)
  // Airlock side walls
  wallWithOpenings(g, { axis: 'z', x: 15, z: 13.5, length: 0.5, height: FH, material: hullMat });
  wallWithOpenings(g, { axis: 'z', x: 18, z: 13.5, length: 0.5, height: FH, material: hullMat });

  // escape_pod_r south wall: z=14, x=20..22
  wallWithOpenings(g, { axis: 'x', x: 20, z: 14, length: 2, height: FH, material: hullMat });

  // strojovna south wall: z=13, x=22..30
  wallWithOpenings(g, { axis: 'x', x: 22, z: 13, length: 8, height: FH, material: hullMat });

  // ── NORTH-SOUTH CONNECTORS (z-axis walls bridging different z-levels) ──

  // life_support west wall: x=6, z=0.5..3 (connecting to kokpit)
  wallWithOpenings(g, { axis: 'z', x: 6, z: 0.5, length: 2.5, height: FH, material: hullMat });

  // armory west wall: x=6, z=11..13.5 (connecting from kokpit south to armory south)
  wallWithOpenings(g, { axis: 'z', x: 6, z: 11, length: 2.5, height: FH, material: hullMat });

  // escape_pod_l east wall connecting to strojovna: x=22, z=0..1
  wallWithOpenings(g, { axis: 'z', x: 22, z: 0, length: 1, height: FH, material: hullMat });

  // escape_pod_l west wall: x=20, z=0..0.5
  wallWithOpenings(g, { axis: 'z', x: 20, z: 0, length: 0.5, height: FH, material: hullMat });

  // medical/cargo east wall connecting to escape pods: x=20, z=0.5..1 (north side gap)
  wallWithOpenings(g, { axis: 'z', x: 20, z: 0.5, length: 0.5, height: FH, material: hullMat });

  // escape_pod_r east wall connecting to strojovna: x=22, z=13..14
  wallWithOpenings(g, { axis: 'z', x: 22, z: 13, length: 1, height: FH, material: hullMat });

  // escape_pod_r west wall: x=20, z=13..13.5
  wallWithOpenings(g, { axis: 'z', x: 20, z: 13.5, length: 0.5, height: FH, material: hullMat });

  // cargo east connecting to escape_pod_r: x=20, z=13..13.5
  wallWithOpenings(g, { axis: 'z', x: 20, z: 13, length: 0.5, height: FH, material: hullMat });

  // ── EAST wall — strojovna ──
  wallWithOpenings(g, { axis: 'z', x: 30, z: 1, length: 12, height: FH, material: hullMat });

  // ═══════════════════════════════════════════════════════════
  // INTERIOR WALLS (with door openings)
  // ═══════════════════════════════════════════════════════════

  // ── kokpit → chodba: x=6, z=5.5..8.5 (corridor z range) ──
  // d_kokpit_chodba: (6, 6.5) — on wall at x=6, z=6.5 relative to group, door is 1m wide along z
  wallWithOpenings(g, { axis: 'z', x: 6, z: 5.5, length: 3, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 1, end: 2, top: 2.2 }  // d_kokpit_chodba at z=6.5..7.5
    ]
  });
  addDoor(g, { axis: 'z', x: 6, z: 5.5, at: 1.5, width: 1, doorHeight: 2.2, material: blastDoor });

  // ── kokpit → life_support wall: z=5.5, x=0..6 (south wall of kokpit upper, part is chodba) ──
  // Already handled by kokpit structure — kokpit goes from z=3 to z=11,
  // but corridor is z=5.5..8.5. Interior wall at z=5.5 from x=6..8 (life_support south)
  wallWithOpenings(g, { axis: 'x', x: 6, z: 5.5, length: 2, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 1, end: 2, top: 2.2 }  // d_ls_chodba at (7, 5.5)
    ]
  });
  addDoor(g, { axis: 'x', x: 6, z: 5.5, at: 1.5, width: 1, doorHeight: 2.2, material: doorMat });

  // ── kajuty → chodba: z=5.5, x=8..14 ──
  wallWithOpenings(g, { axis: 'x', x: 8, z: 5.5, length: 6, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 2, end: 3, top: 2.2 }  // d_kajuty_chodba at (10, 5.5)
    ]
  });
  addDoor(g, { axis: 'x', x: 8, z: 5.5, at: 2.5, width: 1, doorHeight: 2.2, material: doorMat });

  // ── wc → chodba: door in north corridor wall at z=5.5, x=14..15 ──
  // (WC door is handled below in the corridor north wall at x=14..15)

  // ── wc → kajuty wall: z=0.5..5.5 at x=14.5 (already part of hull/interior) ──
  // Thin wall between kajuty and wc
  wallWithOpenings(g, { axis: 'z', x: 14, z: 0.5, length: 5, height: FH, thickness: 0.12, material: wallInt });

  // ── wc → medical wall: x=15, z=0.5..5.5 ──
  wallWithOpenings(g, { axis: 'z', x: 15, z: 0.5, length: 5, height: FH, thickness: 0.12, material: wallInt });

  // ── medical → chodba: z=5.5, x=15..20 ──
  wallWithOpenings(g, { axis: 'x', x: 15, z: 5.5, length: 5, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 2, end: 3, top: 2.2 }  // d_medical_chodba at (17, 5.5)
    ]
  });
  addDoor(g, { axis: 'x', x: 15, z: 5.5, at: 2.5, width: 1, doorHeight: 2.2, material: doorMat });

  // ── armory → chodba: z=8.5, x=6..8 ──
  // d_armory_chodba: (7, 8.3) — actually at z=8.5 wall
  wallWithOpenings(g, { axis: 'x', x: 6, z: 8.5, length: 2, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 1, end: 2, top: 2.2 }  // d_armory_chodba
    ]
  });
  addDoor(g, { axis: 'x', x: 6, z: 8.5, at: 1.5, width: 1, doorHeight: 2.2, material: doorMat });

  // ── jidelna → chodba: z=8.5, x=8..14 ──
  wallWithOpenings(g, { axis: 'x', x: 8, z: 8.5, length: 6, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 2, end: 3, top: 2.2 }  // d_jidelna_chodba at (10, 8.3)
    ]
  });
  addDoor(g, { axis: 'x', x: 8, z: 8.5, at: 2.5, width: 1, doorHeight: 2.2, material: doorMat });

  // ── cargo → chodba: z=8.5, x=15..20 ──
  wallWithOpenings(g, { axis: 'x', x: 15, z: 8.5, length: 5, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 2, end: 3, top: 2.2 }  // d_cargo_chodba at (17, 8.3)
    ]
  });
  addDoor(g, { axis: 'x', x: 15, z: 8.5, at: 2.5, width: 1, doorHeight: 2.2, material: doorMat });

  // ── strojovna → chodba: x=22, z=5.5..8.5 ──
  wallWithOpenings(g, { axis: 'z', x: 22, z: 5.5, length: 3, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 1, end: 2, top: 2.2 }  // d_strojovna_chodba at (22, 6.5)
    ]
  });
  addDoor(g, { axis: 'z', x: 22, z: 5.5, at: 1.5, width: 1, doorHeight: 2.2, material: blastDoor });

  // ── Divider walls between north/south rooms ──

  // life_support → armory divider: x=6..8, z=5.5 (already done above)
  // jidelna → armory: x=8, z=8.5..13.5
  wallWithOpenings(g, { axis: 'z', x: 8, z: 8.5, length: 5, height: FH, thickness: 0.12, material: wallInt });

  // jidelna → kajuty divider at x=14: z=0.5..5.5 and z=8.5..13.5
  wallWithOpenings(g, { axis: 'z', x: 14, z: 8.5, length: 5, height: FH, thickness: 0.12, material: wallInt });

  // cargo → jidelna: x=15, z=8.5..13.5
  wallWithOpenings(g, { axis: 'z', x: 15, z: 8.5, length: 5, height: FH, thickness: 0.12, material: wallInt });

  // medical → cargo divider: x=20, z=0.5..5.5 and z=8.5..13.5
  wallWithOpenings(g, { axis: 'z', x: 20, z: 0.5, length: 5, height: FH, thickness: 0.12, material: wallInt });
  wallWithOpenings(g, { axis: 'z', x: 20, z: 8.5, length: 5, height: FH, thickness: 0.12, material: wallInt });

  // Corridor north wall from x=14..15 at z=5.5 — with WC door
  wallWithOpenings(g, { axis: 'x', x: 14, z: 5.5, length: 1, height: FH, thickness: 0.12, material: wallInt,
    openings: [
      { start: 0.15, end: 0.85, top: 2.1 }  // d_wc_chodba — 0.7m wide door
    ]
  });
  addDoor(g, { axis: 'x', x: 14, z: 5.5, at: 0.5, width: 0.7, doorHeight: 2.1, material: doorMat });

  // Corridor south wall from x=14..15 at z=8.5
  wallWithOpenings(g, { axis: 'x', x: 14, z: 8.5, length: 1, height: FH, thickness: 0.12, material: wallInt });

  // Corridor walls connecting the chodba between sections: x=20..22
  wallWithOpenings(g, { axis: 'x', x: 20, z: 5.5, length: 2, height: FH, thickness: 0.12, material: wallInt });
  wallWithOpenings(g, { axis: 'x', x: 20, z: 8.5, length: 2, height: FH, thickness: 0.12, material: wallInt });

  // North hull connectors between rooms at z=0.5: life_support/kajuty/wc/medical share z=0.5
  // South hull at z=13.5: armory/jidelna/cargo share z=13.5

  // Strojovna walls connecting to corridor area: z=1..5.5 and z=8.5..13
  wallWithOpenings(g, { axis: 'z', x: 22, z: 1, length: 4.5, height: FH, thickness: 0.12, material: wallInt });
  wallWithOpenings(g, { axis: 'z', x: 22, z: 8.5, length: 4.5, height: FH, thickness: 0.12, material: wallInt });

  // ── Life support/armory east walls (x=8) connecting hull ──
  wallWithOpenings(g, { axis: 'z', x: 8, z: 0.5, length: 5, height: FH, thickness: 0.12, material: wallInt });

  // ═══════════════════════════════════════════════════════════
  // CORRIDOR DETAILS — strip lighting, metal grate overlay
  // ═══════════════════════════════════════════════════════════

  // Ceiling strip lights along corridor
  for (let cx2 = 7; cx2 < 22; cx2 += 2) {
    g.add(p(box(1.5, 0.03, 0.15, screenMat), cx2, FH - 0.05, 7));
  }
  // Floor grate texture — dark strips
  for (let cx2 = 7; cx2 < 22; cx2 += 1) {
    g.add(p(box(0.8, 0.02, 0.05, darkMetal), cx2, 0.16, 6.5));
    g.add(p(box(0.8, 0.02, 0.05, darkMetal), cx2, 0.16, 7.5));
  }

  // ═══════════════════════════════════════════════════════════
  // FURNITURE
  // ═══════════════════════════════════════════════════════════

  furnishKokpit(g);
  furnishKajuty(g);
  furnishStrojovna(g);
  furnishMedical(g);
  furnishJidelna(g);
  furnishArmory(g);
  furnishLifeSupport(g);
  furnishCargo(g);
  furnishEscapePods(g);
  furnishAirlock(g);
  furnishWC(g);

  scene.add(g);
}

// ═══════════════════════════════════════════════════════════
// KOKPIT — mcp:kokpit (0,3) 6×8
// ═══════════════════════════════════════════════════════════
function furnishKokpit(g) {
  const rx = 0, rz = 3;

  // Main console — wide curved desk with screens
  // mcp:kokpit/console (0.5, 1) 5×1.5
  g.add(p(box(5, 0.15, 1.5, darkMetal), rx + 0.5 + 2.5, 0.75, rz + 1 + 0.75));
  // Console screen panels (3 screens on front of console)
  g.add(p(box(1.4, 0.8, 0.05, screenMat), rx + 1.2, 1.3, rz + 1.1));
  g.add(p(box(1.4, 0.8, 0.05, screenBlue), rx + 3, 1.3, rz + 1.1));
  g.add(p(box(1.4, 0.8, 0.05, screenMat), rx + 4.8, 1.3, rz + 1.1));
  // Console surface details — buttons/controls
  g.add(p(box(4.8, 0.03, 0.3, metalMat), rx + 3, 0.84, rz + 1.9));

  // Pilot seat 1 (left)
  // mcp:kokpit/pilot1 (1.5, 3) 0.6×0.6
  g.add(p(box(0.6, 0.4, 0.6, leatherMat), rx + 1.5 + 0.3, 0.5, rz + 3 + 0.3));
  g.add(p(box(0.6, 0.5, 0.1, leatherMat), rx + 1.8, 0.75, rz + 3));  // backrest
  // Armrests
  g.add(p(box(0.08, 0.1, 0.5, darkMetal), rx + 1.5, 0.55, rz + 3.3));
  g.add(p(box(0.08, 0.1, 0.5, darkMetal), rx + 2.1, 0.55, rz + 3.3));

  // Pilot seat 2 (right)
  // mcp:kokpit/pilot2 (3.5, 3) 0.6×0.6
  g.add(p(box(0.6, 0.4, 0.6, leatherMat), rx + 3.5 + 0.3, 0.5, rz + 3 + 0.3));
  g.add(p(box(0.6, 0.5, 0.1, leatherMat), rx + 3.8, 0.75, rz + 3));
  g.add(p(box(0.08, 0.1, 0.5, darkMetal), rx + 3.5, 0.55, rz + 3.3));
  g.add(p(box(0.08, 0.1, 0.5, darkMetal), rx + 4.1, 0.55, rz + 3.3));

  // Captain's chair — raised platform, center-back
  // mcp:kokpit/captain (2, 5) 1.2×1
  g.add(p(box(1.6, 0.1, 1.4, darkMetal), rx + 2.7, 0.2, rz + 5.5));  // platform
  g.add(p(box(0.8, 0.45, 0.8, premiumLeather), rx + 2.7, 0.55, rz + 5.5));  // seat
  g.add(p(box(0.8, 0.6, 0.12, premiumLeather), rx + 2.7, 0.8, rz + 5.1));  // backrest
  // Armrests with controls
  g.add(p(box(0.1, 0.08, 0.6, darkMetal), rx + 2.3, 0.62, rz + 5.5));
  g.add(p(box(0.1, 0.08, 0.6, darkMetal), rx + 3.1, 0.62, rz + 5.5));
  // Small control panels on armrests
  g.add(p(box(0.08, 0.02, 0.2, screenOrange), rx + 2.3, 0.67, rz + 5.5));
  g.add(p(box(0.08, 0.02, 0.2, screenOrange), rx + 3.1, 0.67, rz + 5.5));

  // Holo display — center of bridge
  // mcp:kokpit/holo (2, 4) 1.5×1
  const holoBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.1, 16), darkMetal);
  g.add(p(holoBase, rx + 2.75, 0.85, rz + 4.5));
  // Holographic projection cone
  const holoCone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.5, 1.0, 16, 1, true), holoMat);
  g.add(p(holoCone, rx + 2.75, 1.4, rz + 4.5));
  // Holo data ring
  const holoRing = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.02, 8, 24), holoMat);
  holoRing.rotation.x = Math.PI / 6;
  g.add(p(holoRing, rx + 2.75, 1.5, rz + 4.5));

  // Nav panel — left side
  // mcp:kokpit/nav (0.3, 5.5) 0.8×1
  g.add(p(box(0.8, 0.8, 0.05, darkMetal), rx + 0.3 + 0.4, 1.2, rz + 5.5));
  g.add(p(box(0.6, 0.6, 0.04, screenBlue), rx + 0.7, 1.2, rz + 5.55));

  // Comm panel — right side
  // mcp:kokpit/comm (4.5, 5.5) 0.8×1
  g.add(p(box(0.8, 0.8, 0.05, darkMetal), rx + 4.5 + 0.4, 1.2, rz + 5.5));
  g.add(p(box(0.6, 0.6, 0.04, screenMat), rx + 4.9, 1.2, rz + 5.55));

  // Weapons console — left wall
  // mcp:kokpit/weapons (0.3, 7) 0.6×0.8
  g.add(p(box(0.6, 0.8, 0.8, darkMetal), rx + 0.3 + 0.3, 0.75, rz + 7 + 0.4));
  g.add(p(box(0.5, 0.4, 0.05, screenRed), rx + 0.6, 1.3, rz + 7));

  // Shield console — right wall
  // mcp:kokpit/shields (4.8, 7) 0.6×0.8
  g.add(p(box(0.6, 0.8, 0.8, darkMetal), rx + 4.8 + 0.3, 0.75, rz + 7 + 0.4));
  g.add(p(box(0.5, 0.4, 0.05, screenBlue), rx + 5.1, 1.3, rz + 7));

  // Status indicators on ceiling
  g.add(p(box(0.1, 0.05, 0.1, screenMat), rx + 1, FH - 0.1, rz + 4));
  g.add(p(box(0.1, 0.05, 0.1, screenMat), rx + 4.5, FH - 0.1, rz + 4));
}

// ═══════════════════════════════════════════════════════════
// KAJUTY — mcp:kajuty (8,0.5) 6×5 — crew quarters, 4 beds
// ═══════════════════════════════════════════════════════════
function furnishKajuty(g) {
  const rx = 8, rz = 0.5;

  // 4 bunk beds (2 double bunks)
  for (let i = 0; i < 2; i++) {
    const bx = rx + 0.3 + i * 3;

    // Lower bunk — mcp:kajuty/bed_l{i} ({0.3+i*3}, 0.3) 2×0.9
    g.add(p(box(2, 0.3, 0.9, bedFrame), bx + 1, 0.3, rz + 0.3 + 0.45));
    g.add(p(box(1.9, 0.1, 0.85, bedMat), bx + 1, 0.45, rz + 0.75));
    // Pillow
    g.add(p(box(0.3, 0.08, 0.25, whiteMat), bx + 0.2, 0.5, rz + 0.75));

    // Upper bunk
    g.add(p(box(2, 0.05, 0.9, bedFrame), bx + 1, 1.5, rz + 0.3 + 0.45));
    g.add(p(box(1.9, 0.1, 0.85, bedMat), bx + 1, 1.6, rz + 0.75));
    g.add(p(box(0.3, 0.08, 0.25, whiteMat), bx + 0.2, 1.65, rz + 0.75));

    // Bunk frame posts
    g.add(p(box(0.05, 1.8, 0.05, bedFrame), bx + 0.05, 0.9, rz + 0.35));
    g.add(p(box(0.05, 1.8, 0.05, bedFrame), bx + 1.95, 0.9, rz + 0.35));
    g.add(p(box(0.05, 1.8, 0.05, bedFrame), bx + 0.05, 0.9, rz + 1.15));
    g.add(p(box(0.05, 1.8, 0.05, bedFrame), bx + 1.95, 0.9, rz + 1.15));

    // Safety rail for upper bunk
    g.add(p(box(1.9, 0.2, 0.03, bedFrame), bx + 1, 1.7, rz + 1.2));

    // Reading light (small emissive)
    g.add(p(box(0.08, 0.08, 0.08, screenMat), bx + 0.15, 0.55, rz + 0.4));
    g.add(p(box(0.08, 0.08, 0.08, screenMat), bx + 0.15, 1.7, rz + 0.4));
  }

  // Night stands between bunks
  // mcp:kajuty/stand (2.5, 0.3) 0.4×0.9
  g.add(p(box(0.4, 0.5, 0.4, darkMetal), rx + 2.7, 0.25, rz + 0.5));

  // Personal terminal — wall-mounted
  // mcp:kajuty/terminal (2, 2) 1×0.5
  g.add(p(box(1, 0.8, 0.05, darkMetal), rx + 2.5, 1.2, rz + 2));
  g.add(p(box(0.8, 0.6, 0.04, screenBlue), rx + 2.5, 1.2, rz + 2.05));
  // Terminal desk
  g.add(p(box(1, 0.04, 0.5, metalMat), rx + 2.5, 0.75, rz + 2.25));
  // Chair
  g.add(p(box(0.5, 0.35, 0.5, leatherMat), rx + 2.5, 0.45, rz + 2.8));

  // Lockers — tall storage against south wall
  // mcp:kajuty/lockers (0.3, 3.5) 5×1
  for (let i = 0; i < 4; i++) {
    g.add(p(box(1, 2.2, 0.5, metalMat), rx + 0.8 + i * 1.3, 1.1, rz + 4.2));
    // Locker handle
    g.add(p(box(0.03, 0.15, 0.03, steelMat), rx + 0.4 + i * 1.3, 1.2, rz + 3.95));
    // Name plate (small emissive)
    g.add(p(box(0.4, 0.1, 0.02, screenMat), rx + 0.8 + i * 1.3, 1.9, rz + 3.95));
  }
}

// ═══════════════════════════════════════════════════════════
// STROJOVNA — mcp:strojovna (22,1) 8×12 — engine room
// ═══════════════════════════════════════════════════════════
function furnishStrojovna(g) {
  const rx = 22, rz = 1;

  // ── Reactor core — center ──
  // mcp:strojovna/reactor (2.5, 4) 3×4
  // Outer containment cylinder
  const reactorShell = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2.5, 24, 1, true), darkMetal
  );
  g.add(p(reactorShell, rx + 4, 1.4, rz + 6));

  // Inner glow core
  const reactorCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 2.0, 16), reactorGlow
  );
  g.add(p(reactorCore, rx + 4, 1.3, rz + 6));

  // Reactor base
  const reactorBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.6, 0.3, 24), darkMetal
  );
  g.add(p(reactorBase, rx + 4, 0.25, rz + 6));

  // Reactor top cap
  const reactorCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.3, 0.2, 24), darkMetal
  );
  g.add(p(reactorCap, rx + 4, 2.7, rz + 6));

  // Glow ring around reactor
  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.06, 8, 32), reactorGlow
  );
  glowRing.rotation.x = Math.PI / 2;
  g.add(p(glowRing, rx + 4, 1.0, rz + 6));

  const glowRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.06, 8, 32), reactorGlow
  );
  glowRing2.rotation.x = Math.PI / 2;
  g.add(p(glowRing2, rx + 4, 1.8, rz + 6));

  // ── Engine 1 (north) ──
  // mcp:strojovna/engine1 (6, 1) 1.5×3
  const engine1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, 3, 12), darkMetal
  );
  engine1.rotation.x = Math.PI / 2;
  g.add(p(engine1, rx + 6.75, 1.2, rz + 2.5));
  // Exhaust glow
  const exhaust1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.3, 0.5, 12), exhaustGlow
  );
  exhaust1.rotation.x = Math.PI / 2;
  g.add(p(exhaust1, rx + 7.75, 1.2, rz + 2.5));
  // Engine housing
  g.add(p(box(2, 1.8, 3.5, darkMetal), rx + 6.75, 0.9, rz + 2.5));

  // ── Engine 2 (south) ──
  // mcp:strojovna/engine2 (6, 8) 1.5×3
  const engine2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, 3, 12), darkMetal
  );
  engine2.rotation.x = Math.PI / 2;
  g.add(p(engine2, rx + 6.75, 1.2, rz + 9.5));
  const exhaust2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.3, 0.5, 12), exhaustGlow
  );
  exhaust2.rotation.x = Math.PI / 2;
  g.add(p(exhaust2, rx + 7.75, 1.2, rz + 9.5));
  g.add(p(box(2, 1.8, 3.5, darkMetal), rx + 6.75, 0.9, rz + 9.5));

  // ── Fuel tanks ──
  // mcp:strojovna/fuel1 (0.5, 1) 1×2
  const fuel1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 2, 12), metalMat
  );
  g.add(p(fuel1, rx + 1, 1.1, rz + 2));
  // Fuel gauge
  g.add(p(box(0.15, 0.4, 0.04, screenOrange), rx + 1, 1.5, rz + 1.2));

  // mcp:strojovna/fuel2 (0.5, 9) 1×2
  const fuel2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 2, 12), metalMat
  );
  g.add(p(fuel2, rx + 1, 1.1, rz + 10));
  g.add(p(box(0.15, 0.4, 0.04, screenOrange), rx + 1, 1.5, rz + 10.8));

  // ── Coolant system ──
  // mcp:strojovna/coolant (0.5, 4) 1×4
  g.add(p(box(0.8, 1.5, 0.6, steelMat), rx + 0.9, 0.75, rz + 4.5));
  g.add(p(box(0.8, 1.5, 0.6, steelMat), rx + 0.9, 0.75, rz + 7.5));
  // Coolant pipes connecting to reactor
  g.add(p(box(0.1, 0.1, 1.2, steelMat), rx + 1.3, 1.0, rz + 5.4));
  g.add(p(box(0.1, 0.1, 1.2, steelMat), rx + 1.3, 1.0, rz + 6.6));
  // Coolant status lights
  g.add(p(box(0.1, 0.1, 0.04, screenBlue), rx + 0.9, 1.6, rz + 4.2));
  g.add(p(box(0.1, 0.1, 0.04, screenBlue), rx + 0.9, 1.6, rz + 7.2));

  // ── Power distribution panel ──
  // mcp:strojovna/power (2.5, 0.5) 2×1
  g.add(p(box(2, 2, 0.5, darkMetal), rx + 3.5, 1.0, rz + 1));
  g.add(p(box(0.6, 0.6, 0.04, screenMat), rx + 3.0, 1.3, rz + 0.7));
  g.add(p(box(0.6, 0.6, 0.04, screenOrange), rx + 4.0, 1.3, rz + 0.7));
  // Warning stripes
  g.add(p(box(0.3, 0.1, 0.05, hazardYellow), rx + 2.7, 2.1, rz + 0.7));
  g.add(p(box(0.3, 0.1, 0.05, hazardBlack), rx + 3.0, 2.1, rz + 0.7));
  g.add(p(box(0.3, 0.1, 0.05, hazardYellow), rx + 3.3, 2.1, rz + 0.7));

  // ── Diagnostic console ──
  // mcp:strojovna/diag (2.5, 10.5) 2×1
  g.add(p(box(2, 0.8, 0.8, darkMetal), rx + 3.5, 0.75, rz + 11));
  g.add(p(box(1.6, 0.6, 0.05, screenMat), rx + 3.5, 1.3, rz + 10.6));
  // Chair
  g.add(p(box(0.5, 0.35, 0.5, leatherMat), rx + 3.5, 0.45, rz + 11.5));

  // ── Repair bench ──
  // mcp:strojovna/bench (6, 5) 1.5×2
  g.add(p(box(1.5, 0.8, 2, metalMat), rx + 6.75, 0.4, rz + 6));
  // Tools on bench
  g.add(p(box(0.4, 0.05, 0.1, steelMat), rx + 6.4, 0.83, rz + 5.5));
  g.add(p(box(0.3, 0.05, 0.15, steelMat), rx + 7.0, 0.83, rz + 5.8));
  g.add(p(box(0.15, 0.15, 0.15, redMat), rx + 6.5, 0.88, rz + 6.3));

  // ── Floor hazard stripes around reactor ──
  for (let angle = 0; angle < 8; angle++) {
    const a = (angle / 8) * Math.PI * 2;
    const stripX = rx + 4 + Math.cos(a) * 1.7;
    const stripZ = rz + 6 + Math.sin(a) * 1.7;
    g.add(p(box(0.3, 0.02, 0.1, hazardYellow), stripX, 0.16, stripZ));
  }
}

// ═══════════════════════════════════════════════════════════
// MEDICAL — mcp:medical (15,0.5) 5×5
// ═══════════════════════════════════════════════════════════
function furnishMedical(g) {
  const rx = 15, rz = 0.5;

  // Med bed 1
  // mcp:medical/bed1 (0.5, 0.5) 2×0.8
  g.add(p(box(2, 0.6, 0.8, steelMat), rx + 0.5 + 1, 0.3, rz + 0.5 + 0.4));
  g.add(p(box(1.9, 0.08, 0.7, whiteMat), rx + 1.5, 0.64, rz + 0.9));
  // Side rails
  g.add(p(box(1.8, 0.15, 0.03, steelMat), rx + 1.5, 0.7, rz + 0.5));
  g.add(p(box(1.8, 0.15, 0.03, steelMat), rx + 1.5, 0.7, rz + 1.3));
  // Monitor
  g.add(p(box(0.3, 0.25, 0.05, screenMat), rx + 0.6, 1.2, rz + 0.5));
  // IV stand
  const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), steelMat);
  g.add(p(ivPole, rx + 2.4, 1.4, rz + 0.7));
  g.add(p(box(0.2, 0.03, 0.05, steelMat), rx + 2.4, 2.1, rz + 0.7));

  // Med bed 2
  // mcp:medical/bed2 (0.5, 2) 2×0.8
  g.add(p(box(2, 0.6, 0.8, steelMat), rx + 0.5 + 1, 0.3, rz + 2 + 0.4));
  g.add(p(box(1.9, 0.08, 0.7, whiteMat), rx + 1.5, 0.64, rz + 2.4));
  g.add(p(box(1.8, 0.15, 0.03, steelMat), rx + 1.5, 0.7, rz + 2.0));
  g.add(p(box(1.8, 0.15, 0.03, steelMat), rx + 1.5, 0.7, rz + 2.8));
  g.add(p(box(0.3, 0.25, 0.05, screenMat), rx + 0.6, 1.2, rz + 2.0));

  // Cryo pod — capsule shape
  // mcp:medical/cryo (3, 0.5) 1.5×1.2
  g.add(p(box(1.5, 0.5, 1.2, darkMetal), rx + 3 + 0.75, 0.25, rz + 0.5 + 0.6));  // base
  g.add(p(box(1.4, 0.6, 1.1, darkMetal), rx + 3.75, 0.8, rz + 1.1));  // walls
  // Transparent cryo lid
  g.add(p(box(1.3, 0.08, 1.0, glassMat), rx + 3.75, 1.15, rz + 1.1));
  // Cryo status light
  g.add(p(box(0.3, 0.1, 0.05, screenBlue), rx + 3.75, 0.6, rz + 0.5));
  // Frost effect glow
  g.add(p(box(1.2, 0.02, 0.9, holoMat), rx + 3.75, 0.55, rz + 1.1));

  // Bio-scanner arch
  // mcp:medical/scanner (3, 3) 1.5×1
  // Two pillars + top beam
  g.add(p(box(0.15, 2.2, 0.15, steelMat), rx + 3.2, 1.1, rz + 3.2));
  g.add(p(box(0.15, 2.2, 0.15, steelMat), rx + 4.3, 1.1, rz + 3.2));
  g.add(p(box(1.3, 0.15, 0.2, steelMat), rx + 3.75, 2.2, rz + 3.2));
  // Scanner beam line
  g.add(p(box(1.0, 0.03, 0.03, screenMat), rx + 3.75, 2.1, rz + 3.2));
  // Platform
  g.add(p(box(1.0, 0.05, 0.8, metalMat), rx + 3.75, 0.17, rz + 3.5));

  // Med cabinet — tall box with red cross
  // mcp:medical/cabinet (0.3, 3.5) 0.6×1
  g.add(p(box(0.6, 1.8, 0.4, whiteMat), rx + 0.3 + 0.3, 0.9, rz + 3.5 + 0.2));
  // Red cross
  g.add(p(box(0.3, 0.06, 0.04, redMat), rx + 0.6, 1.5, rz + 3.5));
  g.add(p(box(0.06, 0.3, 0.04, redMat), rx + 0.6, 1.5, rz + 3.5));

  // Defibrillator — wall-mounted
  // mcp:medical/defib (0.3, 4.5) 0.3×0.2
  g.add(p(box(0.3, 0.25, 0.15, redMat), rx + 0.3 + 0.15, 1.3, rz + 4.5 + 0.1));
  g.add(p(box(0.1, 0.05, 0.02, screenRed), rx + 0.45, 1.5, rz + 4.5));
}

// ═══════════════════════════════════════════════════════════
// JIDELNA — mcp:jidelna (8,8.5) 6×5 — mess hall/kitchen
// ═══════════════════════════════════════════════════════════
function furnishJidelna(g) {
  const rx = 8, rz = 8.5;

  // Kitchen block — counter with cabinets
  // mcp:jidelna/kitchen (0.3, 3.5) 5×1
  g.add(p(box(5, 0.9, 0.6, metalMat), rx + 0.3 + 2.5, 0.45, rz + 4));
  g.add(p(box(5, 0.04, 0.6, darkMetal), rx + 2.8, 0.92, rz + 4));  // counter top
  // Upper cabinets
  g.add(p(box(2, 0.6, 0.35, metalMat), rx + 1.3, 1.7, rz + 4.4));
  g.add(p(box(2, 0.6, 0.35, metalMat), rx + 4.3, 1.7, rz + 4.4));

  // Sink
  g.add(p(box(0.6, 0.08, 0.4, steelMat), rx + 1.5, 0.94, rz + 3.9));

  // Stove/heater
  g.add(p(box(0.6, 0.04, 0.5, darkMetal), rx + 3.5, 0.94, rz + 4));
  // Heating elements (orange glow)
  g.add(p(box(0.15, 0.02, 0.15, screenOrange), rx + 3.3, 0.96, rz + 3.9));
  g.add(p(box(0.15, 0.02, 0.15, screenOrange), rx + 3.7, 0.96, rz + 3.9));

  // Dining table — central
  // mcp:jidelna/table (1.5, 1) 3×1.5
  g.add(p(box(3, 0.05, 1.5, metalMat), rx + 1.5 + 1.5, 0.74, rz + 1 + 0.75));
  // Table leg (pedestal)
  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.72, 8), darkMetal);
  g.add(p(tableLeg, rx + 3, 0.36, rz + 1.75));

  // 4 chairs
  // mcp:jidelna/chair1..4
  const chairPositions = [
    [rx + 1.8, rz + 1.3], [rx + 4.2, rz + 1.3],
    [rx + 1.8, rz + 2.2], [rx + 4.2, rz + 2.2],
  ];
  for (const [cx2, cz2] of chairPositions) {
    g.add(p(box(0.4, 0.35, 0.4, leatherMat), cx2, 0.4, cz2));
    g.add(p(box(0.4, 0.35, 0.06, leatherMat), cx2, 0.6, cz2 - 0.17));
  }

  // Food storage — tall unit
  // mcp:jidelna/storage (5, 0.5) 0.8×1
  g.add(p(box(0.8, 2, 1, metalMat), rx + 5 + 0.4, 1.0, rz + 0.5 + 0.5));
  g.add(p(box(0.3, 0.1, 0.04, screenMat), rx + 5.4, 1.5, rz + 0.5));

  // Water dispenser
  // mcp:jidelna/water (5.3, 2) 0.3×0.3
  g.add(p(box(0.3, 1.4, 0.3, steelMat), rx + 5.3 + 0.15, 0.7, rz + 2 + 0.15));
  g.add(p(box(0.1, 0.1, 0.04, screenBlue), rx + 5.45, 1.2, rz + 2));

  // Info display — wall-mounted, moved away from door (door is at x=10..11)
  // mcp:jidelna/display — on south wall, away from door
  g.add(p(box(1.2, 0.8, 0.05, darkMetal), rx + 4.5, 1.6, rz + 0.15));
  g.add(p(box(1.0, 0.6, 0.04, screenBlue), rx + 4.5, 1.6, rz + 0.2));
}

// ═══════════════════════════════════════════════════════════
// ARMORY — mcp:armory (6,8.5) 2×5 — weapons/suits
// ═══════════════════════════════════════════════════════════
function furnishArmory(g) {
  const rx = 6, rz = 8.5;

  // Weapon rack — tall box with horizontal bars
  // mcp:armory/rack — moved deeper into room (door at x=7..8, z=8.5)
  g.add(p(box(1.5, 2.2, 0.5, darkMetal), rx + 0.2 + 0.75, 1.1, rz + 1.2 + 0.25));
  // Horizontal bars (weapon slots)
  for (let i = 0; i < 4; i++) {
    g.add(p(box(1.3, 0.04, 0.04, steelMat), rx + 0.95, 0.5 + i * 0.45, rz + 1.25));
  }
  // Status light
  g.add(p(box(0.2, 0.1, 0.04, screenRed), rx + 0.95, 2.1, rz + 1.25));

  // Suit storage lockers
  // mcp:armory/suits (0.2, 2.5) 1.5×2
  g.add(p(box(0.7, 2.2, 0.5, metalMat), rx + 0.55, 1.1, rz + 3));
  g.add(p(box(0.7, 2.2, 0.5, metalMat), rx + 1.35, 1.1, rz + 3));
  // Suit visors (small glowing detail)
  g.add(p(box(0.15, 0.1, 0.04, screenBlue), rx + 0.55, 1.8, rz + 2.7));
  g.add(p(box(0.15, 0.1, 0.04, screenBlue), rx + 1.35, 1.8, rz + 2.7));

  // Ammo crates — stacked
  // mcp:armory/ammo (0.3, 4) 1×0.8
  g.add(p(box(0.8, 0.3, 0.5, darkMetal), rx + 0.3 + 0.4, 0.15, rz + 4 + 0.25));
  g.add(p(box(0.7, 0.3, 0.45, darkMetal), rx + 0.7, 0.45, rz + 4.25));
  g.add(p(box(0.5, 0.3, 0.4, darkMetal), rx + 0.65, 0.75, rz + 4.2));
  // Hazard markings
  g.add(p(box(0.3, 0.05, 0.05, hazardYellow), rx + 0.7, 0.32, rz + 4));
}

// ═══════════════════════════════════════════════════════════
// LIFE SUPPORT — mcp:life_support (6,0.5) 2×5
// ═══════════════════════════════════════════════════════════
function furnishLifeSupport(g) {
  const rx = 6, rz = 0.5;

  // O2 generator
  // mcp:life_support/o2 (0.2, 0.3) 1.5×1
  g.add(p(box(1.5, 1.5, 1, metalMat), rx + 0.2 + 0.75, 0.75, rz + 0.3 + 0.5));
  g.add(p(box(0.3, 0.15, 0.04, screenMat), rx + 0.95, 1.6, rz + 0.3));
  // O2 label
  g.add(p(box(0.4, 0.1, 0.04, screenBlue), rx + 0.95, 1.3, rz + 0.3));
  // Pipes
  g.add(p(box(0.08, 0.08, 0.5, steelMat), rx + 0.5, 1.5, rz + 1.1));

  // CO2 scrubber
  // mcp:life_support/co2 (0.2, 1.8) 1.5×1
  g.add(p(box(1.5, 1.5, 1, metalMat), rx + 0.2 + 0.75, 0.75, rz + 1.8 + 0.5));
  g.add(p(box(0.3, 0.15, 0.04, screenOrange), rx + 0.95, 1.6, rz + 1.8));
  g.add(p(box(0.08, 0.08, 0.5, steelMat), rx + 0.5, 1.5, rz + 2.6));

  // Water recycler
  // mcp:life_support/water (0.2, 3.3) 1.5×1.2
  g.add(p(box(1.5, 1.5, 1.2, metalMat), rx + 0.2 + 0.75, 0.75, rz + 3.3 + 0.6));
  g.add(p(box(0.3, 0.15, 0.04, screenBlue), rx + 0.95, 1.6, rz + 3.3));
  // Water tank indicator
  const waterTank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 1.0, 8), steelMat
  );
  g.add(p(waterTank, rx + 1.5, 0.65, rz + 4.2));

  // Status panel — master control
  g.add(p(box(0.8, 0.6, 0.05, darkMetal), rx + 0.95, 2.0, rz + 2.3));
  g.add(p(box(0.6, 0.4, 0.04, screenMat), rx + 0.95, 2.0, rz + 2.35));
}

// ═══════════════════════════════════════════════════════════
// CARGO — mcp:cargo (15,8.5) 5×5
// ═══════════════════════════════════════════════════════════
function furnishCargo(g) {
  const rx = 15, rz = 8.5;

  // Rack shelf 1 (left)
  // mcp:cargo/rack1 (0.3, 0.5) 1.5×4
  for (let shelf = 0; shelf < 4; shelf++) {
    g.add(p(box(1.5, 0.05, 1.5, metalMat), rx + 0.3 + 0.75, 0.5 + shelf * 0.6, rz + 0.5 + 0.75));
  }
  // Rack uprights
  g.add(p(box(0.05, 2.4, 0.05, darkMetal), rx + 0.35, 1.2, rz + 0.55));
  g.add(p(box(0.05, 2.4, 0.05, darkMetal), rx + 1.75, 1.2, rz + 0.55));
  g.add(p(box(0.05, 2.4, 0.05, darkMetal), rx + 0.35, 1.2, rz + 1.95));
  g.add(p(box(0.05, 2.4, 0.05, darkMetal), rx + 1.75, 1.2, rz + 1.95));

  // Cargo crates on shelves
  g.add(p(box(0.6, 0.4, 0.5, darkMetal), rx + 0.7, 0.75, rz + 1));
  g.add(p(box(0.5, 0.35, 0.6, metalMat), rx + 1.3, 0.7, rz + 1.2));
  g.add(p(box(0.8, 0.3, 0.4, darkMetal), rx + 0.9, 1.3, rz + 0.9));

  // Rack shelf 2 (right)
  // mcp:cargo/rack2 (3, 0.5) 1.5×4
  for (let shelf = 0; shelf < 4; shelf++) {
    g.add(p(box(1.5, 0.05, 1.5, metalMat), rx + 3 + 0.75, 0.5 + shelf * 0.6, rz + 0.5 + 0.75));
  }
  g.add(p(box(0.05, 2.4, 0.05, darkMetal), rx + 3.05, 1.2, rz + 0.55));
  g.add(p(box(0.05, 2.4, 0.05, darkMetal), rx + 4.45, 1.2, rz + 0.55));
  g.add(p(box(0.05, 2.4, 0.05, darkMetal), rx + 3.05, 1.2, rz + 1.95));
  g.add(p(box(0.05, 2.4, 0.05, darkMetal), rx + 4.45, 1.2, rz + 1.95));

  // More crates
  g.add(p(box(0.7, 0.45, 0.6, darkMetal), rx + 3.5, 0.75, rz + 1.1));
  g.add(p(box(0.5, 0.3, 0.5, metalMat), rx + 4.0, 1.3, rz + 1.0));

  // Floor crates (large)
  // mcp:cargo/crate_floor (1, 3) 2.5×1.5
  g.add(p(box(1.2, 0.8, 1.0, darkMetal), rx + 1.6, 0.4, rz + 3.5));
  g.add(p(box(1.0, 0.6, 0.8, metalMat), rx + 3.0, 0.3, rz + 3.8));
  g.add(p(box(0.8, 0.5, 0.6, darkMetal), rx + 3.5, 0.65, rz + 3.3));

  // Cargo manifest terminal — moved to west wall, away from door (door at x=17..18)
  g.add(p(box(0.05, 0.8, 0.5, darkMetal), rx + 0.15, 1.2, rz + 2.5));
  g.add(p(box(0.04, 0.6, 0.4, screenMat), rx + 0.2, 1.2, rz + 2.5));
}

// ═══════════════════════════════════════════════════════════
// ESCAPE PODS — capsule shapes on north/south sides
// ═══════════════════════════════════════════════════════════
function furnishEscapePods(g) {
  const orangeMat = new THREE.MeshLambertMaterial({ color: 0xff6600, side: DS });
  const orangeGlow = new THREE.MeshLambertMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 0.2, side: DS });

  // Escape pod left (north) — mcp:escape_pod_l (20,0) 2×1
  // Capsule body
  g.add(p(box(1.6, 1.8, 0.8, orangeMat), 21, 1.0, 0.5));
  // Window
  g.add(p(box(0.6, 0.4, 0.05, glassMat), 21, 1.4, 0.05));
  // Status light
  g.add(p(box(0.15, 0.15, 0.05, screenMat), 20.3, 1.8, 0.05));
  // Hatch frame
  g.add(p(box(0.8, 1.5, 0.05, darkMetal), 21, 0.9, 1.0));
  // Interior seat
  g.add(p(box(0.5, 0.3, 0.5, leatherMat), 21, 0.35, 0.5));

  // Escape pod right (south) — mcp:escape_pod_r (20,13) 2×1
  g.add(p(box(1.6, 1.8, 0.8, orangeMat), 21, 1.0, 13.5));
  g.add(p(box(0.6, 0.4, 0.05, glassMat), 21, 1.4, 13.95));
  g.add(p(box(0.15, 0.15, 0.05, screenMat), 20.3, 1.8, 13.95));
  g.add(p(box(0.8, 1.5, 0.05, darkMetal), 21, 0.9, 13.0));
  g.add(p(box(0.5, 0.3, 0.5, leatherMat), 21, 0.35, 13.5));
}

// ═══════════════════════════════════════════════════════════
// AIRLOCK — mcp:airlock (15,13.5) 3×0.5
// ═══════════════════════════════════════════════════════════
function furnishAirlock(g) {
  const rx = 15, rz = 13.5;

  // Hazard stripes on floor (alternating yellow/black)
  for (let i = 0; i < 6; i++) {
    const mat = i % 2 === 0 ? hazardYellow : hazardBlack;
    g.add(p(box(0.5, 0.02, 0.4, mat), rx + 0.25 + i * 0.5, 0.17, rz + 0.25));
  }

  // Control panel — right side
  g.add(p(box(0.3, 0.4, 0.1, darkMetal), rx + 2.8, 1.2, rz + 0.1));
  g.add(p(box(0.2, 0.2, 0.04, screenRed), rx + 2.8, 1.2, rz + 0.05));

  // Pressure indicator
  g.add(p(box(0.15, 0.15, 0.04, screenMat), rx + 0.2, 1.5, rz + 0.1));

  // Warning lights (ceiling)
  g.add(p(box(0.1, 0.08, 0.1, screenRed), rx + 0.5, FH - 0.1, rz + 0.25));
  g.add(p(box(0.1, 0.08, 0.1, screenRed), rx + 2.5, FH - 0.1, rz + 0.25));
}

// ═══════════════════════════════════════════════════════════
// WC — mcp:wc (14.5,0.5) 0.5×5
// ═══════════════════════════════════════════════════════════
function furnishWC(g) {
  const rx = 14.5, rz = 0.5;

  // Toilet
  // mcp:wc/toilet (0.05, 1) 0.4×0.5
  g.add(p(box(0.35, 0.35, 0.45, whiteMat), rx + 0.25, 0.175, rz + 1 + 0.225));
  g.add(p(box(0.3, 0.2, 0.15, whiteMat), rx + 0.25, 0.3, rz + 1.4));

  // Sink
  // mcp:wc/sink (0.05, 2.5) 0.4×0.3
  g.add(p(box(0.35, 0.06, 0.3, whiteMat), rx + 0.25, 0.8, rz + 2.5 + 0.15));
  // Mirror
  const mirror = plane(0.3, 0.5, glassMat);
  mirror.rotation.y = Math.PI / 2;
  g.add(p(mirror, rx + 0.5, 1.3, rz + 2.65));

  // Shower head (small ceiling mount)
  // mcp:wc/shower (0.05, 3.5) 0.4×1
  const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.05, 8), steelMat);
  g.add(p(showerHead, rx + 0.25, 2.5, rz + 4));
  // Drain
  g.add(p(box(0.3, 0.02, 0.8, darkMetal), rx + 0.25, 0.16, rz + 4));
}
