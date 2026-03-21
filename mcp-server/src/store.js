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
      // Bounds in meters
      x: 0, y: 0,
      width,  // meters
      height, // meters
      char: '.',
      tags: [],
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
   * Render ASCII with automatic scaling.
   * maxCols/maxRows define the max terminal size.
   * The view auto-scales so everything fits.
   */
  renderAscii(node, maxCols = 60, maxRows = 30) {
    const children = Object.values(node.children || {});
    if (children.length === 0) {
      return { ascii: [`(empty space: ${node.width}m × ${node.height}m)`], legend: [], scaleInfo: '' };
    }

    // Compute scale: how many meters per ASCII cell
    const scaleX = node.width / maxCols;
    const scaleY = node.height / maxRows;
    const scale = Math.max(scaleX, scaleY, 0.1); // at least 0.1m per cell

    const cols = Math.min(maxCols, Math.ceil(node.width / scale));
    const rows = Math.min(maxRows, Math.ceil(node.height / scale));

    // Initialize grid
    const grid = [];
    for (let r = 0; r < rows; r++) {
      grid.push(new Array(cols).fill('.'));
    }

    const legend = [];

    // Place children
    for (const child of children) {
      legend.push({ char: child.char, id: child.id, name: child.name });

      const startCol = Math.floor(child.x / scale);
      const startRow = Math.floor(child.y / scale);
      const endCol = Math.ceil((child.x + child.width) / scale);
      const endRow = Math.ceil((child.y + child.height) / scale);

      for (let r = startRow; r < endRow && r < rows; r++) {
        for (let c = startCol; c < endCol && c < cols; c++) {
          if (r >= 0 && c >= 0) {
            grid[r][c] = child.char;
          }
        }
      }
    }

    const ascii = grid.map(row => row.join(''));
    const scaleInfo = `1 cell = ${scale.toFixed(2)}m | view: ${cols}×${rows} cells | real: ${node.width}m × ${node.height}m`;

    return { ascii, legend, scaleInfo };
  }

  exportJSON() {
    return this.root;
  }

  save() {
    writeFileSync(MAP_FILE, JSON.stringify(this.root, null, 2));
  }

  _load() {
    if (!existsSync(MAP_FILE)) return null;
    try {
      return JSON.parse(readFileSync(MAP_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
}

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
}
