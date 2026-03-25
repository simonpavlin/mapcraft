import sharp from './viewer/node_modules/sharp/lib/index.js';

const IMG = '/mnt/c/Users/simip/Downloads/Loft-Cafe-Karlin-2048x1365.jpg';
const OUT_ANNOTATED = '/mnt/c/Users/simip/Downloads/cafe-analyzed.png';
const OUT_TOPDOWN = '/mnt/c/Users/simip/Downloads/cafe-topdown.png';

const img = sharp(IMG);
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, CH = info.channels;

const annotated = Buffer.from(data);

function getPixel(x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return [0, 0, 0];
  const i = (y * W + x) * CH;
  return [data[i], data[i + 1], data[i + 2]];
}

function setPixel(buf, x, y, r, g, b) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * CH;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
}

function drawThickLine(buf, x1, y1, x2, y2, r, g, b, thick = 2) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x1 + t * (x2 - x1));
    const y = Math.round(y1 + t * (y2 - y1));
    for (let dx = -thick; dx <= thick; dx++)
      for (let dy = -thick; dy <= thick; dy++)
        setPixel(buf, x + dx, y + dy, r, g, b);
  }
}

function drawCross(buf, cx, cy, size, r, g, b) {
  for (let d = -size; d <= size; d++) {
    for (let t = -2; t <= 2; t++) {
      setPixel(buf, cx + d, cy + t, r, g, b);
      setPixel(buf, cx + t, cy + d, r, g, b);
    }
  }
}

// ─── Perspective: floor corners in image ───
// Photo from elevated SW corner. I need the 4 floor corners.
// Looking carefully at the photo:
// - Near-left floor corner (SW): where left wall meets floor near camera ~(120, 1130)
// - Near-right floor corner (SE): right wall-floor near camera ~(1720, 1020)
// - Far-right corner (NE): right wall-floor at back wall ~(1480, 410)
// - Far-left corner (NW): left wall-floor at back wall ~(320, 430)
// Note: the view is not symmetric — left side is closer to camera

const floorSW = [120, 1130];  // near-left (entrance side, west) → room (0, 0)
const floorSE = [1720, 1020]; // near-right (entrance side, east) → room (6.5, 0)
const floorNE = [1480, 410];  // far-right (back wall, east) → room (6.5, 5)
const floorNW = [320, 430];   // far-left (back wall, west) → room (0, 5)

const RW = 6.5, RD = 5;

// Draw floor boundary
drawThickLine(annotated, ...floorSW, ...floorSE, 0, 255, 0, 2);
drawThickLine(annotated, ...floorSE, ...floorNE, 0, 255, 0, 2);
drawThickLine(annotated, ...floorNE, ...floorNW, 0, 255, 0, 2);
drawThickLine(annotated, ...floorNW, ...floorSW, 0, 255, 0, 2);

// Bilinear interpolation for perspective mapping
// room (rx, ry) → image (px, py)
function roomToImg(rx, ry) {
  const u = rx / RW; // 0..1 across width
  const v = ry / RD; // 0..1 across depth (0=front/south, 1=back/north)
  // Bilinear interpolation of 4 corners
  const px = (1 - u) * (1 - v) * floorSW[0] + u * (1 - v) * floorSE[0]
           + u * v * floorNE[0] + (1 - u) * v * floorNW[0];
  const py = (1 - u) * (1 - v) * floorSW[1] + u * (1 - v) * floorSE[1]
           + u * v * floorNE[1] + (1 - u) * v * floorNW[1];
  return [Math.round(px), Math.round(py)];
}

// Inverse: image → room (iterative Newton's method)
function imgToRoom(imgX, imgY) {
  let u = 0.5, v = 0.5;
  for (let iter = 0; iter < 20; iter++) {
    const [ex, ey] = roomToImg(u * RW, v * RD);
    const dx = imgX - ex, dy = imgY - ey;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) break;
    // Approximate Jacobian
    const [ex1, ey1] = roomToImg((u + 0.01) * RW, v * RD);
    const [ex2, ey2] = roomToImg(u * RW, (v + 0.01) * RD);
    const dxdu = (ex1 - ex) / 0.01, dydu = (ey1 - ey) / 0.01;
    const dxdv = (ex2 - ex) / 0.01, dydv = (ey2 - ey) / 0.01;
    const det = dxdu * dydv - dxdv * dydu;
    if (Math.abs(det) < 1e-6) break;
    u += (dydv * dx - dxdv * dy) / det;
    v += (-dydu * dx + dxdu * dy) / det;
  }
  return [+(u * RW).toFixed(2), +(v * RD).toFixed(2)];
}

// ─── Draw meter grid on annotated image ───
for (let rx = 0; rx <= RW; rx += 1) {
  for (let ry = 0; ry <= RD; ry += 0.05) {
    const [px, py] = roomToImg(rx, ry);
    for (let d = -1; d <= 1; d++) setPixel(annotated, px + d, py, 0, 200, 0);
  }
}
for (let ry = 0; ry <= RD; ry += 1) {
  for (let rx = 0; rx <= RW; rx += 0.05) {
    const [px, py] = roomToImg(rx, ry);
    for (let d = -1; d <= 1; d++) setPixel(annotated, px, py + d, 0, 200, 0);
  }
}

// ─── Detect colored furniture ───
const STEP = 2;
const pts = { red: [], yellow: [], wood: [] };

// Scan within floor area
for (let v = 0; v <= 1; v += 0.003) {
  for (let u = 0; u <= 1; u += 0.003) {
    const [px, py] = roomToImg(u * RW, v * RD);
    if (px < 0 || px >= W || py < 0 || py >= H) continue;
    const [r, g, b] = getPixel(px, py);

    if (r > 155 && g < 55 && b < 55) {
      pts.red.push({ rx: +(u * RW).toFixed(2), ry: +(v * RD).toFixed(2) });
    }
    else if (r > 170 && g > 135 && b < 55 && r - b > 120) {
      pts.yellow.push({ rx: +(u * RW).toFixed(2), ry: +(v * RD).toFixed(2) });
    }
    else if (r > 125 && r < 195 && g > 80 && g < 140 && b > 30 && b < 85
             && r - g > 15 && g - b > 18) {
      pts.wood.push({ rx: +(u * RW).toFixed(2), ry: +(v * RD).toFixed(2) });
    }
  }
}

// ─── Cluster ───
function cluster(points, radius = 0.4, minPts = 10) {
  const used = new Set();
  const clusters = [];
  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;
    const cl = [points[i]];
    used.add(i);
    let changed = true;
    while (changed) {
      changed = false;
      for (let j = 0; j < points.length; j++) {
        if (used.has(j)) continue;
        for (const c of cl) {
          if (Math.abs(points[j].rx - c.rx) < radius && Math.abs(points[j].ry - c.ry) < radius) {
            cl.push(points[j]); used.add(j); changed = true; break;
          }
        }
      }
    }
    if (cl.length >= minPts) clusters.push(cl);
  }
  return clusters.map(cl => {
    const cx = cl.reduce((s, p) => s + p.rx, 0) / cl.length;
    const cy = cl.reduce((s, p) => s + p.ry, 0) / cl.length;
    const x1 = Math.min(...cl.map(p => p.rx));
    const x2 = Math.max(...cl.map(p => p.rx));
    const y1 = Math.min(...cl.map(p => p.ry));
    const y2 = Math.max(...cl.map(p => p.ry));
    return { cx: +cx.toFixed(2), cy: +cy.toFixed(2),
             x: +x1.toFixed(2), y: +y1.toFixed(2),
             w: +(x2 - x1).toFixed(2), h: +(y2 - y1).toFixed(2),
             n: cl.length };
  }).sort((a, b) => b.n - a.n);
}

const redCl = cluster(pts.red, 0.5, 10);
const yellowCl = cluster(pts.yellow, 0.5, 10);
const woodCl = cluster(pts.wood, 0.4, 30);

// Mark clusters on annotated
for (const c of redCl) {
  const [px, py] = roomToImg(c.cx, c.cy);
  drawCross(annotated, px, py, 20, 255, 0, 255); // magenta cross
}
for (const c of yellowCl) {
  const [px, py] = roomToImg(c.cx, c.cy);
  drawCross(annotated, px, py, 18, 0, 255, 255); // cyan cross
}
for (const c of woodCl.filter(w => w.w < 2.5)) {
  const [px, py] = roomToImg(c.cx, c.cy);
  drawCross(annotated, px, py, 14, 255, 165, 0); // orange cross
}

// Mark MCP positions for comparison (white crosses)
const mcpPositions = [
  { label: 'bar', rx: 0.15 + 1.6, ry: 2.8 + 0.3 },
  { label: 's1', rx: 0.575, ry: 2.475 },
  { label: 's2', rx: 1.225, ry: 2.475 },
  { label: 's3', rx: 1.875, ry: 2.475 },
  { label: 's4', rx: 2.525, ry: 2.475 },
  { label: 't1', rx: 1.35, ry: 1.05 },
  { label: 't2', rx: 3.55, ry: 1.05 },
  { label: 't3', rx: 5.325, ry: 1.025 },
  { label: 't4', rx: 5.325, ry: 2.925 },
  { label: 'vitrina', rx: 5.65, ry: 4.325 },
  { label: 'regal', rx: 4.6, ry: 4.8 },
];
for (const m of mcpPositions) {
  const [px, py] = roomToImg(m.rx, m.ry);
  drawCross(annotated, px, py, 12, 255, 255, 255);
}

// ─── Save annotated ───
await sharp(annotated, { raw: { width: W, height: H, channels: CH } })
  .png().toFile(OUT_ANNOTATED);
console.log(`Saved: ${OUT_ANNOTATED}`);

// ─── Top-down projection ───
const SCALE = 80;
const tdW = Math.round(RW * SCALE), tdH = Math.round(RD * SCALE);
const topdown = Buffer.alloc(tdW * tdH * 3, 180);

for (let ty = 0; ty < tdH; ty++) {
  for (let tx = 0; tx < tdW; tx++) {
    const roomX = tx / SCALE;
    const roomY = (tdH - 1 - ty) / SCALE; // flip Y so south (entrance) is at bottom
    const [imgX, imgY] = roomToImg(roomX, roomY);
    const ix = Math.round(imgX), iy = Math.round(imgY);
    if (ix >= 0 && ix < W && iy >= 0 && iy < H) {
      const [r, g, b] = getPixel(ix, iy);
      const oi = (ty * tdW + tx) * 3;
      topdown[oi] = r; topdown[oi + 1] = g; topdown[oi + 2] = b;
    }
  }
}

// Grid on top-down
for (let m = 0; m <= RW; m++) {
  const x = Math.round(m * SCALE);
  for (let y = 0; y < tdH; y++) {
    if (x < tdW) { const i = (y * tdW + x) * 3; topdown[i] = 0; topdown[i+1] = 255; topdown[i+2] = 0; }
  }
}
for (let m = 0; m <= RD; m++) {
  const y = Math.round((RD - m) * SCALE); // flip
  for (let x = 0; x < tdW; x++) {
    if (y >= 0 && y < tdH) { const i = (y * tdW + x) * 3; topdown[i] = 0; topdown[i+1] = 255; topdown[i+2] = 0; }
  }
}

// MCP labels on top-down
for (const m of mcpPositions) {
  const tx = Math.round(m.rx * SCALE);
  const ty = Math.round((RD - m.ry) * SCALE);
  for (let d = -4; d <= 4; d++) {
    for (let t = -1; t <= 1; t++) {
      if (tx+d >= 0 && tx+d < tdW && ty+t >= 0 && ty+t < tdH) {
        const i = ((ty+t) * tdW + (tx+d)) * 3;
        topdown[i] = 255; topdown[i+1] = 255; topdown[i+2] = 255;
      }
      if (tx+t >= 0 && tx+t < tdW && ty+d >= 0 && ty+d < tdH) {
        const i = ((ty+d) * tdW + (tx+t)) * 3;
        topdown[i] = 255; topdown[i+1] = 255; topdown[i+2] = 255;
      }
    }
  }
}

await sharp(topdown, { raw: { width: tdW, height: tdH, channels: 3 } })
  .png().toFile(OUT_TOPDOWN);
console.log(`Saved: ${OUT_TOPDOWN}`);

// ─── Results ───
console.log('\n=== DETECTED FURNITURE (room meters) ===\n');
console.log('RED (Tolix chairs + bar stools):');
for (const c of redCl) console.log(`  center=(${c.cx}, ${c.cy})  bounds: ${c.x},${c.y} ${c.w}×${c.h}m  [${c.n}px]`);
console.log('\nYELLOW (Tolix chairs):');
for (const c of yellowCl) console.log(`  center=(${c.cx}, ${c.cy})  bounds: ${c.x},${c.y} ${c.w}×${c.h}m  [${c.n}px]`);
console.log('\nWOOD (tables, bar top):');
for (const c of woodCl.slice(0, 10)) {
  const label = c.w > 2 ? '← BAR/FLOOR' : c.w > 0.4 && c.h > 0.3 ? '← TABLE' : '';
  console.log(`  center=(${c.cx}, ${c.cy})  bounds: ${c.x},${c.y} ${c.w}×${c.h}m  [${c.n}px] ${label}`);
}
