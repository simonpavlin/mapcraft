import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MapStore } from './store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const MAP_FILE = resolve(DATA_DIR, 'map.json');
const UI_FILE = resolve(__dirname, '../ui/index.html');

const PORT = 3001;

function loadMap() {
  if (!existsSync(MAP_FILE)) return null;
  try {
    return JSON.parse(readFileSync(MAP_FILE, 'utf-8'));
  } catch {
    return null;
  }
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

function renderAscii(node, maxCols = 60, maxRows = 30) {
  const children = Object.values(node.children || {});
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
    const startCol = Math.floor(child.x / scale);
    const startRow = Math.floor(child.y / scale);
    const endCol = Math.ceil((child.x + child.width) / scale);
    const endRow = Math.ceil((child.y + child.height) / scale);
    for (let r = startRow; r < endRow && r < rows; r++) {
      for (let c = startCol; c < endCol && c < cols; c++) {
        if (r >= 0 && c >= 0) grid[r][c] = child.char;
      }
    }
  }

  return {
    ascii: grid.map(r => r.join('')),
    legend,
    scaleInfo: `1 cell = ${scale.toFixed(2)}m | ${cols}×${rows} cells | ${node.width}m × ${node.height}m`,
  };
}

function collectTree(node, path = '') {
  const hasChildren = node.children && Object.keys(node.children).length > 0;
  const entry = {
    id: node.id,
    name: node.name,
    path: path || '/',
    hasGrid: hasChildren || !!node.children, // container = has children dict
    childCount: Object.keys(node.children || {}).length,
    children: [],
  };
  for (const [id, child] of Object.entries(node.children || {})) {
    const childPath = path ? `${path}/${id}` : id;
    entry.children.push(collectTree(child, childPath));
  }
  return entry;
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
    if (!root) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No map data.' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(collectTree(root)));
    return;
  }

  if (url.pathname === '/api/node') {
    const root = loadMap();
    const path = url.searchParams.get('path') || '/';
    const node = resolveNode(root, path);
    if (!node) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Path "${path}" not found` }));
      return;
    }

    const maxCols = parseInt(url.searchParams.get('cols')) || 60;
    const maxRows = parseInt(url.searchParams.get('rows')) || 30;
    const { ascii, legend, scaleInfo } = renderAscii(node, maxCols, maxRows);

    const isContainer = !!node.children;
    const children = Object.values(node.children || {}).map(c => ({
      id: c.id,
      name: c.name,
      char: c.char,
      x: c.x, y: c.y,
      width: c.width, height: c.height,
      description: c.description,
      tags: c.tags,
      hasGrid: !!c.children,
      childCount: Object.keys(c.children || {}).length,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: node.id,
      name: node.name,
      description: node.description,
      width: node.width,
      height: node.height,
      char: node.char,
      tags: node.tags,
      isContainer,
      scaleInfo,
      grid: isContainer ? { width: node.width, height: node.height, cell_size: 1 } : null,
      ascii,
      legend,
      children,
      path,
    }));
    return;
  }

  if (url.pathname === '/api/raw') {
    const root = loadMap();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(root, null, 2));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MapCraft UI: http://localhost:${PORT}`);
});
