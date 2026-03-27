import { state } from '../state.js';
import { cc, shapePath, drawFloorContent } from '../canvas-utils.js';
import { updateInfoPanel } from '../info-panel.js';
import { navigateTo } from '../navigation.js';

export function renderFloorplan() {
  const d = state.nodeData;
  const allChildren = d.children || [];
  const allDescendants = d.descendants || [];
  if (allChildren.length === 0) { document.getElementById('content').innerHTML = '<div class="empty-state"><h2>Prázdný prostor</h2></div>'; return; }

  const floors = d.floors;
  const hasFloors = floors && floors.length > 0;

  // Determine what to show
  let children, descendants, viewWidth = d.width, viewHeight = d.height;
  if (hasFloors && state.selectedFloor && state.selectedFloorData) {
    children = (state.selectedFloorData.children || []).filter(c => c.isSpatial !== false);
    descendants = (state.selectedFloorData.descendants || []).filter(c => c.isSpatial !== false);
    viewWidth = state.selectedFloorData.width || d.width;
    viewHeight = state.selectedFloorData.height || d.height;
  } else {
    children = allChildren.filter(c => c.isSpatial !== false);
    descendants = allDescendants.filter(c => c.isSpatial !== false);
  }

  // Projection
  if (state.currentProjection !== 'plan') {
    if (d.floorSection && d.floorSection.length > 0) {
      const projFn = (c) => {
        if (c.elevation === undefined || c.height_3d === undefined) return null;
        return {
          ...c,
          x: state.currentProjection === 'front' ? c.x : c.y,
          y: c.elevation,
          width: state.currentProjection === 'front' ? c.width : c.height,
          height: c.height_3d,
        };
      };
      const projected = d.floorSection.map(projFn).filter(Boolean);
      children = projected.filter(c => !c._depth || c._depth <= 1);
      descendants = projected.filter(c => c._depth && c._depth > 1);
      viewWidth = state.currentProjection === 'front' ? d.width : d.height;
      viewHeight = d.floorSectionHeight || 6;
    } else {
      const projFn = (c) => {
        if (c.elevation === undefined || c.height_3d === undefined) return null;
        return {
          ...c,
          x: state.currentProjection === 'front' ? c.x : c.y,
          y: c.elevation,
          width: state.currentProjection === 'front' ? c.width : c.height,
          height: c.height_3d,
        };
      };
      children = children.map(projFn).filter(Boolean);
      descendants = descendants.map(projFn).filter(Boolean);
      viewWidth = state.currentProjection === 'front' ? d.width : d.height;
      viewHeight = d.metadata?.floor_height || Math.max(...[...children, ...descendants].map(c => c.y + c.height), 3);
    }
  }

  if (children.length === 0) { document.getElementById('content').innerHTML = '<div class="empty-state"><h2>Prázdný prostor</h2></div>'; return; }

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

  const isFloorSection = state.currentProjection !== 'plan' && d.floorSection && d.floorSection.length > 0;
  const floorLabel = (!isFloorSection && hasFloors && state.selectedFloor) ? ` — ${floors.find(f => f.id === state.selectedFloor)?.name || state.selectedFloor}` : '';
  const sectionLabel = isFloorSection ? ' — řez všemi patry' : '';
  const viewNames = { plan: 'Půdorys', front: 'Pohled zepředu', side: 'Pohled z boku' };
  let h = '<div class="view-with-panel"><div class="view-main"><div style="background:var(--sf);border:1px solid var(--bd);border-radius:8px;padding:16px;overflow:auto">';
  h += `<p style="margin-bottom:8px;font-size:12px;color:var(--tx2)">${viewNames[state.currentProjection]} — ${Number(vpw).toFixed(1)}m × ${Number(vph).toFixed(1)}m${floorLabel}${sectionLabel}</p>`;
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

    if (d.floorSection && d.floors) {
      for (const f of d.floors) {
        const floorNode = d.children?.find(c => c.id === f.id);
        const floorY = floorNode?.metadata?.floor_y ?? 0;
        const canvasY = PAD + (vph - floorY) * scale;
        ctx.beginPath(); ctx.moveTo(PAD, canvasY); ctx.lineTo(PAD + vpw * scale, canvasY); ctx.stroke();
        ctx.fillText(f.name + ' (' + floorY + 'm)', PAD + 4, canvasY - 4);
      }
    } else {
      ctx.beginPath(); ctx.moveTo(PAD, PAD + vph * scale); ctx.lineTo(PAD + vpw * scale, PAD + vph * scale); ctx.stroke();
      ctx.textBaseline = 'top';
      ctx.fillText('podlaha', PAD + 4, PAD + vph * scale + 4);
    }
  } else {
    drawFloorContent(ctx, children, descendants, vpw, vph, scale, PAD, vpOffsetX, vpOffsetY, d.char ? cc(d.char) : null, viewWidth, viewHeight);
  }

  // Dimension labels
  ctx.fillStyle = '#606080'; ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`${viewWidth}m`, PAD + (-vpOffsetX) * scale + viewWidth * scale / 2, PAD + (-vpOffsetY) * scale + viewHeight * scale + 6);
  ctx.save(); ctx.translate(PAD + (-vpOffsetX) * scale - 8, PAD + (-vpOffsetY) * scale + viewHeight * scale / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'bottom'; ctx.fillText(`${viewHeight}m`, 0, 0); ctx.restore();

  // Hit detection
  const hitChildren = state.currentProjection !== 'plan' ? children.map(c => ({ ...c, y: vph - c.y - c.height })) : children;
  const hitAll = state.currentProjection !== 'plan' ? [...children, ...descendants].map(c => ({ ...c, y: vph - c.y - c.height })) : [...children, ...descendants];

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
