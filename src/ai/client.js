// ============================================================================
//  IA · Cliente
//  Llamada directa a la API de Anthropic desde el navegador, con la clave del
//  usuario (mismo enfoque que ARCANUM). Devuelve { text, usage }.
// ============================================================================

import { getAIConfig, AI_MODELS } from './config.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude({ system, userPrompt, maxTokens = 1500, model, temperature }) {
  const cfg = getAIConfig();
  if (!cfg.apiKey) throw new Error('Falta la clave de API. Configúrala en Ajustes de IA.');
  const modelId = AI_MODELS[model || cfg.model].id;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      // necesario para llamar a Anthropic desde el navegador con la clave del usuario
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      ...(typeof temperature === 'number' ? { temperature } : {}),
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const j = await res.json(); msg = j.error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return { text, usage: data.usage };
}

// Extrae el primer objeto JSON de una respuesta. Tolera ```fences```, preámbulos,
// comas finales y JSON TRUNCADO (cierra lo que quedó abierto, descartando el
// último elemento incompleto), que es lo que ocurre cuando el modelo se corta.
export function extractJSON(text) {
  if (!text) throw new Error('Respuesta vacía.');
  let t = text.replace(/```json|```/g, '').trim();
  const start = t.indexOf('{');
  if (start === -1) throw new Error('La respuesta no contenía JSON.');
  const end = t.lastIndexOf('}');
  const slice = end > start ? t.slice(start, end + 1) : t.slice(start);

  // 1) directo
  try { return JSON.parse(slice); } catch {}

  // 2) comas finales / objetos pegados
  const cleaned = slice.replace(/,\s*([\]}])/g, '$1').replace(/}\s*{/g, '},{');
  try { return JSON.parse(cleaned); } catch {}

  // 3) truncado: recortar al último cierre completo y equilibrar los brackets
  try { return JSON.parse(repairTruncated(slice)); } catch (e) {
    throw new Error('JSON no recuperable: ' + e.message);
  }
}

function repairTruncated(s) {
  // localizar el último '}' o ']' a tope de estructura (fuera de string)
  let inStr = false, esc = false, lastClose = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '}' || ch === ']') lastClose = i;
  }
  if (lastClose < 0) throw new Error('sin cierres');
  let cut = s.slice(0, lastClose + 1);

  // recomputar qué brackets siguen abiertos en el recorte y cerrarlos
  inStr = false; esc = false; const stack = [];
  for (let i = 0; i < cut.length; i++) {
    const ch = cut[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }
  cut = cut.replace(/,\s*$/, '');
  while (stack.length) cut += (stack.pop() === '{' ? '}' : ']');
  return cut;
}
