// ============================================================================
//  PROFUNDIZAR ("hacer zoom")
//  No escribe prosa suelta: genera detalle Y CREA entidades hijas reales
//  (sublugares, residentes, miembros, conexiones) cosidas con relaciones.
// ============================================================================

import { callClaude, extractJSON } from '../ai/client.js';
import { resolveName } from '../model/lore.js';
import { buildContext, COHERENCE_CONTRACT } from '../ai/coherence.js';
import { newPlace, newNPC, newRelation, touch } from '../model/schema.js';

const ctx = (c) => `${buildContext(c)}\n\n${COHERENCE_CONTRACT}\nAl conectar con otras entidades, REUTILIZA por su nombre exacto las que ya existan arriba; crea nuevas solo si hace falta.`;

export const DEEPEN = {
  places: {
    system: 'Eres un diseñador experto de localizaciones de rol. Profundizas un lugar en detalle jugable. Respondes en español, solo JSON.',
    build: (e, c) => `${ctx(c)}\n\nProfundiza este LUGAR: "${e.name}"${e.kind ? ` (${e.kind})` : ''}. ${e.summary || ''}\n` +
      `Devuelve SOLO JSON:\n{ "expanded": "descripción rica 2-4 frases", "subLocations": [ { "name":"", "kind":"Distrito|Edificio|…", "summary":"", "ambience":"" } ], "npcs": [ { "name":"", "role":"", "summary":"", "goal":"", "secret":"" } ], "rumors": ["",""], "dangers": [""] }`,
    apply: (c, e, j) => {
      if (j.expanded) e.description = j.expanded;
      if (Array.isArray(j.rumors)) e.rumors = j.rumors;
      if (Array.isArray(j.dangers)) e.dangers = j.dangers;
      (j.subLocations || []).forEach((p) => c.places.push(newPlace({ ...p, parentId: e.id, source: 'ai' })));
      (j.npcs || []).forEach((n) => c.npcs.push(newNPC({ name: n.name, role: n.role, summary: n.summary, goal: n.goal, secret: n.secret, placeId: e.id, source: 'ai' })));
    },
  },

  npcs: {
    system: 'Eres un diseñador experto de NPCs de rol. Profundizas un personaje en una ficha rica y lo conectas con el reparto. Respondes en español, solo JSON.',
    build: (e, c) => `${ctx(c)}\n\nProfundiza este NPC: "${e.name}"${e.role ? ` (${e.role})` : ''}. ${e.summary || ''}\n` +
      `Devuelve SOLO JSON:\n{ "appearance": "aspecto físico", "expanded": "voz, manierismos y trasfondo 2-3 frases", "wants": ["qué quiere de los PJ"], "secrets": [ { "text":"", "visibility":"secret|hinted" } ], "connections": [ { "name":"nombre (existente o nuevo)", "relation":"aliado de|teme a|sirve a|debe un favor a|…", "newNpc": true, "role":"si es nuevo" } ] }`,
    apply: (c, e, j) => {
      if (j.appearance) e.appearance = j.appearance;
      if (j.expanded) e.description = j.expanded;
      if (Array.isArray(j.wants)) e.wants = j.wants;
      (j.secrets || []).forEach((s) => e.secrets.push({ id: 'sec_' + Math.random().toString(36).slice(2, 7), text: s.text || '', visibility: s.visibility === 'hinted' ? 'hinted' : 'secret', note: '' }));
      (j.connections || []).forEach((cn) => {
        let target = resolveName([...c.npcs, ...c.places, ...c.factions], cn.name);
        if (!target && cn.newNpc) { target = newNPC({ name: cn.name, role: cn.role || '', source: 'ai' }); c.npcs.push(target); }
        if (target) c.relations.push(newRelation({ from: e.id, to: target.id, label: cn.relation || 'relacionado con' }));
      });
    },
  },

  factions: {
    system: 'Eres un diseñador experto de facciones de rol. Profundizas una organización: su gente, sus bienes y sus rivalidades. Respondes en español, solo JSON.',
    build: (e, c) => `${ctx(c)}\n\nProfundiza esta FACCIÓN: "${e.name}". Objetivo: ${e.goal || '?'}.\n` +
      `Devuelve SOLO JSON:\n{ "expanded": "una línea más rica", "members": [ { "name":"", "role":"" } ], "assets": [ { "name":"", "kind":"Edificio|Ciudad|…" } ], "rivals": ["nombre de facción existente"] }`,
    apply: (c, e, j) => {
      if (j.expanded) e.summary = j.expanded;
      (j.members || []).forEach((m) => c.npcs.push(newNPC({ name: m.name, role: m.role, factionId: e.id, source: 'ai' })));
      (j.assets || []).forEach((a) => c.places.push(newPlace({ name: a.name, kind: a.kind, source: 'ai' })));
      (j.rivals || []).forEach((rn) => { const r = c.factions.find((f) => f.name.toLowerCase() === String(rn).toLowerCase() && f.id !== e.id); if (r) c.relations.push(newRelation({ from: e.id, to: r.id, label: 'rival de' })); });
    },
  },
};

export async function runDeepen(coll, entity, campaign) {
  const d = DEEPEN[coll];
  if (!d) throw new Error('No se puede profundizar este tipo.');
  const { text } = await callClaude({ system: d.system, userPrompt: d.build(entity, campaign), maxTokens: 2600, temperature: 0.9 });
  return extractJSON(text);
}

export function applyDeepen(campaign, coll, id, proposal) {
  if (!campaign.relations) campaign.relations = [];
  const target = campaign[coll].find((x) => x.id === id);
  if (!target) return campaign;
  DEEPEN[coll].apply(campaign, target, proposal);
  return touch(campaign);
}
