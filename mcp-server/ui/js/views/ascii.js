import { state } from '../state.js';
import { cc } from '../canvas-utils.js';
import { esc } from '../utils.js';
import { updateInfoPanel, buildCharLookup } from '../info-panel.js';

export function renderAscii() {
  const d = state.nodeData;
  if (!d.ascii?.length) { document.getElementById('content').innerHTML = '<div class="empty-state"><h2>Žádná data</h2></div>'; return; }
  let h = '<div class="view-with-panel"><div class="view-main"><div id="ascii-view">';
  if (d.scaleInfo) h += `<p style="margin-bottom:8px;font-size:11px;color:var(--tx2)">${esc(d.scaleInfo)}</p>`;
  h += '<div id="ascii-grid">';
  for (let r = 0; r < d.ascii.length; r++) {
    h += `<span style="color:var(--tx2)">${r.toString().padStart(3)} </span>${colorizeAsciiLine(d.ascii[r])}\n`;
  }
  h += '</div>' + renderLegend(d.legend) + '</div></div>';
  h += '<div id="hover-info"><div class="hi-empty">Najeď na objekt</div></div></div>';
  document.getElementById('content').innerHTML = h;
  const charLookup = buildCharLookup();
  const grid = document.getElementById('ascii-grid');
  if (grid) {
    grid.addEventListener('mousemove', (e) => {
      const span = e.target.closest('.achar');
      updateInfoPanel(span ? charLookup[span.dataset.char] : null);
    });
    grid.addEventListener('mouseleave', () => updateInfoPanel(null));
  }
}

export function colorizeAscii(lines) { return lines.map(l => colorizeAsciiLine(l)).join('\n'); }

export function colorizeAsciiLine(line) {
  let h = '';
  for (const ch of line) {
    if (ch !== '.' && ch !== '#' && ch !== ' ') {
      h += `<span class="achar" data-char="${esc(ch)}" style="color:${cc(ch)}">${esc(ch)}</span>`;
    } else {
      h += `<span style="color:${cc(ch)}">${esc(ch)}</span>`;
    }
  }
  return h;
}

export function renderLegend(legend) {
  if (!legend?.length) return '';
  let h = '<div class="legend-wrap">';
  for (const l of legend) {
    const color = cc(l.char);
    const childPath = state.currentPath === '/' ? l.id : `${state.currentPath}/${l.id}`;
    h += `<div class="legend-item" onclick="navigateTo('${childPath}')"><span class="legend-char" style="background:${color}22;color:${color}">${esc(l.char)}</span><span>${esc(l.id)} — ${esc(l.name)}</span></div>`;
  }
  return h + '</div>';
}
