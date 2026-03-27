import { state } from './state.js';
import { refresh, deleteNode, setOnDataChanged } from './api.js';
import { renderTree, treeClick } from './tree.js';
import { navigateTo, navigateBack, setupNavigationListeners } from './navigation.js';
import { renderContent, switchTab, switchProjection } from './content.js';

// Wire up data change callback
setOnDataChanged(() => { renderTree(); renderContent(); });

// Expose functions for inline onclick handlers in generated HTML
window.treeClick = treeClick;
window.navigateTo = navigateTo;
window.switchTab = switchTab;
window.switchProjection = switchProjection;
window.deleteNode = deleteNode;

// Event listeners
document.getElementById('refresh-btn').addEventListener('click', refresh);
setupNavigationListeners();

// Auto-refresh polling (skip when tab is hidden)
setInterval(() => {
  if (document.hidden) return;
  if (document.getElementById('auto-refresh-check').checked) refresh();
}, 2000);

// Auto-reload UI on code change
setInterval(async () => {
  if (document.hidden) return;
  try {
    const res = await fetch('/api/ui-hash');
    const { hash } = await res.json();
    if (state.lastUiHash && hash !== state.lastUiHash) location.reload();
    state.lastUiHash = hash;
  } catch (err) {
    console.error('UI hash check failed:', err);
  }
}, 1500);

// Restore path from URL
{
  const urlPath = decodeURIComponent(location.pathname).replace(/^\/+/, '').replace(/\/+$/, '');
  if (urlPath) {
    state.currentPath = urlPath;
    const parts = urlPath.split('/').filter(Boolean);
    let p = ''; state.expandedPaths.add('/');
    for (const part of parts) { p = p ? `${p}/${part}` : part; state.expandedPaths.add(p); }
  }
}

// Initial load
refresh();
