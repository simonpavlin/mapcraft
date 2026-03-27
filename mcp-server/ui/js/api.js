import { state } from './state.js';

let onDataChanged = null;

export function setOnDataChanged(callback) {
  onDataChanged = callback;
}

export async function fetchTree() {
  try {
    state.treeData = await (await fetch('/api/tree')).json();
  } catch (err) {
    console.error('fetchTree failed:', err);
  }
}

export async function fetchNode(path) {
  try {
    let url = `/api/node?path=${encodeURIComponent(path)}&projection=${state.currentProjection}`;
    // Preserve tag filter on refresh
    if (state.hiddenTags.size > 0) {
      const allTags = state.nodeData?.allTags || [];
      if (allTags.length > 0) {
        const activeTags = allTags.filter(t => !state.hiddenTags.has(t));
        url += `&ascii_tags=${encodeURIComponent(activeTags.join(','))}`;
      }
    }
    state.nodeData = await (await fetch(url)).json();
    if (onDataChanged) onDataChanged();
  } catch (err) {
    console.error('fetchNode failed:', err);
  }
}

export async function fetchNodeWithAsciiTags(activeTags) {
  try {
    let url = `/api/node?path=${encodeURIComponent(state.currentPath)}&projection=${state.currentProjection}`;
    if (activeTags) {
      url += `&ascii_tags=${encodeURIComponent(activeTags.join(','))}`;
    }
    state.nodeData = await (await fetch(url)).json();
    if (onDataChanged) onDataChanged();
  } catch (err) {
    console.error('fetchNodeWithAsciiTags failed:', err);
  }
}

export async function deleteNode(path, name) {
  if (!confirm(`Smazat "${name}" a veškerý obsah?`)) return;
  try {
    await fetch(`/api/delete?path=${encodeURIComponent(path)}`, { method: 'POST' });
    if (state.currentPath.startsWith(path)) { state.currentPath = '/'; }
    await refresh();
  } catch (err) {
    console.error('deleteNode failed:', err);
  }
}

export async function refresh() {
  await fetchTree();
  await fetchNode(state.currentPath);
}
