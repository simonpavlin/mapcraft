export function esc(s) {
  return s ? s.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}

export function escAttr(s) {
  return s ? s.toString().replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}

export function infoCard(title, value, sub) {
  return `<div class="info-card"><h3>${title}</h3><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
}

export function renderRules(rules) {
  if (!Array.isArray(rules) || rules.length === 0) return '<span style="color:var(--tx2)">Žádná pravidla</span>';
  let h = '<ul class="rules-list">';
  for (const r of rules) {
    const typeLabel = { no_collide: 'No Collide', must_collide: 'Must Collide', must_touch: 'Must Touch', no_touch: 'No Touch' }[r.type] || esc(r.type);
    const typeCls = r.type || '';
    h += `<li><span class="rule-type ${esc(typeCls)}">${esc(typeLabel)}</span>`;
    h += `<span class="rule-tag">${esc(r.a)}</span>`;
    h += `<span class="rule-arrow">→</span>`;
    h += `<span class="rule-tag">${esc(r.b)}</span></li>`;
  }
  h += '</ul>';
  return h;
}
