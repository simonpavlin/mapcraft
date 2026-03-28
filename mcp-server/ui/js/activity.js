import { state } from './state.js';

let lastTs = 0;
let entries = [];
const MAX_ENTRIES = 30;
const ACTIVE_WINDOW = 5000; // entries within 5s are "active"

// Tool categories for visual distinction
const TOOL_TYPES = {
  create_project: 'write', delete_project: 'write', clear_all: 'write',
  place_object: 'write', place_objects: 'write', stamp_object: 'write',
  update_object: 'write', move_object: 'write', remove_object: 'write',
  duplicate_object: 'write', rename_object: 'write', define_rules: 'write',
  get_guide: 'read', get_ascii: 'read', get_objects: 'read', get_info: 'read',
  find_objects: 'read', export_json: 'read',
  check_collision: 'check', check_connectivity: 'check', validate: 'check',
};

const TOOL_ICONS = {
  write: '+',
  read: '?',
  check: '!',
};

export function getActiveEntries() {
  const now = Date.now();
  return entries.filter(e => now - e.ts < ACTIVE_WINDOW);
}

/**
 * Get set of paths that are currently being acted on by MCP.
 */
export function getActivePaths() {
  const active = getActiveEntries();
  const paths = new Set();
  for (const e of active) {
    if (e.path) paths.add(e.path);
    // For place_objects, add individual object paths
    if (e.args?.objects && e.path) {
      for (const id of e.args.objects) {
        paths.add(e.path + '/' + id);
      }
    }
    // For tools with id arg
    if (e.args?.id && e.path) {
      paths.add(e.path + '/' + e.args.id);
    }
  }
  return paths;
}

export async function pollActivity() {
  try {
    const res = await fetch(`/api/activity?since=${lastTs}`);
    const newEntries = await res.json();
    if (newEntries.length > 0) {
      entries.push(...newEntries);
      if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
      lastTs = Math.max(...newEntries.map(e => e.ts));
      renderActivityLog();
    }
  } catch {}
}

function renderActivityLog() {
  const el = document.getElementById('activity-log');
  if (!el) return;

  const now = Date.now();
  // Show last 15 entries, newest first
  const visible = entries.slice(-15).reverse();

  if (visible.length === 0) {
    el.innerHTML = '<div class="act-empty">Žádná aktivita</div>';
    return;
  }

  let h = '';
  for (const e of visible) {
    const age = now - e.ts;
    const type = TOOL_TYPES[e.tool] || 'read';
    const icon = TOOL_ICONS[type];
    const isActive = age < ACTIVE_WINDOW;
    const isFresh = age < 1000;

    const cls = [
      'act-entry',
      `act-${type}`,
      isActive ? 'act-active' : '',
      isFresh ? 'act-fresh' : '',
      e.status === 'start' ? 'act-running' : '',
    ].filter(Boolean).join(' ');

    const toolName = e.tool.replace(/_/g, '_');
    const pathShort = e.path ? e.path.split('/').slice(-2).join('/') : '';
    const detail = formatDetail(e);
    const ago = age < 1000 ? 'teď' : age < 60000 ? `${Math.floor(age / 1000)}s` : `${Math.floor(age / 60000)}m`;

    h += `<div class="${cls}">`;
    h += `<span class="act-icon act-icon-${type}">${icon}</span>`;
    h += `<span class="act-tool">${toolName}</span>`;
    if (pathShort) h += `<span class="act-path">${pathShort}</span>`;
    if (detail) h += `<span class="act-detail">${detail}</span>`;
    h += `<span class="act-time">${ago}</span>`;
    if (e.status === 'start') h += '<span class="act-spinner"></span>';
    h += '</div>';
  }
  el.innerHTML = h;
}

function formatDetail(e) {
  if (!e.args) return '';
  if (e.args.id) return e.args.id;
  if (e.args.objects?.length) return `${e.args.objects.length} obj`;
  if (e.args.tag) return `tag:${e.args.tag}`;
  if (e.args.name) return e.args.name;
  return '';
}

// Start polling
setInterval(pollActivity, 800);
pollActivity();
