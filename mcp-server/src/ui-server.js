import http from 'http';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const MAP_FILE = resolve(DATA_DIR, 'map.json');
const UI_DIR = resolve(__dirname, '../ui');
const UI_FILE = resolve(UI_DIR, 'index.html');

const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function collectFiles(dir) {
  let files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(collectFiles(full));
    else files.push(full);
  }
  return files;
}

function loadMap() {
  if (!existsSync(MAP_FILE)) return null;
  try {
    const root = JSON.parse(readFileSync(MAP_FILE, 'utf-8'));
    if (root) resolveStamps(root, root);
    return root;
  } catch { return null; }
}

// Resolve stamp references — expand template children
function resolveStamps(root, node) {
  if (!node || !node.children) return;
  for (const [id, child] of Object.entries(node.children)) {
    if ((child.tags || []).includes('stamp') && child.metadata?._template && Object.keys(child.children || {}).length === 0) {
      const source = resolveNode(root, child.metadata._template);
      if (!source) continue;
      const rot = child.rotation || 0;
      const bbox = subtreeBBox(source);
      const parts = [];
      if (source.x !== undefined && source.char) {
        parts.push({ id: '_body', name: source.name, x: 0, y: 0, width: source.width, height: source.height, char: source.char, description: '', tags: [...(source.tags || []).filter(t => t !== 'template')], metadata: {}, rotation: 0, children: {} });
      }
      for (const sc of Object.values(source.children || {})) {
        parts.push(JSON.parse(JSON.stringify(sc)));
      }
      if (rot !== 0) {
        for (const part of parts) {
          const cx = part.x, cy = part.y, cw = part.width, ch = part.height;
          if (rot === 90) { part.x = bbox.h - cy - ch; part.y = cx; }
          else if (rot === 180) { part.x = bbox.w - cx - cw; part.y = bbox.h - cy - ch; }
          else if (rot === 270) { part.x = cy; part.y = bbox.w - cx - cw; }
          if (rot === 90 || rot === 270) { const tmp = part.width; part.width = part.height; part.height = tmp; }
        }
      }
      child.children = {};
      for (const part of parts) child.children[part.id] = part;
    }
    resolveStamps(root, child);
  }
}

function subtreeBBox(node) {
  let w = node.width || 0, h = node.height || 0;
  for (const child of Object.values(node.children || {})) {
    if (child.x !== undefined) {
      w = Math.max(w, child.x + child.width);
      h = Math.max(h, child.y + child.height);
    }
  }
  return { w, h };
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

/**
 * Get effective bounds of a node.
 * Spatial nodes: use explicit width/height.
 * Folder nodes: auto-calculate from children bounding box.
 */
function getEffectiveBounds(node) {
  if (node.x !== undefined && node.width !== undefined) {
    return { w: node.width, h: node.height };
  }
  let maxW = 0, maxH = 0;
  for (const child of Object.values(node.children || {})) {
    if (child.x !== undefined) {
      maxW = Math.max(maxW, child.x + (child.width || 0));
      maxH = Math.max(maxH, child.y + (child.height || 0));
    }
  }
  return { w: maxW || 1, h: maxH || 1 };
}

function renderAscii(node, maxCols = 60, maxRows = 30, filterChildren = null, projection = 'plan') {
  const allChildren = filterChildren || Object.values(node.children || {});
  // Skip folder nodes (no spatial data) in rendering
  const spatialChildren = allChildren.filter(c => c.x !== undefined);

  let children;
  if (projection === 'plan') {
    children = spatialChildren;
  } else {
    children = spatialChildren
      .filter(c => c.z !== undefined && c.height_3d !== undefined)
      .map(c => ({
        ...c,
        x: projection === 'front' ? c.x : c.y,
        y: c.z,
        width: projection === 'front' ? c.width : c.height,
        height: c.height_3d,
      }));
  }

  const bounds = getEffectiveBounds(node);

  if (children.length === 0) {
    if (projection !== 'plan') {
      return { ascii: [], legend: [], scaleInfo: `No objects with z data for ${projection} view` };
    }
    return { ascii: [], legend: [], scaleInfo: `${bounds.w}m × ${bounds.h}m — empty` };
  }

  let viewW, viewH, viewLabel;
  if (projection === 'plan') {
    viewW = bounds.w;
    viewH = bounds.h;
    viewLabel = `${bounds.w}m × ${bounds.h}m`;
  } else {
    viewW = projection === 'front' ? bounds.w : bounds.h;
    viewH = node.height_3d || Math.max(...children.map(c => c.y + c.height), 3);
    viewLabel = `${viewW}m × ${viewH}m (${projection})`;
  }

  const scaleX = viewW / maxCols;
  const scaleY = viewH / maxRows;
  const scale = Math.max(scaleX, scaleY, 0.1);
  const cols = Math.min(maxCols, Math.ceil(viewW / scale));
  const rows = Math.min(maxRows, Math.ceil(viewH / scale));
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

  const finalGrid = (projection !== 'plan') ? grid.reverse() : grid;

  return {
    ascii: finalGrid.map(r => r.join('')),
    legend,
    scaleInfo: `1 cell = ${scale.toFixed(2)}m | ${cols}×${rows} cells | ${viewLabel}`,
  };
}


function collectTree(node, path = '') {
  const isSpatial = node.x !== undefined;
  const entry = {
    id: node.id,
    name: node.name,
    path: path || '/',
    hasGrid: !!node.children,
    isSpatial,
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
  const isSpatial = c.x !== undefined;
  const out = {
    id: c.id,
    name: c.name,
    char: c.char || (isSpatial ? '#' : null),
    x: c.x ?? 0, y: c.y ?? 0,
    width: c.width ?? 0, height: c.height ?? 0,
    shape: c.shape || null,
    description: c.description || '',
    tags: c.tags || [],
    metadata: c.metadata || {},
    rotation: c.rotation || 0,
    hasGrid: !!c.children,
    isSpatial,
    childCount: Object.keys(c.children || {}).length,
  };
  if (c.z !== undefined) out.z = c.z;
  if (c.height_3d !== undefined) out.height_3d = c.height_3d;
  return out;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Static files (css, js, etc.)
  if (!url.pathname.startsWith('/api/') && url.pathname.includes('.')) {
    const filePath = join(UI_DIR, decodeURIComponent(url.pathname));
    const normalized = resolve(filePath);
    if (!normalized.startsWith(UI_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (existsSync(normalized) && statSync(normalized).isFile()) {
      const ext = extname(normalized);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(readFileSync(normalized));
      return;
    }
  }

  // SPA fallback — serve index.html for all non-API, non-file routes
  if (!url.pathname.startsWith('/api/')) {
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
    if (!node) { return json(res, { error: `Not found: ${path}` }, 404); }

    const maxCols = parseInt(url.searchParams.get('cols')) || 60;
    const maxRows = parseInt(url.searchParams.get('rows')) || 30;
    const projection = url.searchParams.get('projection') || 'plan';

    const bounds = getEffectiveBounds(node);
    const children = Object.values(node.children || {}).map(serializeChild);

    // Collect ALL descendants recursively with absolute coordinates
    const descendants = [];
    function collectDescendants(obj, offsetX, offsetY, depth, rootParentId) {
      for (const child of Object.values(obj.children || {})) {
        const childIsSpatial = child.x !== undefined;
        const absX = offsetX + (child.x ?? 0);
        const absY = offsetY + (child.y ?? 0);
        descendants.push({
          ...serializeChild(child),
          x: absX,
          y: absY,
          _depth: depth,
          _rootParentId: rootParentId,
        });
        if (child.children) {
          collectDescendants(child, absX, absY, depth + 1, rootParentId);
        }
      }
    }
    for (const child of Object.values(node.children || {})) {
      if (child.children) {
        collectDescendants(child, child.x ?? 0, child.y ?? 0, 1, child.id);
      }
    }

    const { ascii, legend, scaleInfo } = renderAscii(node, maxCols, maxRows, null, projection);

    return json(res, {
      id: node.id, name: node.name, description: node.description || '',
      width: bounds.w, height: bounds.h,
      char: node.char, tags: node.tags || [], metadata: node.metadata || {},
      isContainer: !!node.children,
      isSpatial: node.x !== undefined,
      scaleInfo, ascii, legend, children, descendants, path, projection,
    });
  }

  if (url.pathname === '/api/ui-hash') {
    const hasher = crypto.createHash('md5');
    for (const f of collectFiles(UI_DIR)) {
      hasher.update(f + ':' + statSync(f).mtimeMs);
    }
    return json(res, { hash: hasher.digest('hex') });
  }

  if (url.pathname === '/api/raw') {
    const root = loadMap();
    return json(res, root);
  }

  if (url.pathname === '/api/delete' && req.method === 'POST') {
    const path = url.searchParams.get('path');
    if (!path) return json(res, { error: 'Missing path' }, 400);
    const root = loadMap();
    if (!root) return json(res, { error: 'No map data' }, 404);
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return json(res, { error: 'Cannot delete root' }, 400);
    const parentPath = parts.slice(0, -1).join('/') || '/';
    const childId = parts[parts.length - 1];
    const parent = resolveNode(root, parentPath);
    if (!parent || !parent.children || !parent.children[childId]) {
      return json(res, { error: `Not found: ${path}` }, 404);
    }
    delete parent.children[childId];
    writeFileSync(MAP_FILE, JSON.stringify(root, null, 2));
    return json(res, { ok: true, deleted: path });
  }

  res.writeHead(404);
  res.end('Not found');
});

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MapCraft UI: http://localhost:${PORT}`);
});
