import http from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const MAP_FILE = resolve(DATA_DIR, 'map.json');
const UI_FILE = resolve(__dirname, '../ui/index.html');

const PORT = 3001;

function loadMap() {
  if (!existsSync(MAP_FILE)) return null;
  try { return JSON.parse(readFileSync(MAP_FILE, 'utf-8')); }
  catch { return null; }
}

function resolveNode(root, path) {
  if (!root || !path || path === '/') return root;
  const parts = path.split('/').filter(Boolean);
  let node = root;
  for (const p of parts) {
    if (!node.children || !node.children[p]) return null;
    node = node.children[p];
  }
  return node;
}

function renderAscii(node, maxCols = 60, maxRows = 30, filterChildren = null) {
  const children = filterChildren || Object.values(node.children || {});
  if (children.length === 0) {
    return { ascii: [], legend: [], scaleInfo: `${node.width}m × ${node.height}m — empty` };
  }
  const scaleX = node.width / maxCols;
  const scaleY = node.height / maxRows;
  const scale = Math.max(scaleX, scaleY, 0.1);
  const cols = Math.min(maxCols, Math.ceil(node.width / scale));
  const rows = Math.min(maxRows, Math.ceil(node.height / scale));
  const grid = [];
  for (let r = 0; r < rows; r++) grid.push(new Array(cols).fill('.'));
  const legend = [];
  for (const child of children) {
    legend.push({ char: child.char, id: child.id, name: child.name });
    const sc = Math.floor(child.x / scale);
    const sr = Math.floor(child.y / scale);
    const ec = Math.ceil((child.x + child.width) / scale);
    const er = Math.ceil((child.y + child.height) / scale);
    for (let r = sr; r < er && r < rows; r++)
      for (let c = sc; c < ec && c < cols; c++)
        if (r >= 0 && c >= 0) grid[r][c] = child.char;
  }
  return {
    ascii: grid.map(r => r.join('')),
    legend,
    scaleInfo: `1 cell = ${scale.toFixed(2)}m | ${cols}×${rows} cells | ${node.width}m × ${node.height}m`,
  };
}

/**
 * Detect "floor" containers: children that are containers with same position+size.
 * Returns array of {id, name} or null if no floors detected.
 */
function detectFloors(node) {
  const children = Object.values(node.children || {});
  const containers = children.filter(c => c.children);
  if (containers.length < 2) return null;
  // Group by position+size
  const groups = {};
  for (const c of containers) {
    const key = `${c.x},${c.y},${c.width},${c.height}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  // Find a group with 2+ containers (= floors)
  for (const g of Object.values(groups)) {
    if (g.length >= 2) return g.map(c => ({ id: c.id, name: c.name, char: c.char }));
  }
  return null;
}

function collectTree(node, path = '') {
  const entry = {
    id: node.id,
    name: node.name,
    path: path || '/',
    hasGrid: !!node.children,
    childCount: Object.keys(node.children || {}).length,
    tags: node.tags || [],
    children: [],
  };
  for (const [id, child] of Object.entries(node.children || {})) {
    const childPath = path ? `${path}/${id}` : id;
    entry.children.push(collectTree(child, childPath));
  }
  return entry;
}

function serializeChild(c) {
  return {
    id: c.id,
    name: c.name,
    char: c.char,
    x: c.x, y: c.y,
    width: c.width, height: c.height,
    shape: c.shape || null,
    description: c.description || '',
    tags: c.tags || [],
    metadata: c.metadata || {},
    hasGrid: !!c.children,
    childCount: Object.keys(c.children || {}).length,
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(UI_FILE, 'utf-8'));
    return;
  }

  if (url.pathname === '/api/tree') {
    const root = loadMap();
    if (!root) return json(res, { error: 'No map data.' });
    return json(res, collectTree(root));
  }

  if (url.pathname === '/api/node') {
    const root = loadMap();
    const path = url.searchParams.get('path') || '/';
    const node = resolveNode(root, path);
    if (!node) { res.writeHead(404); return json(res, { error: `Not found: ${path}` }); }

    const maxCols = parseInt(url.searchParams.get('cols')) || 60;
    const maxRows = parseInt(url.searchParams.get('rows')) || 30;
    const { ascii, legend, scaleInfo } = renderAscii(node, maxCols, maxRows);

    const floors = detectFloors(node);
    const children = Object.values(node.children || {}).map(serializeChild);

    // Collect ALL descendants recursively with absolute coordinates
    const descendants = [];
    function collectDescendants(obj, offsetX, offsetY, depth) {
      for (const child of Object.values(obj.children || {})) {
        const absX = offsetX + child.x;
        const absY = offsetY + child.y;
        descendants.push({
          ...serializeChild(child),
          x: absX,
          y: absY,
          _depth: depth,
        });
        if (child.children) {
          collectDescendants(child, absX, absY, depth + 1);
        }
      }
    }
    for (const child of Object.values(node.children || {})) {
      if (child.children) {
        collectDescendants(child, child.x, child.y, 1);
      }
    }

    return json(res, {
      id: node.id, name: node.name, description: node.description || '',
      width: node.width, height: node.height,
      char: node.char, tags: node.tags || [], metadata: node.metadata || {},
      isContainer: !!node.children,
      scaleInfo, ascii, legend, children, descendants, floors, path,
    });
  }

  if (url.pathname === '/api/ui-hash') {
    const content = readFileSync(UI_FILE, 'utf-8');
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return json(res, { hash });
  }

  if (url.pathname === '/api/raw') {
    const root = loadMap();
    return json(res, root);
  }

  res.writeHead(404);
  res.end('Not found');
});

function json(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MapCraft UI: http://localhost:${PORT}`);
});
