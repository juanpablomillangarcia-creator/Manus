// ============================================================================
//  COLUMNA GENERATIVA · Etapas
//  Cada etapa expone `ask` (la instrucción) y `shape` (la forma JSON), para
//  poder pedir UNA propuesta o N OPCIONES distintas con el mismo material.
//  `apply` MAPEA el JSON al modelo como datos estructurados (no prosa).
// ============================================================================

import { buildContext, COHERENCE_CONTRACT } from '../ai/coherence.js';
import { resolveName } from '../model/lore.js';
import { directiveFor } from '../model/archetypes.js';
import {
  newPlace, newFaction, newNPC, newArc, newSession, newMystery, newSecret, newPC, newClock, newEvent, newThreat, newTable, newId, touch,
} from '../model/schema.js';

// Escala de la campaña: cuántas sesiones se esperan (con margen: se alargan
// o acortan según juegue la mesa). Ajusta densidad y enfoque de TODO.
export const scaleOf = (c) => {
  const n = Number(c?.scale?.sessions) || 4;
  if (n <= 2) return { n, tier: 'micro' };
  if (n <= 8) return { n, tier: 'corta' };
  if (n <= 20) return { n, tier: 'media' };
  return { n, tier: 'larga' };
};

const scaleNote = (c) => {
  const { n, tier } = scaleOf(c);
  if (tier === 'larga') return `ESCALA: campaña LARGA (~${n} sesiones, con margen para alargarse o acortarse según juegue la mesa). Diseña DENSO y RAMIFICADO: varias regiones o zonas diferenciadas, cada una con conflictos y misterios propios; una trama troncal que las atraviese sin agotarse pronto; y abundante material secundario (subtramas, facciones menores, semillas) del que tirar durante meses. NUNCA concentres todo en un único lugar o conflicto pequeño.`;
  if (tier === 'media') return `ESCALA: campaña media (~${n} sesiones, flexible). Diseña con capas: una trama principal con recorrido y varias secundarias que puedan crecer si la mesa tira de ellas.`;
  if (tier === 'micro') return `ESCALA: historia de ${n} sesión(es): conflicto único, denso y cerrado.`;
  return `ESCALA: arco corto (~${n} sesiones, flexible): enfocado, sin ramificaciones que no se puedan cerrar.`;
};

const ctx = (c) => {
  const dir = directiveFor(c.archetype);
  return `Estado actual de la campaña:\n\n${buildContext(c)}\n\n` +
    (dir ? `Enfoque de esta campaña: ${dir}\n\n` : '') +
    scaleNote(c) + '\n\n' +
    COHERENCE_CONTRACT;
};

// Empuje de variedad: rota por llamada para romper la repetición de la IA.
const VARIETY = [
  'Para esta tirada, elige a propósito un ángulo que NO sea el primero que vendría a la mente.',
  'Incluye al menos un detalle inesperado, incómodo o moralmente ambiguo.',
  'Evita nombres y estructuras de plantilla; varía la sonoridad y el origen de los nombres.',
  'Que algo de lo que generes complique la vida de los PJ de forma concreta y memorable.',
  'Cruza de manera sorprendente (pero lógica) dos elementos que YA existan en la campaña.',
  'Prefiere lo concreto y peculiar antes que lo épico y vago.',
  'Da a alguien un motivo comprensible para hacer algo terrible.',
];
const nudge = () => VARIETY[Math.floor(Math.random() * VARIETY.length)];

// prompt de UNA propuesta
export const singleUser = (stage, c, extra = '') =>
  `${ctx(c)}\n\n${stage.ask(c)}\n${extra ? '\n' + extra + '\n' : ''}\nVariedad: ${nudge()}\n\nDevuelve SOLO un objeto JSON válido (sin markdown, sin texto fuera) con esta forma exacta:\n${stage.shape}`;

// prompt de N OPCIONES claramente distintas
export const optionsUser = (stage, c, n, extra = '') =>
  `${ctx(c)}\n\n${stage.ask(c)}\n${extra ? '\n' + extra + '\n' : ''}\nVariedad: ${nudge()}\n\nDame ${n} OPCIONES claramente distintas entre sí (enfoques diferentes, no variaciones menores).\n` +
  `Devuelve SOLO un objeto JSON válido con esta forma:\n{ "options": [ ${stage.shape} ] }  // ${n} elementos en "options"`;

export const ITEMS_KEY = {
  premise: 'premise', world: 'places', timeline: 'events', truth: 'core',
  factions: 'factions', cast: 'npcs', bestiary: 'threats', arcs: 'arcs',
  sessions: 'sessions', mysteries: 'mysteries', tables: 'tables',
  clocks: 'clocks', hooks: 'hooks',
};

// ¿Llegó vacía la propuesta para esta etapa? (array sin elementos, o campo
// de texto principal en blanco). Sirve para detectar cortes de la IA que
// dejan JSON válido pero sin contenido real.
export function isProposalEmpty(stageId, proposal) {
  const key = ITEMS_KEY[stageId];
  if (!key) return false;
  const v = proposal?.[key];
  return Array.isArray(v) ? v.length === 0 : !v || !String(v).trim();
}

export const STAGES = {
  timeline: {
    id: 'timeline', label: 'Cronología / trasfondo', optionLabel: 'cronología',
    desc: 'La historia previa que explica el presente, atada a lo ya creado.',
    system: 'Eres un diseñador de trasfondo para campañas de rol. Creas una CRONOLOGÍA de sucesos previos que explican el presente. Cada suceso es concreto, con nombres propios y fechas o etiquetas temporales, y se apoya en los lugares/facciones/NPCs ya existentes. Respondes en español, solo JSON.',
    ask: () => 'Diseña una cronología de 5-8 sucesos clave del PASADO que expliquen la situación actual, ordenados del más antiguo al más reciente. Cada suceso: cuándo (etiqueta temporal concreta: "Hace 40 años", "El invierno de 1902"…), un título breve, qué ocurrió (concreto, con nombres) y su CONSECUENCIA directa en el presente de la campaña. Implica por su NOMBRE EXACTO a lugares, facciones o NPCs ya existentes siempre que encaje; que la cadena de sucesos explique por qué las cosas están como están ahora.',
    shape: '{ "events": [ { "when": "cuándo", "title": "título breve", "what": "qué pasó", "consequence": "consecuencia en el presente", "involved": ["nombre exacto de una entidad existente"] } ] }',
    maxTokens: 2600,
    temperature: 0.9,
    apply(c, p) {
      (p.events || []).forEach((e) => {
        const involvedIds = (e.involved || []).map((nm) => resolveName([...c.places, ...c.factions, ...c.npcs], nm)).filter(Boolean).map((x) => x.id);
        c.timeline = c.timeline || []; c.timeline.push(newEvent({ when: e.when || '', title: e.title || '', what: e.what || '', consequence: e.consequence || '', involvedIds, source: 'ai' }));
      });
    },
  },
  truth: {
    id: 'truth', label: 'La verdad oculta', optionLabel: 'verdad oculta',
    desc: 'Qué pasa REALMENTE bajo las apariencias, con orden de revelación (solo DJ).',
    system: 'Eres un diseñador de misterio para rol. Escribes LA VERDAD OCULTA de la campaña: qué ocurre de verdad bajo las apariencias, coherente con la premisa, la cronología, las facciones, los NPCs y los misterios ya creados. Es material solo para el Director. Concreto y con nombres. Respondes en español, solo JSON.',
    ask: () => 'Escribe LA VERDAD OCULTA de esta campaña: el secreto de fondo que lo explica todo (un párrafo denso y concreto, implicando por su NOMBRE a entidades existentes). Luego un ORDEN DE REVELACIÓN de 3-6 hitos, en secuencia: qué van comprendiendo los jugadores y CÓMO/cuándo aflora cada hito. Y 2-3 formas de SEMBRARLO pronto sin que se note. Debe encajar con la premisa, la cronología y los misterios ya definidos y no contradecir lo ya revelado en mesa.',
    shape: '{ "core": "la verdad de fondo, un párrafo", "revelations": [ { "what": "lo que llegan a comprender", "how": "cómo/cuándo aflora" } ], "foreshadow": ["una forma de sembrarlo", "otra"] }',
    maxTokens: 2200,
    temperature: 0.9,
    apply(c, p) {
      c.truth = {
        core: p.core || '',
        revelations: (p.revelations || []).map((r) => ({ id: newId('rev'), what: r.what || '', how: r.how || '' })),
        foreshadow: Array.isArray(p.foreshadow) ? p.foreshadow.filter(Boolean) : [],
        source: 'ai',
      };
    },
  },
  bestiary: {
    id: 'bestiary', label: 'Bestiario', optionLabel: 'bestiario',
    desc: 'Amenazas con nombre propias de la campaña, atadas al mundo.',
    system: 'Eres un diseñador de amenazas para rol. Creas adversarios y criaturas CON NOMBRE, propios de esta campaña y ligados a sus lugares/facciones/NPCs. Descripciones narrativas y evocadoras, nunca bloques de estadísticas genéricos. Respondes en español, solo JSON.',
    ask: () => 'Diseña 3-5 amenazas CON NOMBRE propias de esta campaña (criaturas, horrores o adversarios singulares), coherentes con el tono. Cada una: qué es (naturaleza), una descripción sensorial concreta, cómo actúa (tácticas), una debilidad o límite explotable, y un gancho de cómo entra en juego. Liga cada amenaza por su NOMBRE EXACTO a un lugar, facción o NPC ya existente. Nada genérico ni intercambiable.',
    shape: '{ "threats": [ { "name":"", "nature":"", "description":"", "tactics":"", "weakness":"", "hook":"", "ties":["nombre de una entidad existente"] } ] }',
    maxTokens: 2800, temperature: 0.9,
    apply(c, p) {
      (p.threats || []).forEach((t) => {
        const involvedIds = (t.ties || []).map((nm) => resolveName([...c.places, ...c.factions, ...c.npcs], nm)).filter(Boolean).map((x) => x.id);
        c.bestiary = c.bestiary || []; c.bestiary.push(newThreat({ name: t.name || 'Amenaza', nature: t.nature || '', description: t.description || '', tactics: t.tactics || '', weakness: t.weakness || '', hook: t.hook || '', involvedIds, source: 'ai' }));
      });
    },
  },
  tables: {
    id: 'tables', label: 'Tablas de la casa', optionLabel: 'set de tablas',
    desc: 'Tablas aleatorias sacadas de TU propio lore, para improvisar a tono.',
    system: 'Eres un diseñador de tablas aleatorias para rol. Creas tablas PROPIAS de esta campaña usando sus lugares, facciones, NPCs y tono concretos, para que el Director improvise sin salirse del tono. Respondes en español, solo JSON.',
    ask: () => 'Diseña 3-5 tablas aleatorias propias de esta campaña. Ejemplos posibles: rumores que corren, encuentros en un lugar existente, complicaciones de una facción existente, hallazgos macabros, qué susurra la ciudad, con quién te cruzas. Usa por su NOMBRE los lugares/facciones/NPCs de la campaña y respeta el tono. Cada tabla: un título claro y 6-8 entradas concretas y evocadoras (una frase cada una).',
    shape: '{ "tables": [ { "title":"", "entries":["entrada 1","entrada 2","..."] } ] }',
    maxTokens: 3000, temperature: 1,
    apply(c, p) {
      (p.tables || []).forEach((t) => {
        c.tables = c.tables || []; c.tables.push(newTable({ title: t.title || 'Tabla', entries: (t.entries || []).filter(Boolean), source: 'ai' }));
      });
    },
  },
  premise: {
    id: 'premise', label: 'Premisa y pitch', optionLabel: 'premisa',
    desc: 'El conflicto central y el gancho de una línea.', maxTokens: 1100,
    system: 'Eres un diseñador experto de campañas de rol. Creas premisas con conflicto fuerte y un gancho memorable. Respondes en español.',
    ask: () => 'Propón la premisa central de esta campaña y un "pitch" de una sola línea evocadora. Sugiere 2-4 temas que la recorran.',
    shape: '{ "premise": "2-3 frases", "pitch": "una línea", "themes": ["tema1","tema2"] }',
    apply: (c, j) => {
      if (j.premise) c.premise = j.premise;
      if (j.pitch) c.pitch = j.pitch;
      if (Array.isArray(j.themes)) c.themes = Array.from(new Set([...(c.themes || []), ...j.themes]));
      return touch(c);
    },
  },

  world: {
    id: 'world', label: 'Esqueleto del mundo', optionLabel: 'mundo',
    desc: 'Lugares ancla y cosmología ligera, coherentes con el tono.', maxTokens: 3200,
    system: 'Eres un diseñador experto de ambientaciones de rol. Creas lugares vívidos y útiles para dirigir. Respondes en español.',
    ask: (c) => { const { tier } = scaleOf(c);
      const size = tier === 'larga' ? '8-12 lugares ancla organizados en 2-4 REGIONES diferenciadas (nómbralas), cada región con su carácter y su conflicto propio'
        : tier === 'media' ? '5-8 lugares ancla, al menos en dos zonas con carácter distinto'
        : '3-5 lugares ancla';
      return `Diseña el esqueleto del mundo: ${size}, y una cosmología ligera (1-2 frases). Cada lugar con NOMBRE PROPIO evocador, un detalle sensorial concreto, un rasgo que lo distinga de cualquier otro y un problema o tensión latente que dé juego. Evita lugares intercambiables.`; },
    shape: '{ "cosmology": "1-2 frases", "places": [ { "name": "", "kind": "Ciudad|Región|Edificio|…", "summary": "una línea", "description": "2-3 frases", "government": "", "ambience": "detalle sensorial" } ] }',
    apply: (c, j) => {
      if (j.cosmology) c.cosmology = j.cosmology;
      (j.places || []).forEach((p) => c.places.push(newPlace({ ...p, source: 'ai' })));
      return touch(c);
    },
  },

  factions: {
    id: 'factions', label: 'Bandos y facciones', optionLabel: 'set de facciones',
    desc: 'Fuerzas con objetivos en conflicto: el motor de la campaña.', maxTokens: 2600,
    system: 'Eres un diseñador experto de conflictos de rol. Creas facciones cuyos objetivos chocan entre sí. Respondes en español.',
    ask: (c) => { const { tier } = scaleOf(c);
      const size = tier === 'larga' ? '4-7 facciones (mezcla grandes poderes y facciones locales de distintas regiones)' : tier === 'media' ? '3-5 facciones' : '2-4 facciones';
      return `Diseña ${size} cuyos objetivos CHOQUEN entre sí (di explícitamente quién quiere qué de quién). Cada una: objetivo concreto, recursos, influencia, una cara pública y una agenda oculta distinta, y un vínculo con un LUGAR o NPC ya existente (por su nombre exacto) si lo hay.`; },
    shape: '{ "factions": [ { "name": "", "summary": "una línea", "goal": "qué quiere", "resources": "con qué cuenta", "influence": "Latente|Local|Regional|Continental|Cósmica" } ] }',
    apply: (c, j) => { (j.factions || []).forEach((f) => c.factions.push(newFaction({ ...f, source: 'ai' }))); return touch(c); },
  },

  cast: {
    id: 'cast', label: 'Reparto clave', optionLabel: 'reparto',
    desc: 'Villano(s), aliados y comodines, enlazados al mundo.', maxTokens: 3800,
    system: 'Eres un diseñador experto de NPCs de rol. Creas personajes con objetivo, secreto y una voz reconocible. Respondes en español.',
    ask: (c) => { const { tier } = scaleOf(c);
      const size = tier === 'larga' ? '8-12 NPCs clave repartidos por las regiones (incluidos 2-3 antagonistas de distinto calibre y alcance)' : tier === 'media' ? '6-8 NPCs clave (incluidos 1-2 antagonistas)' : '4-6 NPCs clave (incluido al menos un antagonista con motivos comprensibles)';
      return `Diseña ${size}. Cada uno: rol, objetivo concreto, un secreto que IMPLIQUE a otra entidad de la campaña, su voz/manierismo distintivo, y su anclaje a un LUGAR existente y, si procede, a una FACCIÓN existente (por su nombre exacto). Que dos de ellos tengan un conflicto o lazo entre sí.`; },
    shape: '{ "npcs": [ { "name": "", "role": "", "summary": "una línea", "goal": "", "secret": "", "voice": "", "bond": "", "faction": "nombre de facción existente o vacío" } ] }',
    apply: (c, j) => {
      (j.npcs || []).forEach((n) => {
        const fac = n.faction ? resolveName(c.factions, n.faction) : null;
        const { faction, ...rest } = n;
        const npc = newNPC({ ...rest, factionId: fac ? fac.id : null, source: 'ai' });
        if (rest.secret) npc.secrets.push(newSecret({ text: rest.secret, visibility: 'secret' }));
        c.npcs.push(npc);
      });
      return touch(c);
    },
  },

  arcs: {
    id: 'arcs', label: 'Arcos', optionLabel: 'estructura de arcos',
    desc: 'La forma dramática: premisa, clímax y condición de avance.', maxTokens: 2200,
    system: 'Eres un diseñador experto de estructura dramática para campañas de rol. Respondes en español.',
    ask: (c) => { const { n, tier } = scaleOf(c);
      if (tier === 'larga') return `Diseña la hoja de ruta de la saga: 4-7 ARCOS que cubran las ~${n} sesiones (cada arco es un capítulo con su rango orientativo de sesiones, p. ej. "sesiones 1-8"; inclúyelo en la premisa del arco). Cada arco: premisa, clímax y cómo se avanza; que cada uno gire en torno a una región o facción distinta, escalando hacia el desenlace. Implica por su nombre lo ya creado.`;
      if (tier === 'media') return `Diseña 3-4 arcos para ~${n} sesiones. Cada arco: premisa, clímax y cómo se avanza. Implica facciones existentes cuando proceda.`;
      return `Diseña los arcos (1 para one-shot; 2-3 para un arco corto de ${n} sesiones). Cada arco: premisa, clímax y cómo se avanza. Implica facciones existentes cuando proceda.`; },
    shape: '{ "arcs": [ { "name": "", "premise": "", "climax": "", "advanceWhen": "qué hace avanzar el arco" } ] }',
    apply: (c, j) => { (j.arcs || []).forEach((a, i) => c.arcs.push(newArc({ ...a, order: c.arcs.length + i, source: 'ai' }))); return touch(c); },
  },

  sessions: {
    id: 'sessions', label: 'Columna de sesiones', optionLabel: 'columna',
    desc: 'Sesiones con objetivo, escenas y elementos en juego.', maxTokens: 3800,
    system: 'Eres un Director de Juego experto preparando sesiones. Cada sesión tiene un objetivo claro y escenas flexibles, no un guion rígido. Respondes en español.',
    ask: (c) => { const { n, tier } = scaleOf(c);
      if (tier === 'larga') return `La campaña es larga (~${n} sesiones): NO diseñes todas. Diseña en detalle SOLO las sesiones del PRIMER ARCO (6-8 sesiones), siguiendo la hoja de ruta de arcos si existe. Cada una con número, título evocador, objetivo claro y 2-4 escenas probables; cada escena en un LUGAR existente y con un NPC concreto en juego (nómbralos). Encadénalas y deja el final del bloque abriendo el siguiente arco. Los arcos posteriores se detallarán cuando lleguen.`;
      const cap = Math.min(n, 12);
      return `Diseña la columna de ${cap} sesión(es). Cada una con número, título evocador, objetivo claro y 2-4 escenas probables; cada escena debería ocurrir en un LUGAR existente y poner en juego a un NPC concreto (nómbralos). Encadena las sesiones: que lo de una tenga consecuencias en la siguiente.`; },
    shape: '{ "sessions": [ { "number": 1, "title": "", "objective": "", "scenes": [ { "title": "", "notes": "" } ] } ] }',
    apply: (c, j) => {
      (j.sessions || []).forEach((s) => {
        const scenes = (s.scenes || []).map((sc) => ({ id: newId('sc'), title: sc.title || '', notes: sc.notes || '', done: false }));
        c.sessions.push(newSession({ number: s.number || c.sessions.length + 1, title: s.title || '', objective: s.objective || '', scenes, source: 'ai' }));
      });
      return touch(c);
    },
  },

  mysteries: {
    id: 'mysteries', label: 'Misterios y pistas', optionLabel: 'misterio',
    desc: 'Conclusiones a deducir, con la regla de las tres pistas.', maxTokens: 2800,
    system: 'Eres un diseñador experto de misterios para rol. Aplicas la regla de las tres pistas: cada conclusión importante necesita al menos tres pistas distintas que apunten a ella. Respondes en español.',
    ask: () => 'Diseña 1-2 misterios. Cada conclusión debe IMPLICAR a un NPC o facción CONCRETOS ya existentes (por su nombre). Da AL MENOS 3 pistas distintas que apunten a ella, y coloca cada una en un LUGAR existente (di cuál). Añade 1-2 pistas falsas verosímiles (señuelos).',
    shape: '{ "mysteries": [ { "name": "", "conclusion": "qué deben deducir", "clues": [ { "text": "la pista", "location": "dónde está colocada" } ], "redHerrings": ["pista falsa"] } ] }',
    apply: (c, j) => {
      (j.mysteries || []).forEach((m) => {
        const clues = (m.clues || []).map((cl) => ({ id: newId('clue'), text: cl.text || '', location: cl.location || '', found: false }));
        c.mysteries.push(newMystery({ name: m.name || '', conclusion: m.conclusion || '', clues, redHerrings: m.redHerrings || [], source: 'ai' }));
      });
      return touch(c);
    },
  },
  clocks: {
    id: 'clocks', label: 'Frentes y relojes', optionLabel: 'set de relojes',
    desc: 'Amenazas fuera de cámara con cuenta atrás, ligadas a las facciones.', maxTokens: 1800,
    system: 'Eres un diseñador experto de campañas de rol. Diseñas "frentes" (relojes de progreso) que hacen tangible lo que ocurre fuera de cámara si los PJ no intervienen. Respondes en español.',
    ask: () => 'Diseña 2-3 relojes de progreso (frentes): amenazas con cuenta atrás ligadas a las facciones existentes. Cada uno: nombre, número de segmentos (4, 6 u 8), qué pasa al completarse, y a qué facción pertenece.',
    shape: '{ "clocks": [ { "name": "", "segments": 6, "trigger": "qué pasa al completarse", "faction": "nombre de facción existente o vacío" } ] }',
    apply: (c, j) => {
      (j.clocks || []).forEach((k) => {
        const fac = k.faction ? resolveName(c.factions, k.faction) : null;
        c.clocks.push(newClock({
          name: k.name || '', segments: [4, 6, 8, 10, 12].includes(k.segments) ? k.segments : 6,
          trigger: k.trigger || '', linkedIds: fac ? [fac.id] : [], source: 'ai',
        }));
      });
      return touch(c);
    },
  },

  hooks: {
    id: 'hooks', label: 'Ganchos por PJ', optionLabel: 'set de ganchos',
    desc: 'Un anzuelo personal que ata a cada jugador a la trama.', maxTokens: 2200,
    system: 'Eres un Director de Juego experto. Creas ganchos personales que dan a cada personaje jugador una razón propia e íntima para implicarse en esta trama concreta. Respondes en español.',
    ask: (c) => (c.pcs && c.pcs.length)
      ? 'Para cada PJ ya listado, escribe un gancho personal que lo ate a esta trama (un secreto familiar, una deuda, una pérdida, un vínculo con un NPC o facción existente).'
      : 'Propón 4 personajes jugador de ejemplo, cada uno con un concepto breve y un gancho personal que lo ate a esta trama.',
    shape: '{ "hooks": [ { "pc": "nombre del PJ", "concept": "concepto breve (si es nuevo)", "hook": "su anzuelo personal a la trama" } ] }',
    apply: (c, j) => {
      (j.hooks || []).forEach((h) => {
        const existing = c.pcs.find((p) => p.name.toLowerCase() === String(h.pc || '').toLowerCase());
        if (existing) {
          existing.hook = h.hook || existing.hook;
          if (!existing.concept && h.concept) existing.concept = h.concept;
        } else {
          c.pcs.push(newPC({ name: h.pc || 'PJ', concept: h.concept || '', hook: h.hook || '', source: 'ai' }));
        }
      });
      return touch(c);
    },
  },
};

export const getStage = (id) => STAGES[id];
