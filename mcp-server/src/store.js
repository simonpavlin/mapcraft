import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const MAP_FILE = resolve(DATA_DIR, 'map.json');

export class MapStore {
  constructor() {
    mkdirSync(DATA_DIR, { recursive: true });
    this.root = this._load();
  }

  createProject(name, description) {
    // Ensure root exists
    if (!this.root) {
      this.root = {
        id: '_root',
        name: 'Projekty',
        description: '',
        x: 0, y: 0,
        width: 1, height: 1,
        char: '.',
        tags: [],
        metadata: {},
        children: {},
      };
    }

    // Generate safe ID from name
    const id = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'project';

    // Add project as child of root
    this.root.children[id] = {
      id, name,
      x: 0, y: 0,
      width: 1, height: 1,
      char: '.',
      description: description || '',
      tags: ['project'],
      metadata: { project: true, created: new Date().toISOString() },
      children: {},
    };

    // Update root name
    const projectCount = Object.values(this.root.children).filter(c => (c.tags || []).includes('project')).length;
    this.root.name = projectCount === 1 ? name : `${projectCount} projektů`;

    this.save();
    return id;
  }

  deleteProject(id) {
    if (!this.root || !this.root.children[id]) return false;
    delete this.root.children[id];
    const projectCount = Object.keys(this.root.children).length;
    this.root.name = projectCount === 0 ? 'Prázdné' : projectCount === 1 ? Object.values(this.root.children)[0].name : `${projectCount} projektů`;
    this.save();
    return true;
  }

  initSpace(name, width, height, description) {
    // Create root if it doesn't exist
    if (!this.root) {
      this.root = {
        id: '_root',
        name: 'Root',
        description: '',
        x: 0, y: 0,
        width: 1, height: 1,
        char: '.',
        tags: [],
        metadata: {},
        children: {},
      };
    }

    // Generate a safe ID from name
    const id = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'space';

    // Add as child container under root
    this.root.children[id] = {
      id, name,
      x: 0, y: 0,
      width, height,
      char: '.',
      description: description || '',
      tags: [],
      metadata: {},
      children: {},
    };

    // Expand root to fit all children
    let maxW = 0, maxH = 0;
    for (const child of Object.values(this.root.children)) {
      maxW = Math.max(maxW, child.x + child.width);
      maxH = Math.max(maxH, child.y + child.height);
    }
    this.root.width = maxW;
    this.root.height = maxH;
    this.root.name = Object.keys(this.root.children).length === 1
      ? name
      : `${Object.keys(this.root.children).length} spaces`;

    this.save();
    return id;
  }

  clearSpace(id) {
    if (!this.root || !this.root.children[id]) return false;
    delete this.root.children[id];
    this.save();
    return true;
  }

  clearAll() {
    this.root = null;
    this.save();
  }

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

  /**
   * Find overlapping objects. Advisory only — not enforced on placement.
   */
  findCollisions(parent, x, y, w, h, excludeId) {
    const collisions = [];
    for (const child of Object.values(parent.children || {})) {
      if (excludeId && child.id === excludeId) continue;
      if (rectsOverlap(x, y, w, h, child.x, child.y, child.width, child.height)) {
        collisions.push(child);
      }
    }
    return collisions;
  }

  /**
   * Find collisions in projected space (front/side view).
   */
  findCollisionsProjected(parent, x, y, w, h, projection) {
    const collisions = [];
    for (const child of Object.values(parent.children || {})) {
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

  /**
   * Collect all objects to render — optionally recursive.
   * projection: 'plan' (default) | 'front' | 'side'
   *   plan:  x → x, y → y (top-down, existing behavior)
   *   front: x → x, elevation → y (looking from south, see width × height_3d)
   *   side:  y → x, elevation → y (looking from east, see height × height_3d)
   * Objects without elevation/height_3d are skipped in front/side projections.
   */
  collectRenderObjects(node, recursive = false, projection = 'plan') {
    const objects = [];
    function collect(parent, offsetX, offsetY) {
      for (const child of Object.values(parent.children || {})) {
        const absX = offsetX + child.x;
        const absY = offsetY + child.y;

        if (projection === 'plan') {
          objects.push({ char: child.char, id: child.id, name: child.name, x: absX, y: absY, width: child.width, height: child.height, shape: child.shape });
        } else if (projection === 'front') {
          // front: looking from south — x stays, elevation becomes y
          if (child.elevation !== undefined && child.height_3d !== undefined) {
            objects.push({ char: child.char, id: child.id, name: child.name, x: absX, y: child.elevation, width: child.width, height: child.height_3d });
          }
        } else if (projection === 'side') {
          // side: looking from east — plan-y becomes x, elevation becomes y
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
    if (objects.length === 0) {
      if (projection !== 'plan') {
        return { ascii: [`(no objects with elevation/height_3d for ${projection} view)`], legend: [], scaleInfo: '' };
      }
      return { ascii: [`(empty: ${node.width}m × ${node.height}m)`], legend: [], scaleInfo: '' };
    }

    // Determine viewport size based on projection
    let viewW, viewH, viewLabel;
    if (projection === 'plan') {
      viewW = node.width;
      viewH = node.height;
      viewLabel = `${node.width}m × ${node.height}m`;
    } else {
      // For front/side, compute bounding box from objects (elevation can vary)
      let maxX = 0, maxY = 0;
      for (const o of objects) {
        maxX = Math.max(maxX, o.x + o.width);
        maxY = Math.max(maxY, o.y + o.height);
      }
      viewW = projection === 'front' ? node.width : node.height;
      viewH = maxY || 3; // fallback to 3m if no height data
      // Use room floor_height from metadata if available
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
        // Polygon fill — absolute shape points
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
        // Rectangle fill
        for (let r = startRow; r < endRow && r < rows; r++) {
          for (let c = startCol; c < endCol && c < cols; c++) {
            if (r >= 0 && c >= 0) grid[r][c] = child.char;
          }
        }
      }
    }

    // For front/side views, flip Y so floor is at bottom
    const finalGrid = (projection !== 'plan') ? grid.reverse() : grid;

    return {
      ascii: finalGrid.map(r => r.join('')),
      legend,
      scaleInfo: `1 cell = ${scale.toFixed(2)}m | ${cols}×${rows} cells | ${viewLabel}`,
    };
  }

  /**
   * Deep-copy a template into a target parent at given position/rotation.
   *
   * For templates with children (door+clearance, furniture group, etc.):
   * - Creates a neutral container sized to the full bounding box
   * - Adds a `_body` child for the template's own visual (char, tags)
   * - Adds all original children alongside _body
   * - Rotates ALL parts (body + children) correctly within the bbox
   *
   * For leaf objects: simple copy with dimension swap.
   */
  stampObject(sourcePath, targetPath, newId, x, y, rotation) {
    const source = this.resolve(sourcePath);
    if (!source) return { error: 'Source not found' };
    const target = this.resolve(targetPath);
    if (!target) return { error: 'Target not found' };
    if (!target.children) return { error: 'Target is not a container' };
    if (target.children[newId]) return { error: `"${newId}" already exists in target` };

    const rot = rotation || 0;
    const hasChildren = source.children && Object.keys(source.children).length > 0;

    if (!hasChildren) {
      // Leaf: simple copy
      const copy = this._deepCopy(source, newId);
      copy.x = x;
      copy.y = y;
      copy.rotation = rot;
      if (rot === 90 || rot === 270) {
        const tmp = copy.width; copy.width = copy.height; copy.height = tmp;
      }
      copy.metadata = { ...(copy.metadata || {}), _template: sourcePath };
      target.children[newId] = copy;
      this.save();
      return { id: newId, name: copy.name };
    }

    // Container template: collect body + children as flat parts list
    const bbox = this._subtreeBBox(source);
    const parts = [];

    // _body = the visual representation of the source object itself
    parts.push({
      id: '_body',
      name: source.name,
      x: 0, y: 0,
      width: source.width, height: source.height,
      char: source.char,
      description: '',
      tags: [...(source.tags || []).filter(t => t !== 'template')],
      metadata: {},
      rotation: 0,
    });

    // Original children
    for (const child of Object.values(source.children)) {
      parts.push(this._deepCopy(child));
    }

    // Rotate all parts within the full bbox
    if (rot !== 0) {
      for (const part of parts) {
        const cx = part.x, cy = part.y, cw = part.width, ch = part.height;
        if (rot === 90) {
          part.x = bbox.h - cy - ch;
          part.y = cx;
        } else if (rot === 180) {
          part.x = bbox.w - cx - cw;
          part.y = bbox.h - cy - ch;
        } else if (rot === 270) {
          part.x = cy;
          part.y = bbox.w - cx - cw;
        }
        if (rot === 90 || rot === 270) {
          const tmp = part.width; part.width = part.height; part.height = tmp;
        }
        // Recurse for grandchildren
        if (part.children && Object.keys(part.children).length > 0) {
          this._rotateChildren(part, cw, ch, rot);
        }
      }
    }

    // Build neutral container sized to rotated bbox
    const rotW = (rot === 90 || rot === 270) ? bbox.h : bbox.w;
    const rotH = (rot === 90 || rot === 270) ? bbox.w : bbox.h;

    const stamp = {
      id: newId,
      name: source.name,
      x, y,
      width: rotW,
      height: rotH,
      char: '.',
      description: source.description || '',
      tags: ['stamp'],
      metadata: { ...(source.metadata || {}), _template: sourcePath },
      rotation: rot,
      children: {},
    };

    for (const part of parts) {
      stamp.children[part.id] = part;
    }

    target.children[newId] = stamp;
    this.save();
    return { id: newId, name: source.name };
  }

  /** Compute bounding box of node + all children. */
  _subtreeBBox(node) {
    let maxW = node.width, maxH = node.height;
    for (const child of Object.values(node.children || {})) {
      maxW = Math.max(maxW, child.x + child.width);
      maxH = Math.max(maxH, child.y + child.height);
    }
    return { w: maxW, h: maxH };
  }

  _rotateChildren(node, origW, origH, rotation) {
    for (const child of Object.values(node.children || {})) {
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
      x: node.x, y: node.y,
      width: node.width, height: node.height,
      char: node.char,
      shape: node.shape ? JSON.parse(JSON.stringify(node.shape)) : undefined,
      description: node.description || '',
      tags: [...(node.tags || [])],
      metadata: { ...(node.metadata || {}) },
      rotation: node.rotation || 0,
      elevation: node.elevation,
      height_3d: node.height_3d,
    };
    if (node.children) {
      copy.children = {};
      for (const [id, child] of Object.entries(node.children)) {
        copy.children[id] = this._deepCopy(child);
      }
    }
    return copy;
  }

  exportJSON(path, tag) {
    const node = this.resolve(path || '/');
    if (!node) return null;
    if (!tag) return node;
    return this._filterByTag(node, tag);
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

  save() {
    writeFileSync(MAP_FILE, JSON.stringify(this.root, null, 2));
  }

  _load() {
    if (!existsSync(MAP_FILE)) return null;
    try { return JSON.parse(readFileSync(MAP_FILE, 'utf-8')); }
    catch { return null; }
  }
}

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
}

// Ray casting point-in-polygon test
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
