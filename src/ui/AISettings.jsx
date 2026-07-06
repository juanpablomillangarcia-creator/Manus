import React, { useState } from 'react';
import { getAIConfig, saveAIConfig, AI_MODELS } from '../ai/config.js';

export default function AISettings({ onClose }) {
  const cfg = getAIConfig();
  const [key, setKey] = useState(cfg.apiKey);
  const [model, setModel] = useState(cfg.model);
  const [imageKey, setImageKey] = useState(cfg.imageKey || '');

  const save = () => {
    if (key && !key.startsWith('sk-ant-')) { alert('La clave debe empezar por "sk-ant-".'); return; }
    saveAIConfig({ apiKey: key, model, imageKey, imageProvider: 'openai' });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow">Configuración</div>
        <h2>Conexión con Claude</h2>
        <p className="small muted">
          La generación con IA usa tu propia clave de Anthropic. Se guarda <strong>solo en tu navegador</strong>
          {' '}y se envía únicamente a Anthropic cuando generas algo. Consíguela en{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a>.
        </p>

        <div className="field">
          <label>Clave de API (empieza por "sk-ant-...")</label>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..." autoComplete="off" />
        </div>

        <div className="field">
          <label>Modelo por defecto</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {Object.entries(AI_MODELS).map(([id, m]) => (
              <option key={id} value={id}>{m.name} — {m.desc}</option>
            ))}
          </select>
        </div>

        <div className="small muted">Coste aproximado por generación: ~$0.01 con Haiku, ~$0.04 con Sonnet.</div>

        <h2 style={{ marginTop: 20 }}>Generación de mapas (imágenes)</h2>
        <p className="small muted">
          Claude no dibuja imágenes, así que los mapas se generan con un modelo de imagen aparte
          (<strong>OpenAI · gpt-image-1</strong>, el que mejor sigue instrucciones y rotula texto).
          Pega tu clave de OpenAI; se guarda solo en tu navegador. Coste orientativo: ~$0.04–0.17 por mapa.
        </p>
        <div className="field">
          <label>Clave de OpenAI (empieza por "sk-...")</label>
          <input type="password" value={imageKey} onChange={(e) => setImageKey(e.target.value)} placeholder="sk-..." autoComplete="off" />
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
