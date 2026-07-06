// ============================================================================
//  MODELO DE DATOS
//  Una campaña es un documento con identidad + colecciones estructuradas.
//  Todo lo que genera la columna (§4 del plano) escribe AQUÍ, como datos, no prosa.
// ============================================================================

export const SCHEMA_VERSION = 1;

export const newId = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const nowTs = () => Date.now();

// ---- Campaña ---------------------------------------------------------------
// Rellena campos que falten en campañas guardadas con versiones anteriores,
// para que .map/.push nunca caigan sobre undefined (evita pantallas en gris).
export function normalizeCampaign(c) {
  if (!c || typeof c !== 'object') return c;
  const arrays = ['places', 'factions', 'npcs', 'pcs', 'arcs', 'sessions', 'threads', 'clocks', 'encounters', 'mysteries', 'relations', 'maps', 'timeline', 'bestiary', 'tables', 'themes', 'tones'];
  arrays.forEach((k) => { if (!Array.isArray(c[k])) c[k] = []; });
  if (!c.chronicle || typeof c.chronicle !== 'object') c.chronicle = { style: '', chapters: [] };
  if (!Array.isArray(c.chronicle.chapters)) c.chronicle.chapters = [];
  if (!c.truth || typeof c.truth !== 'object') c.truth = { core: '', revelations: [], foreshadow: [] };
  else { c.truth.core = c.truth.core || ''; if (!Array.isArray(c.truth.revelations)) c.truth.revelations = []; if (!Array.isArray(c.truth.foreshadow)) c.truth.foreshadow = []; }
  if (!c.stageStatus || typeof c.stageStatus !== 'object') c.stageStatus = {};
  if (!c.scale || typeof c.scale !== 'object') c.scale = { sessions: 4, levelFrom: 1, levelTo: 4 };
  if (!c.table || typeof c.table !== 'object') c.table = { players: 4, expectations: '', linesAndVeils: '' };
  return c;
}

export function newCampaign(brief = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId('camp'),
    // identidad
    name: brief.name || 'Campaña sin título',
    premise: brief.premise || '',
    pitch: brief.pitch || '',
    archetype: brief.archetype || 'short-arc',
    scale: brief.scale || { sessions: 4, levelFrom: 1, levelTo: 4 },
    tones: brief.tones || [],
    table: brief.table || { players: 4, expectations: '', linesAndVeils: '' },
    seed: brief.seed || '',
    system: brief.system || 'agnostic', // 'agnostic' | '5e'
    // mundo
    places: [],
    factions: [],
    cosmology: '',
    timeline: [],
    truth: { core: '', revelations: [], foreshadow: [] }, // "la verdad oculta" (solo DJ)
    bestiary: [],   // amenazas con nombre
    tables: [],     // tablas aleatorias de la casa
    chronicle: { style: '', chapters: [] }, // la campaña escrita como libro
    themes: brief.themes || [],
    // reparto
    npcs: [],
    pcs: [],
    // estructura
    arcs: [],
    sessions: [],
    threads: [],
    clocks: [],
    encounters: [], // kit de mesa 5e (solo si system === '5e')
    // capa de misterio / visibilidad (fases siguientes)
    mysteries: [],
    // tejido de relaciones
    relations: [], // { id, from, to, label }
    // cartografía
    maps: [],
    // meta
    stageStatus: {}, // { [stageId]: 'empty' | 'draft' | 'done' }
    createdAt: nowTs(),
    updatedAt: nowTs(),
  };
}

// ---- Entidades -------------------------------------------------------------
export const newSecret = (o = {}) => ({
  id: newId('sec'), text: '', visibility: 'secret', // 'secret' | 'hinted' | 'revealed'
  note: '', revealedIn: null, ...o,
});

export const newPlace = (o = {}) => ({
  id: newId('place'), name: '', kind: '', parentId: null,
  summary: '', description: '', government: '', ambience: '',
  pointsOfInterest: [], rumors: [], dangers: [],
  secrets: [], hidden: false, tags: [], source: 'manual', ...o,
});

export const newFaction = (o = {}) => ({
  id: newId('fac'), name: '', summary: '',
  goal: '', resources: '', influence: 'Local',
  leaderIds: [], rivalIds: [], secrets: [], hidden: false, tags: [],
  clockId: null, source: 'manual', ...o,
});

export const newNPC = (o = {}) => ({
  id: newId('npc'), name: '', role: '', summary: '',
  goal: '', secret: '', voice: '', bond: '', vital: 'Vivo',
  appearance: '', description: '', wants: [],
  factionId: null, placeId: null, statRef: '',
  secrets: [], hidden: false, tags: [], source: 'manual', ...o,
});

export const newRelation = (o = {}) => ({ id: newId('rel'), from: null, to: null, label: 'relacionado con', ...o });

export const newMap = (o = {}) => ({
  id: newId('map'), name: 'Mapa de la región', kind: 'region',
  size: 'mediana', style: 'tinta-fantasia', palette: '', orientation: '',
  notes: '',
  elements: [], // [{ id, kind, placeId, text, label, pos, relation }]
  prompt: '',   // prompt maestro compilado
  image: '',    // data URL del resultado (si se generó)
  createdAt: nowTs(), source: 'manual', ...o,
});

export const newPC = (o = {}) => ({
  id: newId('pc'), name: '', concept: '',
  hook: '', // gancho personal a la trama — la etapa 9 lo genera
  spotlightIds: [], source: 'manual', ...o,
});

export const newArc = (o = {}) => ({
  id: newId('arc'), name: '', premise: '', climax: '',
  factionIds: [], advanceWhen: '', order: 0, status: 'activo',
  source: 'manual', ...o,
});

export const newSession = (o = {}) => ({
  id: newId('ses'), number: 1, title: '', objective: '',
  openingText: '',       // caja de lectura de apertura
  scenes: [],            // [newScene]
  npcIds: [], placeIds: [],
  stagedIds: [],         // entidades en el escenario de la sesión
  watchedClockIds: [],   // relojes a vigilar
  reveals: [],           // revelaciones previstas [{ entityId, secretId }]
  revealedThisSession: [], // lo revelado en mesa [{ entityId, secretId }]
  encounters: [],
  initiative: [],        // [{ id, name, init }]
  turnIdx: 0,
  status: 'prep', log: '', source: 'manual', ...o,
});

export const newScene = (o = {}) => ({
  id: newId('sc'), title: '', placeId: null,
  npcIds: [], npcNames: '',   // NPCs presentes (enlazados + libres)
  beat: '', complications: [], reveal: '', readAloud: '',
  notes: '', done: false, ...o,
});

export const newThread = (o = {}) => ({
  id: newId('thr'), title: '', desc: '', status: 'plantado',
  priority: 1, chekhov: false, links: [], source: 'manual', ...o,
});

export const newClock = (o = {}) => ({
  id: newId('clk'), name: '', segments: 6, filled: 0,
  trigger: '', linkedIds: [], source: 'manual', ...o,
});

export const newMystery = (o = {}) => ({
  id: newId('mys'), name: '', conclusion: '',
  clues: [],          // [{ id, text, location, found }]
  redHerrings: [],    // pistas falsas
  source: 'manual', ...o,
});

// Suceso de la cronología / historia previa.
export const newEvent = (o = {}) => ({
  id: newId('evt'), when: '', title: '', what: '', consequence: '',
  involvedIds: [],    // ids de lugares/facciones/NPCs implicados
  source: 'manual', ...o,
});

// Amenaza con nombre del bestiario.
export const newThreat = (o = {}) => ({
  id: newId('threat'), name: '', nature: '', description: '', tactics: '', weakness: '', hook: '',
  involvedIds: [], hidden: false, source: 'manual', ...o,
});

// Tabla aleatoria propia de la campaña.
export const newTable = (o = {}) => ({
  id: newId('tbl'), title: '', entries: [], source: 'manual', ...o,
});

export const newEncounter = (o = {}) => ({
  id: newId('enc'), name: '', monsters: [], // [{ id, name, cr }]
  note: '', sessionId: null, source: 'manual', ...o,
});

export const touch = (camp) => { camp.updatedAt = nowTs(); return camp; };
