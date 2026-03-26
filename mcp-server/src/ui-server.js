import http from 'http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
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
      .filter(c => c.elevation !== undefined && c.height_3d !== undefined)
      .map(c => ({
        ...c,
        x: projection === 'front' ? c.x : c.y,
        y: c.elevation,
        width: projection === 'front' ? c.width : c.height,
        height: c.height_3d,
      }));
  }

  const bounds = getEffectiveBounds(node);

  if (children.length === 0) {
    if (projection !== 'plan') {
      return { ascii: [], legend: [], scaleInfo: `No objects with elevation data for ${projection} view` };
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
    viewH = node.metadata?.floor_height || Math.max(...children.map(c => c.y + c.height), 3);
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

/**
 * Detect "floor" containers: children that are containers with same position+size,
 * OR children tagged with "floor".
 */
function detectFloors(node) {
  const children = Object.values(node.children || {});

  // Check for explicit floor tags first
  const taggedFloors = children.filter(c => c.children && (c.tags || []).includes('floor'));
  if (taggedFloors.length >= 2) return taggedFloors.map(c => ({ id: c.id, name: c.name, char: c.char || null }));

  // Fall back to spatial containers with matching position+size
  const containers = children.filter(c => c.children && c.x !== undefined);
  if (containers.length < 2) return null;
  const groups = {};
  for (const c of containers) {
    const key = `${c.x},${c.y},${c.width},${c.height}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  for (const g of Object.values(groups)) {
    if (g.length >= 2) return g.map(c => ({ id: c.id, name: c.name, char: c.char || null }));
  }
  return null;
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
  if (c.elevation !== undefined) out.elevation = c.elevation;
  if (c.height_3d !== undefined) out.height_3d = c.height_3d;
  return out;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
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
    const floors = detectFloors(node);
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

    // For front/side projection with floors: build combined cross-section
    let floorSectionChildren = null;
    let floorSectionHeight = null;
    if (projection !== 'plan' && floors && floors.length > 0) {
      floorSectionChildren = [];
      let maxH = 0;
      for (const floorInfo of floors) {
        const floorNode = node.children[floorInfo.id];
        if (!floorNode) continue;
        const floorY = floorNode.metadata?.floor_y || 0;
        const floorH = floorNode.metadata?.floor_height || 3;
        maxH = Math.max(maxH, floorY + floorH);

        floorSectionChildren.push({
          ...serializeChild(floorNode),
          elevation: floorY,
          height_3d: floorH,
          _floorId: floorInfo.id,
        });

        for (const child of Object.values(floorNode.children || {})) {
          if (child.x === undefined) continue; // skip folder children
          const elev = (child.elevation ?? (child.metadata?.floor_y ?? 0));
          floorSectionChildren.push({
            ...serializeChild(child),
            elevation: floorY + elev,
            height_3d: child.height_3d ?? child.metadata?.floor_height ?? floorH,
            _floorId: floorInfo.id,
          });
          if (child.children) {
            for (const gc of Object.values(child.children)) {
              if (gc.x === undefined) continue; // skip folder grandchildren
              const gcElev = gc.elevation ?? 0;
              floorSectionChildren.push({
                ...serializeChild(gc),
                x: child.x + gc.x,
                y: child.y + gc.y,
                elevation: floorY + gcElev,
                height_3d: gc.height_3d ?? 0.5,
                _floorId: floorInfo.id,
                _depth: 2,
              });
            }
          }
        }
      }
      floorSectionHeight = maxH;
    }

    const { ascii, legend, scaleInfo } = renderAscii(node, maxCols, maxRows, null, projection);

    return json(res, {
      id: node.id, name: node.name, description: node.description || '',
      width: bounds.w, height: bounds.h,
      char: node.char, tags: node.tags || [], metadata: node.metadata || {},
      isContainer: !!node.children,
      isSpatial: node.x !== undefined,
      scaleInfo, ascii, legend, children, descendants, floors, path, projection,
      floorSection: floorSectionChildren,
      floorSectionHeight,
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
