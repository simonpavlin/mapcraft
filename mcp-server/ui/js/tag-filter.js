import { state } from './state.js';
import { esc } from './utils.js';
import { fetchNodeWithAsciiTags } from './api.js';

function toggleTag(tag) {
  if (state.hiddenTags.has(tag)) {
    state.hiddenTags.delete(tag);
  } else {
    state.hiddenTags.add(tag);
  }
  applyFilter();
}

function showAllTags() {
  state.hiddenTags.clear();
  applyFilter();
}

function showOnlyTag(tag) {
  const allTags = state.nodeData?.allTags || [];
  state.hiddenTags = new Set(allTags.filter(t => t !== tag));
  applyFilter();
}

function applyFilter() {
  const allTags = state.nodeData?.allTags || [];
  if (state.hiddenTags.size === 0) {
    fetchNodeWithAsciiTags(null);
  } else {
    const activeTags = allTags.filter(t => !state.hiddenTags.has(t));
    fetchNodeWithAsciiTags(activeTags);
  }
}

// Expose for onclick handlers
window._tagToggle = toggleTag;
window._tagShowAll = showAllTags;
window._tagShowOnly = showOnlyTag;

/**
 * Render the tag filter bar HTML. Returns empty string if no tags.
 */
export function renderTagFilterBar() {
  const allTags = state.nodeData?.allTags || [];
  if (allTags.length === 0) return '';

  let h = '<div class="tag-filter">';
  h += '<span class="tag-filter-label">Tagy:</span>';
  const allActive = state.hiddenTags.size === 0;
  h += `<button class="tag-filter-btn ${allActive ? 'active' : ''}" onclick="_tagShowAll()">Vše</button>`;
  for (const tag of allTags) {
    const active = !state.hiddenTags.has(tag);
    h += `<button class="tag-filter-btn ${active ? 'active' : ''}" onclick="_tagToggle('${esc(tag)}')" oncontextmenu="event.preventDefault();_tagShowOnly('${esc(tag)}')">${esc(tag)}</button>`;
  }
  h += '<span class="tag-filter-hint">pravý klik = jen tento tag</span>';
  h += '</div>';
  return h;
}

/**
 * Check if an object should be visible given current tag filter.
 */
export function isTagVisible(obj) {
  if (state.hiddenTags.size === 0) return true;
  const tags = obj.tags || [];
  if (tags.length === 0) return true; // untagged objects always visible
  return tags.some(t => !state.hiddenTags.has(t));
}
