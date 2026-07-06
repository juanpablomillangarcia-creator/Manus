// ============================================================================
//  COLUMNA GENERATIVA · Ejecutor
//  runStage         → una propuesta
//  runStageOptions  → N opciones distintas para que el DM elija
//  applyStage       → mapea una propuesta (ya elegida/editada) al modelo
//  Ambos reintentan una vez pidiendo JSON estricto si el primer intento no parsea.
// ============================================================================

import { callClaude, extractJSON } from '../ai/client.js';
import { getStage, singleUser, optionsUser, isProposalEmpty } from './stages.js';

const STRICT = '\n\nIMPORTANTE: devuelve JSON ESTRICTO y válido: comillas dobles, sin comas finales, sin comentarios y sin ningún texto fuera del objeto.';

async function callParse(stage, buildUser, maxTokens) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    // temperatura alta para creatividad/variedad; baja un poco en el reintento estricto
    const temperature = attempt > 0 ? 0.5 : (stage.temperature ?? 0.9);
    const { text } = await callClaude({ system: stage.system, userPrompt: buildUser(attempt > 0), maxTokens, temperature });
    try { return extractJSON(text); }
    catch (e) { lastErr = e; }
  }
  throw new Error('La IA devolvió un formato no válido tras reintentar. ' + (lastErr?.message || ''));
}

export async function runStage(stageId, campaign, extra = '') {
  const stage = getStage(stageId);
  if (!stage) throw new Error(`Etapa desconocida: ${stageId}`);
  const proposal = await callParse(stage, (strict) => singleUser(stage, campaign, extra + (strict ? STRICT : '')), stage.maxTokens || 1500);
  if (isProposalEmpty(stageId, proposal)) throw new Error('La IA devolvió una respuesta vacía o incompleta (posible corte). Prueba a generar de nuevo.');
  return { proposal };
}

export async function runStageOptions(stageId, campaign, n = 3, extra = '') {
  const stage = getStage(stageId);
  if (!stage) throw new Error(`Etapa desconocida: ${stageId}`);
  const cap = Math.min(Math.round((stage.maxTokens || 1500) * 2.4) + 400 * n, 8000);
  const parsed = await callParse(stage, (strict) => optionsUser(stage, campaign, n, extra + (strict ? STRICT : '')), cap);
  const options = Array.isArray(parsed.options) ? parsed.options : [parsed];
  const incomplete = options.map((o) => isProposalEmpty(stageId, o));
  if (incomplete.every(Boolean)) throw new Error('La IA devolvió las opciones vacías o incompletas (posible corte). Prueba a generar de nuevo.');
  return { options, incomplete };
}

export function applyStage(stageId, campaign, proposal) {
  const stage = getStage(stageId);
  stage.apply(campaign, proposal);
  campaign.stageStatus = { ...campaign.stageStatus, [stageId]: 'done' };
  return campaign;
}
