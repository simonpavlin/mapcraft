import * as THREE from 'three';
import {
  wallWithOpenings, addWindow, addDoor,
  addFloor, addCeiling, addFlatRoof, addFloorOverlay,
  MAT, box, plane
} from './building-utils.js';

const DS = THREE.FrontSide;
const FH = 3.2;

// Materials
const m = {
  road: new THREE.MeshLambertMaterial({ color: 0x555555, side: DS }),
  sidewalk: new THREE.MeshLambertMaterial({ color: 0xaaa898, side: DS }),
  grass: new THREE.MeshLambertMaterial({ color: 0x4a7c2e, side: DS }),
  garden: new THREE.MeshLambertMaterial({ color: 0x3a6a22, side: DS }),
  terrace: new THREE.MeshLambertMaterial({ color: 0xb09070, side: DS }),
  pool: new THREE.MeshLambertMaterial({ color: 0x4488cc, opacity: 0.6, transparent: true, side: DS }),
  poolEdge: new THREE.MeshLambertMaterial({ color: 0x88aacc, side: DS }),
  fence: new THREE.MeshLambertMaterial({ color: 0x888070, side: DS }),
  garage: new THREE.MeshLambertMaterial({ color: 0xc0b8a8, side: DS }),
  garageDoor: new THREE.MeshLambertMaterial({ color: 0x666666, side: DS }),
  trunk: new THREE.MeshLambertMaterial({ color: 0x6b4226, side: DS }),
  leaves: new THREE.MeshLambertMaterial({ color: 0x2d5a1e, side: DS }),
  bench: new THREE.MeshLambertMaterial({ color: 0x7a5a30, side: DS }),
  fountain: new THREE.MeshLambertMaterial({ color: 0x999090, side: DS }),
  water: new THREE.MeshLambertMaterial({ color: 0x5588aa, side: DS }),
  // House variants
  wallA: new THREE.MeshLambertMaterial({ color: 0xf0e8d8, side: DS }),
  wallB: new THREE.MeshLambertMaterial({ color: 0xd8d0c0, side: DS }),
  wallC: new THREE.MeshLambertMaterial({ color: 0xe8e0cc, side: DS }),
  wallD: new THREE.MeshLambertMaterial({ color: 0xf5f0e8, side: DS }),
  accentA: new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: DS }),
  accentB: new THREE.MeshLambertMaterial({ color: 0x5a3a20, side: DS }),
  accentC: new THREE.MeshLambertMaterial({ color: 0x2a4a2a, side: DS }),
  accentD: new THREE.MeshLambertMaterial({ color: 0x2a2a4a, side: DS }),
  roofA: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: DS }),
  roofB: new THREE.MeshLambertMaterial({ color: 0x5a3a20, side: DS }),
  roofC: new THREE.MeshLambertMaterial({ color: 0x3a4a3a, side: DS }),
  roofD: new THREE.MeshLambertMaterial({ color: 0x2a2a3a, side: DS }),
};

function pos(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

export function createCtvrt(scene) {
  const g = new THREE.Group();

  buildRoads(g);
  buildHouseA(g, 3 + 3, 3 + 5);    // pozemek_a(3,3) + dum offset (3,5)
  buildHouseB(g, 38 + 5, 3 + 5);   // pozemek_b(38,3) + dum offset (5,5)
  buildHouseC(g, 3 + 3, 47 + 3);   // pozemek_c(3,47) + dum offset (3,3)
  buildHouseD(g, 38 + 6, 47 + 3);  // pozemek_d(38,47) + dum offset (6,3)

  buildGarage(g, 3 + 17.5, 3 + 8, 6, 6, m.wallA);   // A garáž
  buildGarage(g, 38 + 2, 3 + 8, 3, 6, m.wallB);      // B garáž (menší)
  buildGarage(g, 3 + 18, 47 + 5, 6, 6, m.wallC);     // C garáž
  buildSmallGarage(g, 38 + 2, 47 + 5, 3, 6, m.wallD); // D garáž

  buildTerraces(g);
  buildGardens(g);
  buildPoolD(g);
  buildPark(g);

  scene.add(g);
}

// ═══════════════════════════════
// ROADS
// ═══════════════════════════════

function buildRoads(g) {
  // Main road y=36..44 → z=36..44
  const road = box(120, 0.08, 8, m.road);
  g.add(pos(road, 60, 0.04, 40));
  // Sidewalks
  g.add(pos(box(120, 0.06, 1.5, m.sidewalk), 60, 0.03, 35));
  g.add(pos(box(120, 0.06, 1.5, m.sidewalk), 60, 0.03, 45));

  // Driveways
  for (const [dx, dz, dw, dd] of [[20, 20, 5, 16], [50, 20, 5, 16], [20, 44, 5, 16], [50, 44, 5, 16]]) {
    g.add(pos(box(dw, 0.07, dd, m.road), dx + dw / 2, 0.035, dz + dd / 2));
  }

  // Road markings
  for (let i = 0; i < 20; i++) {
    const mark = box(3, 0.005, 0.15, new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: DS }));
    g.add(pos(mark, 3 + i * 6, 0.09, 40));
  }
}

// ═══════════════════════════════
// HOUSE BUILDER — generic 2-story house
// ═══════════════════════════════

function buildHouse(g, hx, hz, wallMat, accentMat, roofMat, layout) {
  const W = 14, D = 12;

  for (let f = 0; f < 2; f++) {
    const y = f * FH;
    addFloor(g, hx, hz, W, D, y);
    addCeiling(g, hx, hz, W, D, FH, y);
  }
  addFlatRoof(g, hx, hz, W, D, FH * 2, 0.3, roofMat);

  // Build walls per floor from layout
  for (const floor of layout) {
    const y = floor.y;
    // Outer walls with all openings for this floor
    buildOuterWalls(g, hx, hz, W, D, y, wallMat, accentMat, floor.openings);

    // Inner walls
    for (const iw of (floor.innerWalls || [])) {
      wallWithOpenings(g, {
        axis: iw.axis, x: hx + iw.x, z: hz + iw.z,
        length: iw.length, height: FH, y,
        thickness: 0.12, material: MAT.wallInner,
        openings: iw.openings || [],
      });
      // Add doors in inner wall openings
      for (const op of (iw.doors || [])) {
        addDoor(g, { axis: iw.axis, x: hx + iw.x, z: hz + iw.z, at: op.at, width: op.w, y, material: MAT.door });
      }
    }

    // Windows
    for (const w of (floor.windows || [])) {
      addWindow(g, { axis: w.axis, x: hx + w.x, z: hz + w.z, at: w.at, width: w.w, sillHeight: w.sill, winHeight: w.h, y });
    }
  }

  // Stairs — disabled (addUTurnStairs removed)
  // if (layout[0].stairs) {
  //   const s = layout[0].stairs;
  //   addUTurnStairs(g, {
  //     x: hx + s.x, z: hz + s.z, width: s.w, depth: s.d,
  //     entryY: 0, exitY: FH, entrySide: s.side,
  //   });
  // }
}

function buildOuterWalls(g, hx, hz, W, D, y, wallMat, accentMat, openings) {
  const sides = { north: [], south: [], west: [], east: [] };
  for (const op of (openings || [])) {
    sides[op.side].push(op);
  }

  // North (z=0)
  wallWithOpenings(g, { axis: 'x', x: hx, z: hz, length: W, height: FH, y, thickness: 0.15, material: wallMat,
    openings: sides.north.map(o => ({ start: o.start, end: o.end, bottom: o.bottom || 0, top: o.top || FH }))
  });
  // South
  wallWithOpenings(g, { axis: 'x', x: hx, z: hz + D, length: W, height: FH, y, thickness: 0.15, material: wallMat,
    openings: sides.south.map(o => ({ start: o.start, end: o.end, bottom: o.bottom || 0, top: o.top || FH }))
  });
  // West
  wallWithOpenings(g, { axis: 'z', x: hx, z: hz, length: D, height: FH, y, thickness: 0.15, material: accentMat,
    openings: sides.west.map(o => ({ start: o.start, end: o.end, bottom: o.bottom || 0, top: o.top || FH }))
  });
  // East
  wallWithOpenings(g, { axis: 'z', x: hx + W, z: hz, length: D, height: FH, y, thickness: 0.15, material: accentMat,
    openings: sides.east.map(o => ({ start: o.start, end: o.end, bottom: o.bottom || 0, top: o.top || FH }))
  });
}

// ═══════════════════════════════
// HOUSE A
// ═══════════════════════════════

function buildHouseA(g, hx, hz) {
  buildHouse(g, hx, hz, m.wallA, m.accentA, m.roofA, [
    { // Přízemí
      y: 0,
      stairs: { x: 8.5, z: 0, w: 3, d: 4.5, side: 'north' },
      openings: [
        { side: 'north', start: 5, end: 6.2, top: 2.2 },       // vstupní dveře
        { side: 'north', start: 1.5, end: 2.3, bottom: 1.2, top: 2.0 }, // WC okno
        { side: 'south', start: 1, end: 3.5, bottom: 0.3, top: 2.7 },   // obývák panorama
        { side: 'south', start: 2, end: 5, top: 2.4 },          // terasa dveře
        { side: 'south', start: 10, end: 12, bottom: 0.8, top: 2.3 },   // kuchyně okno
        { side: 'west', start: 6, end: 8, bottom: 0.4, top: 2.6 },      // obývák okno
        { side: 'east', start: 5.5, end: 6.5, top: 2.2 },       // garáž dveře
        { side: 'east', start: 8, end: 9.5, bottom: 0.8, top: 2.3 },    // kuchyně okno
      ],
      innerWalls: [
        { axis: 'z', x: 3.5, z: 0, length: 3, openings: [{ start: 1, end: 1.9 }], doors: [{ at: 1.45, w: 0.9 }] }, // WC
        { axis: 'x', x: 0, z: 3.5, length: 8, openings: [{ start: 4.5, end: 6.5 }], doors: [] },  // vstup/obývák
        { axis: 'z', x: 8.5, z: 0, length: 5, openings: [{ start: 1.5, end: 2.5 }], doors: [{ at: 2, w: 1 }] },  // vstup/schody
        { axis: 'z', x: 8, z: 5, length: 7, openings: [{ start: 2, end: 3.5 }], doors: [] },  // obývák/kuchyně
        { axis: 'x', x: 8.5, z: 5, length: 5.5, openings: [], doors: [] },  // kuchyně sever
      ],
      windows: [
        { axis: 'x', x: 0, z: hz + 12 - hz, at: 2.25, w: 2.5, sill: 0.3, h: 2.4 },
        { axis: 'x', x: 0, z: hz + 12 - hz, at: 11, w: 2, sill: 0.8, h: 1.5 },
        { axis: 'z', x: 0, z: 0, at: 7, w: 2, sill: 0.4, h: 2.2 },
        { axis: 'z', x: 14, z: 0, at: 8.75, w: 1.5, sill: 0.8, h: 1.5 },
      ],
    },
    { // 2. patro
      y: FH,
      openings: [
        { side: 'north', start: 3, end: 5.5, bottom: 0.5, top: 2.5 },   // ložnice okno
        { side: 'south', start: 2, end: 4, bottom: 0.5, top: 2.3 },     // dětský okno
        { side: 'south', start: 9, end: 11, bottom: 0.5, top: 2.5 },    // pracovna okno
        { side: 'west', start: 1.5, end: 3.5, bottom: 0.5, top: 2.5 },  // ložnice okno
        { side: 'west', start: 9, end: 10.5, bottom: 0.5, top: 2.3 },   // dětský okno
      ],
      innerWalls: [
        { axis: 'x', x: 0, z: 4.5, length: 14, openings: [{ start: 3, end: 4 }, { start: 9, end: 10.5 }], doors: [{ at: 3.5, w: 1 }, { at: 9.75, w: 1.5 }] },
        { axis: 'x', x: 0, z: 6.5, length: 14, openings: [{ start: 3, end: 4 }, { start: 10, end: 11 }], doors: [{ at: 3.5, w: 1 }, { at: 10.5, w: 1 }] },
        { axis: 'z', x: 8, z: 0, length: 4.5, openings: [{ start: 3, end: 3.9 }], doors: [{ at: 3.45, w: 0.9 }] },
        { axis: 'z', x: 6.5, z: 7, length: 5, openings: [], doors: [] },
        { axis: 'z', x: 12, z: 0, length: 6.5, openings: [{ start: 5, end: 5.9 }], doors: [{ at: 5.45, w: 0.9 }] },
      ],
      windows: [
        { axis: 'x', x: 0, z: 0, at: 4.25, w: 2.5, sill: 0.5, h: 2 },
        { axis: 'x', x: 0, z: 12, at: 3, w: 2, sill: 0.5, h: 1.8 },
        { axis: 'x', x: 0, z: 12, at: 10, w: 2, sill: 0.5, h: 2 },
        { axis: 'z', x: 0, z: 0, at: 2.5, w: 2, sill: 0.5, h: 2 },
        { axis: 'z', x: 0, z: 0, at: 9.75, w: 1.5, sill: 0.5, h: 1.8 },
      ],
    },
  ]);
  furnishHouseA(g, hx, hz);
}

function furnishHouseA(g, hx, hz) {
  // Přízemí
  g.add(pos(box(2.5, 0.4, 1, MAT.door), hx + 1 + 1.25, 0.35, hz + 5 + 0.5)); // pohovka
  g.add(pos(box(1.2, 0.03, 0.6, MAT.floor), hx + 1.5 + 0.6, 0.4, hz + 7 + 0.3)); // stolek
  g.add(pos(box(1.5, 0.5, 0.3, MAT.wallInner), hx + 1 + 0.75, 0.25, hz + 10 + 0.2)); // TV stolek
  g.add(pos(box(0.6, 1.9, 5, MAT.wallBathroom), hx + 13 + 0.3, 0.95, hz + 6 + 2.5)); // linka
  g.add(pos(box(2, 0.04, 1.2, MAT.floor), hx + 9.5 + 1, 0.74, hz + 8.5 + 0.6)); // jídelní stůl
  g.add(pos(box(0.7, 1.9, 0.65, MAT.wallInner), hx + 12 + 0.35, 0.95, hz + 5.5 + 0.325)); // lednice

  // 2. patro
  const y = FH;
  g.add(pos(box(2, 0.35, 2.2, MAT.floor), hx + 2.5 + 1, y + 0.275, hz + 0.5 + 1.1)); // postel
  g.add(pos(box(1.8, 0.15, 2.1, MAT.ceiling), hx + 2.5 + 0.9, y + 0.5, hz + 0.5 + 1.05)); // matrace
  g.add(pos(box(0.6, 2, 2, MAT.door), hx + 6.5 + 0.3, y + 1, hz + 0.3 + 1)); // skříň
  g.add(pos(box(1, 0.35, 2, MAT.floor), hx + 0.5 + 0.5, y + 0.275, hz + 8 + 1)); // postel dětská
  g.add(pos(box(1.5, 0.04, 0.7, MAT.floor), hx + 4 + 0.75, y + 0.72, hz + 10.5 + 0.35)); // stůl dětský
  g.add(pos(box(2, 0.04, 0.8, MAT.floor), hx + 8 + 1, y + 0.72, hz + 7.5 + 0.4)); // pracovní stůl
  g.add(pos(box(0.4, 2, 3, MAT.door), hx + 13 + 0.2, y + 1, hz + 8 + 1.5)); // knihovna
}

// ═══════════════════════════════
// HOUSE B — vstup ze západu, pracovna na severu
// ═══════════════════════════════

function buildHouseB(g, hx, hz) {
  buildHouse(g, hx, hz, m.wallB, m.accentB, m.roofB, [
    { y: 0,
      stairs: { x: 0, z: 5.5, w: 3, d: 4, side: 'north' },
      openings: [
        { side: 'west', start: 2, end: 3.2, top: 2.2 },       // vstup
        { side: 'west', start: 4, end: 5, top: 2.2 },          // garáž
        { side: 'south', start: 2, end: 5, bottom: 0.2, top: 2.8 },    // panorama
        { side: 'south', start: 5, end: 8, top: 2.4 },         // terasa dveře
        { side: 'south', start: 9, end: 12, bottom: 0.2, top: 2.8 },   // panorama 2
        { side: 'east', start: 1, end: 3, bottom: 0.5, top: 2.5 },     // pracovna
        { side: 'east', start: 8, end: 10, bottom: 0.4, top: 2.6 },    // obývák
        { side: 'north', start: 6, end: 8, bottom: 0.8, top: 2.3 },    // pracovna sever
      ],
      innerWalls: [
        { axis: 'z', x: 3.5, z: 0, length: 5, openings: [{ start: 2, end: 3 }], doors: [{ at: 2.5, w: 1 }] },
        { axis: 'z', x: 4, z: 0, length: 4.5, openings: [{ start: 2, end: 3 }], doors: [{ at: 2.5, w: 1 }] },
        { axis: 'x', x: 0, z: 5, length: 14, openings: [{ start: 2, end: 3.5 }], doors: [] },
        { axis: 'z', x: 9.5, z: 0, length: 2.5, openings: [{ start: 1, end: 1.9 }], doors: [{ at: 1.45, w: 0.9 }] },
        { axis: 'x', x: 9.5, z: 2.5, length: 2.5, openings: [], doors: [] },
      ],
      windows: [
        { axis: 'x', x: 0, z: 12, at: 3.5, w: 3, sill: 0.2, h: 2.6 },
        { axis: 'x', x: 0, z: 12, at: 10.5, w: 3, sill: 0.2, h: 2.6 },
        { axis: 'z', x: 14, z: 0, at: 2, w: 2, sill: 0.5, h: 2 },
        { axis: 'z', x: 14, z: 0, at: 9, w: 2, sill: 0.4, h: 2.2 },
        { axis: 'x', x: 0, z: 0, at: 7, w: 2, sill: 0.8, h: 1.5 },
      ],
    },
    { y: FH,
      openings: [
        { side: 'north', start: 3, end: 6, bottom: 0.4, top: 2.8 },    // master
        { side: 'south', start: 2, end: 4, bottom: 0.5, top: 2.3 },    // dětský 1
        { side: 'south', start: 9.5, end: 11.5, bottom: 0.5, top: 2.3 }, // dětský 2
        { side: 'west', start: 1.5, end: 3.5, bottom: 0.5, top: 2.5 }, // master západ
      ],
      innerWalls: [
        { axis: 'x', x: 0, z: 4, length: 14, openings: [{ start: 5, end: 6.2 }], doors: [{ at: 5.6, w: 1.2 }] },
        { axis: 'x', x: 3.5, z: 4.5, length: 7, openings: [{ start: 1, end: 2.5 }, { start: 5, end: 6.5 }], doors: [{ at: 1.75, w: 1.5 }, { at: 5.75, w: 1.5 }] },
        { axis: 'x', x: 0, z: 6.5, length: 14, openings: [{ start: 3, end: 4 }, { start: 9, end: 10 }], doors: [{ at: 3.5, w: 1 }, { at: 9.5, w: 1 }] },
        { axis: 'z', x: 10, z: 0, length: 4, openings: [{ start: 2, end: 2.9 }], doors: [{ at: 2.45, w: 0.9 }] },
        { axis: 'z', x: 6.5, z: 7, length: 5, openings: [], doors: [] },
      ],
      windows: [
        { axis: 'x', x: 0, z: 0, at: 4.5, w: 3, sill: 0.4, h: 2.4 },
        { axis: 'x', x: 0, z: 12, at: 3, w: 2, sill: 0.5, h: 1.8 },
        { axis: 'x', x: 0, z: 12, at: 10.5, w: 2, sill: 0.5, h: 1.8 },
        { axis: 'z', x: 0, z: 0, at: 2.5, w: 2, sill: 0.5, h: 2 },
      ],
    },
  ]);
  furnishHouseB(g, hx, hz);
}

function furnishHouseB(g, hx, hz) {
  g.add(pos(box(2.5, 0.4, 1, MAT.door), hx + 5 + 1.25, 0.35, hz + 6 + 0.5));
  g.add(pos(box(1.5, 0.5, 0.2, MAT.wallAccent), hx + 5 + 0.75, 1.5, hz + 10.5));
  g.add(pos(box(0.6, 1.9, 6, MAT.wallBathroom), hx + 12.5 + 0.3, 0.95, hz + 5.5 + 3));
  g.add(pos(box(2, 0.9, 0.8, MAT.wallAccent), hx + 10 + 1, 0.45, hz + 8 + 0.4));
  g.add(pos(box(2, 0.04, 0.8, MAT.floor), hx + 5 + 1, 0.72, hz + 0.5 + 0.4));
  const y = FH;
  g.add(pos(box(2.2, 0.35, 2.5, MAT.floor), hx + 3.5 + 1.1, y + 0.275, hz + 0.5 + 1.25));
  g.add(pos(box(1, 0.35, 2, MAT.floor), hx + 1 + 0.5, y + 0.275, hz + 8 + 1));
  g.add(pos(box(1, 0.35, 2, MAT.floor), hx + 8 + 0.5, y + 0.275, hz + 8 + 1));
}

// ═══════════════════════════════
// HOUSE C — schody vlevo, kuchyně vlevo, obývák s krbem vpravo
// ═══════════════════════════════

function buildHouseC(g, hx, hz) {
  buildHouse(g, hx, hz, m.wallC, m.accentC, m.roofC, [
    { y: 0,
      stairs: { x: 0, z: 0, w: 2.5, d: 4, side: 'north' },
      openings: [
        { side: 'north', start: 6.5, end: 7.7, top: 2.2 },     // vstup
        { side: 'south', start: 1.5, end: 3.5, bottom: 0.8, top: 2.3 }, // kuchyně
        { side: 'south', start: 3, end: 5.5, top: 2.4 },       // terasa
        { side: 'south', start: 9, end: 12, bottom: 0.3, top: 2.7 },   // obývák panorama
        { side: 'west', start: 7, end: 9, bottom: 0.8, top: 2.3 },     // kuchyně západ
        { side: 'east', start: 9, end: 11, bottom: 0.3, top: 2.7 },    // obývák východ
      ],
      innerWalls: [
        { axis: 'z', x: 5, z: 0, length: 4.5, openings: [{ start: 3.5, end: 4.5 }], doors: [{ at: 4, w: 1 }] },
        { axis: 'z', x: 2.5, z: 0, length: 4, openings: [{ start: 1.5, end: 2.5 }], doors: [{ at: 2, w: 1 }] },
        { axis: 'z', x: 5.5, z: 4.5, length: 7.5, openings: [{ start: 1, end: 2.5 }, { start: 3.5, end: 5.5 }], doors: [] },
        { axis: 'x', x: 6, z: 8, length: 8, openings: [{ start: 1, end: 3 }], doors: [] },
        { axis: 'z', x: 10.5, z: 4, length: 4, openings: [{ start: 1.5, end: 2.4 }], doors: [{ at: 1.95, w: 0.9 }] },
        { axis: 'x', x: 10.5, z: 8, length: 3.5, openings: [], doors: [] },
      ],
      windows: [
        { axis: 'x', x: 0, z: 12, at: 2.5, w: 2, sill: 0.8, h: 1.5 },
        { axis: 'x', x: 0, z: 12, at: 10.5, w: 3, sill: 0.3, h: 2.4 },
        { axis: 'z', x: 0, z: 0, at: 8, w: 2, sill: 0.8, h: 1.5 },
        { axis: 'z', x: 14, z: 0, at: 10, w: 2, sill: 0.3, h: 2.4 },
      ],
    },
    { y: FH,
      openings: [
        { side: 'north', start: 8, end: 11, bottom: 0.4, top: 2.6 },   // ložnice
        { side: 'south', start: 7, end: 9, bottom: 0.5, top: 2.3 },    // dětský
        { side: 'east', start: 2, end: 4, bottom: 0.5, top: 2.5 },     // ložnice východ
        { side: 'east', start: 6, end: 7.2, top: 2.2 },                // balkon
        { side: 'west', start: 9.5, end: 11, bottom: 0.5, top: 2.3 },  // hobby
      ],
      innerWalls: [
        { axis: 'z', x: 2.5, z: 0, length: 8, openings: [{ start: 2, end: 3 }], doors: [{ at: 2.5, w: 1 }] },
        { axis: 'z', x: 5, z: 0, length: 5.5, openings: [{ start: 2, end: 3 }], doors: [{ at: 2.5, w: 1 }] },
        { axis: 'x', x: 0, z: 4.5, length: 4, openings: [{ start: 2, end: 3 }], doors: [{ at: 2.5, w: 1 }] },
        { axis: 'z', x: 5, z: 6, length: 6, openings: [{ start: 2, end: 3 }], doors: [{ at: 2.5, w: 1 }] },
        { axis: 'x', x: 0, z: 8.5, length: 4.5, openings: [{ start: 2, end: 3 }], doors: [{ at: 2.5, w: 1 }] },
      ],
      windows: [
        { axis: 'x', x: 0, z: 0, at: 9.5, w: 3, sill: 0.4, h: 2.2 },
        { axis: 'x', x: 0, z: 12, at: 8, w: 2, sill: 0.5, h: 1.8 },
        { axis: 'z', x: 14, z: 0, at: 3, w: 2, sill: 0.5, h: 2 },
        { axis: 'z', x: 0, z: 0, at: 10.25, w: 1.5, sill: 0.5, h: 1.8 },
      ],
    },
  ]);
  // Fireplace in obývák
  g.add(pos(box(1, 2.5, 0.3, new THREE.MeshLambertMaterial({ color: 0x555050, side: DS })), hx + 13 + 0.5, 1.25, hz + 9.5 + 0.75));
  g.add(pos(box(2.5, 0.4, 1, MAT.door), hx + 7 + 1.25, 0.35, hz + 9.5 + 0.5));
  const y = FH;
  g.add(pos(box(2, 0.35, 2.2, MAT.floor), hx + 7 + 1, y + 0.275, hz + 1 + 1.1));
  g.add(pos(box(1, 0.35, 2, MAT.floor), hx + 6 + 0.5, y + 0.275, hz + 7 + 1));
}

// ═══════════════════════════════
// HOUSE D — moderní, prosklený, s bazénem
// ═══════════════════════════════

function buildHouseD(g, hx, hz) {
  buildHouse(g, hx, hz, m.wallD, m.accentD, m.roofD, [
    { y: 0,
      stairs: { x: 0, z: 4.5, w: 3, d: 4.5, side: 'north' },
      openings: [
        { side: 'west', start: 1.5, end: 2.7, top: 2.2 },       // vstup
        { side: 'west', start: 3.5, end: 4.5, top: 2.2 },       // garáž
        { side: 'north', start: 4, end: 13, bottom: 0.2, top: 3 },    // celá fasáda
        { side: 'south', start: 4, end: 8, bottom: 0.8, top: 2.3 },   // kuchyně
        { side: 'south', start: 10, end: 13.5, bottom: 0.2, top: 2.8 }, // jídelna + folding
        { side: 'east', start: 2, end: 4, bottom: 0.3, top: 2.7 },    // obývák
        { side: 'east', start: 8, end: 10, bottom: 0.3, top: 2.7 },   // jídelna
      ],
      innerWalls: [
        { axis: 'z', x: 3.5, z: 0, length: 12, openings: [{ start: 2, end: 3.5 }, { start: 8, end: 9.5 }], doors: [] },
        { axis: 'z', x: 9.5, z: 6.5, length: 5.5, openings: [], doors: [] },
        { axis: 'x', x: 3.5, z: 6.5, length: 6, openings: [], doors: [] },
        { axis: 'x', x: 0, z: 9, length: 3, openings: [{ start: 1.5, end: 2.5 }], doors: [{ at: 2, w: 1 }] },
      ],
      windows: [
        { axis: 'x', x: 0, z: 0, at: 8.5, w: 9, sill: 0.2, h: 2.8 },
        { axis: 'x', x: 0, z: 12, at: 6, w: 4, sill: 0.8, h: 1.5 },
        { axis: 'x', x: 0, z: 12, at: 11.75, w: 3.5, sill: 0.2, h: 2.6 },
        { axis: 'z', x: 14, z: 0, at: 3, w: 2, sill: 0.3, h: 2.4 },
        { axis: 'z', x: 14, z: 0, at: 9, w: 2, sill: 0.3, h: 2.4 },
      ],
    },
    { y: FH,
      openings: [
        { side: 'north', start: 6, end: 10, bottom: 0.3, top: 2.7 },   // galerie
        { side: 'east', start: 5, end: 7, bottom: 0.5, top: 2.5 },     // ložnice
        { side: 'south', start: 5, end: 6.5, bottom: 1, top: 2 },      // šatna
        { side: 'south', start: 10.5, end: 12.5, bottom: 0.5, top: 2.3 }, // host
        { side: 'west', start: 1.5, end: 3, bottom: 0.8, top: 2.3 },   // pracovna
      ],
      innerWalls: [
        { axis: 'x', x: 3.5, z: 3, length: 10.5, openings: [{ start: 2.5, end: 3.7 }], doors: [{ at: 3.1, w: 1.2 }] },
        { axis: 'z', x: 10.5, z: 3.5, length: 5, openings: [{ start: 2, end: 3 }], doors: [{ at: 2.5, w: 1 }] },
        { axis: 'x', x: 3.5, z: 8.5, length: 10.5, openings: [{ start: 1.5, end: 2.5 }, { start: 6.5, end: 7.5 }], doors: [{ at: 2, w: 1 }, { at: 7, w: 1 }] },
        { axis: 'z', x: 7.5, z: 9, length: 3, openings: [], doors: [] },
        { axis: 'z', x: 3, z: 0, length: 4, openings: [{ start: 1, end: 2.5 }], doors: [] },
        { axis: 'x', x: 0, z: 4, length: 3, openings: [{ start: 1, end: 2 }], doors: [{ at: 1.5, w: 1 }] },
      ],
      windows: [
        { axis: 'x', x: 0, z: 0, at: 8, w: 4, sill: 0.3, h: 2.4 },
        { axis: 'z', x: 14, z: 0, at: 6, w: 2, sill: 0.5, h: 2 },
        { axis: 'x', x: 0, z: 12, at: 5.75, w: 1.5, sill: 1, h: 1 },
        { axis: 'x', x: 0, z: 12, at: 11.5, w: 2, sill: 0.5, h: 1.8 },
        { axis: 'z', x: 0, z: 0, at: 2.25, w: 1.5, sill: 0.8, h: 1.5 },
      ],
    },
  ]);
  g.add(pos(box(3, 0.4, 1, MAT.door), hx + 5 + 1.5, 0.35, hz + 1 + 0.5));
  g.add(pos(box(2.5, 0.9, 0.8, MAT.wallAccent), hx + 5 + 1.25, 0.45, hz + 8 + 0.4));
  g.add(pos(box(4, 0.9, 0.6, MAT.wallBathroom), hx + 3.8 + 2, 0.45, hz + 11 + 0.3));
  g.add(pos(box(2.5, 0.04, 1.5, MAT.floor), hx + 10.5 + 1.25, 0.74, hz + 8.5 + 0.75));
  const y = FH;
  g.add(pos(box(2.2, 0.35, 2.5, MAT.floor), hx + 5.5 + 1.1, y + 0.275, hz + 4 + 1.25));
  g.add(pos(box(1.5, 0.35, 2, MAT.floor), hx + 9 + 0.75, y + 0.275, hz + 9.5 + 1));
  g.add(pos(box(2, 0.04, 0.8, MAT.floor), hx + 0.3 + 1, y + 0.72, hz + 0.5 + 0.4));
}

// ═══════════════════════════════
// GARAGES
// ═══════════════════════════════

function buildGarage(g, gx, gz, gw, gd, wallMat) {
  addFloor(g, gx, gz, gw, gd, 0, MAT.floorDark);
  wallWithOpenings(g, { axis: 'x', x: gx, z: gz, length: gw, height: 3, thickness: 0.15, material: wallMat, openings: [{ start: 1, end: gw - 1, top: 2.5 }] });
  wallWithOpenings(g, { axis: 'x', x: gx, z: gz + gd, length: gw, height: 3, thickness: 0.15, material: wallMat });
  wallWithOpenings(g, { axis: 'z', x: gx, z: gz, length: gd, height: 3, thickness: 0.15, material: wallMat });
  wallWithOpenings(g, { axis: 'z', x: gx + gw, z: gz, length: gd, height: 3, thickness: 0.15, material: wallMat });
  addFlatRoof(g, gx, gz, gw, gd, 3, 0.2, MAT.roof);
  // Garage door
  g.add(pos(box(gw - 2, 2.5, 0.08, m.garageDoor), gx + gw / 2, 1.25, gz));
}

function buildSmallGarage(g, gx, gz, gw, gd, wallMat) {
  buildGarage(g, gx, gz, gw, gd, wallMat);
}

// ═══════════════════════════════
// TERRACES, GARDENS, POOL
// ═══════════════════════════════

function buildTerraces(g) {
  for (const [tx, tz, tw, td] of [[3+3, 3+18, 10, 5], [38+5, 3+18, 10, 4], [3+3, 47+16, 10, 4]]) {
    g.add(pos(box(tw, 0.08, td, m.terrace), tx + tw/2, 0.04, tz + td/2));
    // Planks
    for (let i = 0; i < td * 2; i++) {
      g.add(pos(box(tw - 0.2, 0.005, 0.03, MAT.stairRail), tx + tw/2, 0.085, tz + 0.2 + i * 0.48));
    }
  }
}

function buildGardens(g) {
  // Garden hedges as borders
  for (const [px, pz, pw, pd] of [[3, 3, 28, 30], [38, 3, 28, 30], [3, 47, 28, 30], [38, 47, 28, 30]]) {
    // Low hedge around pozemek
    for (const [hx, hz, hw, hd] of [
      [px, pz, pw, 0.3], [px, pz + pd - 0.3, pw, 0.3],
      [px, pz, 0.3, pd], [px + pw - 0.3, pz, 0.3, pd],
    ]) {
      g.add(pos(box(hw, 0.8, hd, m.garden), hx + hw/2, 0.4, hz + hd/2));
    }
    // Garden trees
    addTree(g, px + 2, pz + 1.5);
    addTree(g, px + pw - 3, pz + pd - 2);
  }
}

function buildPoolD(g) {
  // Pool at pozemek_d: (38+8, 47+17) 6×4
  const px = 46, pz = 64, pw = 6, pd = 4;
  g.add(pos(box(pw, 0.1, pd, m.poolEdge), px + pw/2, -0.3, pz + pd/2));
  const w = plane(pw - 0.4, pd - 0.4, m.pool);
  w.rotation.x = -Math.PI / 2;
  g.add(pos(w, px + pw/2, -0.05, pz + pd/2));
  // Edges
  for (const [ex, ez, ew, ed] of [[px-0.2, pz-0.2, pw+0.4, 0.4], [px-0.2, pz+pd-0.2, pw+0.4, 0.4], [px-0.2, pz, 0.4, pd], [px+pw-0.2, pz, 0.4, pd]]) {
    g.add(pos(box(ew, 0.12, ed, m.poolEdge), ex + ew/2, 0.06, ez + ed/2));
  }
  // Deck around pool
  g.add(pos(box(pw + 2, 0.06, pd + 2, m.terrace), px + pw/2, 0.03, pz + pd/2));
}

function buildPark(g) {
  const px = 75, pz = 10;
  // Park grass
  g.add(pos(box(40, 0.02, 60, m.garden), px + 20, 0.01, pz + 30));

  // Path through park
  g.add(pos(box(40, 0.07, 3, m.sidewalk), px + 20, 0.035, pz + 28 + 1.5));

  // Fountain at (17,26) 4×4
  const fx = px + 17, fz = pz + 26;
  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 0.5, 16), m.fountain);
  g.add(pos(fountainBase, fx + 2, 0.25, fz + 2));
  const fountainWater = new THREE.Mesh(new THREE.CircleGeometry(1.8, 16), m.water);
  fountainWater.rotation.x = -Math.PI / 2;
  g.add(pos(fountainWater, fx + 2, 0.45, fz + 2));
  const fountainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8), m.fountain);
  g.add(pos(fountainPillar, fx + 2, 1.2, fz + 2));

  // Trees
  for (const [tx, tz] of [[5,8],[15,10],[30,12],[10,40],[28,18],[8,48],[35,45],[20,50]]) {
    addTree(g, px + tx, pz + tz);
  }

  // Benches
  for (const [bx, bz] of [[8,15],[25,40]]) {
    g.add(pos(box(2, 0.5, 0.4, m.bench), px + bx + 1, 0.25, pz + bz + 0.2));
    g.add(pos(box(2, 0.3, 0.06, m.bench), px + bx + 1, 0.55, pz + bz));
  }
}

function addTree(g, x, z) {
  const h = 3 + Math.random() * 3;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, h, 8), m.trunk);
  g.add(pos(trunk, x, h / 2, z));
  const r = 1.2 + Math.random() * 0.8;
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), m.leaves);
  g.add(pos(canopy, x, h + r * 0.4, z));
}
