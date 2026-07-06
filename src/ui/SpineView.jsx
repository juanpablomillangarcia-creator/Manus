import React, { useState } from 'react';
import { stagesFor } from '../model/archetypes.js';
import { STAGES } from '../spine/stages.js';
import { runStage, applyStage } from '../spine/generate.js';
import { verify } from '../ai/coherence.js';
import { hasApiKey } from '../ai/config.js';
import StagePanel from './StagePanel.jsx';
import EncounterBuilder from './EncounterBuilder.jsx';

export default function SpineView({ campaign, update, openAISettings, extStage }) {
  const [weaving, setWeaving] = useState(false);
  const [weaveMsg, setWeaveMsg] = useState('');
  const stageIds = stagesFor(campaign.archetype);
  const issues = verify(campaign);

  // "Tejer todo": encadena las etapas pendientes y autoacepta (primer borrador).
  const weaveAll = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    const coll = { premise: null, world: 'places', factions: 'factions', cast: 'npcs', arcs: 'arcs', mysteries: 'mysteries', clocks: 'clocks', sessions: 'sessions', hooks: 'pcs' };
    const hasData = (id) => id === 'premise' ? !!campaign.premise : ((campaign[coll[id]] || []).length > 0);
    const todo = stageIds.filter((id) => !hasData(id));
    if (todo.length === 0) {
      alert('Ya está todo tejido. Usa "↻ Re-tejer" en una etapa para rehacerla, o "Generar" / "3 opciones" para añadir más.');
      return;
    }

    setWeaving(true);
    const failed = []; let okCount = 0;
    try {
      let working = { ...campaign };
      for (const id of todo) {
        setWeaveMsg(`Tejiendo: ${STAGES[id].label}…`);
        try {
          const { proposal } = await runStage(id, working);
          working = applyStage(id, structuredClone(working), proposal);
          update(working);
          okCount++;
        } catch (e) {
          failed.push(STAGES[id].label);
        }
      }
      setWeaveMsg('');
      let msg = `Tejido completado: ${okCount} etapa(s) generada(s).`;
      if (failed.length) msg += `\nNo salieron (genéralas a mano con su botón): ${failed.join(', ')}.`;
      alert(msg);
    } catch (e) {
      alert('Se detuvo el tejido: ' + e.message);
    } finally {
      setWeaving(false);
    }
  };

  return (
    <div>
      <div className="eyebrow">{campaign.archetype}</div>
      <input
        value={campaign.name}
        onChange={(e) => update((c) => ({ ...c, name: e.target.value }))}
        style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--display)', border: 'none', padding: '4px 0', background: 'transparent' }}
      />
      {campaign.pitch && <p className="muted" style={{ fontStyle: 'italic', marginTop: 0 }}>{campaign.pitch}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="small muted">
            {campaign.scale?.sessions} sesión(es) · niveles {campaign.scale?.levelFrom}–{campaign.scale?.levelTo}
            {campaign.tones?.length ? ' · ' + campaign.tones.join(', ') : ''}
          </div>
          <button className="primary" disabled={weaving} onClick={weaveAll} title="Genera con IA, en orden, las etapas que aún estén vacías, usando lo ya creado como contexto.">
            {weaving ? (weaveMsg || 'Tejiendo…') : '✦ Tejer todo'}
          </button>
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>
          "Tejer todo" rellena con IA las etapas vacías de un tirón (necesita tu clave de IA). Para rehacer una ya hecha, usa "↻ Re-tejer" en esa etapa.
        </div>
        {!hasApiKey() && (
          <div className="small muted" style={{ marginTop: 8 }}>
            La generación con IA necesita tu clave. <a onClick={openAISettings} style={{ cursor: 'pointer' }}>Configúrala aquí</a>. Todo lo manual funciona sin ella.
          </div>
        )}
        {campaign.system !== '5e' && (
          <div className="small" style={{ marginTop: 8 }}>
            <button className="ghost" onClick={() => update((c) => ({ ...c, system: '5e' }))}>+ Activar módulo 5e (balanza de encuentros)</button>
          </div>
        )}
      </div>

      {campaign.system === '5e' && (
        <div style={{ marginBottom: 16 }}>
          <EncounterBuilder campaign={campaign} update={update} openAISettings={openAISettings} />
        </div>
      )}

      {issues.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Verificador de coherencia</div>
          <div className="issues">
            {issues.map((it, i) => (
              <div key={i} className={'issue ' + it.level}>{it.level === 'warn' ? '⚠ ' : '· '}{it.text}</div>
            ))}
          </div>
        </div>
      )}

      {stageIds.map((id) => (
        <StagePanel key={id} stageId={id} campaign={campaign} update={update} openAISettings={openAISettings} forceOpen={extStage?.stage === id ? extStage.n : null} />
      ))}
    </div>
  );
}
