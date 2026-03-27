import { state } from '../state.js';
import { cc, shapePath, drawFloorContent } from '../canvas-utils.js';
import { updateInfoPanel } from '../info-panel.js';
import { navigateTo } from '../navigation.js';
import { renderTagFilterBar, isTagVisible } from '../tag-filter.js';

export function renderFloorplan() {
  const d = state.nodeData;
  const allChildren = d.children || [];
  const allDescendants = d.descendants || [];
  const isLeaf = allChildren.length === 0 && d.width > 0 && d.height > 0;
  if (allChildren.length === 0 && !isLeaf) { document.getElementById('content').innerHTML = '<div class="empty-state"><h2>Prázdný prostor</h2></div>'; return; }

  let children = isLeaf
    ? [{ id: d.name, name: d.name, char: d.char, x: 0, y: 0, width: d.width, height: d.height, tags: d.tags, shape: d.shape, rotation: d.rotation, metadata: d.metadata }]
    : allChildren.filter(c => c.isSpatial !== false);
  let descendants = allDescendants.filter(c => c.isSpatial !== false);
  let viewWidth = d.width, viewHeight = d.height;

  // Tag filtering — client-side for floorplan
  children = children.filter(isTagVisible);
  descendants = descendants.filter(isTagVisible);

  // Projection
  if (state.currentProjection !== 'plan') {
    const projFn = (c) => {
      if (c.z === undefined || c.height_3d === undefined) return null;
      return {
        ...c,
        x: state.currentProjection === 'front' ? c.x : c.y,
        y: c.z,
        width: state.currentProjection === 'front' ? c.width : c.height,
        height: c.height_3d,
      };
    };
    children = children.map(projFn).filter(Boolean);
    descendants = descendants.map(projFn).filter(Boolean);
    viewWidth = state.currentProjection === 'front' ? d.width : d.height;
    viewHeight = d.height_3d || Math.max(...[...children, ...descendants].map(c => c.y + c.height), 3);
  }

  if (children.length === 0) {
    let h = '<div style="background:var(--sf);border:1px solid var(--bd);border-radius:8px;padding:16px">';
    h += renderTagFilterBar();
    h += '<div class="empty-state"><h2>Prázdný prostor</h2></div></div>';
    document.getElementById('content').innerHTML = h;
    return;
  }

  // Expand view to include descendants that overflow parent bounds
  let bbMinX = 0, bbMinY = 0, bbMaxX = viewWidth, bbMaxY = viewHeight;
  for (const c of [...children, ...descendants]) {
    bbMinX = Math.min(bbMinX, c.x);
    bbMinY = Math.min(bbMinY, c.y);
    bbMaxX = Math.max(bbMaxX, c.x + c.width);
    bbMaxY = Math.max(bbMaxY, c.y + c.height);
  }
  const vpw = bbMaxX - bbMinX, vph = bbMaxY - bbMinY;
  const vpOffsetX = bbMinX, vpOffsetY = bbMinY;

  const PAD = 40, maxW = 900, maxH = 600;
  const scale = Math.min((maxW - PAD * 2) / vpw, (maxH - PAD * 2) / vph);
  const cw = Math.ceil(vpw * scale + PAD * 2), ch = Math.ceil(vph * scale + PAD * 2);

  const viewNames = { plan: 'Půdorys', front: 'Pohled zepředu', side: 'Pohled z boku' };
  let h = '<div class="view-with-panel"><div class="view-main"><div style="background:var(--sf);border:1px solid var(--bd);border-radius:8px;padding:16px;overflow:auto">';
  h += `<p style="margin-bottom:8px;font-size:12px;color:var(--tx2)">${viewNames[state.currentProjection]} — ${Number(vpw).toFixed(1)}m × ${Number(vph).toFixed(1)}m</p>`;
  h += renderTagFilterBar();
  h += `<canvas id="fp-canvas" width="${cw}" height="${ch}" style="border:1px solid var(--bd);border-radius:4px;cursor:crosshair"></canvas>`;
  if (descendants.length > 0) {
    h += `<p style="margin-top:8px;font-size:11px;color:var(--tx2)"><span style="display:inline-block;width:12px;height:12px;border:2px solid var(--ac);opacity:.6;vertical-align:middle;margin-right:4px"></span> přímé objekty &nbsp; <span style="display:inline-block;width:12px;height:12px;border:1px dashed var(--tx2);opacity:.6;vertical-align:middle;margin-right:4px"></span> vnořené objekty</p>`;
  }
  h += '</div></div>';
  h += '<div id="hover-info"><div class="hi-empty">Najeď na objekt</div></div></div>';
  document.getElementById('content').innerHTML = h;

  const canvas = document.getElementById('fp-canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, cw, ch);

  if (state.currentProjection !== 'plan') {
    const flipY = (obj) => ({ ...obj, y: vph - obj.y - obj.height });
    const flippedChildren = children.map(flipY);
    const flippedDescendants = descendants.map(flipY);
    drawFloorContent(ctx, flippedChildren, flippedDescendants, vpw, vph, scale, PAD, vpOffsetX, vpOffsetY, d.char ? cc(d.char) : null, viewWidth, viewHeight);

    ctx.strokeStyle = '#4a4a6a'; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.fillStyle = '#606080'; ctx.font = '10px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';

    ctx.beginPath(); ctx.moveTo(PAD, PAD + vph * scale); ctx.lineTo(PAD + vpw * scale, PAD + vph * scale); ctx.stroke();
    ctx.textBaseline = 'top';
    ctx.fillText('podlaha', PAD + 4, PAD + vph * scale + 4);
  } else {
    drawFloorContent(ctx, children, descendants, vpw, vph, scale, PAD, vpOffsetX, vpOffsetY, d.char ? cc(d.char) : null, viewWidth, viewHeight);
  }

  // Dimension labels
  ctx.fillStyle = '#606080'; ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`${viewWidth}m`, PAD + (-vpOffsetX) * scale + viewWidth * scale / 2, PAD + (-vpOffsetY) * scale + viewHeight * scale + 6);
  ctx.save(); ctx.translate(PAD + (-vpOffsetX) * scale - 8, PAD + (-vpOffsetY) * scale + viewHeight * scale / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'bottom'; ctx.fillText(`${viewHeight}m`, 0, 0); ctx.restore();

  // Hit detection — use ALL children (unfiltered) for clicking/hover
  const unfilteredChildren = isLeaf
    ? children
    : (d.children || []).filter(c => c.isSpatial !== false);
  const unfilteredAll = [...unfilteredChildren, ...(d.descendants || []).filter(c => c.isSpatial !== false)];

  const hitChildren = state.currentProjection !== 'plan' ? unfilteredChildren.map(c => ({ ...c, y: vph - c.y - c.height })) : unfilteredChildren;
  const hitAll = state.currentProjection !== 'plan' ? unfilteredAll.map(c => ({ ...c, y: vph - c.y - c.height })) : unfilteredAll;

  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const wx = (e.clientX - rect.left - PAD) / scale + vpOffsetX, wy = (e.clientY - rect.top - PAD) / scale + vpOffsetY;
    let best = null, bestArea = Infinity;
    for (const c of hitChildren) {
      if (wx >= c.x && wx <= c.x + c.width && wy >= c.y && wy <= c.y + c.height) {
        const area = c.width * c.height;
        if (c.hasGrid && area < bestArea) { best = c; bestArea = area; }
      }
    }
    if (best) navigateTo(state.currentPath === '/' ? best.id : `${state.currentPath}/${best.id}`);
  };

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const wx = (e.clientX - rect.left - PAD) / scale + vpOffsetX, wy = (e.clientY - rect.top - PAD) / scale + vpOffsetY;
    let best = null, bestArea = Infinity;
    for (const c of hitAll) {
      if (wx >= c.x && wx <= c.x + c.width && wy >= c.y && wy <= c.y + c.height) {
        const area = c.width * c.height;
        if (area < bestArea) { best = c; bestArea = area; }
      }
    }
    updateInfoPanel(best);
    canvas.style.cursor = best ? 'pointer' : 'crosshair';
  });
  canvas.addEventListener('mouseleave', () => { updateInfoPanel(null); canvas.style.cursor = 'crosshair'; });
}
