import { state } from './state.js';
import { cc } from './canvas-utils.js';
import { esc, renderRules } from './utils.js';

export function updateInfoPanel(obj) {
  const el = document.getElementById('hover-info');
  if (!el) return;
  if (!obj) { el.innerHTML = '<div class="hi-empty">Najeď na objekt</div>'; return; }
  const isFolder = obj.isSpatial === false;
  const color = isFolder ? '#8888aa' : cc(obj.char);
  let h = '';
  if (isFolder) {
    h += `<div class="hi-char" style="background:${color}22;color:${color}">📁</div>`;
  } else {
    h += `<div class="hi-char" style="background:${color}22;color:${color}">${esc(obj.char)}</div>`;
  }
  h += `<div class="hi-name">${esc(obj.name)}</div>`;
  if (obj.description) h += `<div class="hi-desc">${esc(obj.description)}</div>`;
  h += `<div class="hi-row"><b>ID:</b> ${esc(obj.id)}</div>`;
  h += `<div class="hi-row"><b>Typ:</b> ${isFolder ? 'folder' : 'spatial'}</div>`;
  if (!isFolder) {
    h += `<div class="hi-row"><b>Pozice:</b> (${obj.x}, ${obj.y})</div>`;
    h += `<div class="hi-row"><b>Rozměry:</b> ${obj.width} × ${obj.height}m</div>`;
    h += `<div class="hi-row"><b>Plocha:</b> ${(obj.width * obj.height).toFixed(0)} m²</div>`;
    if (obj.rotation) {
      const arrows = { 0: '↑ sever', 90: '→ východ', 180: '↓ jih', 270: '← západ' };
      h += `<div class="hi-row"><b>Otočení:</b> ${obj.rotation}° ${arrows[obj.rotation] || ''}</div>`;
    }
  }
  if (obj.childCount > 0) {
    h += `<div class="hi-row"><b>Children:</b> ${obj.childCount}</div>`;
  }
  if (obj.tags?.length) {
    h += '<div class="hi-tags">';
    for (const t of obj.tags) h += `<span class="tag">${esc(t)}</span>`;
    h += '</div>';
  }
  const meta = obj.metadata || {};
  const metaFiltered = Object.entries(meta).filter(([k]) => k !== '_rules');
  if (metaFiltered.length > 0) {
    h += '<div class="hi-meta">';
    for (const [k, v] of metaFiltered) h += `<div class="hi-meta-row"><b>${esc(k)}:</b> ${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</div>`;
    h += '</div>';
  }
  if (meta._rules?.length > 0) {
    h += `<div class="hi-meta" style="margin-top:6px"><div class="hi-meta-row"><b>Pravidla (${meta._rules.length}):</b></div>${renderRules(meta._rules)}</div>`;
  }
  el.innerHTML = h;
}

export function buildCharLookup() {
  const map = {};
  for (const c of (state.nodeData?.children || [])) { map[c.char] = c; }
  return map;
}
