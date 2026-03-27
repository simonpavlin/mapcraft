import { state } from '../state.js';
import { cc } from '../canvas-utils.js';
import { esc } from '../utils.js';

export function renderObjects() {
  const d = state.nodeData;
  const children = d.children || [];
  if (children.length === 0) { document.getElementById('content').innerHTML = '<div class="empty-state"><h2>Žádné objekty</h2></div>'; return; }

  let h = '<div style="background:var(--sf);border:1px solid var(--bd);border-radius:8px;overflow:auto">';
  h += '<table class="children-table"><thead><tr><th>Typ</th><th>ID</th><th>Název</th><th>Pozice</th><th>Rozměry</th><th>Směr</th><th>Tagy</th><th>Metadata</th></tr></thead><tbody>';
  for (const c of children) {
    const childPath = state.currentPath === '/' ? c.id : `${state.currentPath}/${c.id}`;
    const isFolder = !c.isSpatial;
    const color = isFolder ? '#8888aa' : cc(c.char);
    const metaKeys = Object.keys(c.metadata || {}).filter(k => k !== '_rules');
    const hasRules = c.metadata?._rules?.length > 0;
    h += `<tr onclick="navigateTo('${childPath}')">`;
    if (isFolder) {
      h += `<td><span class="obj-char" style="background:${color}22;color:${color}">📁</span></td>`;
    } else {
      h += `<td><span class="obj-char" style="background:${color}22;color:${color}">${esc(c.char)}</span></td>`;
    }
    h += `<td><code>${esc(c.id)}</code></td>`;
    h += `<td>${esc(c.name)}${c.description ? `<br><span style="font-size:11px;color:var(--tx2)">${esc(c.description)}</span>` : ''}</td>`;
    h += `<td>${isFolder ? '<span style="color:var(--tx2)">—</span>' : `(${c.x}, ${c.y})`}</td>`;
    h += `<td>${isFolder ? '<span style="color:var(--tx2)">—</span>' : `${c.width}×${c.height}m`}</td>`;
    const rotArrows = { 0: '↑', 90: '→', 180: '↓', 270: '←' };
    h += `<td>${c.rotation ? `${rotArrows[c.rotation] || ''} ${c.rotation}°` : ''}</td>`;
    h += `<td>${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</td>`;
    h += `<td>${metaKeys.map(k => `<span class="meta-pill">${esc(k)}:${esc(c.metadata[k])}</span>`).join('')}${hasRules ? `<span class="meta-pill" style="background:#e9456022;color:#e94560">📏 ${c.metadata._rules.length} pravidel</span>` : ''}</td>`;
    h += '</tr>';
  }
  h += '</tbody></table></div>';
  document.getElementById('content').innerHTML = h;
}
