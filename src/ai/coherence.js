// ============================================================================
//  IA · Coherencia
//  buildContext: serializa el estado completo de la campaña para que CADA
//    generación lo reciba (es lo que mantiene todo coherente).
//  verify: pasa sobre la campaña y marca agujeros, sin tocar nada.
// ============================================================================

import { stagesFor } from '../model/archetypes.js';
import { resolveName } from '../model/lore.js';

export function buildContext(c) {
  const lines = [];
  lines.push(`CAMPAÑA: ${c.name}`);
  lines.push(`Tipo: ${c.archetype} · Escala: ${c.scale?.sessions} sesiones (niveles ${c.scale?.levelFrom}–${c.scale?.levelTo})`);
  if (c.tones?.length) lines.push(`Tono: ${c.tones.join(', ')}`);
  if (c.themes?.length) lines.push(`Temas: ${c.themes.join(', ')}`);
  if (c.premise) lines.push(`Premisa: ${c.premise}`);
  if (c.seed) lines.push(`Semilla del autor: ${c.seed}`);

  const sec = (title, arr, fmt) => {
    if (arr && arr.length) {
      lines.push(`\n${title}:`);
      arr.forEach((x) => lines.push('- ' + fmt(x)));
    }
  };
  const secTxt = (e) => (e.secrets && e.secrets.length) ? ` [secretos: ${e.secrets.map((s) => s.text).filter(Boolean).join('; ')}]` : '';
  sec('LUGARES', c.places, (p) => `${p.name}${p.kind ? ` (${p.kind})` : ''}: ${p.summary || p.description || ''}${secTxt(p)}`);
  sec('FACCIONES', c.factions, (f) => `${f.name}: objetivo "${f.goal || '?'}", influencia ${f.influence}${secTxt(f)}`);
  sec('NPCs', c.npcs, (n) => `${n.name}${n.role ? ` — ${n.role}` : ''}: objetivo "${n.goal || '?'}"${secTxt(n)}`);
  sec('ARCOS', c.arcs, (a) => `${a.name}: ${a.premise || ''} (clímax: ${a.climax || '?'})`);
  sec('SESIONES', c.sessions, (s) => `#${s.number} ${s.title}: ${s.objective || ''}`);
  sec('CRONOLOGÍA (trasfondo)', c.timeline, (e) => `${e.when ? e.when + ' — ' : ''}${e.title}${e.what ? ': ' + e.what : ''}${e.consequence ? ' → ' + e.consequence : ''}`);
  if (c.truth?.core) { lines.push(`\nVERDAD OCULTA (solo DJ): ${c.truth.core}`); if (c.truth.revelations?.length) lines.push('Orden de revelación: ' + c.truth.revelations.map((r, i) => `(${i + 1}) ${r.what}`).join(' → ')); }
  sec('BESTIARIO (amenazas)', c.bestiary, (t) => `${t.name}${t.nature ? ` (${t.nature})` : ''}: ${t.description || ''}`);
  if (c.tables?.length) lines.push('\nTABLAS DE LA CASA: ' + c.tables.map((t) => t.title).join(', '));
  sec('PJs', c.pcs, (p) => `${p.name} (${p.concept || '?'})${p.hook ? ` — gancho: ${p.hook}` : ''}`);

  // estado jugado (clave para re-tejer respetando la mesa)
  const revealed = [];
  [...(c.npcs || []), ...(c.places || []), ...(c.factions || [])].forEach((e) =>
    (e.secrets || []).forEach((s) => { if (s.visibility === 'revealed') revealed.push(`${e.name}: ${s.text}`); }));
  if (revealed.length) { lines.push('\nYA REVELADO EN MESA:'); revealed.forEach((r) => lines.push('- ' + r)); }
  const played = (c.sessions || []).filter((s) => s.status === 'done');
  if (played.length) { lines.push('\nSESIONES YA JUGADAS:'); played.forEach((s) => lines.push(`- #${s.number} ${s.title}${s.log ? ': ' + s.log.slice(0, 200) : ''}`)); }

  return lines.join('\n');
}

// Contrato que se inyecta en cada generación.
export const COHERENCE_CONTRACT = `REGLAS DE COHERENCIA Y OFICIO (obligatorias):
1. APÓYATE EN LO EXISTENTE: cita por su NOMBRE EXACTO los lugares, facciones, NPCs y arcos ya creados (arriba). Cada elemento nuevo debe ENGANCHAR con al menos uno ya existente — un NPC vive en un lugar real y sirve a una facción real, un misterio implica a un NPC concreto, un reloj amenaza un lugar concreto. Si nombras una facción/lugar/NPC que ya existe, escríbelo IGUAL que arriba.
2. CONCRETO, NUNCA GENÉRICO: nombres propios, detalles sensoriales específicos, cifras, fechas y objetos con nombre. Prohibido lo vago tipo "un antiguo mal", "una taberna del pueblo" o "fuerzas oscuras": di CUÁL, CÓMO se llama y QUÉ tiene de particular.
3. HUYE DEL TÓPICO: evita los clichés más manidos del género (el elegido, la profecía difusa, el villano malvado-porque-sí, la posada genérica). Busca ángulos inesperados pero coherentes con el tono.
4. TENSIÓN Y GANCHO: cada elemento trae un problema, un deseo o un secreto que dé juego en la mesa y que se cruce con otra parte de la campaña. Nada decorativo.
5. RESPETA el tono, los temas y, sobre todo, lo YA REVELADO EN MESA y las SESIONES YA JUGADAS: no contradigas nada de eso.`;

// Verificador: devuelve una lista de avisos { level, text, stage }.
export function verify(c) {
  const issues = [];
  const add = (level, text, stage) => issues.push({ level, text, stage });

  if (!c.premise) add('warn', 'La campaña no tiene premisa.', 'premise');

  const active = stagesFor(c.archetype);
  if (active.includes('factions') && c.factions.length < 2) add('warn', 'Menos de 2 facciones: el motor de conflicto está flojo.', 'factions');
  if (active.includes('arcs') && !c.arcs.length) add('warn', 'No hay ningún arco definido.', 'arcs');
  if (active.includes('clocks') && !(c.clocks || []).length) add('info', 'Ningún frente/reloj: la amenaza fuera de cámara no es tangible.', 'clocks');
  if (active.includes('mysteries') && !(c.mysteries || []).length) add('info', 'Ningún misterio definido todavía.', 'mysteries');
  c.arcs.forEach((a) => {
    if (!a.climax) add('warn', `El arco "${a.name}" no tiene clímax.`, 'arcs');
    if (!a.advanceWhen) add('info', `El arco "${a.name}" no dice cómo se avanza.`, 'arcs');
  });

  c.factions.forEach((f) => { if (!f.goal) add('warn', `La facción "${f.name}" no tiene objetivo (motor de conflicto débil).`, 'factions'); });
  c.npcs.forEach((n) => { if (!n.goal) add('info', `${n.name} no tiene objetivo definido.`, 'cast'); });
  c.sessions.forEach((s) => { if (!s.objective) add('info', `La sesión #${s.number} no tiene objetivo.`, 'sessions'); });

  // Misterio: regla de las tres pistas (cuando haya misterios — fase 2)
  (c.mysteries || []).forEach((m) => {
    if ((m.clues?.length || 0) < 3) add('warn', `El misterio "${m.name}" tiene menos de 3 pistas.`, 'mysteries');
  });

  // Ganchos por PJ
  c.pcs.forEach((p) => { if (!p.hook) add('info', `${p.name} no tiene gancho personal a la trama.`, 'hooks'); });

  // Relojes sin disparador
  (c.clocks || []).forEach((k) => { if (!k.trigger) add('info', `El reloj "${k.name}" no tiene disparador.`, 'clocks'); });

  // Referencias huérfanas (apuntan a algo que ya no existe)
  const placeIds = new Set(c.places.map((p) => p.id));
  const npcIds = new Set(c.npcs.map((n) => n.id));
  const facIds = new Set(c.factions.map((f) => f.id));
  const clockIds = new Set((c.clocks || []).map((k) => k.id));
  const anyId = new Set([...placeIds, ...npcIds, ...facIds]);

  c.npcs.forEach((n) => {
    if (n.factionId && !facIds.has(n.factionId)) add('warn', `${n.name} pertenece a una facción que ya no existe.`, 'cast');
    if (n.placeId && !placeIds.has(n.placeId)) add('warn', `${n.name} está en un lugar que ya no existe.`, 'cast');
  });
  c.places.forEach((p) => { if (p.parentId && !placeIds.has(p.parentId)) add('warn', `"${p.name}" está contenido en un lugar que ya no existe.`, 'world'); });
  (c.clocks || []).forEach((k) => (k.linkedIds || []).forEach((fid) => { if (!facIds.has(fid)) add('info', `El reloj "${k.name}" apunta a una facción que ya no existe.`, 'clocks'); }));
  (c.relations || []).forEach((r) => { if (!anyId.has(r.from) || !anyId.has(r.to)) add('info', 'Hay una relación que apunta a una entidad eliminada.', null); });
  c.sessions.forEach((s) => {
    (s.scenes || []).forEach((sc) => {
      if (sc.placeId && !placeIds.has(sc.placeId)) add('info', `Una escena de la sesión #${s.number} usa un lugar que ya no existe.`, 'sessions');
      (sc.npcIds || []).forEach((nid) => { if (!npcIds.has(nid)) add('info', `Una escena de la sesión #${s.number} menciona un NPC que ya no existe.`, 'sessions'); });
    });
    (s.watchedClockIds || []).forEach((kid) => { if (!clockIds.has(kid)) add('info', `La sesión #${s.number} vigila un reloj que ya no existe.`, 'sessions'); });
    (s.stagedIds || []).forEach((eid) => { if (!anyId.has(eid)) add('info', `La sesión #${s.number} tiene en escena una entidad que ya no existe.`, 'sessions'); });
  });

  // Enlaces [[…]] sin destino (con resolución tolerante)
  const allEnts = [...c.places, ...c.npcs, ...c.factions];
  const broken = new Set();
  allEnts.forEach((e) => (String(e.description || '').match(/\[\[([^\]]+)\]\]/g) || []).forEach((raw) => { const nm = raw.slice(2, -2).trim(); if (nm && !resolveName(allEnts, nm)) broken.add(nm); }));
  if (broken.size) add('info', `Enlaces [[…]] sin destino: ${[...broken].slice(0, 6).join(', ')}.`, null);

  return issues;
}
