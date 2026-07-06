// ============================================================================
//  LORE · helpers de interlinkado
//  Une places/npcs/factions en un índice navegable, resuelve enlaces [[Nombre]]
//  y calcula backlinks ("aparece en"). El cosido entre fichas vive aquí.
// ============================================================================

export const COLL_OF = { places: 'Lugar', npcs: 'NPC', factions: 'Facción' };

export function allLoreEntities(c) {
  return [
    ...(c.places || []).map((e) => ({ ...e, _coll: 'places' })),
    ...(c.npcs || []).map((e) => ({ ...e, _coll: 'npcs' })),
    ...(c.factions || []).map((e) => ({ ...e, _coll: 'factions' })),
  ];
}

export function nameIndex(entities) {
  const m = {};
  entities.forEach((e) => {
    if (e.name) m[e.name.toLowerCase()] = e;
    (e.aliases || []).forEach((a) => a && (m[a.toLowerCase()] = e));
  });
  return m;
}

// texto buscable de una entidad (para backlinks)
function blob(e) {
  return [e.description, e.summary, e.ambience, e.goal, e.dmNotes,
    ...(e.secrets || []).map((s) => s.text),
    ...(e.rumors || []), ...(e.dangers || [])].filter(Boolean).join(' ').toLowerCase();
}

export function backlinksFor(entity, entities) {
  const names = [entity.name, ...(entity.aliases || [])].filter(Boolean).map((n) => `[[${n.toLowerCase()}]]`);
  if (!names.length) return [];
  return entities.filter((o) => o.id !== entity.id).filter((o) => {
    const b = blob(o);
    return names.some((n) => b.includes(n));
  });
}

// divide un texto en segmentos de texto y enlaces [[Nombre]]
export function parseLinks(text) {
  if (!text) return [];
  return text.split(/(\[\[[^\]\n]+\]\])/g).map((part) => {
    const m = part.match(/^\[\[([^\]\n]+)\]\]$/);
    return m ? { t: 'link', v: m[1] } : { t: 'text', v: part };
  });
}

// Resuelve una entidad por nombre de forma tolerante: primero exacto (sin
// distinguir mayúsculas), y si no, una única coincidencia parcial inequívoca
// (p. ej. "Dr. Armitage" ↔ "Dr. Nathaniel Armitage"). Si hay ambigüedad, null.
export function resolveName(list, raw) {
  const n = String(raw || '').trim().toLowerCase();
  if (!n) return null;
  const exact = list.find((e) => e.name.toLowerCase() === n);
  if (exact) return exact;
  const sub = list.filter((e) => { const en = e.name.toLowerCase(); return en.includes(n) || n.includes(en); });
  if (sub.length === 1) return sub[0];
  // por tokens: todas las palabras significativas de uno están en el otro
  const toks = (x) => x.split(/[^a-záéíóúñü0-9]+/i).filter((t) => t.length > 2);
  const qt = toks(n);
  if (qt.length) {
    const tok = list.filter((e) => { const et = toks(e.name.toLowerCase()); return et.length > 0 && (qt.every((t) => et.includes(t)) || et.every((t) => qt.includes(t))); });
    if (tok.length === 1) return tok[0];
  }
  return null;
}
