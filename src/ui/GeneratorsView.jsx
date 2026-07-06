import React, { useState } from 'react';
import { CULTURES, genName, genTown, genRiver, genTavern, genTrinket, genRumor, genNPC, genHook, genLoot, genMagicItem, genTrait, genVoice, genMotivation, genWeather, genAmbience, genFaction, genDeity, genArtifact, genOmen, genComplication, genCurse, genShip, genDistrict, genDyingWords, genBeast, genOath, rollTable, TABLE_KEYS, sample } from '../model/generators.js';
import { newNPC, newPlace, newFaction } from '../model/schema.js';
import { callClaude, extractJSON } from '../ai/client.js';
import { hasApiKey } from '../ai/config.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

function GenCard({ title, hint, onGen, count = 8, children, onSave, saveLabel }) {
  const [items, setItems] = useState([]);
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="eyebrow">{title}</div>
      {hint && <div className="small muted" style={{ marginTop: 2 }}>{hint}</div>}
      <div className="row" style={{ margin: '8px 0', flexWrap: 'wrap', gap: 8 }}>
        {children}
        <button className="primary" onClick={() => setItems(sample(onGen, count))}>Generar</button>
      </div>
      {items.map((it, i) => (
        <div className="row" key={i} style={{ justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--line-soft)', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ flex: 1, lineHeight: 1.5 }}>{it}</span>
          <div className="row" style={{ gap: 4, flexShrink: 0 }}>
            <button className="ghost small" onClick={() => navigator.clipboard?.writeText(it)}>copiar</button>
            {onSave && <button className="ghost small" onClick={() => onSave(it)}>{saveLabel}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignTable({ t }) {
  const [rolled, setRolled] = useState([]);
  const roll = () => { const e = t.entries || []; if (e.length) setRolled((r) => [e[Math.floor(Math.random() * e.length)], ...r].slice(0, 6)); };
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="eyebrow">{t.title}</div>
        <button className="primary small" onClick={roll}>Tirar</button>
      </div>
      {rolled.map((r, i) => <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid var(--line-soft)', opacity: i === 0 ? 1 : 0.55, lineHeight: 1.5 }}>{r}</div>)}
      <details style={{ marginTop: 8 }}>
        <summary className="small muted" style={{ cursor: 'pointer' }}>ver las {(t.entries || []).length} entradas</summary>
        <ol style={{ margin: '6px 0 0', paddingLeft: 20 }}>{(t.entries || []).map((e, i) => <li key={i} className="small" style={{ marginBottom: 3, lineHeight: 1.45 }}>{e}</li>)}</ol>
      </details>
    </div>
  );
}

export default function GeneratorsView({ campaign, update, openAISettings }) {
  const [culture, setCulture] = useState('fantasia');
  const [flash, setFlash] = useState('');
  const note = (t) => { setFlash(t); setTimeout(() => setFlash(''), 1800); };

  const addNPC = (name) => { update((c) => ({ ...c, npcs: [...c.npcs, newNPC({ name, source: 'gen' })] })); note(`"${name}" → NPC`); };
  const addNPCFull = (text) => { const [name, ...rest] = String(text).split(','); update((c) => ({ ...c, npcs: [...c.npcs, newNPC({ name: name.trim(), summary: rest.join(',').trim(), source: 'gen' })] })); note('NPC añadido al lore'); };
  const addPlace = (name, kind) => { update((c) => ({ ...c, places: [...c.places, newPlace({ name, kind, source: 'gen' })] })); note(`"${name}" → Lugar`); };
  const addFaction = (name) => { update((c) => ({ ...c, factions: [...c.factions, newFaction({ name, source: 'gen' })] })); note(`"${name}" → Facción`); };

  // IA
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiItems, setAiItems] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
  const PRESETS = ['10 nombres de tabernas', '8 NPCs con un secreto', '6 ganchos de aventura', '8 rumores de taberna', 'una tabla de 8 eventos de viaje', '10 objetos mágicos menores', '8 nombres de barcos', '6 cultos extraños'];
  const SEEDS = ['evita los clichés y los nombres más obvios', 'varía la longitud, el ritmo y el origen de cada uno', 'que no empiecen todos por el mismo sonido o letra', 'mezcla registros: ásperos, suaves, extraños, mundanos', 'sorpréndeme, huye de lo esperable', 'que cada uno evoque una imagen distinta'];
  const genAI = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    if (!aiPrompt.trim()) return;
    setAiBusy(true); setAiItems([]);
    try {
      const tone = (campaign.tones || []).join(', ') || 'fantasía';
      const { text } = await callClaude({
        system: 'Eres un generador creativo para mesas de rol. Devuelves listas MUY variadas y evocadoras, sin caer en patrones repetidos ni en los tópicos más manidos. Cada elemento debe diferenciarse de los demás en estructura, sonido y registro. Respondes solo con JSON.',
        userPrompt: `Tono de la campaña: ${tone}. Premisa: ${campaign.premise || '—'}.\nGenera: ${aiPrompt.trim()}.\nDirectriz de variedad: ${pick(SEEDS)}.\nDevuelve 12-15 elementos claramente distintos entre sí. SOLO JSON: { "items": ["...", "..."] }`,
        maxTokens: 1200, temperature: 1,
      });
      const j = extractJSON(text);
      setAiItems([...new Set(Array.isArray(j.items) ? j.items : [])]);
    } catch (e) { alert('Error: ' + e.message); }
    finally { setAiBusy(false); }
  };

  const [lastRoll, setLastRoll] = useState({});

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Generadores</h2>
        {flash && <span className="badge done">{flash}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16, alignItems: 'start' }}>
        <GenCard title="Nombres de persona" onGen={() => genName(culture)} onSave={addNPC} saveLabel="→ NPC">
          <select value={culture} onChange={(e) => setCulture(e.target.value)}>{CULTURES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </GenCard>
        <GenCard title="NPC al vuelo" hint="Nombre, oficio, rasgo y un secreto." count={6} onGen={genNPC} onSave={addNPCFull} saveLabel="→ NPC" />
        <GenCard title="Pueblos y ciudades" onGen={genTown} onSave={(n) => addPlace(n, 'Asentamiento')} saveLabel="→ Lugar" />
        <GenCard title="Ríos" onGen={genRiver} onSave={(n) => addPlace(n, 'Río')} saveLabel="→ Lugar" />
        <GenCard title="Tabernas" onGen={genTavern} onSave={(n) => addPlace(n, 'Taberna')} saveLabel="→ Lugar" />
        <GenCard title="Ganchos de aventura" count={5} onGen={genHook} />
        <GenCard title="Rumores" count={6} onGen={genRumor} />
        <GenCard title="Baratijas y objetos curiosos" onGen={genTrinket} />
        <GenCard title="Botín con carácter" onGen={genLoot} />
        <GenCard title="Objetos mágicos menores" count={6} onGen={genMagicItem} />
        <GenCard title="Chispa de personaje" hint="Rasgo, voz y motivación." count={6} onGen={() => `${genTrait()}. ${genVoice()}. Le mueve ${genMotivation().toLowerCase()}.`} />
        <GenCard title="Facciones y cultos" onGen={genFaction} onSave={addFaction} saveLabel="→ Facción" />
        <GenCard title="Deidades y entidades" count={6} onGen={genDeity} onSave={addFaction} saveLabel="→ Facción" />
        <GenCard title="Artefactos con nombre" onGen={genArtifact} />
        <GenCard title="Bestias y horrores" hint="Una criatura descrita al vuelo." count={5} onGen={genBeast} />
        <GenCard title="Presagios" count={6} onGen={genOmen} />
        <GenCard title="Complicaciones y giros" count={6} onGen={genComplication} />
        <GenCard title="Maldiciones" count={6} onGen={genCurse} />
        <GenCard title="Distritos y calles" onGen={genDistrict} onSave={(n) => addPlace(n, 'Distrito')} saveLabel="→ Lugar" />
        <GenCard title="Barcos" onGen={genShip} onSave={(n) => addPlace(n, 'Barco')} saveLabel="→ Lugar" />
        <GenCard title="Últimas palabras" count={6} onGen={genDyingWords} />
        <GenCard title="Juramentos" onGen={genOath} />
        <GenCard title="Clima y atmósfera" onGen={() => (Math.random() < 0.5 ? genWeather() : genAmbience())} />

        <div className="card" style={{ marginBottom: 12 }}>
          <div className="eyebrow">Tablas de eventos</div>
          <div className="small muted" style={{ marginTop: 2 }}>Tira un imprevisto al vuelo.</div>
          <div className="row" style={{ margin: '8px 0', flexWrap: 'wrap', gap: 4 }}>
            {TABLE_KEYS.map((k) => <button key={k} onClick={() => setLastRoll((r) => ({ ...r, [k]: rollTable(k) }))}>{k}</button>)}
          </div>
          {Object.entries(lastRoll).map(([k, v]) => v && <div key={k} className="small" style={{ padding: '4px 0', borderBottom: '1px solid var(--line)' }}><strong>{k}:</strong> {v}</div>)}
        </div>
      </div>

      {(campaign.tables || []).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="eyebrow lore-section">Tablas de la casa · de esta campaña</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16, alignItems: 'start' }}>
            {campaign.tables.map((t) => <CampaignTable key={t.id} t={t} />)}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Generar con IA (al tono de la campaña)</div>
        <div className="small muted" style={{ marginTop: 2 }}>Cada tirada usa temperatura alta y una directriz de variedad distinta para evitar repetirse.</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 4, margin: '8px 0' }}>
          {PRESETS.map((p) => <button key={p} className="ghost small" onClick={() => setAiPrompt(p)}>{p}</button>)}
        </div>
        <div className="row">
          <input style={{ flex: 1 }} placeholder="¿Qué genero? p. ej. 10 nombres de barcos piratas" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && genAI()} />
          <button className="primary" disabled={aiBusy} onClick={genAI}>{aiBusy ? '…' : '✦ Generar'}</button>
        </div>
        {aiItems.map((it, i) => (
          <div className="row" key={i} style={{ justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--line-soft)', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ flex: 1, lineHeight: 1.5 }}>{it}</span>
            <div className="row" style={{ gap: 4, flexShrink: 0 }}>
              <button className="ghost small" onClick={() => navigator.clipboard?.writeText(it)}>copiar</button>
              <button className="ghost small" onClick={() => addNPC(it)}>→ NPC</button>
              <button className="ghost small" onClick={() => addPlace(it, '')}>→ Lugar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
