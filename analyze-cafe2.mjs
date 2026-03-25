import sharp from './viewer/node_modules/sharp/lib/index.js';

const IMG = '/mnt/c/Users/simip/Downloads/Loft-Cafe-Karlin-2048x1365.jpg';

const img = sharp(IMG);
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, CH = info.channels;

function px(x, y) {
  const i = (y * W + x) * CH;
  return [data[i], data[i + 1], data[i + 2]];
}

// ─── Perspective mapping ───
// Approximate floor corners in image pixels (manually estimated from the photo):
// The photo is taken from elevated SW, looking NE.
// Floor visible area (approximate pixel positions):
//   Bottom-left (near viewer, SW):   ~(150, 1080)   → room (0, 0)
//   Bottom-right (SE):               ~(1680, 1080)   → room (6.5, 0)
//   Top-right (NE, far wall-floor):  ~(1550, 380)    → room (6.5, 5)
//   Top-left (NW, far wall-floor):   ~(350, 380)     → room (0, 5)

// Simple bilinear perspective interpolation
const corners = {
  // image → room mapping
  imgBL: [150, 1080],  roomBL: [0, 0],
  imgBR: [1680, 1080], roomBR: [6.5, 0],
  imgTR: [1550, 380],  roomTR: [6.5, 5],
  imgTL: [350, 380],   roomTL: [0, 5],
};

// Inverse bilinear: given image (px, py), estimate room (rx, ry)
function imgToRoom(px, py) {
  // Normalize within the trapezoid
  // Vertical interpolation factor (0=bottom, 1=top)
  const t = 1 - (py - corners.imgTL[1]) / (corners.imgBL[1] - corners.imgTL[1]);
  // Left edge x at this height
  const leftX = corners.imgBL[0] + t * (corners.imgTL[0] - corners.imgBL[0]);
  // Right edge x at this height
  const rightX = corners.imgBR[0] + t * (corners.imgTR[0] - corners.imgBR[0]);
  // Horizontal factor
  const s = (px - leftX) / (rightX - leftX);

  // Map to room coords
  const ry = t * 5;  // 0..5 meters depth
  const rx = s * 6.5; // 0..6.5 meters width
  return [Math.round(rx * 100) / 100, Math.round(ry * 100) / 100];
}

// ─── Scan for specific furniture colors with refined detection ───
const STEP = 4;
const furniture = {
  redChair: [],    // red Tolix chairs/stools
  yellowChair: [], // yellow Tolix chairs
  woodSurface: [], // wood table tops, bar top
  barWood: [],     // reclaimed wood (darker, varied)
  chrome: [],      // espresso machine
  whiteFridge: [], // display fridge
};

for (let y = Math.floor(corners.imgTL[1]); y < corners.imgBL[1]; y += STEP) {
  for (let x = 100; x < 1700; x += STEP) {
    if (x >= W || y >= H) continue;
    const [r, g, b] = px(x, y);

    // Red furniture (saturated red, not just dark-ish red)
    if (r > 160 && g < 60 && b < 60) {
      const [rx, ry] = imgToRoom(x, y);
      if (rx >= 0 && rx <= 6.5 && ry >= 0 && ry <= 5) {
        furniture.redChair.push({ rx, ry, imgX: x, imgY: y });
      }
    }

    // Yellow furniture
    if (r > 170 && g > 140 && b < 60 && r - b > 120) {
      const [rx, ry] = imgToRoom(x, y);
      if (rx >= 0 && rx <= 6.5 && ry >= 0 && ry <= 5) {
        furniture.yellowChair.push({ rx, ry, imgX: x, imgY: y });
      }
    }

    // Wood table/bar tops (warm brown, medium brightness)
    if (r > 120 && r < 200 && g > 80 && g < 140 && b > 30 && b < 90
        && r - g > 15 && r - g < 60 && g - b > 20) {
      const [rx, ry] = imgToRoom(x, y);
      if (rx >= 0 && rx <= 6.5 && ry >= 0 && ry <= 5) {
        furniture.woodSurface.push({ rx, ry, imgX: x, imgY: y });
      }
    }
  }
}

// ─── Cluster room-coordinate points ───
function clusterPoints(points, radius = 0.4) {
  if (points.length === 0) return [];
  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    const cluster = [points[i]];
    visited.add(i);

    for (let j = i + 1; j < points.length; j++) {
      if (visited.has(j)) continue;
      // Check if close to any point already in cluster
      for (const cp of cluster) {
        const dx = points[j].rx - cp.rx;
        const dy = points[j].ry - cp.ry;
        if (dx * dx + dy * dy < radius * radius) {
          cluster.push(points[j]);
          visited.add(j);
          break;
        }
      }
    }

    if (cluster.length >= 5) { // minimum pixel count for a real object
      clusters.push(cluster);
    }
  }

  return clusters.map(cl => {
    const minRx = Math.min(...cl.map(p => p.rx));
    const maxRx = Math.max(...cl.map(p => p.rx));
    const minRy = Math.min(...cl.map(p => p.ry));
    const maxRy = Math.max(...cl.map(p => p.ry));
    const avgRx = cl.reduce((s, p) => s + p.rx, 0) / cl.length;
    const avgRy = cl.reduce((s, p) => s + p.ry, 0) / cl.length;
    return {
      center: [Math.round(avgRx * 10) / 10, Math.round(avgRy * 10) / 10],
      bounds: {
        x: Math.round(minRx * 10) / 10,
        y: Math.round(minRy * 10) / 10,
        w: Math.round((maxRx - minRx) * 10) / 10,
        h: Math.round((maxRy - minRy) * 10) / 10,
      },
      pixels: cl.length,
    };
  }).sort((a, b) => b.pixels - a.pixels);
}

// ─── Output results ───
console.log('=== FURNITURE POSITIONS IN ROOM COORDS (meters) ===\n');

console.log('--- RED objects (chairs/stools) ---');
const redClusters = clusterPoints(furniture.redChair, 0.5);
for (const cl of redClusters) {
  console.log(`  center=(${cl.center[0]}, ${cl.center[1]})  bounds: x=${cl.bounds.x} y=${cl.bounds.y} ${cl.bounds.w}×${cl.bounds.h}m  (${cl.pixels} px)`);
}

console.log('\n--- YELLOW objects (chairs) ---');
const yellowClusters = clusterPoints(furniture.yellowChair, 0.5);
for (const cl of yellowClusters) {
  console.log(`  center=(${cl.center[0]}, ${cl.center[1]})  bounds: x=${cl.bounds.x} y=${cl.bounds.y} ${cl.bounds.w}×${cl.bounds.h}m  (${cl.pixels} px)`);
}

console.log('\n--- WOOD surfaces (tables, bar) ---');
const woodClusters = clusterPoints(furniture.woodSurface, 0.6);
for (const cl of woodClusters.slice(0, 15)) { // top 15
  const desc = cl.bounds.w > 1.5 ? '(BAR/large surface)' :
               cl.bounds.w > 0.4 && cl.bounds.h > 0.3 ? '(table top?)' : '';
  console.log(`  center=(${cl.center[0]}, ${cl.center[1]})  bounds: x=${cl.bounds.x} y=${cl.bounds.y} ${cl.bounds.w}×${cl.bounds.h}m  (${cl.pixels} px) ${desc}`);
}

// ─── Summary comparison with MCP ───
console.log('\n=== COMPARISON WITH CURRENT MCP PLAN ===\n');
console.log('MCP object        | MCP pos     | Detected pos  | Delta');
console.log('──────────────────┼─────────────┼───────────────┼──────');

const mcpObjects = [
  { name: 'Bar stools (red)', mcpX: 1.4, mcpY: 2.5 },
  { name: 'Red chair (t1)',   mcpX: 1.0, mcpY: 0.35 },
  { name: 'Yellow chair t2a', mcpX: 3.2, mcpY: 0.4 },
  { name: 'Yellow chair t2b', mcpX: 3.8, mcpY: 1.7 },
  { name: 'Yellow chair t4',  mcpX: 5.1, mcpY: 2.6 },
];

// Match each MCP object to nearest detected cluster
for (const obj of mcpObjects) {
  const source = obj.name.includes('red') || obj.name.includes('Red') ? redClusters : yellowClusters;
  let best = null, bestDist = 99;
  for (const cl of source) {
    const dx = cl.center[0] - obj.mcpX;
    const dy = cl.center[1] - obj.mcpY;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) { bestDist = d; best = cl; }
  }
  if (best) {
    const dx = (best.center[0] - obj.mcpX).toFixed(1);
    const dy = (best.center[1] - obj.mcpY).toFixed(1);
    console.log(`${obj.name.padEnd(18)}| (${obj.mcpX}, ${obj.mcpY})`.padEnd(37) +
      `| (${best.center[0]}, ${best.center[1]})`.padEnd(16) +
      `| Δx=${dx} Δy=${dy}`);
  } else {
    console.log(`${obj.name.padEnd(18)}| (${obj.mcpX}, ${obj.mcpY})`.padEnd(37) + '| NOT FOUND');
  }
}
