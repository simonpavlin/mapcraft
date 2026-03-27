import * as THREE from 'three';
import { box, wallWithOpenings, addWindow, addDoor, addFloor, addCeiling, MAT, boxWithOpenings } from '../../building-utils.js';
import plan from './plan.json';

const DS = THREE.FrontSide;
const wallMat = new THREE.MeshLambertMaterial({ color: 0xe0d8c8, side: DS });
const floorMat = new THREE.MeshLambertMaterial({ color: 0xc4a06a, side: DS });
const shaftWallMat = new THREE.MeshLambertMaterial({ color: 0x999999, side: DS });
const shaftFloorMat = new THREE.MeshLambertMaterial({ color: 0x777777, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

function getChildren(node) {
  return node.c ? Object.entries(node.c) : [];
}

function findByTag(node, tag) {
  return getChildren(node)
    .filter(([, c]) => c.t?.includes(tag))
    .map(([id, c]) => ({ id, ...c }));
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ════════════════════════════════════════════════
// GENERIC FLOOR BUILDER — uses opening tag
// ════════════════════════════════════════════════

function buildFloor(g, floorNode, floorY, shafts) {
  const wallH = floorNode.h3 || 3;
  const walls = findByTag(floorNode, 'wall');
  const openings = findByTag(floorNode, 'opening');
  const rooms = findByTag(floorNode, 'room');
  const windows = findByTag(floorNode, 'window');
  const doors = findByTag(floorNode, 'door');

  // Also collect openings from sibling shafts that apply to this floor's height range
  const shaftOpenings = [];
  for (const shaft of shafts) {
    for (const op of findByTag(shaft, 'opening')) {
      const opZ = op.z ?? 0;
      const opTop = op.h3 ? opZ + op.h3 : (shaft.h3 ?? 9);
      // Only include if opening's z range overlaps this floor
      if (opZ < floorY + wallH && opTop > floorY) {
        // Convert from shaft-relative to floor-relative coordinates
        shaftOpenings.push({
          ...op,
          x: shaft.x + op.x,
          y: shaft.y + op.y,
          z: opZ - floorY,       // relative to this floor
          h3: op.h3,
        });
      }
    }
  }
  const allOpenings = [...openings, ...shaftOpenings];

  // ── WALLS with automatic opening cuts ──
  for (const wall of walls) {
    const isHoriz = wall.w > wall.h;
    const length = isHoriz ? wall.w : wall.h;

    const wallOpenings = [];
    for (const op of allOpenings) {
      if (rectsOverlap(wall.x, wall.y, wall.w, wall.h, op.x, op.y, op.w, op.h)) {
        const bottom = op.z ?? 0;
        const top = op.h3 ? bottom + op.h3 : wallH;
        if (isHoriz) {
          wallOpenings.push({ start: op.x - wall.x, end: op.x - wall.x + op.w, bottom, top });
        } else {
          wallOpenings.push({ start: op.y - wall.y, end: op.y - wall.y + op.h, bottom, top });
        }
      }
    }

    wallWithOpenings(g, {
      axis: isHoriz ? 'x' : 'z',
      x: wall.x, z: wall.y,
      length, height: wallH, y: floorY,
      material: wallMat, openings: wallOpenings,
    });
  }

  // ── FLOORS & CEILINGS per room (skip shafts — they have their own floor only at bottom) ──
  for (const room of rooms) {
    addFloor(g, room.x, room.y, room.w, room.h, floorY, floorMat);
    addCeiling(g, room.x, room.y, room.w, room.h, wallH, floorY);
  }

  // ── WINDOW visuals (sill/win from metadata, opening z/h3 is just the hole) ──
  for (const win of windows) {
    const isHoriz = win.w > win.h;
    const winWidth = isHoriz ? win.w : win.h;
    const sill = win.m?.sill_height ?? win.z ?? 0.9;
    const winH = win.m?.win_height ?? win.h3 ?? 1.5;
    addWindow(g, {
      axis: isHoriz ? 'x' : 'z',
      x: win.x, z: win.y,
      at: winWidth / 2, width: winWidth,
      sillHeight: sill, winHeight: winH, y: floorY,
      hasCurtains: false, hasSill: true,
    });
  }

  // ── DOOR visuals ──
  for (const door of doors) {
    const isHoriz = door.w > door.h;
    const doorH = door.h3 ?? 2.1;
    if (isHoriz) {
      addDoor(g, { axis: 'x', x: door.x, z: door.y, at: door.w / 2, width: door.w - 0.02, y: floorY, doorHeight: doorH });
    } else {
      addDoor(g, { axis: 'z', x: door.x, z: door.y, at: door.h / 2, width: door.h - 0.02, y: floorY, doorHeight: doorH });
    }
  }
}

// ════════════════════════════════════════════════
// SHAFT — continuous through all floors
// ════════════════════════════════════════════════

function buildShaft(g, shaft) {
  const sx = shaft.x, sz = shaft.y;
  const sw = shaft.w, sh = shaft.h;
  const bottom = shaft.z ?? 0;
  const totalH = shaft.h3 ?? 9;

  // Shaft has no own walls — openings cut into surrounding floor walls
  // Only generate floor (at bottom) and ceiling (at top)
  // Door visuals for shaft openings
  const doors = findByTag(shaft, 'door');
  for (const door of doors) {
    const isHoriz = door.w > door.h;
    const doorH = door.h3 ?? 2.1;
    const doorY = door.z ?? 0;
    const gx = sx + door.x, gz = sz + door.y;
    if (isHoriz) {
      addDoor(g, { axis: 'x', x: gx, z: gz, at: door.w / 2, width: door.w - 0.02, y: doorY, doorHeight: doorH });
    } else {
      addDoor(g, { axis: 'z', x: gx, z: gz, at: door.h / 2, width: door.h - 0.02, y: doorY, doorHeight: doorH });
    }
  }

  // Shaft floor (only at bottom)
  addFloor(g, sx, sz, sw, sh, bottom, shaftFloorMat);

  // Shaft ceiling/top
  g.add(p(box(sw, 0.1, sh, shaftFloorMat), sx + sw / 2, bottom + totalH + 0.05, sz + sh / 2));
}

// ════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════

export function createSimpleHouse(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  const budova = plan.c.budova;
  if (!budova) return g;

  // Build floors
  const shafts = findByTag(budova, 'shaft');
  for (const [, floor] of getChildren(budova)) {
    if (!floor.t?.includes('floor')) continue;
    buildFloor(g, floor, floor.z ?? 0, shafts);
  }

  // Build shafts (continuous through all floors)
  for (const shaft of shafts) {
    buildShaft(g, shaft);
  }

  // Roof
  const topZ = 9;
  g.add(p(box(8.2, 0.15, 6.2, MAT.roof), 4, topZ + 0.075, 3));

  scene.add(g);
  return g;
}
