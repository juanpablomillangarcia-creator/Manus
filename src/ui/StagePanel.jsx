import React, { useState, useEffect, useRef } from 'react';
import { STAGES } from '../spine/stages.js';
import { runStage, runStageOptions, applyStage } from '../spine/generate.js';
import { isProposalEmpty } from '../spine/stages.js';
import { hasApiKey, estimatedCost } from '../ai/config.js';
import { newPlace, newFaction, newNPC, newArc, newSession, newMystery, newPC, newClock, newId, newEvent, newThreat, newTable } from '../model/schema.js';
import SecretsEditor from './SecretsEditor.jsx';
import AutoTextarea from './AutoTextarea.jsx';

// Todos los campos de texto crecen para mostrar TODO el contenido (sin recortes
// ni scroll). Solo los numéricos siguen siendo input de una línea.
function T({ label, value, onChange, ph, type = 'text', w }) {
  return (
    <div className="field" style={{ width: w }}>
      {label && <label>{label}</label>}
      {type === 'number'
        ? <input type="number" value={value ?? ''} placeholder={ph} onChange={(e) => onChange(e.target.value)} />
        : <AutoTextarea value={value} onChange={onChange} ph={ph} />}
    </div>
  );
}

const COLL = { world: 'places', timeline: 'timeline', factions: 'factions', cast: 'npcs', bestiary: 'bestiary', tables: 'tables', arcs: 'arcs', sessions: 'sessions', mysteries: 'mysteries', clocks: 'clocks', hooks: 'pcs' };
const FACTORY = { places: newPlace, timeline: newEvent, factions: newFaction, npcs: newNPC, bestiary: newThreat, tables: newTable, arcs: newArc, sessions: newSession, mysteries: newMystery, clocks: newClock, pcs: newPC };

function summarize(p) {
  const out = [];
  if (p.pitch) out.push(`“${p.pitch}”`);
  else if (p.premise) out.push(p.premise.slice(0, 120));
  if (p.themes?.length) out.push('Temas: ' + p.themes.join(', '));
  if (p.places?.length) out.push('Lugares: ' + p.places.map((x) => x.name).filter(Boolean).join(' · '));
  if (p.factions?.length) out.push('Facciones: ' + p.factions.map((x) => x.name).filter(Boolean).join(' · '));
  if (p.npcs?.length) out.push('NPCs: ' + p.npcs.map((x) => x.name).filter(Boolean).join(' · '));
  if (p.arcs?.length) out.push('Arcos: ' + p.arcs.map((x) => x.name).filter(Boolean).join(' · '));
  if (p.sessions?.length) out.push('Sesiones: ' + p.sessions.map((x) => x.title).filter(Boolean).join(' · '));
  if (p.mysteries?.length) out.push('Misterios: ' + p.mysteries.map((x) => `${x.name} (${(x.clues || []).length} pistas)`).join(' · '));
  if (p.events?.length) out.push('Cronología: ' + p.events.map((x) => x.title).filter(Boolean).join(' · '));
  if (p.threats?.length) out.push('Bestiario: ' + p.threats.map((x) => x.name).filter(Boolean).join(', '));
  if (p.tables?.length) out.push('Tablas: ' + p.tables.map((x) => x.title).filter(Boolean).join(', '));
  if (p.core) out.push('Verdad oculta: ' + p.core.slice(0, 140));
  if (p.clocks?.length) out.push('Relojes: ' + p.clocks.map((x) => `${x.name} (${x.segments})`).join(' · '));
  if (p.hooks?.length) out.push('Ganchos: ' + p.hooks.map((x) => x.pc).filter(Boolean).join(' · '));
  return out;
}

function HouseTable({ t, onEdit, onDel }) {
  const [rolled, setRolled] = useState(null);
  const entries = t.entries || [];
  return (
    <div className="item">
      <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}><T label="Título de la tabla" value={t.title} onChange={(v) => onEdit({ title: v })} /></div>
        {entries.length > 0 && <button className="primary small" style={{ marginBottom: 16 }} onClick={() => setRolled(entries[Math.floor(Math.random() * entries.length)])}>Tirar</button>}
      </div>
      {rolled && <div className="readbox">{rolled}</div>}
      {entries.map((e, i) => (
        <div className="row" key={i} style={{ marginBottom: 6, alignItems: 'flex-start' }}>
          <span className="small muted" style={{ width: 20, textAlign: 'right', marginTop: 10 }}>{i + 1}</span>
          <div style={{ flex: 1 }}><AutoTextarea value={e} onChange={(v) => onEdit({ entries: entries.map((x, k) => k === i ? v : x) })} /></div>
          <button className="danger" onClick={() => onEdit({ entries: entries.filter((_, k) => k !== i) })}>×</button>
        </div>
      ))}
      <button className="ghost small" onClick={() => onEdit({ entries: [...entries, ''] })}>+ Entrada</button>
      <div className="item-actions"><button className="danger" onClick={onDel}>Eliminar tabla</button></div>
    </div>
  );
}

export default function StagePanel({ stageId, campaign, update, openAISettings, forceOpen }) {
  const stage = STAGES[stageId];
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!forceOpen) return;
    setOpen(true);
    const t = setTimeout(() => rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    return () => clearTimeout(t);
  }, [forceOpen]);
  const [busy, setBusy] = useState('');
  const [options, setOptions] = useState(null);
  const [drafts, setDrafts] = useState(null);
  const [replaceMode, setReplaceMode] = useState(false);

  const collKey = COLL[stageId];
  const hasData = stageId === 'premise' ? !!campaign.premise
    : stageId === 'truth' ? !!(campaign.truth && campaign.truth.core)
    : (campaign[collKey]?.length > 0);
  const status = campaign.stageStatus?.[stageId] === 'done' || hasData ? 'done' : 'empty';

  const editItem = (key, id, patch) => update((c) => ({ ...c, [key]: c[key].map((x) => x.id === id ? { ...x, ...patch } : x) }));
  const addItem = (key) => update((c) => ({ ...c, [key]: [...c[key], FACTORY[key]()] }));
  const delItem = (key, id) => update((c) => ({ ...c, [key]: c[key].filter((x) => x.id !== id) }));
  const hiddenBtn = (key, e) => (
    <button onClick={() => editItem(key, e.id, { hidden: !e.hidden })} style={{ fontSize: 12, color: e.hidden ? 'var(--danger)' : 'var(--muted)' }}>
      {e.hidden ? '◉ Oculto a jugadores' : '○ Visible a jugadores'}
    </button>
  );

  const guard = () => { if (!hasApiKey()) { openAISettings(); return false; } return true; };

  const applyProposal = (proposal, replace) => {
    update((c) => {
      const base = structuredClone(c);
      if (replace && collKey) base[collKey] = [];
      return applyStage(stageId, base, proposal);
    });
    setOptions(null); setDrafts(null); setIncomplete(null); setReplaceMode(false); setOpen(true);
  };
  const useOption = (i) => {
    let proposal;
    try { proposal = JSON.parse(drafts[i]); }
    catch (e) { alert('El JSON editado no es válido: ' + e.message); return; }
    applyProposal(proposal, replaceMode);
  };

  const genOne = async () => {
    if (!guard()) return;
    setBusy('one'); setOptions(null); setDrafts(null); setReplaceMode(false);
    try { const { proposal } = await runStage(stageId, campaign); applyProposal(proposal, false); }
    catch (e) { alert('Error al generar: ' + e.message); }
    finally { setBusy(''); }
  };
  const [incomplete, setIncomplete] = useState(null); // paralelo a options: true si llegó vacía/cortada
  const genOptions = async (reweave = false) => {
    if (!guard()) return;
    setBusy(reweave ? 'rew' : 'opts'); setOptions(null); setDrafts(null); setIncomplete(null);
    const extra = reweave
      ? 'IMPORTANTE: ten en cuenta lo YA revelado en mesa y las sesiones ya jugadas. Propón una versión revisada que REEMPLACE el contenido actual de esta etapa, sin contradecir lo ya jugado.'
      : '';
    try {
      const { options, incomplete } = await runStageOptions(stageId, campaign, 3, extra);
      setOptions(options); setDrafts(options.map((o) => JSON.stringify(o, null, 2))); setIncomplete(incomplete); setReplaceMode(reweave); setOpen(true);
    } catch (e) { alert('Error al generar opciones: ' + e.message); }
    finally { setBusy(''); }
  };
  const regenOne = async (i) => {
    if (!guard()) return;
    setBusy('opt' + i);
    try {
      const { proposal } = await runStage(stageId, campaign, replaceMode ? 'IMPORTANTE: ten en cuenta lo YA revelado en mesa y las sesiones ya jugadas. Propón una versión revisada que REEMPLACE el contenido actual de esta etapa, sin contradecir lo ya jugado.' : '');
      setOptions((o) => o.map((x, k) => k === i ? proposal : x));
      setDrafts((d) => d.map((x, k) => k === i ? JSON.stringify(proposal, null, 2) : x));
      setIncomplete((inc) => inc.map((x, k) => k === i ? isProposalEmpty(stageId, proposal) : x));
    } catch (e) { alert('Error al regenerar: ' + e.message); }
    finally { setBusy(''); }
  };

  return (
    <div className="stage" ref={rootRef}>
      <div className="stage-head" onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="stage-title">{open ? '▾ ' : '▸ '}{stage.label}</div>
          <div className="stage-desc">{stage.desc}</div>
        </div>
        <div className="row" onClick={(e) => e.stopPropagation()}>
          {collKey && (campaign[collKey]?.length || 0) > 0 && <span className="chip">{campaign[collKey].length}</span>}
          <span className={'badge ' + (status === 'done' ? 'done' : '')}>{status === 'done' ? 'hecho' : 'vacío'}</span>
          {hasData && collKey && <button onClick={() => genOptions(true)} disabled={!!busy} title="Regenerar respetando lo ya jugado">{busy === 'rew' ? '…' : '↻ Re-tejer'}</button>}
          <button onClick={() => genOptions(false)} disabled={!!busy} title={`Genera 3 opciones (${estimatedCost()})`}>{busy === 'opts' ? '…' : '✦ 3 opciones'}</button>
          <button onClick={genOne} disabled={!!busy} title={`Genera y añade (${estimatedCost()})`}>{busy === 'one' ? '…' : 'Generar'}</button>
        </div>
      </div>

      {(open || options) && (
        <div className="stage-body">
          {options && (
            <div style={{ paddingTop: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{replaceMode ? 'Elige el reemplazo' : 'Elige una opción'} ({stage.optionLabel})</strong>
                <button onClick={() => { setOptions(null); setDrafts(null); setIncomplete(null); }}>Descartar</button>
              </div>
              {replaceMode && <div className="small" style={{ color: 'var(--warn)', margin: '4px 0' }}>Al usar una, sustituirá el contenido actual de esta etapa.</div>}
              {options.map((opt, i) => {
                const broken = incomplete?.[i];
                const summ = summarize(opt);
                return (
                  <div className="proposal" key={i} style={broken ? { borderColor: 'var(--danger)' } : undefined}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="badge ai">{replaceMode ? 'Reemplazo' : 'Opción'} {i + 1}</span>
                      <div className="row">
                        {broken && <button disabled={!!busy} onClick={() => regenOne(i)}>{busy === 'opt' + i ? '…' : '↻ Regenerar esta'}</button>}
                        <button className="primary" disabled={broken} title={broken ? 'Llegó incompleta: regenérala antes de usarla' : ''} onClick={() => useOption(i)}>Usar esta</button>
                      </div>
                    </div>
                    {broken ? (
                      <div className="small" style={{ marginTop: 8, color: 'var(--danger)' }}>⚠ Esta opción llegó vacía o cortada (fallo puntual de la IA). Dale a «Regenerar esta».</div>
                    ) : (
                      <div className="small" style={{ marginTop: 8 }}>
                        {summ.map((line, k) => <div key={k} style={{ marginBottom: 3 }}>{line}</div>)}
                      </div>
                    )}
                    <details>
                      <summary className="small muted" style={{ cursor: 'pointer', marginTop: 6 }}>editar antes de aceptar</summary>
                      <AutoTextarea mono value={drafts?.[i] ?? ''} onChange={(v) => setDrafts((d) => d.map((x, k) => k === i ? v : x))} style={{ marginTop: 6 }} />
                    </details>
                  </div>
                );
              })}
            </div>
          )}

          {stageId === 'premise' && (
            <div style={{ paddingTop: 12 }}>
              <T label="Premisa" area value={campaign.premise} onChange={(v) => update((c) => ({ ...c, premise: v }))} ph="El conflicto central, en 2-3 frases." />
              <T label="Pitch (una línea)" value={campaign.pitch} onChange={(v) => update((c) => ({ ...c, pitch: v }))} />
              <T label="Temas (separados por comas)" value={(campaign.themes || []).join(', ')} onChange={(v) => update((c) => ({ ...c, themes: v.split(',').map((s) => s.trim()).filter(Boolean) }))} />
            </div>
          )}

          {stageId === 'truth' && (() => {
            const t = campaign.truth || { core: '', revelations: [], foreshadow: [] };
            const setT = (patch) => update((c) => ({ ...c, truth: { ...(c.truth || { core: '', revelations: [], foreshadow: [] }), ...patch } }));
            return (
              <div style={{ paddingTop: 12 }}>
                <T label="La verdad de fondo (solo DJ)" area value={t.core} onChange={(v) => setT({ core: v })} ph="Qué está pasando realmente por debajo de todo." />
                <label style={{ marginTop: 4 }}>Orden de revelación</label>
                {(t.revelations || []).map((r, i) => (
                  <div className="item" key={r.id || i}>
                    <div className="grid2">
                      <T label={`Hito ${i + 1}: qué comprenden`} value={r.what} onChange={(v) => setT({ revelations: t.revelations.map((x, k) => k === i ? { ...x, what: v } : x) })} />
                      <T label="Cómo/cuándo aflora" value={r.how} onChange={(v) => setT({ revelations: t.revelations.map((x, k) => k === i ? { ...x, how: v } : x) })} />
                    </div>
                    <div className="item-actions"><button className="danger" onClick={() => setT({ revelations: t.revelations.filter((_, k) => k !== i) })}>Quitar hito</button></div>
                  </div>
                ))}
                <button className="small" style={{ marginTop: 6 }} onClick={() => setT({ revelations: [...(t.revelations || []), { id: 'rev_' + Date.now(), what: '', how: '' }] })}>+ Hito de revelación</button>
                <div style={{ marginTop: 14 }}>
                  <label>Cómo sembrarlo pronto</label>
                  {(t.foreshadow || []).map((f, i) => (
                    <div className="row" key={i} style={{ marginBottom: 6, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}><AutoTextarea value={f} onChange={(v) => setT({ foreshadow: t.foreshadow.map((x, k) => k === i ? v : x) })} /></div>
                      <button className="danger" onClick={() => setT({ foreshadow: t.foreshadow.filter((_, k) => k !== i) })}>×</button>
                    </div>
                  ))}
                  <button className="ghost small" onClick={() => setT({ foreshadow: [...(t.foreshadow || []), ''] })}>+ Añadir</button>
                </div>
              </div>
            );
          })()}

          {stageId === 'world' && (
            <div style={{ paddingTop: 12 }}>
              <T label="Cosmología" area value={campaign.cosmology} onChange={(v) => update((c) => ({ ...c, cosmology: v }))} />
              {campaign.places.map((p) => (
                <div className="item" key={p.id}>
                  <div className="grid2">
                    <T label="Nombre" value={p.name} onChange={(v) => editItem('places', p.id, { name: v })} />
                    <T label="Tipo" value={p.kind} onChange={(v) => editItem('places', p.id, { kind: v })} />
                  </div>
                  <T label="Resumen" value={p.summary} onChange={(v) => editItem('places', p.id, { summary: v })} />
                  <T label="Ambiente (sensorial)" area value={p.ambience} onChange={(v) => editItem('places', p.id, { ambience: v })} />
                  <SecretsEditor secrets={p.secrets} onChange={(secrets) => editItem('places', p.id, { secrets })} />
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                    {hiddenBtn('places', p)}
                    <button className="danger" onClick={() => delItem('places', p.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
              <button style={{ marginTop: 8 }} onClick={() => addItem('places')}>+ Lugar</button>
            </div>
          )}

          {stageId === 'factions' && (
            <div style={{ paddingTop: 12 }}>
              {campaign.factions.map((f) => (
                <div className="item" key={f.id}>
                  <T label="Nombre" value={f.name} onChange={(v) => editItem('factions', f.id, { name: v })} />
                  <T label="Objetivo" area value={f.goal} onChange={(v) => editItem('factions', f.id, { goal: v })} />
                  <div className="grid2">
                    <T label="Recursos" value={f.resources} onChange={(v) => editItem('factions', f.id, { resources: v })} />
                    <T label="Influencia" value={f.influence} onChange={(v) => editItem('factions', f.id, { influence: v })} />
                  </div>
                  <SecretsEditor secrets={f.secrets} onChange={(secrets) => editItem('factions', f.id, { secrets })} />
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                    {hiddenBtn('factions', f)}
                    <button className="danger" onClick={() => delItem('factions', f.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
              <button style={{ marginTop: 8 }} onClick={() => addItem('factions')}>+ Facción</button>
            </div>
          )}

          {stageId === 'cast' && (
            <div style={{ paddingTop: 12 }}>
              {campaign.npcs.map((n) => (
                <div className="item" key={n.id}>
                  <div className="grid2">
                    <T label="Nombre" value={n.name} onChange={(v) => editItem('npcs', n.id, { name: v })} />
                    <T label="Rol" value={n.role} onChange={(v) => editItem('npcs', n.id, { role: v })} />
                  </div>
                  <T label="Objetivo" value={n.goal} onChange={(v) => editItem('npcs', n.id, { goal: v })} />
                  <div className="grid2">
                    <T label="Voz / manierismo" value={n.voice} onChange={(v) => editItem('npcs', n.id, { voice: v })} />
                    <T label="Vínculo" value={n.bond} onChange={(v) => editItem('npcs', n.id, { bond: v })} />
                  </div>
                  <SecretsEditor secrets={n.secrets} onChange={(secrets) => editItem('npcs', n.id, { secrets })} />
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                    {hiddenBtn('npcs', n)}
                    <button className="danger" onClick={() => delItem('npcs', n.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
              <button style={{ marginTop: 8 }} onClick={() => addItem('npcs')}>+ NPC</button>
            </div>
          )}

          {stageId === 'arcs' && (
            <div style={{ paddingTop: 12 }}>
              {campaign.arcs.map((a) => (
                <div className="item" key={a.id}>
                  <T label="Nombre del arco" value={a.name} onChange={(v) => editItem('arcs', a.id, { name: v })} />
                  <T label="Premisa" area value={a.premise} onChange={(v) => editItem('arcs', a.id, { premise: v })} />
                  <T label="Clímax" area value={a.climax} onChange={(v) => editItem('arcs', a.id, { climax: v })} />
                  <T label="Cómo se avanza" value={a.advanceWhen} onChange={(v) => editItem('arcs', a.id, { advanceWhen: v })} />
                  <div className="item-actions"><button className="danger" onClick={() => delItem('arcs', a.id)}>Eliminar</button></div>
                </div>
              ))}
              <button style={{ marginTop: 8 }} onClick={() => addItem('arcs')}>+ Arco</button>
            </div>
          )}

          {stageId === 'timeline' && (
            <div>
              {(campaign.timeline || []).map((ev) => (
                <div className="item" key={ev.id}>
                  <div className="grid2">
                    <T label="Cuándo" value={ev.when} onChange={(v) => editItem('timeline', ev.id, { when: v })} />
                    <T label="Título" value={ev.title} onChange={(v) => editItem('timeline', ev.id, { title: v })} />
                  </div>
                  <T label="Qué pasó" value={ev.what} onChange={(v) => editItem('timeline', ev.id, { what: v })} />
                  <T label="Consecuencia en el presente" value={ev.consequence} onChange={(v) => editItem('timeline', ev.id, { consequence: v })} />
                  <div className="item-actions"><button className="danger" onClick={() => delItem('timeline', ev.id)}>Eliminar suceso</button></div>
                </div>
              ))}
              <button style={{ marginTop: 8 }} onClick={() => addItem('timeline')}>+ Suceso</button>
            </div>
          )}
          {stageId === 'bestiary' && (
            <div>
              {(campaign.bestiary || []).map((t) => (
                <div className="item" key={t.id}>
                  <div className="grid2">
                    <T label="Nombre" value={t.name} onChange={(v) => editItem('bestiary', t.id, { name: v })} />
                    <T label="Naturaleza (qué es)" value={t.nature} onChange={(v) => editItem('bestiary', t.id, { nature: v })} />
                  </div>
                  <T label="Descripción" value={t.description} onChange={(v) => editItem('bestiary', t.id, { description: v })} />
                  <div className="grid2">
                    <T label="Tácticas" value={t.tactics} onChange={(v) => editItem('bestiary', t.id, { tactics: v })} />
                    <T label="Debilidad / límite" value={t.weakness} onChange={(v) => editItem('bestiary', t.id, { weakness: v })} />
                  </div>
                  <T label="Gancho (cómo entra en juego)" value={t.hook} onChange={(v) => editItem('bestiary', t.id, { hook: v })} />
                  <div className="item-actions row" style={{ justifyContent: 'space-between' }}>{hiddenBtn('bestiary', t)}<button className="danger" onClick={() => delItem('bestiary', t.id)}>Eliminar amenaza</button></div>
                </div>
              ))}
              <button style={{ marginTop: 8 }} onClick={() => addItem('bestiary')}>+ Amenaza</button>
            </div>
          )}

          {stageId === 'tables' && (
            <div>
              {(campaign.tables || []).map((t) => <HouseTable key={t.id} t={t} onEdit={(patch) => editItem('tables', t.id, patch)} onDel={() => delItem('tables', t.id)} />)}
              <button style={{ marginTop: 8 }} onClick={() => addItem('tables')}>+ Tabla</button>
            </div>
          )}

          {stageId === 'mysteries' && (
            <div style={{ paddingTop: 12 }}>
              {campaign.mysteries.map((m) => {
                const enough = (m.clues || []).length >= 3;
                const setClues = (clues) => editItem('mysteries', m.id, { clues });
                return (
                  <div className="item" key={m.id}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <strong>Misterio</strong>
                      <span className="badge" style={{ color: enough ? 'var(--ok)' : 'var(--warn)', borderColor: enough ? 'var(--ok)' : 'var(--warn)' }}>
                        {enough ? `${m.clues.length} pistas` : `faltan ${3 - (m.clues || []).length} pistas`}
                      </span>
                    </div>
                    <T label="Nombre" value={m.name} onChange={(v) => editItem('mysteries', m.id, { name: v })} />
                    <T label="Conclusión (qué deben deducir)" area value={m.conclusion} onChange={(v) => editItem('mysteries', m.id, { conclusion: v })} />
                    <label>Pistas (regla de las tres)</label>
                    {(m.clues || []).map((cl) => (
                      <div className="row" key={cl.id} style={{ alignItems: 'flex-start', marginBottom: 6 }}>
                        <button title={cl.found ? 'Descubierta' : 'Sin descubrir'} onClick={() => setClues(m.clues.map((x) => x.id === cl.id ? { ...x, found: !x.found } : x))} style={{ minWidth: 34 }}>{cl.found ? '✓' : '○'}</button>
                        <div style={{ flex: 2 }}><AutoTextarea ph="La pista…" value={cl.text} onChange={(v) => setClues(m.clues.map((x) => x.id === cl.id ? { ...x, text: v } : x))} /></div>
                        <input style={{ flex: 1 }} placeholder="¿dónde?" value={cl.location} onChange={(e) => setClues(m.clues.map((x) => x.id === cl.id ? { ...x, location: e.target.value } : x))} />
                        <button className="danger" onClick={() => setClues(m.clues.filter((x) => x.id !== cl.id))}>×</button>
                      </div>
                    ))}
                    <button onClick={() => setClues([...(m.clues || []), { id: newId('clue'), text: '', location: '', found: false }])}>+ Pista</button>
                    <div style={{ marginTop: 8 }}>
                      <T label="Pistas falsas / señuelos (separadas por comas)" value={(m.redHerrings || []).join(', ')} onChange={(v) => editItem('mysteries', m.id, { redHerrings: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
                    </div>
                    <div className="item-actions"><button className="danger" onClick={() => delItem('mysteries', m.id)}>Eliminar misterio</button></div>
                  </div>
                );
              })}
              <button style={{ marginTop: 8 }} onClick={() => addItem('mysteries')}>+ Misterio</button>
            </div>
          )}

          {stageId === 'clocks' && (
            <div style={{ paddingTop: 12 }}>
              {campaign.clocks.map((k) => {
                const facNames = (k.linkedIds || []).map((id) => campaign.factions.find((f) => f.id === id)?.name).filter(Boolean);
                const setFilled = (n) => editItem('clocks', k.id, { filled: Math.max(0, Math.min(k.segments, n)) });
                return (
                  <div className="item" key={k.id}>
                    <T label="Nombre del reloj" value={k.name} onChange={(v) => editItem('clocks', k.id, { name: v })} />
                    <div className="row" style={{ alignItems: 'center', margin: '6px 0' }}>
                      <span className="small muted">Segmentos:</span>
                      {[4, 6, 8, 10, 12].map((seg) => (
                        <button key={seg} className={k.segments === seg ? 'primary' : ''} style={{ padding: '4px 9px' }}
                          onClick={() => editItem('clocks', k.id, { segments: seg, filled: Math.min(k.filled, seg) })}>{seg}</button>
                      ))}
                    </div>
                    <div className="row" style={{ alignItems: 'center', gap: 4 }}>
                      <span className="small muted" style={{ marginRight: 4 }}>{k.filled}/{k.segments}</span>
                      {Array.from({ length: k.segments }).map((_, i) => (
                        <button key={i} title={`Marcar ${i + 1}`} onClick={() => setFilled(k.filled === i + 1 ? i : i + 1)}
                          style={{ width: 22, height: 22, padding: 0, borderRadius: 4, background: i < k.filled ? 'var(--warn)' : 'var(--panel)', borderColor: i < k.filled ? 'var(--warn)' : 'var(--line)' }} />
                      ))}
                    </div>
                    <T label="Al completarse" area value={k.trigger} onChange={(v) => editItem('clocks', k.id, { trigger: v })} />
                    {facNames.length > 0 && <div className="small muted">Facción: {facNames.join(', ')}</div>}
                    <div className="item-actions"><button className="danger" onClick={() => delItem('clocks', k.id)}>Eliminar</button></div>
                  </div>
                );
              })}
              <button style={{ marginTop: 8 }} onClick={() => addItem('clocks')}>+ Reloj</button>
            </div>
          )}

          {stageId === 'hooks' && (
            <div style={{ paddingTop: 12 }}>
              <div className="small muted" style={{ marginBottom: 8 }}>Añade tus PJs y genera un gancho personal para cada uno (o deja que la IA proponga un grupo de ejemplo).</div>
              {campaign.pcs.map((p) => (
                <div className="item" key={p.id}>
                  <div className="grid2">
                    <T label="PJ" value={p.name} onChange={(v) => editItem('pcs', p.id, { name: v })} />
                    <T label="Concepto" value={p.concept} onChange={(v) => editItem('pcs', p.id, { concept: v })} />
                  </div>
                  <T label="Gancho personal a la trama" area value={p.hook} onChange={(v) => editItem('pcs', p.id, { hook: v })} />
                  <div className="item-actions"><button className="danger" onClick={() => delItem('pcs', p.id)}>Eliminar</button></div>
                </div>
              ))}
              <button style={{ marginTop: 8 }} onClick={() => addItem('pcs')}>+ PJ</button>
            </div>
          )}

          {stageId === 'sessions' && (
            <div style={{ paddingTop: 12 }}>
              {campaign.sessions.map((s) => (
                <div className="item" key={s.id}>
                  <div className="grid2">
                    <T label="Nº" type="number" value={s.number} onChange={(v) => editItem('sessions', s.id, { number: Number(v) || s.number })} />
                    <T label="Título" value={s.title} onChange={(v) => editItem('sessions', s.id, { title: v })} />
                  </div>
                  <T label="Objetivo" area value={s.objective} onChange={(v) => editItem('sessions', s.id, { objective: v })} />
                  {(s.scenes || []).length > 0 && (
                    <div className="small muted" style={{ marginTop: 4 }}>Escenas: {s.scenes.map((sc) => sc.title).filter(Boolean).join(' · ')}</div>
                  )}
                  <div className="item-actions"><button className="danger" onClick={() => delItem('sessions', s.id)}>Eliminar</button></div>
                </div>
              ))}
              <button style={{ marginTop: 8 }} onClick={() => addItem('sessions')}>+ Sesión</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
