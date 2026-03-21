import http from 'http';
import { readFileSync, existsSync, watchFile } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

function renderAscii(node) {
  if (!node || !node.grid) return { ascii: [], legend: [] };
  const g = node.grid;
  const rows = [];
  for (let r = 0; r < g.height; r++) rows.push(new Array(g.width).fill('.'));
  const legend = [];
  for (const child of Object.values(node.children || {})) {
    legend.push({ char: child.char, id: child.id, name: child.name });
    for (let dy = 0; dy < child.height; dy++) {
      for (let dx = 0; dx < child.width; dx++) {
        const gy = child.y + dy;
        const gx = child.x + dx;
        if (gy >= 0 && gy < g.height && gx >= 0 && gx < g.width) {
          rows[gy][gx] = child.char;
        }
      }
    }
  }
  return { ascii: rows.map(r => r.join('')), legend };
}

function collectTree(node, path = '') {
  const entry = {
    id: node.id,
    name: node.name,
    path: path || '/',
    hasGrid: !!node.grid,
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

  // CORS
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
      res.end(JSON.stringify({ error: 'No map data. Use MCP to init_space first.' }));
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

    const { ascii, legend } = renderAscii(node);
    const children = Object.values(node.children || {}).map(c => ({
      id: c.id,
      name: c.name,
      char: c.char,
      x: c.x, y: c.y,
      width: c.width, height: c.height,
      description: c.description,
      tags: c.tags,
      hasGrid: !!c.grid,
      gridSize: c.grid ? `${c.grid.width}×${c.grid.height}` : null,
      childCount: Object.keys(c.children || {}).length,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: node.id,
      name: node.name,
      description: node.description,
      grid: node.grid,
      char: node.char,
      tags: node.tags,
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
