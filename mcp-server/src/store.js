import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const MAP_FILE = resolve(DATA_DIR, 'map.json');

/**
 * Normalize a name into a safe ID: lowercase, strip accents, replace non-alphanum with _.
 */
export function normalizeId(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'node';
}

export class MapStore {
  constructor() {
    mkdirSync(DATA_DIR, { recursive: true });
    this.root = this._load();
    if (this.root) {
      this._updateRootName();
      this.save();
    }
  }

  // ── Node creation ──────────────────────────────

  createProject(name, description) {
    if (!this.root) {
      this.root = this._makeRoot();
    }
    const id = normalizeId(name);
    this.root.children[id] = {
      id, name,
      description: description || '',
      tags: ['project'],
      metadata: { project: true, created: new Date().toISOString() },
      children: {},
    };
    this._updateRootName();
    this.save();
    return id;
  }

  deleteProject(id) {
    if (!this.root || !this.root.children[id]) return false;
    delete this.root.children[id];
    this._updateRootName();
    this.save();
    return true;
  }

  /**
   * Add a node to the tree.
   * If spatial data (x, y, char) is provided → spatial node.
   * If no spatial data → folder node.
   */
  addNode(parentPath, nodeData) {
    const parent = this.resolve(parentPath);
    if (!parent) return { error: `Parent "${parentPath}" not found` };
    if (!parent.children) return { error: `Parent "${parentPath}" cannot hold children` };
    if (parent.children[nodeData.id]) return { error: `"${nodeData.id}" already exists` };

    const node = {
      id: nodeData.id,
      name: nodeData.name,
      description: nodeData.description || '',
      tags: nodeData.tags || [],
      metadata: nodeData.metadata || {},
      rotation: nodeData.rotation || 0,
      children: {},
    };

    // Spatial data (optional)
    if (nodeData.x !== undefined) {
      node.x = nodeData.x;
      node.y = nodeData.y ?? 0;
      node.width = nodeData.width;
      node.height = nodeData.height;
      node.char = nodeData.char || '#';
      if (nodeData.shape) node.shape = nodeData.shape;
      if (nodeData.elevation !== undefined) node.elevation = nodeData.elevation;
      if (nodeData.height_3d !== undefined) node.height_3d = nodeData.height_3d;
    }

    parent.children[nodeData.id] = node;
    this.save();
    return { id: nodeData.id, name: node.name };
  }

  // ── Tree operations ────────────────────────────

  resolve(path) {
    if (!this.root) return null;
    if (!path || path === '/') return this.root;
    const parts = path.split('/').filter(Boolean);
    let node = this.root;
    for (const p of parts) {
      if (!node.children || !node.children[p]) return null;
      node = node.children[p];
    }
    return node;
  }

  // Get children with stamps resolved (expanded from template)
  getChildren(node) {
    const children = {};
    for (const [id, child] of Object.entries(node.children || {})) {
      if ((child.tags || []).includes('stamp') && child.metadata?._template) {
        children[id] = this.resolveStamp(child);
      } else {
        children[id] = child;
      }
    }
    return children;
  }

  /**
   * Resolve parent and child ID from a full path.
   */
  resolveParentAndChild(path) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const childId = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/') || '/';
    const parent = this.resolve(parentPath);
    if (!parent || !parent.children || !parent.children[childId]) return null;
    return { parent, childId, child: parent.children[childId] };
  }

  removeNode(path) {
    const res = this.resolveParentAndChild(path);
    if (!res) return false;
    delete res.parent.children[res.childId];
    this.save();
    return true;
  }

  renameNode(path, newId) {
    const res = this.resolveParentAndChild(path);
    if (!res) return { error: 'Not found' };
    if (res.parent.children[newId]) return { error: `"${newId}" already exists in parent` };
    const node = res.child;
    delete res.parent.children[res.childId];
    node.id = newId;
    res.parent.children[newId] = node;
    this.save();
    return { id: newId, name: node.name };
  }

  duplicateNode(sourcePath, newId, targetPath) {
    const source = this.resolve(sourcePath);
    if (!source) return { error: 'Source not found' };
    const target = targetPath ? this.resolve(targetPath) : null;

    // If no target, duplicate in same parent
    let parent;
    if (target) {
      parent = target;
    } else {
      const res = this.resolveParentAndChild(sourcePath);
      if (!res) return { error: 'Source parent not found' };
      parent = res.parent;
    }
    if (!parent.children) return { error: 'Target cannot hold children' };
    if (parent.children[newId]) return { error: `"${newId}" already exists in target` };

    parent.children[newId] = this._deepCopy(source, newId);
    this.save();
    return { id: newId, name: source.name };
  }

  reparentNode(path, newParentPath, newX, newY) {
    const res = this.resolveParentAndChild(path);
    if (!res) return { error: 'Not found' };
    const newParent = this.resolve(newParentPath);
    if (!newParent) return { error: 'New parent not found' };
    if (!newParent.children) return { error: 'New parent cannot hold children' };
    if (newParent.children[res.childId]) return { error: `"${res.childId}" already exists in new parent` };

    const node = res.child;
    delete res.parent.children[res.childId];
    if (newX !== undefined) node.x = newX;
    if (newY !== undefined) node.y = newY;
    newParent.children[res.childId] = node;
    this.save();
    return { id: res.childId, name: node.name };
  }

  // ── Search ─────────────────────────────────────

  findObjects(rootPath, filters) {
    const root = this.resolve(rootPath || '/');
    if (!root) return [];
    const results = [];
    const namePattern = filters.name ? filters.name.toLowerCase() : null;

    const walk = (node, path) => {
      for (const [id, child] of Object.entries(node.children || {})) {
        const childPath = path ? `${path}/${id}` : id;
        let match = true;
        if (namePattern && !child.name.toLowerCase().includes(namePattern)) match = false;
        if (filters.tags?.length && !filters.tags.every(t => (child.tags || []).includes(t))) match = false;
        if (filters.metadata_key && !(child.metadata && filters.metadata_key in child.metadata)) match = false;
        if (match) {
          results.push({
            path: childPath,
            id: child.id,
            name: child.name,
            tags: child.tags || [],
            isSpatial: child.x !== undefined,
          });
        }
        walk(child, childPath);
      }
    };
    walk(root, rootPath === '/' || !rootPath ? '' : rootPath);
    return results;
  }

  // ── Collision detection ────────────────────────

  findCollisions(parent, x, y, w, h, excludeId) {
    const collisions = [];
    for (const child of Object.values(this.getChildren(parent))) {
      if (child.x === undefined) continue; // skip folder nodes
      if (excludeId && child.id === excludeId) continue;
      if (rectsOverlap(x, y, w, h, child.x, child.y, child.width, child.height)) {
        collisions.push(child);
      }
    }
    return collisions;
  }

  findCollisionsProjected(parent, x, y, w, h, projection) {
    const collisions = [];
    for (const child of Object.values(this.getChildren(parent))) {
      if (child.elevation === undefined || child.height_3d === undefined) continue;
      let px, py, pw, ph;
      if (projection === 'front') {
        px = child.x; py = child.elevation; pw = child.width; ph = child.height_3d;
      } else { // side
        px = child.y; py = child.elevation; pw = child.height; ph = child.height_3d;
      }
      if (rectsOverlap(x, y, w, h, px, py, pw, ph)) {
        collisions.push({ ...child, px, py, pw, ph });
      }
    }
    return collisions;
  }

  // ── Connectivity check ─────────────────────────

  findConnectedGroups(parent, excludeTags) {
    const children = Object.values(this.getChildren(parent));
    let spatial = children.filter(c => c.x !== undefined);
    if (excludeTags?.length) {
      spatial = spatial.filter(c => !(c.tags || []).some(t => excludeTags.includes(t)));
    }
    if (spatial.length === 0) return { groups: [], count: 0 };

    // Build 3D boxes
    const boxes = spatial.map(c => ({
      id: c.id, name: c.name, char: c.char, tags: c.tags || [],
      x: c.x, y: c.y, w: c.width, h: c.height,
      ez: c.elevation ?? 0, eh: c.height_3d ?? c.height,
    }));

    // Union-Find
    const parent_uf = boxes.map((_, i) => i);
    function find(i) { while (parent_uf[i] !== i) { parent_uf[i] = parent_uf[parent_uf[i]]; i = parent_uf[i]; } return i; }
    function union(a, b) { const ra = find(a), rb = find(b); if (ra !== rb) parent_uf[ra] = rb; }

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (boxesTouch3D(boxes[i], boxes[j])) union(i, j);
      }
    }

    // Collect groups
    const groupMap = {};
    for (let i = 0; i < boxes.length; i++) {
      const root = find(i);
      if (!groupMap[root]) groupMap[root] = [];
      groupMap[root].push(boxes[i]);
    }
    const groups = Object.values(groupMap);
    return { groups, count: groups.length };
  }

  // ── Validation ─────────────────────────────────

  validate(node, rules) {
    const violations = [];
    // Collect all spatial objects recursively with absolute coords
    const allObjects = [];
    const collectAll = (parent, offsetX, offsetY, parentId) => {
      for (const child of Object.values(this.getChildren(parent))) {
        if (child.x === undefined) {
          collectAll(child, offsetX, offsetY, parentId);
          continue;
        }
        const absX = offsetX + child.x, absY = offsetY + child.y;
        allObjects.push({
          id: child.id, name: child.name, tags: child.tags || [],
          x: absX, y: absY, w: child.width, h: child.height,
          parentId,
        });
        collectAll(child, absX, absY, child.id);
      }
    };
    collectAll(node, 0, 0, node.id);

    const hasTag = (obj, tag) => obj.tags.includes(tag);
    const overlap = (a, b) => rectsOverlap(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h);
    const touch = (a, b) => {
      // Touch = overlap OR share edge (but not gap)
      const sepX = a.x + a.w < b.x || b.x + b.w < a.x;
      const sepY = a.y + a.h < b.y || b.y + b.h < a.y;
      return !sepX && !sepY;
    };

    for (const rule of rules) {
      if (rule.type === 'no_collide') {
        // Symmetric: no object with tag A may overlap object with tag B
        for (const objA of allObjects) {
          if (!hasTag(objA, rule.a)) continue;
          for (const objB of allObjects) {
            if (objA.id === objB.id) continue;
            if (!hasTag(objB, rule.b)) continue;
            if (overlap(objA, objB)) {
              violations.push(`[${rule.a}] "${objA.name}" collides with [${rule.b}] "${objB.name}" at (${objA.x},${objA.y})`);
            }
          }
        }
      }

      if (rule.type === 'must_collide') {
        // Every A must overlap at least one B
        for (const objA of allObjects) {
          if (!hasTag(objA, rule.a)) continue;
          const found = allObjects.some(objB => objB.id !== objA.id && hasTag(objB, rule.b) && overlap(objA, objB));
          if (!found) {
            violations.push(`[${rule.a}] "${objA.name}" does not collide with any [${rule.b}]`);
          }
        }
      }

      if (rule.type === 'must_touch') {
        // Every A must touch at least one B
        for (const objA of allObjects) {
          if (!hasTag(objA, rule.a)) continue;
          const found = allObjects.some(objB => objB.id !== objA.id && hasTag(objB, rule.b) && touch(objA, objB));
          if (!found) {
            violations.push(`[${rule.a}] "${objA.name}" does not touch any [${rule.b}]`);
          }
        }
      }
    }

    // Deduplicate symmetric violations (no_collide A↔B)
    return [...new Set(violations)];
  }

  // ── ASCII rendering ────────────────────────────

  collectRenderObjects(node, recursive = false, projection = 'plan') {
    const objects = [];
    const self = this;
    function collect(parent, offsetX, offsetY) {
      for (const child of Object.values(self.getChildren(parent))) {
        if (child.x === undefined) {
          // Folder node — recurse into it if recursive, but don't render
          if (recursive && child.children) {
            collect(child, offsetX, offsetY);
          }
          continue;
        }
        const absX = offsetX + child.x;
        const absY = offsetY + child.y;

        if (projection === 'plan') {
          objects.push({ char: child.char, id: child.id, name: child.name, x: absX, y: absY, width: child.width, height: child.height, shape: child.shape });
        } else if (projection === 'front') {
          if (child.elevation !== undefined && child.height_3d !== undefined) {
            objects.push({ char: child.char, id: child.id, name: child.name, x: absX, y: child.elevation, width: child.width, height: child.height_3d });
          }
        } else if (projection === 'side') {
          if (child.elevation !== undefined && child.height_3d !== undefined) {
            objects.push({ char: child.char, id: child.id, name: child.name, x: absY, y: child.elevation, width: child.height, height: child.height_3d });
          }
        }

        if (recursive && child.children) {
          collect(child, absX, absY);
        }
      }
    }
    collect(node, 0, 0);
    return objects;
  }

  renderAscii(node, maxCols = 60, maxRows = 30, recursive = false, projection = 'plan') {
    const objects = this.collectRenderObjects(node, recursive, projection);
    const bounds = this.getEffectiveBounds(node);

    if (objects.length === 0) {
      if (projection !== 'plan') {
        return { ascii: [`(no objects with elevation/height_3d for ${projection} view)`], legend: [], scaleInfo: '' };
      }
      return { ascii: [`(empty: ${bounds.w}m × ${bounds.h}m)`], legend: [], scaleInfo: '' };
    }

    let viewW, viewH, viewLabel;
    if (projection === 'plan') {
      viewW = bounds.w;
      viewH = bounds.h;
      viewLabel = `${bounds.w}m × ${bounds.h}m`;
    } else {
      let maxX = 0, maxY = 0;
      for (const o of objects) {
        maxX = Math.max(maxX, o.x + o.width);
        maxY = Math.max(maxY, o.y + o.height);
      }
      viewW = projection === 'front' ? bounds.w : bounds.h;
      viewH = maxY || 3;
      if (node.metadata?.floor_height) viewH = node.metadata.floor_height;
      viewLabel = `${viewW}m × ${viewH}m (${projection} view)`;
    }

    const scaleX = viewW / maxCols;
    const scaleY = viewH / maxRows;
    const scale = Math.max(scaleX, scaleY, 0.1);

    const cols = Math.min(maxCols, Math.ceil(viewW / scale));
    const rows = Math.min(maxRows, Math.ceil(viewH / scale));

    const grid = [];
    for (let r = 0; r < rows; r++) grid.push(new Array(cols).fill('.'));

    const legend = [];
    const seenChars = new Set();

    for (const child of objects) {
      if (!seenChars.has(child.char + child.id)) {
        legend.push({ char: child.char, id: child.id, name: child.name });
        seenChars.add(child.char + child.id);
      }
      const startCol = Math.floor(child.x / scale);
      const startRow = Math.floor(child.y / scale);
      const endCol = Math.ceil((child.x + child.width) / scale);
      const endRow = Math.ceil((child.y + child.height) / scale);

      if (child.shape) {
        const absShape = child.shape.map(([px, py]) => [child.x + px, child.y + py]);
        for (let r = startRow; r < endRow && r < rows; r++) {
          for (let c = startCol; c < endCol && c < cols; c++) {
            if (r >= 0 && c >= 0) {
              const px = (c + 0.5) * scale;
              const py = (r + 0.5) * scale;
              if (pointInPolygon(px, py, absShape)) grid[r][c] = child.char;
            }
          }
        }
      } else {
        for (let r = startRow; r < endRow && r < rows; r++) {
          for (let c = startCol; c < endCol && c < cols; c++) {
            if (r >= 0 && c >= 0) grid[r][c] = child.char;
          }
        }
      }
    }

    const finalGrid = (projection !== 'plan') ? grid.reverse() : grid;

    return {
      ascii: finalGrid.map(r => r.join('')),
      legend,
      scaleInfo: `1 cell = ${scale.toFixed(2)}m | ${cols}×${rows} cells | ${viewLabel}`,
    };
  }

  // ── Stamping ───────────────────────────────────

  stampObject(sourcePath, targetPath, newId, x, y, rotation) {
    const source = this.resolve(sourcePath);
    if (!source) return { error: 'Source not found' };
    const target = this.resolve(targetPath);
    if (!target) return { error: 'Target not found' };
    if (!target.children) return { error: 'Target is not a container' };
    if (target.children[newId]) return { error: `"${newId}" already exists in target` };

    const rot = rotation || 0;
    const bbox = this._subtreeBBox(source);
    const rotW = (rot === 90 || rot === 270) ? bbox.h : bbox.w;
    const rotH = (rot === 90 || rot === 270) ? bbox.w : bbox.h;

    // Store as reference — no deep copy of children
    const stamp = {
      id: newId,
      name: source.name,
      x, y,
      width: rotW,
      height: rotH,
      description: source.description || '',
      tags: ['stamp'],
      metadata: { _template: sourcePath },
      rotation: rot,
      children: {},
    };

    target.children[newId] = stamp;
    this.save();
    return { id: newId, name: source.name };
  }

  // Resolve stamp → expand template children with rotation + offset
  resolveStamp(stamp) {
    const tmplPath = stamp.metadata?._template;
    if (!tmplPath) return stamp;
    const source = this.resolve(tmplPath);
    if (!source) return stamp; // template deleted, return as-is

    const rot = stamp.rotation || 0;
    const bbox = this._subtreeBBox(source);

    // Collect parts: source itself (if spatial) + its children
    const parts = [];
    if (source.x !== undefined && source.char) {
      parts.push({
        id: '_body', name: source.name,
        x: 0, y: 0, width: source.width, height: source.height,
        char: source.char, description: '',
        tags: [...(source.tags || []).filter(t => t !== 'template')],
        metadata: {}, rotation: 0, children: {},
      });
    }
    for (const child of Object.values(source.children || {})) {
      parts.push(this._deepCopy(child));
    }

    // Apply rotation
    if (rot !== 0) {
      for (const part of parts) {
        const cx = part.x, cy = part.y, cw = part.width, ch = part.height;
        if (rot === 90) { part.x = bbox.h - cy - ch; part.y = cx; }
        else if (rot === 180) { part.x = bbox.w - cx - cw; part.y = bbox.h - cy - ch; }
        else if (rot === 270) { part.x = cy; part.y = bbox.w - cx - cw; }
        if (rot === 90 || rot === 270) {
          const tmp = part.width; part.width = part.height; part.height = tmp;
        }
        if (part.children && Object.keys(part.children).length > 0) {
          this._rotateChildren(part, cw, ch, rot);
        }
      }
    }

    // Return expanded stamp
    const expanded = { ...stamp, children: {} };
    for (const part of parts) expanded.children[part.id] = part;
    return expanded;
  }

  // ── Export ──────────────────────────────────────

  exportJSON(path, tag) {
    const node = this.resolve(path || '/');
    if (!node) return null;
    if (!tag) return node;
    return this._filterByTag(node, tag);
  }

  // ── Bounds ─────────────────────────────────────

  /**
   * Get effective bounds of a node.
   * Spatial nodes: use explicit width/height.
   * Folder nodes: auto-calculate from children bounding box.
   */
  getEffectiveBounds(node) {
    if (node.x !== undefined && node.width !== undefined) {
      return { w: node.width, h: node.height };
    }
    // Folder — auto-bounds from children
    let maxW = 0, maxH = 0;
    for (const child of Object.values(node.children || {})) {
      if (child.x !== undefined) {
        maxW = Math.max(maxW, child.x + (child.width || 0));
        maxH = Math.max(maxH, child.y + (child.height || 0));
      }
    }
    return { w: maxW || 1, h: maxH || 1 };
  }

  // ── Persistence ────────────────────────────────

  clearAll() {
    this.root = null;
    this.save();
  }

  save() {
    writeFileSync(MAP_FILE, JSON.stringify(this.root, null, 2));
  }

  // ── Private helpers ────────────────────────────

  _makeRoot() {
    return {
      id: '_root',
      name: 'Projects',
      description: '',
      tags: [],
      metadata: {},
      children: {},
    };
  }

  _updateRootName() {
    this.root.name = 'Projects';
    // Ensure root is always a folder (no spatial props)
    delete this.root.x;
    delete this.root.y;
    delete this.root.width;
    delete this.root.height;
    delete this.root.char;
  }

  _load() {
    if (!existsSync(MAP_FILE)) return null;
    try {
      const data = JSON.parse(readFileSync(MAP_FILE, 'utf-8'));
      if (data) this._migrate(data);
      return data;
    } catch { return null; }
  }

  /**
   * Migrate legacy data: ensure children: {} on all nodes, remove is_container.
   */
  _migrate(node) {
    if (!node) return;
    if (!node.children) node.children = {};
    delete node.is_container;
    for (const child of Object.values(node.children)) {
      this._migrate(child);
    }
  }

  _subtreeBBox(node) {
    let maxW = node.width || 0, maxH = node.height || 0;
    for (const child of Object.values(node.children || {})) {
      if (child.x !== undefined) {
        maxW = Math.max(maxW, child.x + (child.width || 0));
        maxH = Math.max(maxH, child.y + (child.height || 0));
      }
    }
    return { w: maxW, h: maxH };
  }

  _rotateChildren(node, origW, origH, rotation) {
    for (const child of Object.values(node.children || {})) {
      if (child.x === undefined) continue;
      const cx = child.x, cy = child.y, cw = child.width, ch = child.height;
      if (rotation === 90) {
        child.x = origH - cy - ch;
        child.y = cx;
      } else if (rotation === 180) {
        child.x = origW - cx - cw;
        child.y = origH - cy - ch;
      } else if (rotation === 270) {
        child.x = cy;
        child.y = origW - cx - cw;
      }
      if (rotation === 90 || rotation === 270) {
        const tmp = child.width;
        child.width = child.height;
        child.height = tmp;
      }
      if (child.children && Object.keys(child.children).length > 0) {
        this._rotateChildren(child, cw, ch, rotation);
      }
    }
  }

  _deepCopy(node, newId) {
    const copy = {
      id: newId || node.id,
      name: node.name,
      description: node.description || '',
      tags: [...(node.tags || [])],
      metadata: { ...(node.metadata || {}) },
      rotation: node.rotation || 0,
      children: {},
    };
    // Spatial data
    if (node.x !== undefined) {
      copy.x = node.x;
      copy.y = node.y;
      copy.width = node.width;
      copy.height = node.height;
      copy.char = node.char;
      if (node.shape) copy.shape = JSON.parse(JSON.stringify(node.shape));
      if (node.elevation !== undefined) copy.elevation = node.elevation;
      if (node.height_3d !== undefined) copy.height_3d = node.height_3d;
    }
    // Recurse children
    for (const [id, child] of Object.entries(node.children || {})) {
      copy.children[id] = this._deepCopy(child);
    }
    return copy;
  }

  _filterByTag(node, tag) {
    const filtered = { ...node };
    if (node.children) {
      const newChildren = {};
      for (const [id, child] of Object.entries(node.children)) {
        if ((child.tags || []).includes(tag)) {
          newChildren[id] = child;
        } else if (child.children) {
          const sub = this._filterByTag(child, tag);
          if (sub.children && Object.keys(sub.children).length > 0) {
            newChildren[id] = sub;
          }
        }
      }
      filtered.children = newChildren;
    }
    return filtered;
  }
}

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
}

// Two 3D boxes touch if they overlap or share a face/edge in all 3 axes
// "Touch" = overlap OR share boundary (<=, not <)
function boxesTouch3D(a, b) {
  // a, b = { x, y, w, h, ez, eh } where ez=elevation(z-axis), eh=height_3d
  const sepX = a.x + a.w < b.x || b.x + b.w < a.x;
  const sepY = a.y + a.h < b.y || b.y + b.h < a.y;
  const sepZ = a.ez + a.eh < b.ez || b.ez + b.eh < a.ez;
  return !sepX && !sepY && !sepZ;
}

function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
