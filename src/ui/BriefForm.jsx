import React, { useState } from 'react';
import AutoTextarea from './AutoTextarea.jsx';
import { ARCHETYPE_LIST, ARCHETYPES } from '../model/archetypes.js';
import { newCampaign } from '../model/schema.js';

const TONES = ['Épico', 'Horror / lovecraftiano', 'Terror psicológico', 'Misterio', 'Noir / detectivesco', 'Político / intriga', 'Dungeon / exploración', 'Grimdark', 'Fantasía oscura', 'Épica trágica', 'Aventura pulp', 'Espada y brujería', 'Piratas / náutico', 'Western sobrenatural', 'Gótico romántico', 'Supervivencia', 'Bélico', 'Cómico', 'Sandbox'];

export default function BriefForm({ onCreate, onCancel }) {
  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState('short-arc');
  const [tones, setTones] = useState([]);
  const [seed, setSeed] = useState('');
  const [players, setPlayers] = useState(4);
  const [levelFrom, setLevelFrom] = useState(ARCHETYPES['short-arc'].defaults.scale.levelFrom);
  const [levelTo, setLevelTo] = useState(ARCHETYPES['short-arc'].defaults.scale.levelTo);
  const [sessions, setSessions] = useState(ARCHETYPES['short-arc'].defaults.scale.sessions);
  const [linesAndVeils, setLV] = useState('');
  const [system, setSystem] = useState('agnostic');

  const pickArchetype = (id) => {
    setArchetype(id);
    const d = ARCHETYPES[id].defaults.scale;
    setSessions(d.sessions); setLevelFrom(d.levelFrom); setLevelTo(d.levelTo);
  };
  const toggleTone = (t) => setTones((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]);
  const [customTone, setCustomTone] = useState('');
  const addCustomTone = () => { const t = customTone.trim(); if (t && !tones.includes(t)) setTones((ts) => [...ts, t]); setCustomTone(''); };

  const create = () => {
    const camp = newCampaign({
      name: name.trim() || 'Campaña sin título',
      archetype, tones, seed: seed.trim(), system,
      scale: { sessions: Number(sessions) || 1, levelFrom: Number(levelFrom) || 1, levelTo: Number(levelTo) || 1 },
      table: { players: Number(players) || 4, expectations: '', linesAndVeils: linesAndVeils.trim() },
    });
    onCreate(camp);
  };

  return (
    <div>
      <div className="eyebrow">Etapa 0 · El brief</div>
      <h2>De qué va tu campaña</h2>
      <p className="muted small">Esto alimenta toda la columna generativa. Cuanto más concreto, mejor teje la app.</p>

      <div className="card">
        <div className="field">
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Las mareas de Puerto Vísceras" />
        </div>

        <div className="field">
          <label>Tipo de campaña</label>
          <div className="row">
            {ARCHETYPE_LIST.map((a) => (
              <button key={a.id} className={archetype === a.id ? 'primary' : ''} onClick={() => pickArchetype(a.id)} title={a.desc}>{a.label}</button>
            ))}
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>{ARCHETYPES[archetype].desc}</div>
        </div>

        <div className="field">
          <label>Tono (uno o varios)</label>
          <div className="row">
            {TONES.map((t) => (
              <button key={t} className={tones.includes(t) ? 'primary' : ''} onClick={() => toggleTone(t)}>{t}</button>
            ))}
            {tones.filter((t) => !TONES.includes(t)).map((t) => (
              <button key={t} className="primary" onClick={() => toggleTone(t)}>{t} ×</button>
            ))}
            <span className="row" style={{ gap: 6 }}>
              <input value={customTone} onChange={(e) => setCustomTone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomTone()} placeholder="tono propio…" style={{ width: 140 }} />
              <button className="ghost small" onClick={addCustomTone}>+ Añadir</button>
            </span>
          </div>
        </div>

        <div className="grid2">
          <div className="field"><label>Sesiones estimadas</label><input type="number" min="1" value={sessions} onChange={(e) => setSessions(e.target.value)} /></div>
          <div className="field"><label>Jugadores</label><input type="number" min="1" value={players} onChange={(e) => setPlayers(e.target.value)} /></div>
          <div className="field"><label>Nivel inicial</label><input type="number" min="1" value={levelFrom} onChange={(e) => setLevelFrom(e.target.value)} /></div>
          <div className="field"><label>Nivel final</label><input type="number" min="1" value={levelTo} onChange={(e) => setLevelTo(e.target.value)} /></div>
        </div>

        <div className="field">
          <label>Sistema</label>
          <div className="row">
            <button className={system === 'agnostic' ? 'primary' : ''} onClick={() => setSystem('agnostic')}>Agnóstico</button>
            <button className={system === '5e' ? 'primary' : ''} onClick={() => setSystem('5e')}>D&D 5e</button>
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>El núcleo es agnóstico; 5e añade la balanza de encuentros (XP/CR). Puedes cambiarlo luego.</div>
        </div>

        <div className="field">
          <label>Semilla (opcional): una frase, una imagen, un "quiero algo como…"</label>
          <AutoTextarea value={seed} onChange={setSeed} ph="Un pueblo pesquero que adora algo dormido bajo el mar; tono de terror lento." />
        </div>

        <div className="field">
          <label>Líneas y velos / seguridad (opcional)</label>
          <AutoTextarea value={linesAndVeils} onChange={setLV} ph="Temas a evitar o tratar con cuidado en la mesa." />
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onCancel}>Cancelar</button>
          <button className="primary" onClick={create}>Crear y abrir la columna →</button>
        </div>
      </div>
    </div>
  );
}
