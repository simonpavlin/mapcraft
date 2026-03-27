import { state } from '../state.js';
import { esc, infoCard, renderRules } from '../utils.js';
import { cc, shapePath, drawFloorContent } from '../canvas-utils.js';
import { navigateTo } from '../navigation.js';
import { colorizeAscii, renderLegend } from './ascii.js';

export function renderOverview() {
  const d = state.nodeData;
  const isFolder = !d.isSpatial;
  let h = '<div class="info-grid">';
  h += infoCard('Název', d.name, d.description || '');
  h += infoCard('Typ', isFolder ? '<span style="font-size:22px">📁</span> Folder' : `<span style="font-family:monospace;font-size:28px;color:${cc(d.char)}">${esc(d.char || '-')}</span> Spatial`, '');
  if (d.width > 0 && d.height > 0) {
    h += infoCard('Rozměry', `${d.width}m × ${d.height}m`, isFolder ? 'auto z children' : (d.scaleInfo || ''));
    if (!isFolder) h += infoCard('Plocha', `${(d.width * d.height).toFixed(0)} m²`, '');
  }
  const childFolders = (d.children || []).filter(c => !c.isSpatial).length;
  const childSpatial = (d.children || []).filter(c => c.isSpatial).length;
  const childInfo = [];
  if (childSpatial > 0) childInfo.push(`${childSpatial} spatial`);
  if (childFolders > 0) childInfo.push(`${childFolders} folders`);
  h += infoCard('Objekty', (d.children || []).length.toString(), childInfo.join(', '));
  if (d.tags?.length > 0) h += infoCard('Tagy', d.tags.map(t => `<span class="tag">${esc(t)}</span>`).join(' '), '');
  if (d.floors) h += infoCard('Patra', d.floors.map(f => `[${esc(f.char)}] ${esc(f.name)}`).join(', '), 'Přepínač v toolbaru');
  h += '</div>';

  // Metadata
  const meta = d.metadata || {};
  const metaEntries = Object.entries(meta).filter(([k]) => k !== '_rules');
  const rules = meta._rules;
  if (metaEntries.length > 0) {
    h += '<div class="info-card" style="margin-bottom:20px"><h3>Metadata</h3><table class="meta-table">';
    for (const [k, v] of metaEntries) {
      h += `<tr><td>${esc(k)}</td><td>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`;
    }
    h += '</table></div>';
  }
  if (rules && Array.isArray(rules) && rules.length > 0) {
    h += `<div class="info-card" style="margin-bottom:20px"><h3>Pravidla (${rules.length})</h3>${renderRules(rules)}</div>`;
  }

  // ASCII preview — only for spatial nodes
  if (!isFolder && d.ascii?.length > 0) {
    h += '<h3 style="margin-bottom:8px;font-size:14px;color:var(--tx2)">Náhled</h3>';
    h += '<div id="ascii-view" style="max-height:400px;overflow:auto">';
    h += `<div id="ascii-grid">${colorizeAscii(d.ascii)}</div>`;
    h += renderLegend(d.legend);
    h += '</div>';
  } else if (!isFolder && d.width > 0 && d.height > 0 && !(d.ascii?.length > 0)) {
    // Leaf spatial node — show canvas preview of the object itself
    h += '<h3 style="margin-bottom:8px;font-size:14px;color:var(--tx2)">Náhled</h3>';
    h += '<div id="leaf-preview-wrap"></div>';
  }

  // Folder tile preview
  if (isFolder) {
    const spatialKids = (d.children || []).filter(c => c.isSpatial !== false);
    const folderKids = (d.children || []).filter(c => c.isSpatial === false && c.childCount > 0);
    const tiles = [...spatialKids, ...folderKids];
    if (tiles.length > 0) {
      h += '<h3 style="margin-bottom:8px;font-size:14px;color:var(--tx2)">Prostory</h3>';
      h += `<div id="folder-tiles-wrap"></div>`;
    }
  }

  document.getElementById('content').innerHTML = h;

  if (isFolder) renderFolderTiles();
  if (!isFolder && document.getElementById('leaf-preview-wrap')) renderLeafPreview();
}

function renderFolderTiles() {
  const d = state.nodeData;
  if (!d) return;
  const wrap = document.getElementById('folder-tiles-wrap');
  if (!wrap) return;

  const allChildren = d.children || [];
  const allDescendants = d.descendants || [];
  const spatialKids = allChildren.filter(c => c.isSpatial !== false);
  const folderKids = allChildren.filter(c => c.isSpatial === false && c.childCount > 0);
  const tiles = [...spatialKids, ...folderKids];
  if (tiles.length === 0) return;

  wrap.innerHTML = '<div class="folder-grid"></div>';
  const grid = wrap.querySelector('.folder-grid');

  for (const tile of tiles) {
    const tw = tile.width || 1, th = tile.height || 1;
    const isFolder = tile.isSpatial === false;
    const color = isFolder ? '#8888aa' : cc(tile.char);
    const label = isFolder ? `📁 ${tile.name}` : `${tile.name} (${tw}×${th}m)`;

    const el = document.createElement('div');
    el.className = 'folder-tile';
    el.onclick = () => navigateTo(state.currentPath === '/' ? tile.id : `${state.currentPath}/${tile.id}`);
    grid.appendChild(el);

    if (isFolder) {
      const childCount = tile.childCount || 0;
      el.innerHTML = `<div class="folder-tile-header" style="color:${color}">${esc(label)}</div><div class="folder-tile-canvas-wrap"><div class="folder-tile-empty"><div class="folder-icon">📁</div><span>${childCount}</span></div></div>`;
    } else {
      el.innerHTML = `<div class="folder-tile-header" style="color:${color}">${esc(label)}</div><div class="folder-tile-canvas-wrap"><canvas></canvas></div>`;

      requestAnimationFrame(() => {
        const canvasWrap = el.querySelector('.folder-tile-canvas-wrap');
        const canvas = el.querySelector('canvas');
        const size = canvasWrap.clientWidth;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, size, size);

        const PAD = 16;
        const drawArea = size - PAD * 2;
        const tileDesc = allDescendants.filter(dc => dc._rootParentId === tile.id && dc.isSpatial !== false);
        let bbMinX = 0, bbMinY = 0, bbMaxX = tw, bbMaxY = th;
        for (const dc of tileDesc) {
          bbMinX = Math.min(bbMinX, dc.x);
          bbMinY = Math.min(bbMinY, dc.y);
          bbMaxX = Math.max(bbMaxX, dc.x + dc.width);
          bbMaxY = Math.max(bbMaxY, dc.y + dc.height);
        }
        const bbW = bbMaxX - bbMinX, bbH = bbMaxY - bbMinY;
        const s = Math.min(drawArea / bbW, drawArea / bbH);
        const totalPw = bbW * s, totalPh = bbH * s;
        const ox = PAD + (drawArea - totalPw) / 2 - bbMinX * s;
        const oy = PAD + (drawArea - totalPh) / 2 - bbMinY * s;

        // Background grid
        const gridStep = s;
        ctx.strokeStyle = '#ffffff20'; ctx.lineWidth = 0.5;
        for (let gx = ox % gridStep; gx < size; gx += gridStep) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, size); ctx.stroke();
        }
        for (let gy = oy % gridStep; gy < size; gy += gridStep) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(size, gy); ctx.stroke();
        }
        if (gridStep > 12) {
          ctx.fillStyle = '#ffffff40'; ctx.font = '8px "Segoe UI",sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText('1m', 3, size - 3);
        }

        const tileChildren = tileDesc.filter(dc => dc._depth === 1);
        const tileDeep = tileDesc.filter(dc => dc._depth > 1);

        ctx.save();
        // Parent outline
        ctx.fillStyle = color + '25';
        ctx.fillRect(ox, oy, tw * s, th * s);
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, tw * s, th * s);

        ctx.translate(ox, oy);
        for (const c of tileChildren) {
          const rx = c.x * s, ry = c.y * s, rw = c.width * s, rh = c.height * s;
          const cl = cc(c.char);
          if (c.tags?.includes('door')) { ctx.fillStyle = cl + '80'; ctx.fillRect(rx, ry, rw, rh); continue; }
          if (c.tags?.includes('window')) { ctx.fillStyle = '#88ccee44'; ctx.fillRect(rx, ry, rw, rh); continue; }
          if (c.tags?.includes('clearance')) { ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(rx, ry, rw, rh); ctx.setLineDash([]); continue; }
          ctx.fillStyle = cl + '25'; ctx.fillRect(rx, ry, rw, rh);
          ctx.strokeStyle = cl; ctx.lineWidth = 1.5; ctx.strokeRect(rx, ry, rw, rh);
          const nm = c.name;
          const maxF = Math.min(rw / (nm.length * 0.55), rh / 3, 14);
          const fs = Math.max(6, Math.floor(maxF));
          if (fs >= 6 && rw > 14 && rh > 10) {
            ctx.fillStyle = cl; ctx.font = `bold ${fs}px 'Segoe UI',sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(nm, rx + rw / 2, ry + rh / 2, rw - 4);
          }
        }
        for (const dc of tileDeep) {
          const rx = dc.x * s, ry = dc.y * s, rw = dc.width * s, rh = dc.height * s;
          const cl = cc(dc.char);
          const op = Math.max(15, 35 - dc._depth * 8);
          if (dc.tags?.includes('door') || dc.tags?.includes('window')) continue;
          if (dc.tags?.includes('clearance')) { ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 0.5; ctx.setLineDash([2, 3]); ctx.strokeRect(rx, ry, rw, rh); ctx.setLineDash([]); continue; }
          ctx.fillStyle = cl + Math.round(op * 0.6).toString(16).padStart(2, '0'); ctx.fillRect(rx, ry, rw, rh);
          ctx.strokeStyle = cl + Math.round(op * 2).toString(16).padStart(2, '0');
          ctx.lineWidth = 0.5; ctx.setLineDash([2, 2]); ctx.strokeRect(rx, ry, rw, rh); ctx.setLineDash([]);
        }
        ctx.restore();
      });
    }
  }
}

function renderLeafPreview() {
  const d = state.nodeData;
  const wrap = document.getElementById('leaf-preview-wrap');
  if (!wrap || !d) return;

  const tw = d.width, th = d.height;
  const color = cc(d.char);
  const size = 250;
  const PAD = 24;
  const drawArea = size - PAD * 2;
  const s = Math.min(drawArea / tw, drawArea / th);
  const pw = tw * s, ph = th * s;
  const cw = Math.ceil(pw + PAD * 2), ch = Math.ceil(ph + PAD * 2);

  wrap.innerHTML = `<canvas width="${cw}" height="${ch}" style="border:1px solid var(--bd);border-radius:4px"></canvas>`;
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, cw, ch);

  // Grid
  ctx.strokeStyle = '#ffffff20'; ctx.lineWidth = 0.5;
  for (let gx = PAD % s; gx < cw; gx += s) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke(); }
  for (let gy = PAD % s; gy < ch; gy += s) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }

  // Object
  const ox = PAD, oy = PAD;
  const fakeObj = { width: tw, height: th, shape: d.shape };
  ctx.fillStyle = color + '30';
  shapePath(ctx, fakeObj, ox, oy, s); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  shapePath(ctx, fakeObj, ox, oy, s); ctx.stroke();

  // Label
  const label = d.name;
  const maxFont = Math.min(pw / (label.length * 0.55), ph / 3, 16);
  const fs = Math.max(8, Math.floor(maxFont));
  if (fs >= 8 && pw > 20 && ph > 16) {
    ctx.fillStyle = color; ctx.font = `bold ${fs}px 'Segoe UI',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, ox + pw / 2, oy + ph / 2 - fs * 0.35, pw - 4);
    ctx.font = `${Math.max(7, fs - 3)}px 'Segoe UI',sans-serif`; ctx.fillStyle = color + 'aa';
    ctx.fillText(`${tw}×${th}m`, ox + pw / 2, oy + ph / 2 + fs * 0.45, pw - 4);
  }

  // Dimension labels
  ctx.fillStyle = '#606080'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${tw}m`, ox + pw / 2, oy + ph + 6);
  ctx.save(); ctx.translate(ox - 8, oy + ph / 2); ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'bottom'; ctx.fillText(`${th}m`, 0, 0); ctx.restore();
}
