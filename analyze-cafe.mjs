import sharp from './viewer/node_modules/sharp/lib/index.js';
import { writeFileSync } from 'fs';

const IMG = '/mnt/c/Users/simip/Downloads/Loft-Cafe-Karlin-2048x1365.jpg';

// ─── 1. Load image and get raw pixels ───
const img = sharp(IMG);
const meta = await img.metadata();
console.log(`Image: ${meta.width}x${meta.height}`);

const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, CH = info.channels;

function getPixel(x, y) {
  const i = (y * W + x) * CH;
  return [data[i], data[i + 1], data[i + 2]];
}

// ─── 2. Color detection functions ───
function isRed(r, g, b) {
  return r > 140 && g < 80 && b < 80 && r > g * 2 && r > b * 2;
}

function isYellow(r, g, b) {
  return r > 150 && g > 120 && b < 80 && r > b * 2;
}

function isWoodBrown(r, g, b) {
  // Reclaimed wood / table tops
  return r > 100 && r < 200 && g > 70 && g < 150 && b > 30 && b < 100
    && r > g && g > b;
}

function isDark(r, g, b) {
  return r < 60 && g < 60 && b < 60;
}

function isWhiteTile(r, g, b) {
  return r > 180 && g > 180 && b > 180;
}

function isChrome(r, g, b) {
  // Silver/chrome espresso machine
  return r > 160 && g > 160 && b > 160 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20;
}

function isLightBlue(r, g, b) {
  // Display fridge illumination
  return b > 180 && r > 180 && g > 200;
}

// ─── 3. Scan image in grid cells ───
const GRID = 20; // divide image into 20x20 grid
const cellW = Math.floor(W / GRID);
const cellH = Math.floor(H / GRID);

const result = {
  red: [],
  yellow: [],
  wood: [],
  dark: [],
  chrome: [],
  bright: [],
};

for (let gy = 0; gy < GRID; gy++) {
  for (let gx = 0; gx < GRID; gx++) {
    const counts = { red: 0, yellow: 0, wood: 0, dark: 0, chrome: 0, bright: 0, total: 0 };

    // Sample pixels in this cell
    const step = 3; // sample every 3rd pixel for speed
    for (let y = gy * cellH; y < (gy + 1) * cellH; y += step) {
      for (let x = gx * cellW; x < (gx + 1) * cellW; x += step) {
        if (x >= W || y >= H) continue;
        const [r, g, b] = getPixel(x, y);
        counts.total++;
        if (isRed(r, g, b)) counts.red++;
        if (isYellow(r, g, b)) counts.yellow++;
        if (isWoodBrown(r, g, b)) counts.wood++;
        if (isDark(r, g, b)) counts.dark++;
        if (isChrome(r, g, b)) counts.chrome++;
        if (isLightBlue(r, g, b)) counts.bright++;
      }
    }

    // Threshold: >8% of pixels in cell
    const threshold = counts.total * 0.08;
    for (const color of Object.keys(result)) {
      if (counts[color] > threshold) {
        result[color].push({
          gridX: gx,
          gridY: gy,
          pct: Math.round(counts[color] / counts.total * 100),
        });
      }
    }
  }
}

// ─── 4. Print color map ───
console.log('\n=== COLOR MAP (20x20 grid) ===');
console.log('R=red  Y=yellow  W=wood  D=dark  C=chrome  B=bright  .=other\n');

for (let gy = 0; gy < GRID; gy++) {
  let row = '';
  for (let gx = 0; gx < GRID; gx++) {
    const r = result.red.find(c => c.gridX === gx && c.gridY === gy);
    const y = result.yellow.find(c => c.gridX === gx && c.gridY === gy);
    const w = result.wood.find(c => c.gridX === gx && c.gridY === gy);
    const d = result.dark.find(c => c.gridX === gx && c.gridY === gy);
    const c = result.chrome.find(c => c.gridX === gx && c.gridY === gy);
    const b = result.bright.find(c => c.gridX === gx && c.gridY === gy);

    // Priority: red > yellow > chrome > bright > wood > dark
    if (r && r.pct > 15) row += 'R';
    else if (y && y.pct > 10) row += 'Y';
    else if (c && c.pct > 15) row += 'C';
    else if (b && b.pct > 15) row += 'B';
    else if (w && w.pct > 12) row += 'W';
    else if (d && d.pct > 30) row += 'D';
    else row += '.';
  }
  console.log(`${String(gy).padStart(2)}: ${row}`);
}

// ─── 5. Identify clusters ───
console.log('\n=== DETECTED CLUSTERS ===\n');

function findClusters(cells, label) {
  if (cells.length === 0) return [];
  // Simple flood-fill clustering
  const visited = new Set();
  const clusters = [];

  for (const cell of cells) {
    const key = `${cell.gridX},${cell.gridY}`;
    if (visited.has(key)) continue;

    const cluster = [];
    const queue = [cell];
    while (queue.length > 0) {
      const c = queue.shift();
      const k = `${c.gridX},${c.gridY}`;
      if (visited.has(k)) continue;
      visited.add(k);
      cluster.push(c);

      // Check neighbors
      for (const n of cells) {
        const nk = `${n.gridX},${n.gridY}`;
        if (!visited.has(nk) && Math.abs(n.gridX - c.gridX) <= 1 && Math.abs(n.gridY - c.gridY) <= 1) {
          queue.push(n);
        }
      }
    }
    clusters.push(cluster);
  }

  return clusters.map(cl => {
    const minX = Math.min(...cl.map(c => c.gridX));
    const maxX = Math.max(...cl.map(c => c.gridX));
    const minY = Math.min(...cl.map(c => c.gridY));
    const maxY = Math.max(...cl.map(c => c.gridY));
    return {
      label,
      gridBounds: { minX, maxX, minY, maxY },
      size: cl.length,
      avgPct: Math.round(cl.reduce((s, c) => s + c.pct, 0) / cl.length),
    };
  });
}

for (const [color, cells] of Object.entries(result)) {
  const clusters = findClusters(cells, color);
  for (const cl of clusters) {
    if (cl.size >= 2) { // only significant clusters
      const { minX, maxX, minY, maxY } = cl.gridBounds;
      console.log(`${cl.label.toUpperCase()} cluster: grid(${minX}-${maxX}, ${minY}-${maxY}) size=${cl.size} avg=${cl.avgPct}%`);
      // Convert to approximate room percentages
      const pctX1 = Math.round(minX / GRID * 100);
      const pctX2 = Math.round((maxX + 1) / GRID * 100);
      const pctY1 = Math.round(minY / GRID * 100);
      const pctY2 = Math.round((maxY + 1) / GRID * 100);
      console.log(`  → image area: ${pctX1}-${pctX2}% X, ${pctY1}-${pctY2}% Y`);
    }
  }
}

// ─── 6. Perspective reference points ───
console.log('\n=== PERSPECTIVE NOTES ===');
console.log('Photo taken from elevated SW corner looking NE');
console.log('The floor tile pattern can serve as a metric grid reference');
console.log('Approximate room visible area: ~60-85% of image (excluding walls/ceiling border)');
