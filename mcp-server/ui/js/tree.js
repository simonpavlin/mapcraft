import { state } from './state.js';
import { esc, escAttr } from './utils.js';
import { fetchNode } from './api.js';

export function renderTree() {
  if (!state.treeData || state.treeData.error) {
    document.getElementById('tree').innerHTML = `<p style="padding:16px;color:var(--tx2)">${state.treeData?.error || 'Žádná data'}</p>`;
    return;
  }
  document.getElementById('tree').innerHTML = renderTreeNode(state.treeData);
}

function renderTreeNode(n) {
  const has = n.children?.length > 0, exp = state.expandedPaths.has(n.path), act = state.currentPath === n.path;
  const isProject = n.tags?.includes('project');
  const isFolder = !n.isSpatial;
  let h = `<div class="tree-node"><div class="tree-row ${act ? 'active' : ''}" onclick="treeClick(event,'${escAttr(n.path)}',${has})">`;
  h += `<span class="tree-toggle">${has ? (exp ? '▼' : '▶') : ''}</span>`;
  if (isFolder) {
    h += `<span class="tree-icon" style="color:#8888aa">📁</span>`;
  } else {
    h += `<span class="tree-icon">📦</span>`;
  }
  h += `<span class="tree-name">${esc(n.name)}</span>`;
  if (n.childCount > 0) h += `<span class="tree-badge">${n.childCount}</span>`;
  if (isProject) h += `<span class="tree-tag" style="background:var(--ac)">projekt</span>`;
  else if (isFolder && n.path !== '/') h += `<span class="tree-tag" style="background:var(--sf2)">folder</span>`;
  h += '</div>';
  if (has) { h += `<div class="tree-children ${exp ? '' : 'collapsed'}">`; for (const c of n.children) h += renderTreeNode(c); h += '</div>'; }
  return h + '</div>';
}

export function treeClick(e, path, hasChildren) {
  e.stopPropagation();
  if (hasChildren && path !== '/') {
    if (state.expandedPaths.has(path)) state.expandedPaths.delete(path);
    else state.expandedPaths.add(path);
  }
  state.currentPath = path;
  state.currentProjection = 'plan';
  state.currentTab = 'floorplan';
  const urlPath = '/' + path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  if (decodeURIComponent(location.pathname) !== decodeURIComponent(urlPath)) {
    history.pushState(null, '', urlPath);
  }
  fetchNode(path);
  renderTree();
}
