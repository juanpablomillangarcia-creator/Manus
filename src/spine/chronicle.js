// ============================================================================
//  CRÓNICA: la campaña escrita como un libro.
//  Genera capítulos de prosa literaria a partir del lore, la cronología y lo
//  jugado en mesa (los diarios de sesión). El estilo de la prosa se adapta al
//  tono de la campaña: el terror no se escribe como la aventura.
// ============================================================================

import { callClaude, extractJSON } from '../ai/client.js';
import { buildContext } from '../ai/coherence.js';
import { newId } from '../model/schema.js';

// Estilo de prosa derivado de los tonos elegidos (editable por el usuario).
export function suggestStyle(c) {
  const t = (c.tones || []).join(' ').toLowerCase();
  if (/lovecraft|cósmico|terror psicológico|horror/.test(t))
    return 'Prosa de terror literario: frases que se alargan como sombras, adjetivación precisa y enfermiza, lo monstruoso siempre entrevisto, nunca del todo descrito. Ecos de Lovecraft y Shirley Jackson.';
  if (/grimdark|oscura|trágica/.test(t))
    return 'Prosa sombría y descarnada: frases cortas, imágenes duras, cero romanticismo. La violencia tiene peso y consecuencia. Ecos de Abercrombie y Cormac McCarthy.';
  if (/noir|detectivesco|intriga|político/.test(t))
    return 'Prosa de novela negra: seca, irónica, observadora. Los detalles delatan; los diálogos cortan. Ecos de Chandler.';
  if (/pulp|aventura|espada|pirata/.test(t))
    return 'Prosa de aventura clásica: ritmo vivo, verbos musculosos, color y peligro en cada página. Ecos de Howard y Sabatini.';
  if (/gótico|romántico/.test(t))
    return 'Prosa gótica: atmósfera densa, pasiones contenidas, arquitectura y clima como personajes. Ecos de las Brontë y du Maurier.';
  if (/cómico/.test(t))
    return 'Prosa cómica e irónica, con narrador socarrón que quiere a sus personajes pero no les perdona una. Ecos de Pratchett.';
  return 'Prosa de crónica histórica evocadora: mirada de historiador que sabe más de lo que cuenta, detalles concretos, tensión latente.';
}

// Resumen de lo jugado (diarios de sesión) para alimentar el capítulo.
function playedSummary(c) {
  const done = (c.sessions || []).filter((s) => (s.log || '').trim());
  if (!done.length) return '';
  return 'DIARIO DE LO JUGADO EN MESA (fuente principal de los hechos):\n' +
    done.map((s) => `Sesión ${s.number} — ${s.title}: ${s.log.trim()}`).join('\n');
}

export async function runChronicleChapter(c, opts = {}) {
  const prev = (c.chronicle?.chapters || []);
  const prevNote = prev.length
    ? `CAPÍTULOS YA ESCRITOS (no repitas lo narrado; continúa donde acaba el último):\n${prev.map((ch, i) => `${i + 1}. ${ch.title}${ch.summary ? ' — ' + ch.summary : ''}`).join('\n')}`
    : 'Aún no hay capítulos: este es el PRIMERO. Empieza por los orígenes (la cronología previa) y llega hasta donde arranca la historia presente.';
  const style = c.chronicle?.style || suggestStyle(c);

  const narr = (opts.narration || '').trim();
  const narrNote = narr
    ? `NARRACIÓN DEL DIRECTOR (dictada; ES LA FUENTE PRINCIPAL de los hechos de este capítulo${opts.sessionLabel ? ` — corresponde a ${opts.sessionLabel}` : ''}; es lenguaje hablado: extrae los hechos, no imites su registro):\n"${narr}"\n\n`
    : '';
  const user = `Estado de la campaña:\n\n${buildContext(c)}\n\n${playedSummary(c)}\n\n${narrNote}${prevNote}\n\n` +
    `ESTILO DE PROSA (obligatorio): ${style}\n\n` +
    `Escribe el siguiente capítulo de la CRÓNICA de esta campaña: un libro de historia narrativa del mundo, escrito por un cronista experto. Reglas:\n` +
    `1. Es PROSA LITERARIA continua (600-900 palabras), no una lista ni un resumen: escenas, imágenes, transiciones. Párrafos separados por líneas en blanco.\n` +
    `2. Nárralo desde DENTRO del mundo: el cronista no sabe de "jugadores" ni "sesiones"; cuenta hechos, rumores y testimonios.\n` +
    `3. Usa los NOMBRES exactos de lugares, personas y facciones de la campaña. Concreto, nunca vago.\n` +
    `4. ${narr ? 'La NARRACIÓN DEL DIRECTOR es el corazón del capítulo: novela ESOS hechos, cosiéndolos con el lore existente.' : 'Si hay diario de lo jugado, esos hechos son el corazón del capítulo. Si no, narra el trasfondo (cronología) hacia el presente.'}\n` +
    `5. NO REVELES la verdad oculta ni secretos no revelados en mesa: el cronista puede insinuar, extrañarse, dejar cabos... pero no confirmar.\n` +
    `6. Cierra el capítulo con una nota que pida seguir leyendo.\n\n` +
    `Devuelve SOLO un objeto JSON: { "title": "título del capítulo", "text": "la prosa completa, con \\n\\n entre párrafos", "summary": "resumen de 1-2 frases de lo narrado (para continuidad interna)" }`;

  const { text } = await callClaude({
    system: 'Eres un escritor literario experto que redacta crónicas de mundos de campaña. Tu prosa es de calidad editorial y se adapta con precisión al estilo pedido. Respondes en español, solo JSON.',
    userPrompt: user, maxTokens: 4000, temperature: 0.9,
  });
  return extractJSON(text);
}

export function applyChapter(c, ch) {
  c.chronicle = c.chronicle || { style: '', chapters: [] };
  if (!c.chronicle.style) c.chronicle.style = suggestStyle(c);
  c.chronicle.chapters.push({ id: newId('ch'), title: ch.title || 'Capítulo', text: ch.text || '', summary: ch.summary || '' });
  return c;
}

// Revisa el libro ENTERO: reordena si hace falta, corrige contradicciones y
// saltos entre capítulos, y suaviza las transiciones. Devuelve el libro revisado.
export async function runHarmonize(c) {
  const chs = c.chronicle?.chapters || [];
  if (chs.length < 2) throw new Error('Hacen falta al menos 2 capítulos para armonizar.');
  const style = c.chronicle?.style || suggestStyle(c);
  const book = chs.map((ch, i) => `### CAPÍTULO ${i + 1}: ${ch.title}\n${ch.text}`).join('\n\n');
  const user = `Estado de la campaña (la fuente de verdad sobre nombres y hechos):\n\n${buildContext(c)}\n\n` +
    `EL LIBRO ACTUAL, CAPÍTULO A CAPÍTULO:\n\n${book}\n\n` +
    `ESTILO DE PROSA (obligatorio): ${style}\n\n` +
    `Revisa el libro COMPLETO como un editor literario:\n` +
    `1. Si algún capítulo está fuera de orden cronológico, REORDÉNALO.\n` +
    `2. Corrige contradicciones entre capítulos y con el lore (nombres, hechos, quién estaba dónde).\n` +
    `3. Suaviza las transiciones entre capítulos y cose los saltos (si falta un puente, escríbelo breve dentro del capítulo siguiente).\n` +
    `4. CONSERVA la prosa buena: retoca lo necesario, no reescribas por reescribir. Mantén la extensión aproximada de cada capítulo.\n` +
    `5. No reveles la verdad oculta ni secretos no revelados.\n\n` +
    `Devuelve SOLO un objeto JSON con el libro entero revisado y en orden final:\n` +
    `{ "chapters": [ { "title": "", "text": "prosa con \\n\\n entre párrafos", "summary": "1-2 frases" } ] }`;
  const { text } = await callClaude({
    system: 'Eres un editor literario experto. Revisas libros por capítulos manteniendo la voz del autor y la coherencia interna. Respondes en español, solo JSON.',
    userPrompt: user, maxTokens: 8000, temperature: 0.6,
  });
  return extractJSON(text);
}

export function applyHarmonize(c, p) {
  const chs = (p.chapters || []).filter((x) => x && x.text);
  if (!chs.length) throw new Error('La revisión llegó vacía; no se ha tocado nada.');
  c.chronicle.chapters = chs.map((ch) => ({ id: newId('ch'), title: ch.title || 'Capítulo', text: ch.text, summary: ch.summary || '' }));
  return c;
}

export function chronicleToMarkdown(c) {
  const chs = c.chronicle?.chapters || [];
  const L = [`# Crónica de ${c.name || 'la campaña'}`, ''];
  chs.forEach((ch, i) => { L.push(`## ${i + 1}. ${ch.title}`); L.push(''); L.push(ch.text); L.push(''); });
  return L.join('\n');
}
