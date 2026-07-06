// ============================================================================
//  IA · Configuración
//  La clave es del propio usuario y vive SOLO en su navegador (como ARCANUM).
// ============================================================================

const CFG_KEY = 'ce.ai.config.v1';

export const AI_MODELS = {
  haiku:  { id: 'claude-haiku-4-5-20251001',  name: 'Haiku 4.5',  priceIn: 1.0,  priceOut: 5.0,  desc: 'Rápido y barato — generación en masa' },
  sonnet: { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5', priceIn: 3.0,  priceOut: 15.0, desc: 'Calidad superior — casos complejos' },
};

const state = { apiKey: '', model: 'haiku', imageKey: '', imageProvider: 'openai' };

export function loadAIConfig() {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      state.apiKey = c.apiKey || '';
      state.model = c.model || 'haiku';
      state.imageKey = c.imageKey || '';
      state.imageProvider = c.imageProvider || 'openai';
    }
  } catch {}
  return { ...state };
}

export function saveAIConfig({ apiKey, model, imageKey, imageProvider }) {
  if (apiKey !== undefined) state.apiKey = apiKey.trim();
  if (model !== undefined) state.model = model;
  if (imageKey !== undefined) state.imageKey = imageKey.trim();
  if (imageProvider !== undefined) state.imageProvider = imageProvider;
  try { localStorage.setItem(CFG_KEY, JSON.stringify(state)); } catch {}
  return { ...state };
}

export const getAIConfig = () => ({ ...state });
export const hasApiKey = () => !!state.apiKey && state.apiKey.startsWith('sk-ant-');
export const hasImageKey = () => !!state.imageKey;
export function estimatedCost(model = state.model) {
  return model === 'haiku' ? '~$0.01' : '~$0.04';
}
