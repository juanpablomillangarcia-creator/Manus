import React, { useState } from 'react';
import { CR_LIST, evaluateEncounter, crToXp, DIFFICULTY_COLOR } from '../model/dnd5e.js';
import { newEncounter, newId } from '../model/schema.js';
import { callClaude, extractJSON } from '../ai/client.js';
import { hasApiKey } from '../ai/config.js';

export default function EncounterBuilder({ campaign, update, openAISettings }) {
  const [partySize, setPartySize] = useState(campaign.pcs?.length || campaign.table?.players || 4);
  const [partyLevel, setPartyLevel] = useState(campaign.scale?.levelFrom || 1);
  const [monsters, setMonsters] = useState([]);
  const [name, setName] = useState('');
  const [cr, setCr] = useState('1');
  const [encName, setEncName] = useState('');
  const [target, setTarget] = useState('Media');
  const [busy, setBusy] = useState(false);

  const levels = Array.from({ length: Math.max(1, Number(partySize) || 1) }, () => Number(partyLevel) || 1);
  const evalr = evaluateEncounter(levels, monsters);

  const addMonster = () => { if (!name.trim()) return; setMonsters((m) => [...m, { id: newId('mon'), name: name.trim(), cr }]); setName(''); };
  const delMonster = (id) => setMonsters((m) => m.filter((x) => x.id !== id));

  const save = () => {
    if (!monsters.length) return;
    const enc = newEncounter({ name: encName.trim() || `Encuentro (${evalr.difficulty})`, monsters });
    update((c) => ({ ...c, encounters: [...(c.encounters || []), enc] }));
    setEncName('');
  };
  const loadEnc = (e) => setMonsters(e.monsters.map((m) => ({ ...m, id: newId('mon') })));
  const delEnc = (id) => update((c) => ({ ...c, encounters: (c.encounters || []).filter((e) => e.id !== id) }));

  const suggest = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    setBusy(true);
    try {
      const tone = (campaign.tones || []).join(', ') || 'fantasía';
      const { text } = await callClaude({
        system: 'Eres un DM experto de D&D 5e. Diseñas encuentros de combate temáticos y equilibrados. Respondes en español, solo JSON.',
        userPrompt: `Sugiere un encuentro de combate de dificultad "${target}" para ${partySize} PJ de nivel ${partyLevel}, en el tono: ${tone}. ` +
          `Premisa: ${campaign.premise || '—'}.\nDevuelve SOLO JSON: { "monsters": [ { "name": "", "cr": "1/4|1/2|1|2|…" } ] } con CR válidos de 5e.`,
        maxTokens: 700,
      });
      const j = extractJSON(text);
      if (Array.isArray(j.monsters)) setMonsters(j.monsters.map((m) => ({ id: newId('mon'), name: m.name || 'Enemigo', cr: CR_LIST.includes(String(m.cr)) ? String(m.cr) : '1' })));
    } catch (e) { alert('Error al sugerir: ' + e.message); }
    finally { setBusy(false); }
  };

  const Bar = () => {
    const b = evalr.budget;
    const marks = [['Fácil', b.easy], ['Media', b.medium], ['Difícil', b.hard], ['Mortal', b.deadly]];
    return (
      <div className="small muted" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
        {marks.map(([k, v]) => <span key={k}>{k}: {v} XP</span>)}
      </div>
    );
  };

  return (
    <div className="card" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="eyebrow">Módulo 5e · Balanza de encuentros</div>
        <button className="ghost small" onClick={() => update((c) => ({ ...c, system: 'agnostic' }))}>Desactivar 5e</button>
      </div>

      <div className="row" style={{ gap: 16, marginTop: 8 }}>
        <div className="field" style={{ width: 130 }}><label>Nº de PJs</label><input type="number" min="1" value={partySize} onChange={(e) => setPartySize(e.target.value)} /></div>
        <div className="field" style={{ width: 130 }}><label>Nivel del grupo</label><input type="number" min="1" max="20" value={partyLevel} onChange={(e) => setPartyLevel(e.target.value)} /></div>
      </div>

      <label>Enemigos</label>
      {monsters.map((m) => (
        <div className="row" key={m.id} style={{ alignItems: 'center', marginBottom: 4 }}>
          <span style={{ flex: 1 }}>{m.name}</span>
          <span className="small muted">CR {m.cr} · {crToXp(m.cr)} XP</span>
          <button className="danger" onClick={() => delMonster(m.id)}>×</button>
        </div>
      ))}
      <div className="row" style={{ marginTop: 6 }}>
        <input style={{ flex: 1 }} placeholder="Nombre del enemigo" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMonster()} />
        <select style={{ width: 110 }} value={cr} onChange={(e) => setCr(e.target.value)}>
          {CR_LIST.map((c) => <option key={c} value={c}>CR {c}</option>)}
        </select>
        <button onClick={addMonster}>Añadir</button>
      </div>

      <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#fafafa', border: '1px solid var(--line)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong style={{ color: DIFFICULTY_COLOR[evalr.difficulty] }}>{evalr.difficulty}</strong>
          <span className="small muted">{evalr.adjustedXP} XP ajustada (x{evalr.multiplier}) · {evalr.rawXP} XP base</span>
        </div>
        <Bar />
      </div>

      <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
        <button disabled={busy} onClick={suggest}>{busy ? '…' : '✦ Sugerir encuentro'}</button>
        <select style={{ width: 120 }} value={target} onChange={(e) => setTarget(e.target.value)}>
          {['Fácil', 'Media', 'Difícil', 'Mortal'].map((d) => <option key={d}>{d}</option>)}
        </select>
        <div className="row">
          <input style={{ width: 160 }} placeholder="Nombre del encuentro" value={encName} onChange={(e) => setEncName(e.target.value)} />
          <button className="primary" onClick={save} disabled={!monsters.length}>Guardar</button>
        </div>
      </div>

      {(campaign.encounters || []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="eyebrow">Encuentros guardados</div>
          {campaign.encounters.map((e) => (
            <div className="row" key={e.id} style={{ justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span>{e.name} <span className="small muted">· {e.monsters.length} enemigos</span></span>
              <div className="row">
                <button className="ghost small" onClick={() => loadEnc(e)}>Cargar</button>
                <button className="danger" onClick={() => delEnc(e.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
