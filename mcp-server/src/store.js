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

  initSpace(name, width, height, description) {
    this.root = {
      id: '_root',
      name,
      description: description || '',
      x: 0, y: 0,
      width, height,
      char: '.',
      tags: [],
      metadata: {},
      children: {},
    };
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
   * Collect all objects to render — optionally recursive.
   * Returns flat array of { char, id, name, x, y, width, height } with absolute coords.
   */
  collectRenderObjects(node, recursive = false) {
    const objects = [];
    function collect(parent, offsetX, offsetY) {
      for (const child of Object.values(parent.children || {})) {
        const absX = offsetX + child.x;
        const absY = offsetY + child.y;
        objects.push({ char: child.char, id: child.id, name: child.name, x: absX, y: absY, width: child.width, height: child.height, shape: child.shape });
        if (recursive && child.children) {
          collect(child, absX, absY);
        }
      }
    }
    collect(node, 0, 0);
    return objects;
  }

  renderAscii(node, maxCols = 60, maxRows = 30, recursive = false) {
    const objects = this.collectRenderObjects(node, recursive);
    if (objects.length === 0) {
      return { ascii: [`(empty: ${node.width}m × ${node.height}m)`], legend: [], scaleInfo: '' };
    }

    const scaleX = node.width / maxCols;
    const scaleY = node.height / maxRows;
    const scale = Math.max(scaleX, scaleY, 0.1);

    const cols = Math.min(maxCols, Math.ceil(node.width / scale));
    const rows = Math.min(maxRows, Math.ceil(node.height / scale));

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

    return {
      ascii: grid.map(r => r.join('')),
      legend,
      scaleInfo: `1 cell = ${scale.toFixed(2)}m | ${cols}×${rows} cells | ${node.width}m × ${node.height}m`,
    };
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
