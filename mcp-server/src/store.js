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

  initSpace(name, width, height, cellSize, description) {
    this.root = {
      id: '_root',
      name,
      description: description || '',
      x: 0,
      y: 0,
      width,
      height,
      char: '.',
      tags: [],
      children: {},
      grid: { width, height, cell_size: cellSize },
    };
    this.save();
  }

  /**
   * Resolve a path like "building_a/floor_1/kitchen" to a node.
   * "/" or "" returns root.
   */
  resolve(path) {
    if (!this.root) return null;
    if (!path || path === '/') return this.root;

    const parts = path.split('/').filter(Boolean);
    let node = this.root;

    for (const part of parts) {
      if (!node.children || !node.children[part]) return null;
      node = node.children[part];
    }

    return node;
  }

  /**
   * Find objects in parent that overlap with the given rectangle.
   * Optionally exclude one object by id (for move operations).
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
   * Render ASCII grid for a node.
   */
  renderAscii(node) {
    const grid = node.grid;
    if (!grid) return { ascii: [], legend: [] };

    // Initialize grid with dots
    const rows = [];
    for (let r = 0; r < grid.height; r++) {
      rows.push(new Array(grid.width).fill('.'));
    }

    const legend = [];

    // Fill in children
    for (const child of Object.values(node.children || {})) {
      legend.push({ char: child.char, id: child.id, name: child.name });

      for (let dy = 0; dy < child.height; dy++) {
        for (let dx = 0; dx < child.width; dx++) {
          const gy = child.y + dy;
          const gx = child.x + dx;
          if (gy >= 0 && gy < grid.height && gx >= 0 && gx < grid.width) {
            rows[gy][gx] = child.char;
          }
        }
      }
    }

    const ascii = rows.map(row => row.join(''));
    return { ascii, legend };
  }

  /**
   * Export the entire tree as JSON.
   */
  exportJSON() {
    return this.root;
  }

  save() {
    writeFileSync(MAP_FILE, JSON.stringify(this.root, null, 2));
  }

  _load() {
    if (!existsSync(MAP_FILE)) {
      return null;
    }
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
