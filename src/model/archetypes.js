// ============================================================================
//  ARQUETIPOS (recetas)
//  Cada tipo define QUÉ etapas se activan, en qué orden, sus valores por
//  defecto y un `directive`: el enfoque de tono que se inyecta en CADA
//  generación para afinar los prompts (misterio siembra pistas, sandbox deja
//  huecos, intriga prioriza facciones…). Añadir un arquetipo = una entrada.
// ============================================================================

export const ARCHETYPES = {
  'saga': {
    label: 'Saga (campaña larga)',
    desc: '30–100+ sesiones por arcos regionales, con espacio para tramas secundarias.',
    stages: ['premise', 'world', 'timeline', 'factions', 'cast', 'bestiary', 'arcs', 'mysteries', 'clocks', 'sessions', 'truth', 'tables', 'hooks'],
    defaults: { scale: { sessions: 50, levelFrom: 1, levelTo: 15 } },
    directive: 'Es una SAGA de decenas de sesiones. Diseña un mundo AMPLIO (varias regiones, cada una con sus lugares, facciones y conflictos propios), una trama troncal que atraviesa las regiones y abundante material secundario (misterios locales, facciones menores, semillas de subtramas) para que la mesa pueda desviarse sin que el mundo se quede pequeño. Los arcos son capítulos de la saga; no lo resuelvas todo pronto.',
  },
  'one-shot': {
    label: 'One-shot',
    desc: 'Una sola sesión, conflicto único y cerrado.',
    stages: ['premise', 'world', 'timeline', 'cast', 'bestiary', 'mysteries', 'sessions', 'truth', 'tables', 'hooks'],
    defaults: { scale: { sessions: 1, levelFrom: 3, levelTo: 3 } },
    directive: 'Es un one-shot: conflicto único, autoconclusivo y jugable en una sola sesión. Evita tramas que exijan continuidad.',
  },
  'short-arc': {
    label: 'Arco corto',
    desc: '3–6 sesiones con un objetivo claro por sesión.',
    stages: ['premise', 'world', 'timeline', 'factions', 'cast', 'bestiary', 'arcs', 'mysteries', 'clocks', 'sessions', 'truth', 'tables', 'hooks'],
    defaults: { scale: { sessions: 4, levelFrom: 1, levelTo: 4 } },
    directive: 'Es un arco corto y dirigido: cada elemento debe empujar hacia un clímax claro en pocas sesiones.',
  },
  'sandbox': {
    label: 'Sandbox',
    desc: 'Mundo abierto movido por frentes, sin columna fija de sesiones.',
    stages: ['premise', 'world', 'timeline', 'factions', 'cast', 'bestiary', 'clocks', 'mysteries', 'truth', 'tables', 'hooks'],
    defaults: { scale: { sessions: 12, levelFrom: 1, levelTo: 8 } },
    directive: 'Es un sandbox de mundo abierto: prioriza lugares, facciones y fuerzas en movimiento (frentes/relojes) sobre una trama lineal. No asumas un orden de sesiones fijo; deja huecos para que los jugadores marquen el rumbo y para reaccionar a lo que hagan.',
  },
  'mystery': {
    label: 'Misterio',
    desc: 'Investigación: pistas, deducción y la regla de las tres pistas.',
    stages: ['premise', 'world', 'timeline', 'factions', 'cast', 'bestiary', 'mysteries', 'clocks', 'sessions', 'truth', 'tables', 'hooks'],
    defaults: { scale: { sessions: 3, levelFrom: 1, levelTo: 3 } },
    directive: 'Es una campaña de misterio/investigación: trata cada elemento como una posible pista, siembra ambigüedad, y asegúrate de que toda conclusión importante tenga al menos tres pistas distintas que apunten a ella. Los NPCs ocultan tanto como revelan.',
  },
  'intrigue': {
    label: 'Intriga política',
    desc: 'Facciones con agendas cruzadas; el conflicto es social.',
    stages: ['premise', 'world', 'timeline', 'factions', 'cast', 'bestiary', 'arcs', 'clocks', 'sessions', 'truth', 'tables', 'hooks'],
    defaults: { scale: { sessions: 6, levelFrom: 3, levelTo: 8 } },
    directive: 'Es una campaña de intriga política: prioriza facciones con agendas que se cruzan, favores, deudas, traiciones y la información como moneda de cambio. El conflicto se resuelve más por relaciones y maniobras que por combate.',
  },
  'horror': {
    label: 'Horror',
    desc: 'Terror lovecraftiano: atmósfera, lo desconocido y coste psicológico.',
    stages: ['premise', 'world', 'timeline', 'cast', 'bestiary', 'mysteries', 'clocks', 'sessions', 'truth', 'tables', 'hooks'],
    defaults: { scale: { sessions: 4, levelFrom: 1, levelTo: 4 } },
    directive: 'Es horror lovecraftiano: la atmósfera y lo desconocido por encima del combate. Dosifica la revelación —lo que se explica del todo deja de dar miedo—, mantén una amenaza que escala (usa relojes) e incluye el coste psicológico sobre los personajes.',
  },
  'dungeon': {
    label: 'Dungeon crawl',
    desc: 'Exploración de una localización peligrosa: salas, peligros y botín.',
    stages: ['premise', 'world', 'timeline', 'cast', 'bestiary', 'mysteries', 'sessions', 'truth', 'tables', 'hooks'],
    defaults: { scale: { sessions: 3, levelFrom: 1, levelTo: 4 } },
    directive: 'Es un dungeon crawl: la localización ES la campaña. Diseña los lugares como una mazmorra de salas conectadas, cada una con su peligro, su recompensa o su pista; prioriza la exploración táctica, las trampas, los recursos limitados y las decisiones de ruta.',
  },
};

export const ARCHETYPE_LIST = Object.entries(ARCHETYPES).map(([id, a]) => ({ id, ...a }));

export const stagesFor = (archetype) =>
  (ARCHETYPES[archetype]?.stages) || ARCHETYPES['short-arc'].stages;

export const directiveFor = (archetype) =>
  (ARCHETYPES[archetype]?.directive) || '';
