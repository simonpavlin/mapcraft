export const COLORS = {
  '#': '#8b8b8b', '.': '#3a3a4a',
  'A': '#e94560', 'B': '#4ade80', 'C': '#60a5fa', 'D': '#facc15',
  'E': '#c084fc', 'F': '#fb923c', 'G': '#2dd4bf', 'H': '#a78bfa',
  'I': '#f87171', 'K': '#fbbf24', 'L': '#34d399', 'M': '#a3e635',
  'O': '#fb923c', 'P': '#c4b5fd', 'R': '#fb7185', 'S': '#f472b6',
  'T': '#4ade80', 'V': '#38bdf8', 'W': '#94a3b8', 'o': '#60a5fa',
  '~': '#38bdf8', '=': '#9ca3af', '1': '#f59e0b', '2': '#8b5cf6',
};

export function cc(ch) {
  return COLORS[ch] || '#e0e0e0';
}

export function drawRotationArrow(ctx, rx, ry, rw, rh, rotation, color) {
  const cx = rx + rw / 2, cy = ry + rh / 2;
  const arrowLen = Math.min(rw, rh) * 0.3;
  const headSize = Math.max(3, arrowLen * 0.35);
  const angles = { 0: -Math.PI / 2, 90: 0, 180: Math.PI / 2, 270: Math.PI };
  const angle = angles[rotation] ?? 0;
  const ex = cx + Math.cos(angle) * arrowLen;
  const ey = cy + Math.sin(angle) * arrowLen;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, arrowLen * 0.12); ctx.lineCap = 'round';
  ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headSize * Math.cos(angle - 0.5), ey - headSize * Math.sin(angle - 0.5));
  ctx.lineTo(ex - headSize * Math.cos(angle + 0.5), ey - headSize * Math.sin(angle + 0.5));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function shapePath(ctx, obj, ox, oy, s) {
  if (obj.shape && obj.shape.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(ox + obj.shape[0][0] * s, oy + obj.shape[0][1] * s);
    for (let i = 1; i < obj.shape.length; i++) ctx.lineTo(ox + obj.shape[i][0] * s, oy + obj.shape[i][1] * s);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.rect(ox, oy, obj.width * s, obj.height * s);
  }
}

/**
 * Draw floor content on a canvas context.
 * Used by both renderFloorplan and renderFolderTiles.
 */
export function drawFloorContent(ctx, floorChildren, floorDescendants, pw, ph, scale, PAD, offsetX, offsetY, parentColor, parentW, parentH) {
  const ox = offsetX || 0, oy = offsetY || 0;
  const pc = parentColor || '#3a3a5a';
  const prw = parentW || pw, prh = parentH || ph;

  // Parent filled + outline
  const prx = PAD - ox * scale, pry = PAD - oy * scale;
  ctx.fillStyle = pc + '25';
  ctx.fillRect(prx, pry, prw * scale, prh * scale);
  ctx.strokeStyle = pc; ctx.lineWidth = 2;
  ctx.strokeRect(prx, pry, prw * scale, prh * scale);

  // Direct children — sorted largest first
  const sorted = [...floorChildren].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  for (const c of sorted) {
    const rx = PAD + (c.x - ox) * scale, ry = PAD + (c.y - oy) * scale, rw = c.width * scale, rh = c.height * scale;
    const color = cc(c.char);
    if (c.tags?.includes('door')) {
      ctx.fillStyle = color + '80'; ctx.fillRect(rx, ry, rw, rh);
      if (c.rotation && rw > 8 && rh > 8) drawRotationArrow(ctx, rx, ry, rw, rh, c.rotation, '#ffffff');
      continue;
    }
    if (c.tags?.includes('window')) { ctx.fillStyle = '#88ccee44'; ctx.fillRect(rx, ry, rw, rh); continue; }
    if (c.tags?.includes('clearance')) {
      ctx.strokeStyle = '#ffffff18'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.strokeRect(rx, ry, rw, rh); ctx.setLineDash([]);
      continue;
    }
    ctx.fillStyle = color + '25';
    shapePath(ctx, c, rx, ry, scale); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    shapePath(ctx, c, rx, ry, scale); ctx.stroke();

    // Label
    const label = c.name;
    const maxFont = Math.min(rw / (label.length * 0.55), rh / 3, 15);
    const fs = Math.max(7, Math.floor(maxFont));
    if (fs >= 7 && rw > 18 && rh > 14) {
      ctx.fillStyle = color; ctx.font = `bold ${fs}px 'Segoe UI',sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, rx + rw / 2, ry + rh / 2 - (fs > 9 ? fs * .35 : 0), rw - 4);
      if (fs > 9 && rh > 25) {
        ctx.font = `${Math.max(7, fs - 3)}px 'Segoe UI',sans-serif`; ctx.fillStyle = color + 'aa';
        ctx.fillText(`${c.width}×${c.height}m`, rx + rw / 2, ry + rh / 2 + fs * .45, rw - 4);
      }
    }
    // Metadata text (skip _rules)
    const metaEntries = Object.entries(c.metadata || {}).filter(([k]) => k !== '_rules');
    if (metaEntries.length > 0 && rw > 30 && rh > 35) {
      ctx.font = '8px monospace'; ctx.fillStyle = '#ffffff55';
      const metaStr = metaEntries.map(([k, v]) => `${k}:${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' ');
      ctx.fillText(metaStr.substring(0, Math.floor(rw / 5)), rx + rw / 2, ry + rh - 6, rw - 6);
    }
    if (c.rotation && rw > 14 && rh > 14) {
      drawRotationArrow(ctx, rx, ry, rw, rh, c.rotation, color);
    }
  }

  // Descendants
  if (floorDescendants.length > 0) {
    const descSorted = [...floorDescendants].sort((a, b) => {
      if (a._depth !== b._depth) return a._depth - b._depth;
      return (b.width * b.height) - (a.width * a.height);
    });
    for (const dc of descSorted) {
      const rx = PAD + (dc.x - ox) * scale, ry = PAD + (dc.y - oy) * scale, rw = dc.width * scale, rh = dc.height * scale;
      const color = cc(dc.char);
      const isDoor = dc.tags?.includes('door');
      const isWindow = dc.tags?.includes('window');
      const isFurniture = dc.tags?.includes('furniture');
      const isClearance = dc.tags?.includes('clearance');
      const opacity = Math.max(15, 40 - dc._depth * 10);
      if (isDoor) {
        ctx.fillStyle = color + Math.round(opacity * 1.5).toString(16).padStart(2, '0'); ctx.fillRect(rx, ry, rw, rh);
        if (dc.rotation && rw > 8 && rh > 8) drawRotationArrow(ctx, rx, ry, rw, rh, dc.rotation, '#ffffffaa');
        continue;
      }
      if (isWindow) { ctx.fillStyle = '#88ccee' + Math.round(opacity).toString(16).padStart(2, '0'); ctx.fillRect(rx, ry, rw, rh); continue; }
      if (isClearance) {
        ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 0.5; ctx.setLineDash([2, 3]);
        ctx.strokeRect(rx, ry, rw, rh); ctx.setLineDash([]);
        continue;
      }
      ctx.fillStyle = color + Math.round(opacity * 0.6).toString(16).padStart(2, '0');
      shapePath(ctx, dc, rx, ry, scale); ctx.fill();
      ctx.strokeStyle = color + Math.round(opacity * 2).toString(16).padStart(2, '0');
      ctx.lineWidth = isFurniture ? 0.5 : 1;
      ctx.setLineDash(isFurniture ? [2, 2] : [4, 3]);
      shapePath(ctx, dc, rx, ry, scale); ctx.stroke();
      ctx.setLineDash([]);
      const maxFontSize = Math.max(6, 12 - dc._depth * 2);
      const label = dc.name;
      const maxFont2 = Math.min(rw / (label.length * 0.55), rh / 3, maxFontSize);
      const fs2 = Math.max(5, Math.floor(maxFont2));
      if (fs2 >= 5 && rw > 12 && rh > 8) {
        ctx.fillStyle = color + Math.round(opacity * 3).toString(16).padStart(2, '0');
        ctx.font = `${fs2}px 'Segoe UI',sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, rx + rw / 2, ry + rh / 2, rw - 4);
      }
      if (dc.rotation && rw > 10 && rh > 10) {
        drawRotationArrow(ctx, rx, ry, rw, rh, dc.rotation, color);
      }
    }
  }
}
