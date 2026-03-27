import { state } from './state.js';
import { esc } from './utils.js';
import { fetchNode } from './api.js';
import { renderTree } from './tree.js';

export function navigateTo(path) {
  if (state.currentPath !== path) state.navHistory.push(state.currentPath);
  state.currentPath = path;
  state.currentProjection = 'plan';
  state.currentTab = 'floorplan';
  state.hiddenTags = new Set();
  // Expand parent paths
  const parts = path.split('/').filter(Boolean);
  let p = ''; state.expandedPaths.add('/');
  for (let i = 0; i < parts.length - 1; i++) { p = p ? `${p}/${parts[i]}` : parts[i]; state.expandedPaths.add(p); }
  fetchNode(path);
  renderTree();
}

export function navigateBack() {
  if (state.navHistory.length > 0) {
    const prev = state.navHistory.pop();
    state.currentPath = prev;
    state.currentProjection = 'plan';
    fetchNode(prev);
    renderTree();
  } else if (state.currentPath !== '/') {
    const parts = state.currentPath.split('/').filter(Boolean);
    parts.pop();
    navigateTo(parts.length === 0 ? '/' : parts.join('/'));
  }
}

export function renderBreadcrumb() {
  const parts = state.currentPath === '/' ? [] : state.currentPath.split('/').filter(Boolean);
  let h = `<span class="crumb ${parts.length === 0 ? 'current' : ''}" onclick="navigateTo('/')">Root</span>`;
  let p = '';
  for (let i = 0; i < parts.length; i++) {
    p = p ? `${p}/${parts[i]}` : parts[i];
    h += `<span class="crumb-sep">/</span><span class="crumb ${i === parts.length - 1 ? 'current' : ''}" onclick="navigateTo('${p}')">${esc(parts[i])}</span>`;
  }
  document.getElementById('breadcrumb').innerHTML = h;
}

export function setupNavigationListeners() {
  window.addEventListener('mouseup', (e) => { if (e.button === 3) { e.preventDefault(); navigateBack(); } });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault(); navigateBack();
    }
  });
  window.addEventListener('popstate', () => {
    const urlPath = decodeURIComponent(location.pathname).replace(/^\/+/, '').replace(/\/+$/, '') || '/';
    state.currentPath = urlPath;
    state.currentProjection = 'plan';
    state.currentTab = 'floorplan';
    const parts = urlPath.split('/').filter(Boolean);
    let p = ''; state.expandedPaths.add('/');
    for (const part of parts) { p = p ? `${p}/${part}` : part; state.expandedPaths.add(p); }
    fetchNode(urlPath);
    renderTree();
  });
}
