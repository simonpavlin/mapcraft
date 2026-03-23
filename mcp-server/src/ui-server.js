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

function renderAscii(node, maxCols = 60, maxRows = 30, filterChildren = null, projection = 'plan') {
  const allChildren = filterChildren || Object.values(node.children || {});

  // Project children based on projection type
  let children;
  if (projection === 'plan') {
    children = allChildren;
  } else {
    children = allChildren
      .filter(c => c.elevation !== undefined && c.height_3d !== undefined)
      .map(c => ({
        ...c,
        x: projection === 'front' ? c.x : c.y,
        y: c.elevation,
        width: projection === 'front' ? c.width : c.height,
        height: c.height_3d,
      }));
  }

  if (children.length === 0) {
    if (projection !== 'plan') {
      return { ascii: [], legend: [], scaleInfo: `No objects with elevation data for ${projection} view` };
    }
    return { ascii: [], legend: [], scaleInfo: `${node.width}m × ${node.height}m — empty` };
  }

  // Determine viewport
  let viewW, viewH, viewLabel;
  if (projection === 'plan') {
    viewW = node.width;
    viewH = node.height;
    viewLabel = `${node.width}m × ${node.height}m`;
  } else {
    viewW = projection === 'front' ? node.width : node.height;
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

  // For front/side views, flip Y so floor is at bottom
  const finalGrid = (projection !== 'plan') ? grid.reverse() : grid;

  return {
    ascii: finalGrid.map(r => r.join('')),
    legend,
    scaleInfo: `1 cell = ${scale.toFixed(2)}m | ${cols}×${rows} cells | ${viewLabel}`,
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
  const out = {
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
  if (c.elevation !== undefined) out.elevation = c.elevation;
  if (c.height_3d !== undefined) out.height_3d = c.height_3d;
  return out;
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
    if (!node) { return json(res, { error: `Not found: ${path}` }, 404); }

    const maxCols = parseInt(url.searchParams.get('cols')) || 60;
    const maxRows = parseInt(url.searchParams.get('rows')) || 30;
    const projection = url.searchParams.get('projection') || 'plan';

    const floors = detectFloors(node);
    const children = Object.values(node.children || {}).map(serializeChild);

    // Collect ALL descendants recursively with absolute coordinates
    const descendants = [];
    function collectDescendants(obj, offsetX, offsetY, depth, rootParentId) {
      for (const child of Object.values(obj.children || {})) {
        const absX = offsetX + child.x;
        const absY = offsetY + child.y;
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
        collectDescendants(child, child.x, child.y, 1, child.id);
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

        // Add the floor container itself as a reference frame
        floorSectionChildren.push({
          ...serializeChild(floorNode),
          elevation: floorY,
          height_3d: floorH,
          _floorId: floorInfo.id,
        });

        // Add all descendants of this floor with floor_y offset
        for (const child of Object.values(floorNode.children || {})) {
          const elev = (child.elevation ?? (child.metadata?.floor_y ?? 0));
          floorSectionChildren.push({
            ...serializeChild(child),
            elevation: floorY + elev,
            height_3d: child.height_3d ?? child.metadata?.floor_height ?? floorH,
            _floorId: floorInfo.id,
          });
          // Recurse into room children
          if (child.children) {
            for (const gc of Object.values(child.children)) {
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
      width: node.width, height: node.height,
      char: node.char, tags: node.tags || [], metadata: node.metadata || {},
      isContainer: !!node.children,
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
