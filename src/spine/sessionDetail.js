// ============================================================================
//  SESIÓN DETALLADA
//  Convierte una sesión (número + objetivo) en un guion jugable: caja de
//  apertura y escenas con lugar, NPCs presentes (enlazados al lore), el nudo,
//  complicaciones, qué se revela y texto de lectura.
// ============================================================================

import { callClaude, extractJSON } from '../ai/client.js';
import { resolveName } from '../model/lore.js';
import { buildContext, COHERENCE_CONTRACT } from '../ai/coherence.js';
import { newScene, touch } from '../model/schema.js';

export async function runSessionDetail(session, campaign) {
  const sys = 'Eres un Director de Juego experto preparando una sesión jugable. Diseñas un guion concreto y dirigible, no un resumen. Reutiliza por su nombre exacto los NPCs y lugares que ya existan en la campaña. Respondes en español, solo JSON.';
  const user = `${buildContext(campaign)}\n\n${COHERENCE_CONTRACT}\n\n` +
    `Prepara la SESIÓN #${session.number}${session.title ? ` "${session.title}"` : ''}.\n` +
    `Objetivo de la sesión: ${session.objective || '(defínelo tú a partir del estado de la campaña)'}.\n\n` +
    `Que cada escena sea concreta y memorable, no de relleno: las complicaciones deben nacer de los DESEOS y SECRETOS de los NPCs implicados, y cada escena dejar un hilo para la siguiente.\n\n` +
    `Diseña una caja de lectura de apertura y 3-5 escenas. En cada escena indica el lugar (reutiliza uno existente si encaja), los NPCs presentes (por nombre, reutilizando los existentes), el nudo de la escena, 2-3 complicaciones posibles, qué pista o secreto puede revelarse, y un texto de lectura breve para los jugadores.\n\n` +
    `Devuelve SOLO JSON:\n{ "opening": "caja de lectura de apertura", "scenes": [ { "title": "", "place": "nombre del lugar", "npcs": ["nombre1","nombre2"], "beat": "el nudo de la escena", "complications": ["",""], "reveal": "qué se puede revelar aquí", "readAloud": "texto de lectura para los jugadores" } ] }`;
  const { text } = await callClaude({ system: sys, userPrompt: user, maxTokens: 3400, temperature: 0.9 });
  return extractJSON(text);
}

export function applySessionDetail(campaign, sessionId, j) {
  const s = campaign.sessions.find((x) => x.id === sessionId);
  if (!s) return campaign;
  const byName = (name) => {
    const n = String(name || '').toLowerCase();
    return campaign.npcs.find((e) => e.name.toLowerCase() === n)
      || campaign.places.find((e) => e.name.toLowerCase() === n);
  };
  if (j.opening) s.openingText = j.opening;
  s.scenes = (j.scenes || []).map((sc) => {
    const place = resolveName(campaign.places, sc.place);
    const npcIds = [];
    const unmatched = [];
    (sc.npcs || []).forEach((nm) => {
      const hit = resolveName(campaign.npcs, nm);
      if (hit) npcIds.push(hit.id); else if (nm) unmatched.push(nm);
    });
    return newScene({
      title: sc.title || '', placeId: place ? place.id : null,
      npcIds, npcNames: unmatched.join(', '),
      beat: sc.beat || '', complications: Array.isArray(sc.complications) ? sc.complications : [],
      reveal: sc.reveal || '', readAloud: sc.readAloud || '',
    });
  });
  return touch(campaign);
}
