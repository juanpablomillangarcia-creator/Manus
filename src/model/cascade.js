// ============================================================================
//  CASCADA: qué toca a qué.
//  - referencesTo: analiza TODO lo que referencia a una entidad (para avisar
//    antes de borrar: "esto afectará a...").
//  - deleteEntityCascade: borra la entidad y limpia las referencias formales
//    (relaciones, pertenencias, escenas, relojes, cronología, bestiario) SIN
//    destruir el texto detallado de otras fichas: los [[enlaces]] a la entidad
//    borrada se convierten en texto plano, no se elimina la frase.
//  - renameEntity: renombra y propaga el cambio a todos los [[enlaces]] y
//    menciones exactas del nombre en todo el texto de la campaña.
// ============================================================================

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Recorre todos los strings de la campaña aplicando fn(texto) → texto.
function mapStrings(obj, fn) {
  if (typeof obj === 'string') return fn(obj);
  if (Array.isArray(obj)) return obj.map((x) => mapStrings(x, fn));
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) obj[k] = mapStrings(obj[k], fn);
    return obj;
  }
  return obj;
}

// ---------- ANÁLISIS ----------
// Devuelve un informe legible de todo lo que quedará afectado si se borra.
export function referencesTo(c, coll, id) {
  const ent = (c[coll] || []).find((x) => x.id === id);
  if (!ent) return { items: [], total: 0 };
  const items = [];
  const add = (text, detail) => items.push({ text, detail: detail || '' });

  const rels = (c.relations || []).filter((r) => r.from === id || r.to === id);
  if (rels.length) {
    const other = (rid) => [...c.places, ...c.npcs, ...c.factions].find((x) => x.id === rid)?.name || '¿?';
    add(`${rels.length} relación(es) se eliminarán`, rels.map((r) => `${other(r.from === id ? r.to : r.from)} (${r.label || 'relación'})`).join(', '));
  }
  if (coll === 'places') {
    const kids = c.places.filter((p) => p.parentId === id);
    if (kids.length) add(`${kids.length} sublugar(es) quedarán sueltos (no se borran)`, kids.map((k) => k.name).join(', '));
    const res = c.npcs.filter((n) => n.placeId === id);
    if (res.length) add(`${res.length} NPC(s) quedarán sin lugar (no se borran)`, res.map((n) => n.name).join(', '));
  }
  if (coll === 'factions') {
    const mem = c.npcs.filter((n) => n.factionId === id);
    if (mem.length) add(`${mem.length} NPC(s) quedarán sin facción (no se borran)`, mem.map((n) => n.name).join(', '));
    const clk = (c.clocks || []).filter((k) => (k.linkedIds || []).includes(id));
    if (clk.length) add(`${clk.length} reloj(es) se desligarán`, clk.map((k) => k.name).join(', '));
  }
  let scenes = 0;
  (c.sessions || []).forEach((s) => (s.scenes || []).forEach((sc) => {
    if (sc.placeId === id || (sc.npcIds || []).includes(id)) scenes++;
  }));
  if (scenes) add(`${scenes} escena(s) de sesión perderán esta referencia`);
  const tl = (c.timeline || []).filter((e) => (e.involvedIds || []).includes(id));
  if (tl.length) add(`${tl.length} suceso(s) de la cronología se desligarán`, tl.map((e) => e.title).join(', '));
  const bst = (c.bestiary || []).filter((t) => (t.involvedIds || []).includes(id));
  if (bst.length) add(`${bst.length} amenaza(s) del bestiario se desligarán`, bst.map((t) => t.name).join(', '));

  // menciones [[enlazadas]] en el texto de otras fichas (incluidos secretos)
  const rx = new RegExp(`\\[\\[\\s*${esc(ent.name)}\\s*\\]\\]`, 'i');
  const mentions = [];
  const scan = (e, kind) => {
    if (e.id === id) return;
    const texts = [e.description, e.summary, e.expanded, ...(e.secrets || []).map((s) => s.text)];
    if (texts.some((t) => t && rx.test(t))) mentions.push(`${e.name} (${kind})`);
  };
  c.places.forEach((e) => scan(e, 'lugar')); c.npcs.forEach((e) => scan(e, 'NPC')); c.factions.forEach((e) => scan(e, 'facción'));
  if (mentions.length) add(`Mencionado con [[enlace]] en ${mentions.length} ficha(s) — el texto se conserva, el enlace se deshace`, mentions.join(', '));

  return { items, total: items.length, name: ent.name };
}

// ---------- BORRADO EN CASCADA ----------
export function deleteEntityCascade(c, coll, id) {
  const ent = (c[coll] || []).find((x) => x.id === id);
  if (!ent) return c;
  const name = ent.name;

  c[coll] = c[coll].filter((x) => x.id !== id);
  c.relations = (c.relations || []).filter((r) => r.from !== id && r.to !== id);
  c.npcs.forEach((n) => { if (n.factionId === id) n.factionId = null; if (n.placeId === id) n.placeId = null; });
  c.places.forEach((p) => { if (p.parentId === id) p.parentId = null; });
  (c.clocks || []).forEach((k) => { if (k.linkedIds) k.linkedIds = k.linkedIds.filter((x) => x !== id); });
  (c.timeline || []).forEach((e) => { if (e.involvedIds) e.involvedIds = e.involvedIds.filter((x) => x !== id); });
  (c.bestiary || []).forEach((t) => { if (t.involvedIds) t.involvedIds = t.involvedIds.filter((x) => x !== id); });
  (c.sessions || []).forEach((s) => {
    if (s.stagedIds) s.stagedIds = s.stagedIds.filter((x) => x !== id);
    (s.scenes || []).forEach((sc) => {
      if (sc.placeId === id) sc.placeId = null;
      if (sc.npcIds) sc.npcIds = sc.npcIds.filter((x) => x !== id);
    });
  });
  // los [[enlaces]] al borrado pasan a texto plano (la prosa se conserva)
  if (name) {
    const rx = new RegExp(`\\[\\[\\s*${esc(name)}\\s*\\]\\]`, 'gi');
    mapStrings(c, (t) => t.replace(rx, name));
  }
  return c;
}

// ---------- RENOMBRAR CON PROPAGACIÓN ----------
// Cambia el nombre y actualiza [[enlaces]] y menciones exactas en TODO el
// texto de la campaña. No toca nada más: el detalle se conserva.
export function renameEntity(c, coll, id, newName) {
  const ent = (c[coll] || []).find((x) => x.id === id);
  const oldName = ent?.name?.trim();
  const nn = String(newName || '').trim();
  if (!ent || !nn || !oldName || oldName === nn) { if (ent) ent.name = nn || ent.name; return c; }
  ent.name = nn;
  const rxLink = new RegExp(`\\[\\[\\s*${esc(oldName)}\\s*\\]\\]`, 'gi');
  // mención exacta con límites: no dentro de otra palabra (solo nombres de 4+ letras, para no falsear)
  const rxPlain = oldName.length >= 4 ? new RegExp(`(^|[^\\p{L}\\p{N}\\[])${esc(oldName)}(?=$|[^\\p{L}\\p{N}\\]])`, 'gu') : null;
  mapStrings(c, (t) => {
    let out = t.replace(rxLink, `[[${nn}]]`);
    if (rxPlain) out = out.replace(rxPlain, (m, pre) => pre + nn);
    return out;
  });
  return c;
}
