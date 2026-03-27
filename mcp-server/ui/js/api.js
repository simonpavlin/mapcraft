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
    state.nodeData = await (await fetch(`/api/node?path=${encodeURIComponent(path)}&projection=${state.currentProjection}`)).json();
    if (state.nodeData.floors?.length > 0 && !state.selectedFloor) {
      await selectFloor(state.nodeData.floors[0].id);
      return;
    }
    if (onDataChanged) onDataChanged();
  } catch (err) {
    console.error('fetchNode failed:', err);
  }
}

export async function selectFloor(id) {
  state.selectedFloor = id;
  if (id) {
    const floorPath = state.currentPath === '/' ? id : `${state.currentPath}/${id}`;
    try {
      const res = await fetch(`/api/node?path=${encodeURIComponent(floorPath)}`);
      state.selectedFloorData = await res.json();
    } catch (err) {
      console.error('selectFloor failed:', err);
      state.selectedFloorData = null;
    }
  } else {
    state.selectedFloorData = null;
  }
  if (onDataChanged) onDataChanged();
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
