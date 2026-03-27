import * as THREE from 'three';
import { box, wallWithOpenings, addWindow, addDoor, addFloor, addCeiling, MAT, boxWithOpenings } from '../../building-utils.js';
import createWardrobe from '../wardrobe/model.js';
import { createEntranceDoor } from './entrance-door.js';
import plan from './plan.json';

// ════════════════════════════════════════════════
// MATERIALS
// ════════════════════════════════════════════════

const DS = THREE.FrontSide;
const panelWall = new THREE.MeshLambertMaterial({ color: 0xd0c8b8, side: DS });
const panelWallAccent = new THREE.MeshLambertMaterial({ color: 0xb8b0a0, side: DS });
const innerWall = new THREE.MeshLambertMaterial({ color: 0xf0ece4, side: DS });
const bathWall = new THREE.MeshLambertMaterial({ color: 0xe0e0ea, side: DS });
const floorWood = new THREE.MeshLambertMaterial({ color: 0xc4a06a, side: DS });
const floorTile = new THREE.MeshLambertMaterial({ color: 0xc8c8d0, side: DS });
const floorTerrace = new THREE.MeshLambertMaterial({ color: 0xb09070, side: DS });
const concrete = new THREE.MeshLambertMaterial({ color: 0x999999, side: DS });
const stairMat = new THREE.MeshLambertMaterial({ color: 0x888888, side: DS });
const railMat = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const bedMat = new THREE.MeshLambertMaterial({ color: 0xeeddcc, side: DS });
const woodFurn = new THREE.MeshLambertMaterial({ color: 0x8b6b3a, side: DS });
const sofaMat = new THREE.MeshLambertMaterial({ color: 0x5566aa, side: DS });
const kitchenMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: DS });
const bathFurn = new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: DS });
const greenMat = new THREE.MeshLambertMaterial({ color: 0x4a8c2e, side: DS });
const dirtMat = new THREE.MeshLambertMaterial({ color: 0x6b5030, side: DS });
const pergolaMat = new THREE.MeshLambertMaterial({ color: 0x8b6b3a, side: DS });

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// ════════════════════════════════════════════════
// DATA HELPERS — extract from MCP JSON
// ════════════════════════════════════════════════

function getChildren(node) {
  return node.c ? Object.entries(node.c) : [];
}

function findByTag(node, tag) {
  const results = [];
  for (const [id, child] of getChildren(node)) {
    if (child.t && child.t.includes(tag)) results.push({ id, ...child });
    // recurse into children
    results.push(...findByTag(child, tag));
  }
  return results;
}

function findDirectByTag(node, tag) {
  return getChildren(node)
    .filter(([, c]) => {
      const resolved = resolveStamp(c);
      return resolved.t && resolved.t.includes(tag);
    })
    .map(([id, c]) => ({ id, ...resolveStamp(c), ...c, c: { ...resolveStamp(c).c, ...c.c } }));
}

// Resolve stamp: merge template data with stamp overrides
function resolveStamp(node) {
  if (!node.ref) return node;
  const tmpl = resolveRefPath(node.ref);
  if (!tmpl) return node;
  const rot = node.r || 0;
  const swapped = rot === 90 || rot === 270;
  return {
    ...tmpl,
    ...node,
    w: node.w || (swapped ? tmpl.h : tmpl.w),
    h: node.h || (swapped ? tmpl.w : tmpl.h),
    t: node.t || tmpl.t,
    m: { ...tmpl.m, ...node.m },
    c: tmpl.c,
  };
}

function resolveRefPath(refPath) {
  // ref is like "panelak/sablony/okno_150" — first segment is root node (plan itself), skip it
  const parts = refPath.split('/');
  let node = plan;
  for (let i = 1; i < parts.length; i++) {
    node = node?.c?.[parts[i]];
    if (!node) return null;
  }
  return node;
}

// ════════════════════════════════════════════════
// WALL GENERATION — universal 'opening' tag cuts holes
// ════════════════════════════════════════════════

function buildWallsForApt(g, apt, gx, gz, floorY, wallH) {
  const walls = findDirectByTag(apt, 'wall');
  const allOpenings = findDirectByTag(apt, 'opening');

  for (const wall of walls) {
    const wx = gx + wall.x;
    const wz = gz + wall.y;
    const ww = wall.w;
    const wh = wall.h;

    const isHoriz = ww > wh;
    const length = isHoriz ? ww : wh;

    // Find all 'opening' objects that overlap this wall → cut holes
    const openings = [];
    for (const op of allOpenings) {
      const ox = gx + op.x;
      const oz = gz + op.y;

      if (rectsOverlap(wx, wz, ww, wh, ox, oz, op.w, op.h)) {
        const bottom = op.z ?? 0;
        const top = op.h3 ? bottom + op.h3 : wallH;
        if (isHoriz) {
          openings.push({ start: ox - wx, end: ox - wx + op.w, bottom, top });
        } else {
          openings.push({ start: oz - wz, end: oz - wz + op.h, bottom, top });
        }
      }
    }

    const isOuter = wall.x === 0 || wall.y === 0 ||
      (wall.x + wall.w >= apt.w - 0.1) || (wall.y + wall.h >= apt.h - 0.1);
    const mat = isOuter ? panelWall : innerWall;
    const axis = isHoriz ? 'x' : 'z';
    wallWithOpenings(g, { axis, x: wx, z: wz, length, height: wallH, y: floorY, material: mat, openings });
  }

  // Add window glass + door panels (visual elements, separate from openings)
  const windows = findDirectByTag(apt, 'window');
  for (const win of windows) {
    const sill = win.m?.sill_height ?? 0.9;
    const winH = win.m?.win_height ?? 1.5;
    const isHoriz = win.w > win.h;
    const winWidth = isHoriz ? win.w : win.h;
    // Detect pane style from metadata or window width
    let panes = win.m?.panes ?? null;
    if (!panes) {
      if (winWidth >= 1.8) panes = '3_leaf';
      else if (winWidth >= 1.3) panes = '2_leaf_ventilacka';
      else if (winWidth >= 0.8) panes = '1_leaf_ventilacka';
    }

    // Detect interior side from stamp rotation
    // Template outside marker is at y=-0.15 (exterior = -y = north in template space)
    // Stamp rotation transforms exterior direction:
    //   rot=0   → exterior is -y (plan) → -z (3D) → interior at +z → interiorSide=+1
    //   rot=180 → exterior is +y (plan) → +z (3D) → interior at -z → interiorSide=-1
    //   rot=270 → exterior is -x (plan) → -x (3D) → interior at +x → interiorSide=+1
    //   rot=90  → exterior is +x (plan) → +x (3D) → interior at -x → interiorSide=-1
    const rot = win.r || 0;
    const interiorSide = (rot === 0 || rot === 270) ? 1 : -1;

    addWindow(g, {
      axis: isHoriz ? 'x' : 'z',
      x: gx + win.x, z: gz + win.y,
      at: winWidth / 2, width: winWidth,
      sillHeight: sill, winHeight: winH, y: floorY,
      panes, interiorSide,
    });
  }

  const doors = findDirectByTag(apt, 'door');
  for (const door of doors) {
    const isHoriz = door.w > door.h;
    if (isHoriz) {
      addDoor(g, {
        axis: 'x', x: gx + door.x, z: gz + door.y,
        at: door.w / 2, width: door.w - 0.02, y: floorY,
      });
    } else {
      addDoor(g, {
        axis: 'z', x: gx + door.x, z: gz + door.y,
        at: door.h / 2, width: door.h - 0.02, y: floorY,
      });
    }
  }
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ════════════════════════════════════════════════
// FURNITURE — simple boxes from MCP data
// ════════════════════════════════════════════════

const FURN_STYLES = {
  'Postel': { h: 0.4, mat: () => bedMat },
  'Postel dvoulůžko': { h: 0.4, mat: () => bedMat },
  'Postel king-size': { h: 0.4, mat: () => bedMat },
  'Dětská postel': { h: 0.35, mat: () => bedMat },
  'Noční stolek': { h: 0.45, mat: () => woodFurn },
  'Šatní skříň': { h: 2.0, mat: () => woodFurn },
  'Skříň': { h: 2.0, mat: () => woodFurn },
  'Skříňka': { h: 1.2, mat: () => woodFurn },
  'Pohovka': { h: 0.7, mat: () => sofaMat },
  'Rohová pohovka': { h: 0.7, mat: () => sofaMat },
  'TV stolek': { h: 0.45, mat: () => woodFurn },
  'Konferenční stůl': { h: 0.4, mat: () => woodFurn },
  'Jídelní stůl': { h: 0.75, mat: () => woodFurn },
  'Venkovní stůl': { h: 0.75, mat: () => woodFurn },
  'Kuchyňská linka': { h: 0.9, mat: () => kitchenMat },
  'Kuchyňský ostrůvek': { h: 0.9, mat: () => kitchenMat },
  'Kuchyňský kout': { h: 0.9, mat: () => kitchenMat },
  'Lednice': { h: 1.8, mat: () => kitchenMat },
  'Židle': { h: 0.45, mat: () => woodFurn },
  'Barové židle': { h: 0.7, mat: () => woodFurn },
  'Vana': { h: 0.55, mat: () => bathFurn },
  'Volně stojící vana': { h: 0.55, mat: () => bathFurn },
  'Umyvadlo': { h: 0.85, mat: () => bathFurn },
  'Dvojité umyvadlo': { h: 0.85, mat: () => bathFurn },
  'Pračka': { h: 0.85, mat: () => bathFurn },
  'Walk-in sprcha': { h: 0.05, mat: () => floorTile },
  'Sprchový kout': { h: 0.05, mat: () => floorTile },
  'Psací stůl': { h: 0.75, mat: () => woodFurn },
  'Knihovna': { h: 1.8, mat: () => woodFurn },
  'Stojany na kola': { h: 1.2, mat: () => railMat },
  'Prostor kočárky': { h: 0.1, mat: () => concrete },
  'Poštovní schránky': { h: 1.4, mat: () => railMat },
  'Lavička': { h: 0.45, mat: () => woodFurn },
};

const WARDROBE_NAMES = new Set(['Šatní skříň', 'Skříň']);

function buildFurniture(g, room, gx, gz, floorY) {
  for (const [, child] of getChildren(room)) {
    if (!child.t || !child.t.includes('furniture')) continue;

    // Handle stamped objects (have ref and _body child)
    let fw = child.w, fh = child.h, name = child.n;
    if (child.c && child.c._body) {
      fw = fw || child.c._body.w;
      fh = fh || child.c._body.h;
      name = name || child.c._body.n;
    }
    if (!fw || !fh) continue;

    // Detailed wardrobe model for wardrobes
    if (WARDROBE_NAMES.has(name)) {
      const wardrobe = createWardrobe({ width: fw, height: 2.0, depth: fh });
      wardrobe.position.set(gx + child.x, floorY, gz + child.y);
      g.add(wardrobe);
      continue;
    }

    const style = FURN_STYLES[name] || { h: 0.5, mat: () => woodFurn };
    const fY = style.h;
    const mat = style.mat();

    const fx = gx + child.x + fw / 2;
    const fz = gz + child.y + fh / 2;
    g.add(p(box(fw, fY, fh, mat), fx, floorY + fY / 2, fz));
  }
}

function buildRoomFurniture(g, apt, gx, gz, floorY) {
  // Furniture in rooms (children of rooms)
  for (const [, room] of getChildren(apt)) {
    if (!room.t || !room.t.includes('room')) continue;
    buildFurniture(g, room, gx + room.x, gz + room.y, floorY);
  }
  // Furniture directly in apartment
  buildFurniture(g, apt, gx, gz, floorY);
}

// ════════════════════════════════════════════════
// STAIRS — detailed, reads individual steps from MCP template
// ════════════════════════════════════════════════

// Resolve stamp: if node has no children, read from template
function resolveStairTemplate(stairNode) {
  if (stairNode.c && Object.keys(stairNode.c).length > 0) return stairNode;
  const tmpl = plan.c?.sablony?.c?.schodiste;
  if (tmpl && tmpl.c) return { ...stairNode, c: tmpl.c };
  return stairNode;
}

// Collect openings on a staircase wall from all children of floorNode
function collectStairOpenings(floorNode, wallAxis, wallPos, wallStart, wallLen, tolerance) {
  const openings = [];
  for (const [, child] of getChildren(floorNode)) {
    const resolved = resolveStamp(child);
    if (!resolved.t) continue;

    // Search for 'opening' tagged objects inside apartments/rooms
    const ops = findByTag(child, 'opening');
    for (const op of ops) {
      const gx = child.x + (op.x ?? 0);
      const gz = child.y + (op.y ?? 0);
      const ow = op.w, oh = op.h;
      const bottom = op.z ?? 0;
      const top = op.h3 ? bottom + op.h3 : 3;

      if (wallAxis === 'z') {
        if (Math.abs(gx - wallPos) < tolerance || Math.abs(gx + ow - wallPos) < tolerance) {
          openings.push({ start: gz - wallStart, end: gz - wallStart + oh, bottom, top });
        }
      } else {
        if (Math.abs(gz - wallPos) < tolerance || Math.abs(gz + oh - wallPos) < tolerance) {
          openings.push({ start: gx - wallStart, end: gx - wallStart + ow, bottom, top });
        }
      }
    }

    // Floor-level openings (direct children of floorNode)
    if (resolved.t.includes('opening')) {
      const gx = child.x, gz = child.y;
      const ow = resolved.w || child.w, oh = resolved.h || child.h;
      const bottom = resolved.z ?? 0;
      const top = resolved.h3 ? bottom + resolved.h3 : 3;

      if (wallAxis === 'x' && (Math.abs(gz - wallPos) < tolerance || Math.abs(gz + oh - wallPos) < tolerance)) {
        openings.push({ start: gx - wallStart, end: gx - wallStart + ow, bottom, top });
      }
      if (wallAxis === 'z' && (Math.abs(gx - wallPos) < tolerance || Math.abs(gx + ow - wallPos) < tolerance)) {
        openings.push({ start: gz - wallStart, end: gz - wallStart + oh, bottom, top });
      }
    }
  }
  return openings;
}

function buildStaircase(g, stairNode, floorNode, floorY) {
  const resolved = resolveStairTemplate(stairNode);
  const sx = resolved.x;
  const sz = resolved.y;
  const sw = resolved.w;
  const sh = resolved.h;
  const wallH = 3;

  // ── STAIRCASE WALLS — openings cut by universal 'opening' tag ──
  const westOps = collectStairOpenings(floorNode, 'z', sx, sz, sh, 0.4);
  wallWithOpenings(g, { axis: 'z', x: sx, z: sz, length: sh, height: wallH, y: floorY, material: panelWall, openings: westOps });

  const eastOps = collectStairOpenings(floorNode, 'z', sx + sw, sz, sh, 0.4);
  wallWithOpenings(g, { axis: 'z', x: sx + sw, z: sz, length: sh, height: wallH, y: floorY, material: panelWall, openings: eastOps });

  const northOps = collectStairOpenings(floorNode, 'x', sz, sx, sw, 0.4);
  wallWithOpenings(g, { axis: 'x', x: sx, z: sz, length: sw, height: wallH, y: floorY, material: panelWall, openings: northOps });

  const southOps = collectStairOpenings(floorNode, 'x', sz + sh, sx, sw, 0.4);
  wallWithOpenings(g, { axis: 'x', x: sx, z: sz + sh, length: sw, height: wallH, y: floorY, material: panelWall, openings: southOps });

  // Door panels for openings tagged 'door' near staircase
  for (const [, child] of getChildren(floorNode)) {
    const rc = resolveStamp(child);
    if (!rc.t) continue;
    const doors = findByTag(child, 'door').filter(d => d.t?.includes('opening'));
    for (const d of doors) {
      const gx = child.x + (d.x ?? 0);
      const gz = child.y + (d.y ?? 0);
      const isHoriz = d.w > d.h;
      // Only render if near staircase walls
      const nearStair = (Math.abs(gx - sx) < 0.4 || Math.abs(gx + d.w - sx) < 0.4 ||
        Math.abs(gx - sx - sw) < 0.4 || Math.abs(gx + d.w - sx - sw) < 0.4 ||
        Math.abs(gz - sz) < 0.4 || Math.abs(gz + d.h - sz) < 0.4 ||
        Math.abs(gz - sz - sh) < 0.4 || Math.abs(gz + d.h - sz - sh) < 0.4);
      if (!nearStair) continue;
      if (isHoriz) {
        addDoor(g, { axis: 'x', x: gx, z: gz, at: d.w / 2, width: d.w * 0.9, y: floorY });
      } else {
        addDoor(g, { axis: 'z', x: gx, z: gz, at: d.h / 2, width: d.h * 0.9, y: floorY });
      }
    }
  }

  // ── STEPS, LANDINGS, RAILINGS from template ──
  for (const [, child] of getChildren(resolved)) {

    // Steps
    if (child.t && child.t.includes('stairs')) {
      const rx = sx + child.x;
      const rz = sz + child.y;
      const rw = child.m?.step_w ?? child.w ?? 1.2;
      const stepH = child.m?.step_h ?? 0.15;
      const stepD = child.m?.step_d ?? 0.3;

      const steps = getChildren(child).filter(([, s]) => s.t && s.t.includes('step'));
      for (const [, step] of steps) {
        const zRel = step.m?.z_rel ?? 0;
        const sy = floorY + zRel;
        const stepZ = rz + step.y + stepD / 2;
        g.add(p(box(rw, stepH, stepD, stairMat), rx + rw / 2, sy - stepH / 2, stepZ));
        // Nosing
        g.add(p(box(rw + 0.02, 0.02, 0.03, railMat), rx + rw / 2, sy, stepZ - stepD / 2));
      }

      if (steps.length === 0) {
        // Fallback from metadata
        const n = child.m?.steps ?? 10;
        const zS = child.m?.z_start_rel ?? 0;
        const dir = child.m?.direction ?? 'south_to_north';
        for (let i = 0; i < n; i++) {
          const sy = floorY + zS + (i + 1) * stepH;
          const szi = dir === 'south_to_north'
            ? rz + child.h - i * stepD - stepD / 2
            : rz + i * stepD + stepD / 2;
          g.add(p(box(rw, stepH, stepD, stairMat), rx + rw / 2, sy - stepH / 2, szi));
        }
      }
    }

    // Landings
    if (child.t && child.t.includes('landing')) {
      const lx = sx + child.x;
      const lz = sz + child.y;
      const zRel = child.m?.z_rel ?? 0;
      g.add(p(box(child.w, 0.15, child.h, concrete), lx + child.w / 2, floorY + zRel + 0.075, lz + child.h / 2));
    }

    // Railings
    if (child.t && child.t.includes('railing') && !child.t.includes('wall_rail')) {
      const rx = sx + child.x;
      const rz = sz + child.y;
      const rH = child.m?.height ?? 1.0;
      const isHoriz = child.w > child.h;

      if (isHoriz) {
        // Horizontal railing on landing
        g.add(p(box(child.w, 0.04, 0.04, railMat), rx + child.w / 2, floorY + rH, rz));
        const count = Math.max(2, Math.floor(child.w / 0.12));
        for (let i = 0; i <= count; i++) {
          g.add(p(box(0.015, rH, 0.015, railMat), rx + i * child.w / count, floorY + rH / 2, rz));
        }
      } else {
        // Vertical railing along shaft
        g.add(p(box(0.04, 0.04, child.h, railMat), rx, floorY + rH, rz + child.h / 2));
        g.add(p(box(0.04, 0.04, child.h, railMat), rx, floorY + rH + 1.5, rz + child.h / 2));
        const count = Math.max(2, Math.floor(child.h / 0.12));
        for (let i = 0; i <= count; i++) {
          g.add(p(box(0.015, rH + 1.5, 0.015, railMat), rx, floorY + (rH + 1.5) / 2, rz + i * child.h / count));
        }
      }
    }
  }
}

// ════════════════════════════════════════════════
// TERRACE — garden beds, pergola, railings
// ════════════════════════════════════════════════

function buildTerrace(g, terrace, gx, gz, floorY) {
  const tx = gx + terrace.x;
  const tz = gz + terrace.y;

  // Floor
  addFloor(g, tx, tz, terrace.w, terrace.h, floorY, floorTerrace);

  for (const [, child] of getChildren(terrace)) {
    const cx = tx + child.x;
    const cz = tz + child.y;

    if (child.t && child.t.includes('garden')) {
      // Raised bed
      const bedH = child.m?.height ?? 0.6;
      g.add(p(box(child.w, bedH, child.h, dirtMat), cx + child.w / 2, floorY + bedH / 2, cz + child.h / 2));
      // Plants on top
      g.add(p(box(child.w - 0.1, 0.3, child.h - 0.1, greenMat), cx + child.w / 2, floorY + bedH + 0.15, cz + child.h / 2));
    }

    if (child.t && child.t.includes('structure') && child.n?.includes('Pergola')) {
      const pH = child.m?.height ?? 2.5;
      // 4 posts
      const posts = [[0.1, 0.1], [child.w - 0.1, 0.1], [0.1, child.h - 0.1], [child.w - 0.1, child.h - 0.1]];
      for (const [px, pz] of posts) {
        g.add(p(box(0.12, pH, 0.12, pergolaMat), cx + px, floorY + pH / 2, cz + pz));
      }
      // Top beams
      g.add(p(box(child.w, 0.1, 0.12, pergolaMat), cx + child.w / 2, floorY + pH, cz + 0.1));
      g.add(p(box(child.w, 0.1, 0.12, pergolaMat), cx + child.w / 2, floorY + pH, cz + child.h - 0.1));
      // Cross slats
      for (let i = 0; i < 5; i++) {
        const sz = cz + 0.1 + (child.h - 0.2) * i / 4;
        g.add(p(box(child.w - 0.2, 0.06, 0.08, pergolaMat), cx + child.w / 2, floorY + pH + 0.05, sz));
      }
    }

    if (child.t && child.t.includes('furniture')) {
      const style = FURN_STYLES[child.n] || { h: 0.45, mat: () => woodFurn };
      g.add(p(box(child.w, style.h, child.h, style.mat()), cx + child.w / 2, floorY + style.h / 2, cz + child.h / 2));
    }
  }

  // Railing from wall tagged objects
  for (const [, child] of getChildren(terrace)) {
    if (child.t && child.t.includes('wall') && child.m?.type === 'railing') {
      const rx = tx + child.x;
      const rz = tz + child.y;
      const rH = child.m?.height ?? 1.2;
      const isH = child.w > child.h;
      if (isH) {
        g.add(p(box(child.w, rH, 0.08, railMat), rx + child.w / 2, floorY + rH / 2, rz));
      } else {
        g.add(p(box(0.08, rH, child.h, railMat), rx, floorY + rH / 2, rz + child.h / 2));
      }
    }
  }
}

// ════════════════════════════════════════════════
// FLOOR SLAB GENERATION
// ════════════════════════════════════════════════

function buildFloorSlabs(g, floorNode, floorY) {
  // Room-specific floors and ceilings only (no full-building bounding box)
  for (const [, apt] of getChildren(floorNode)) {
    if (!apt.t) continue;
    const isApt = apt.t.includes('apartment');
    const isRoom = apt.t.includes('room');
    if (!isApt && !isRoom) continue;

    const ax = apt.x;
    const az = apt.y;

    if (isApt) {
      // Apartment-level rooms
      for (const [, room] of getChildren(apt)) {
        if (!room.t || !room.t.includes('room')) continue;
        const rx = ax + room.x;
        const rz = az + room.y;
        const isBath = room.n?.includes('Koupelna') || room.n?.includes('WC');
        const isOutdoor = room.t.includes('outdoor');
        const mat = isOutdoor ? floorTerrace : isBath ? floorTile : floorWood;
        addFloor(g, rx, rz, room.w, room.h, floorY, mat);
        addCeiling(g, rx, rz, room.w, room.h, 3, floorY);
      }
    } else if (isRoom && !apt.t.includes('outdoor')) {
      // Structural rooms (vstup, tech)
      const mat = apt.n?.includes('Koupelna') || apt.n?.includes('WC') ? floorTile : concrete;
      addFloor(g, ax, az, apt.w, apt.h, floorY, mat);
      addCeiling(g, ax, az, apt.w, apt.h, 3, floorY);
    }
  }

  // Staircase floor
  const stair = floorNode.c?.schodiste;
  if (stair) {
    addFloor(g, stair.x, stair.y, stair.w, stair.h, floorY, concrete);
    addCeiling(g, stair.x, stair.y, stair.w, stair.h, 3, floorY);
  }
}

// ════════════════════════════════════════════════
// PER-FLOOR GENERATION
// ════════════════════════════════════════════════

function buildFloor(g, floorNode, floorY) {
  const wallH = 3;

  // Floor slabs
  buildFloorSlabs(g, floorNode, floorY);

  for (const [id, child] of getChildren(floorNode)) {
    const isApt = child.t && child.t.includes('apartment');
    const isRoom = child.t && child.t.includes('room');
    const isOutdoor = child.t && child.t.includes('outdoor');

    // Apartments — walls + furniture
    if (isApt) {
      buildWallsForApt(g, child, child.x, child.y, floorY, wallH);
      buildRoomFurniture(g, child, child.x, child.y, floorY);
    }

    // Structural rooms (schodiště, vstup, tech) — walls from their children
    if (isRoom && !isOutdoor && child.c) {
      // Build walls inside structural rooms
      const innerWalls = findDirectByTag(child, 'wall');
      const innerDoors = findDirectByTag(child, 'door');
      if (innerWalls.length > 0) {
        buildWallsForApt(g, child, child.x, child.y, floorY, wallH);
      }
      // Furniture in structural rooms
      buildFurniture(g, child, child.x, child.y, floorY);
    }

    // Staircase — self-contained: walls + doors + steps + railings
    if (id === 'schodiste') {
      buildStaircase(g, child, floorNode, floorY);
    }

    // Terraces
    if (isOutdoor) {
      buildTerrace(g, child, 0, 0, floorY);
    }
  }

}


// ════════════════════════════════════════════════
// ROOF
// ════════════════════════════════════════════════

function buildRoof(g) {
  // Flat roof typical for panelák
  const roofY = 18; // 6 floors × 3m
  g.add(p(box(24.4, 0.2, 12.4, MAT.roof), 12, roofY + 0.1, 6));
  // Slight overhang
  g.add(p(box(24.6, 0.05, 12.6, MAT.roof), 12, roofY + 0.225, 6));
}

// ════════════════════════════════════════════════
// FACADE — collect all window/door openings per facade
// ════════════════════════════════════════════════

function collectFacadeOpenings(floorNode, facadeZ, tolerance) {
  const openings = [];

  for (const [, child] of getChildren(floorNode)) {
    const cx = child.x ?? 0;
    const cy = child.y ?? 0;
    const resolved = resolveStamp(child);

    // Search in apartments and rooms for 'opening' tagged objects
    const sources = resolved.t && resolved.t.includes('apartment') ? [child] :
      resolved.t && resolved.t.includes('room') && child.c ? [child] : [];

    for (const src of sources) {
      const sx = (src === child) ? cx : cx + src.x;
      const sy = (src === child) ? cy : cy + src.y;

      for (const op of findDirectByTag(src, 'opening')) {
        const oy = sy + op.y;
        const isHoriz = op.w > op.h;
        if (isHoriz && (Math.abs(oy - facadeZ) < tolerance || Math.abs(oy + op.h - facadeZ) < tolerance)) {
          const bottom = op.z ?? 0;
          const top = op.h3 ? bottom + op.h3 : 3;
          openings.push({ start: sx + op.x, end: sx + op.x + op.w, bottom, top });
        }
      }
    }

    // Floor-level openings (like hlavni_dvere, direct children of floorNode)
    if (resolved.t && resolved.t.includes('opening')) {
      const isHoriz = (resolved.w || child.w) > (resolved.h || child.h);
      const w = resolved.w || child.w;
      const h = resolved.h || child.h;
      if (isHoriz && (Math.abs(cy - facadeZ) < tolerance || Math.abs(cy + h - facadeZ) < tolerance)) {
        const bottom = resolved.z ?? 0;
        const top = resolved.h3 ? bottom + resolved.h3 : 3;
        openings.push({ start: cx, end: cx + w, bottom, top });
      }
    }
  }

  return openings;
}

// Build floor-level walls and doors (direct children of floor node, not inside any apartment)
function buildFloorLevelObjects(g, floorNode, floorY, wallH) {
  for (const [id, child] of getChildren(floorNode)) {
    // Skip apartments, rooms, staircases — those are handled elsewhere
    if (child.t && (child.t.includes('apartment') || child.t.includes('room') ||
        child.t.includes('floor') || child.t.includes('outdoor'))) continue;

    // Floor-level walls
    if (child.t && child.t.includes('wall')) {
      const wx = child.x;
      const wz = child.y;
      const isHoriz = child.w > child.h;

      // Find overlapping floor-level openings
      const openings = [];
      for (const [, d] of getChildren(floorNode)) {
        const rd = resolveStamp(d);
        if (!rd.t || !rd.t.includes('opening')) continue;
        const dw = rd.w || d.w;
        const dh = rd.h || d.h;
        if (rectsOverlap(wx, wz, child.w, child.h, d.x, d.y, dw, dh)) {
          const bottom = rd.z ?? 0;
          const top = rd.h3 ? bottom + rd.h3 : wallH;
          if (isHoriz) {
            openings.push({ start: d.x - wx, end: d.x - wx + dw, bottom, top });
          } else {
            openings.push({ start: d.y - wz, end: d.y - wz + dh, bottom, top });
          }
        }
      }

      const axis = isHoriz ? 'x' : 'z';
      const length = isHoriz ? child.w : child.h;
      wallWithOpenings(g, { axis, x: wx, z: wz, length, height: wallH, y: floorY, material: panelWall, openings });
    }

    // Floor-level door panels
    if (child.t && child.t.includes('door')) {
      // Hlavní vchod — detailní model
      if (child.m?.style === 'double') {
        const isHoriz = child.w > child.h;
        if (isHoriz) {
          createEntranceDoor(g, { axis: 'x', cx: child.x + child.w / 2, z: child.y + 1, doorWidth: child.w, y: floorY });
        } else {
          createEntranceDoor(g, { axis: 'z', cx: child.y + child.h / 2, z: child.x + 1, doorWidth: child.h, y: floorY });
        }
      } else {
        const isHoriz = child.w > child.h;
        if (isHoriz) {
          addDoor(g, { axis: 'x', x: child.x, z: child.y, at: child.w / 2, width: child.w * 0.9, y: floorY, doorHeight: 2.4, material: MAT.doorEntrance });
        } else {
          addDoor(g, { axis: 'z', x: child.x, z: child.y, at: child.h / 2, width: child.h * 0.9, y: floorY, doorHeight: 2.4, material: MAT.doorEntrance });
        }
      }
    }
  }
}

// ════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════

export function createPanelak(scene, ox = 0, oz = 0) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);

  const budova = plan.c.budova;
  if (!budova) { console.error('No budova node in plan'); return g; }

  // Build each floor
  const floors = [];
  for (const [id, floor] of getChildren(budova)) {
    if (!floor.t || !floor.t.includes('floor')) continue;
    const floorY = floor.z ?? 0;
    buildFloor(g, floor, floorY);
    buildFloorLevelObjects(g, floor, floorY, 3);
    floors.push({ id, floor, floorY });
  }

  // Building-wide outer facades with openings from data
  for (const { floor, floorY } of floors) {
    // North facade z=0
    const northOpenings = collectFacadeOpenings(floor, 0, 0.3);
    wallWithOpenings(g, {
      axis: 'x', x: 0, z: 0, length: 24, height: 3, y: floorY,
      material: panelWall, openings: northOpenings,
    });
    // South facade z=12
    const southOpenings = collectFacadeOpenings(floor, 12, 0.3);
    wallWithOpenings(g, {
      axis: 'x', x: 0, z: 12, length: 24, height: 3, y: floorY,
      material: panelWall, openings: southOpenings,
    });
    // West facade x=0
    const westOpenings = collectSideFacadeOpenings(floor, 0, 0.3);
    wallWithOpenings(g, {
      axis: 'z', x: 0, z: 0, length: 12, height: 3, y: floorY,
      material: panelWallAccent, openings: westOpenings,
    });
    // East facade x=24
    const eastOpenings = collectSideFacadeOpenings(floor, 24, 0.3);
    wallWithOpenings(g, {
      axis: 'z', x: 24, z: 0, length: 12, height: 3, y: floorY,
      material: panelWallAccent, openings: eastOpenings,
    });
  }

  // Roof
  buildRoof(g);

  scene.add(g);
  return g;
}

// Collect openings on east/west facades (walls along Z axis)
function collectSideFacadeOpenings(floorNode, facadeX, tolerance) {
  const openings = [];

  for (const [, child] of getChildren(floorNode)) {
    const cx = child.x ?? 0;
    const cy = child.y ?? 0;
    const resolved = resolveStamp(child);
    if (!resolved.t) continue;

    const sources = resolved.t.includes('apartment') ? [child] :
      resolved.t.includes('room') && child.c ? [child] : [];

    for (const src of sources) {
      const sx = (src === child) ? cx : cx + src.x;
      const sy = (src === child) ? cy : cy + src.y;

      for (const op of findDirectByTag(src, 'opening')) {
        const ox = sx + op.x;
        const isVert = op.h > op.w;
        if (isVert && (Math.abs(ox - facadeX) < tolerance || Math.abs(ox + op.w - facadeX) < tolerance)) {
          const bottom = op.z ?? 0;
          const top = op.h3 ? bottom + op.h3 : 3;
          openings.push({ start: sy + op.y, end: sy + op.y + op.h, bottom, top });
        }
      }
    }
  }

  return openings;
}
