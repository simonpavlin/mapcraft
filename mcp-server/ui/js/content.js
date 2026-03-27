import { state } from './state.js';
import { esc, escAttr } from './utils.js';
import { renderBreadcrumb } from './navigation.js';
import { fetchNode, deleteNode } from './api.js';
import { renderOverview } from './views/overview.js';
import { renderAscii } from './views/ascii.js';
import { renderFloorplan } from './views/floorplan.js';
import { renderObjects } from './views/objects.js';

export function switchTab(t) { state.currentTab = t; renderContent(); }
export function switchProjection(p) { state.currentProjection = p; fetchNode(state.currentPath); }

export function renderContent() {
  if (!state.nodeData || state.nodeData.error) {
    document.getElementById('content').innerHTML = '<div class="empty-state"><h2>Žádná data</h2></div>';
    return;
  }
  // Sync URL
  const urlPath = '/' + state.currentPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  if (decodeURIComponent(location.pathname) !== decodeURIComponent(urlPath)) {
    history.pushState(null, '', urlPath);
  }
  const isFolder = !state.nodeData.isSpatial;
  if (isFolder && (state.currentTab === 'ascii' || state.currentTab === 'floorplan')) state.currentTab = 'overview';
  renderBreadcrumb();
  renderToolbar();
  switch (state.currentTab) {
    case 'overview': renderOverview(); break;
    case 'ascii': renderAscii(); break;
    case 'floorplan': renderFloorplan(); break;
    case 'objects': renderObjects(); break;
  }
}

function renderToolbar() {
  const d = state.nodeData;
  const isFolder = !d.isSpatial;
  let h = '';
  const tabs = isFolder
    ? [['overview', 'Přehled'], ['objects', 'Objekty']]
    : [['overview', 'Přehled'], ['ascii', 'ASCII'], ['floorplan', 'Půdorys'], ['objects', 'Objekty']];
  for (const [id, label] of tabs) {
    h += `<div class="tab ${state.currentTab === id ? 'active' : ''}" onclick="switchTab('${id}')">${label}</div>`;
  }
  if (!isFolder) {
    h += '<span class="floor-label" style="margin-left:16px">Pohled:</span>';
    for (const [id, label] of [['plan', '↓ Půdorys'], ['front', '→ Zepředu'], ['side', '→ Z boku']]) {
      h += `<div class="floor-btn ${state.currentProjection === id ? 'active' : ''}" onclick="switchProjection('${id}')">${label}</div>`;
    }
  }
  if (state.currentPath !== '/') {
    h += `<span style="flex:1"></span><button type="button" onclick="deleteNode('${escAttr(state.currentPath)}','${escAttr(d.name)}')" style="margin-left:auto;padding:4px 12px;font-size:12px;cursor:pointer;border:1px solid var(--bd);border-radius:4px;background:transparent;color:var(--tx2);transition:all .15s" onmouseover="this.style.background='var(--ac)';this.style.color='#fff';this.style.borderColor='var(--ac)'" onmouseout="this.style.background='transparent';this.style.color='var(--tx2)';this.style.borderColor='var(--bd)'">Smazat</button>`;
  }
  document.getElementById('toolbar').innerHTML = h;
}
