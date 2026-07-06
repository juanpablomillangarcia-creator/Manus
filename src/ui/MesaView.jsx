import React, { useState, useEffect } from 'react';
import AutoTextarea from './AutoTextarea.jsx';
import { newSession, newScene, newId } from '../model/schema.js';
import { runSessionDetail, applySessionDetail } from '../spine/sessionDetail.js';
import { hasApiKey } from '../ai/config.js';

const VISLABEL = { secret: 'Secreto', hinted: 'Insinuado', revealed: 'Revelado' };

function DiceBar() {
  const [rolls, setRolls] = useState([]);
  const roll = (sides) => {
    const v = 1 + Math.floor(Math.random() * sides);
    setRolls((r) => [{ sides, v, id: Date.now() }, ...r].slice(0, 8));
  };
  const last = rolls[0];
  return (
    <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div className="dicebar">
          {[4, 6, 8, 10, 12, 20, 100].map((d) => (
            <button key={d} onClick={() => roll(d)}>d{d}</button>
          ))}
        </div>
        <div className="dice-log">
          {last && (
            <span className={'dice-roll' + (last.sides === 20 && last.v === 20 ? ' crit' : '') + (last.sides === 20 && last.v === 1 ? ' fail' : '')}>
              d{last.sides} → <strong>{last.v}</strong>
            </span>
          )}
          {rolls.slice(1).map((r) => <span key={r.id} className="dice-old">d{r.sides}:{r.v}</span>)}
        </div>
      </div>
    </div>
  );
}

export default function MesaView({ campaign, update, openAISettings, extSession }) {
  const sessions = [...(campaign.sessions || [])].sort((a, b) => (b.number || 0) - (a.number || 0));
  const [selId, setSel] = useState(sessions[0]?.id || null);
  const [tab, setTab] = useState('prep');
  useEffect(() => { if (extSession) setSel(extSession.id); }, [extSession?.n]);
  const [busy, setBusy] = useState(false);
  const session = campaign.sessions.find((s) => s.id === selId) || null;

  const entities = [
    ...campaign.npcs.map((e) => ({ ...e, _kind: 'NPC' })),
    ...campaign.places.map((e) => ({ ...e, _kind: 'Lugar' })),
    ...campaign.factions.map((e) => ({ ...e, _kind: 'Facción' })),
  ];
  const findEntity = (id) => entities.find((e) => e.id === id);

  const ps = (fn) => update((c) => ({ ...c, sessions: c.sessions.map((s) => { if (s.id !== selId) return s; const ns = { ...s }; fn(ns); return ns; }) }));
  const setScene = (i, patch) => ps((s) => { s.scenes = s.scenes.map((sc, k) => k === i ? { ...sc, ...patch } : sc); });

  const genDetail = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    if (session.scenes.length && !confirm('Esto reemplazará las escenas actuales por un guion detallado generado. ¿Continuar?')) return;
    setBusy(true);
    try { const j = await runSessionDetail(session, campaign); update((c) => applySessionDetail(structuredClone(c), selId, j)); }
    catch (e) { alert('Error al generar el guion: ' + e.message); }
    finally { setBusy(false); }
  };

  const newSess = () => {
    const n = (campaign.sessions.reduce((m, s) => Math.max(m, s.number || 0), 0)) + 1;
    const s = newSession({ number: n, title: `Sesión ${n}` });
    update((c) => ({ ...c, sessions: [...c.sessions, s] }));
    setSel(s.id); setTab('prep');
  };

  const reveal = (eid, sid) => update((c) => {
    const flip = (arr) => arr.map((e) => e.id === eid ? { ...e, secrets: (e.secrets || []).map((x) => x.id === sid ? { ...x, visibility: 'revealed' } : x) } : e);
    return {
      ...c, npcs: flip(c.npcs), places: flip(c.places), factions: flip(c.factions),
      sessions: c.sessions.map((s) => s.id === selId
        ? { ...s, revealedThisSession: s.revealedThisSession.some((r) => r.secretId === sid) ? s.revealedThisSession : [...s.revealedThisSession, { entityId: eid, secretId: sid }] }
        : s),
    };
  });

  const setClock = (id, filled) => update((c) => ({ ...c, clocks: c.clocks.map((k) => k.id === id ? { ...k, filled: Math.max(0, Math.min(k.segments, filled)) } : k) }));

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Mesa</h2>
        <button className="primary" onClick={newSess}>+ Nueva sesión</button>
      </div>

      {sessions.length === 0 && <div className="card muted">Crea una sesión para preparar, dirigir y recapitular. Lo que reveles en mesa actualizará el lore.</div>}

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {sessions.map((s) => (
          <button key={s.id} className={selId === s.id ? 'primary' : ''} onClick={() => { setSel(s.id); setTab(s.status === 'done' ? 'recap' : s.status === 'live' ? 'run' : 'prep'); }}>
            #{s.number} {s.title} {s.status === 'live' ? '· en curso' : s.status === 'done' ? '· hecha' : ''}
          </button>
        ))}
      </div>

      {session && (
        <div className="card">
          <input value={session.title} onChange={(e) => ps((s) => (s.title = e.target.value))} style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--display)', border: 'none', background: 'transparent', padding: 0, marginBottom: 10 }} />
          <div className="tabs" style={{ marginBottom: 16 }}>
            {[['prep', 'Preparar'], ['run', 'Dirigir'], ['recap', 'Recapitular']].map(([k, l]) => (
              <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          <DiceBar />

          {(campaign.truth?.core || (campaign.timeline || []).length > 0 || (campaign.bestiary || []).length > 0) && (
            <details className="card" style={{ marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', fontFamily: 'var(--display)', letterSpacing: '.04em' }}>
                Chuleta del Director <span className="small muted">· trasfondo y verdad oculta — no mostrar a la mesa</span>
              </summary>
              <div style={{ marginTop: 14 }}>
                {campaign.truth?.core && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="eyebrow">La verdad oculta</div>
                    <p className="prose" style={{ marginTop: 6 }}>{campaign.truth.core}</p>
                    {(campaign.truth.revelations || []).length > 0 && (
                      <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                        {campaign.truth.revelations.map((r, i) => (
                          <li key={r.id || i} style={{ marginBottom: 6 }}><strong>{r.what}</strong>{r.how ? <span className="muted"> — {r.how}</span> : null}</li>
                        ))}
                      </ol>
                    )}
                    {(campaign.truth.foreshadow || []).length > 0 && (
                      <div className="small muted" style={{ marginTop: 8 }}>Sembrar: {campaign.truth.foreshadow.join(' · ')}</div>
                    )}
                  </div>
                )}
                {(campaign.timeline || []).length > 0 && (
                  <div>
                    <div className="eyebrow">Cronología</div>
                    <div style={{ marginTop: 6 }}>
                      {campaign.timeline.map((e, i) => (
                        <div key={e.id || i} className="rel">
                          <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                            {e.when && <span className="chip">{e.when}</span>}
                            <strong>{e.title}</strong>
                          </div>
                          {e.what && <div className="small" style={{ marginTop: 3 }}>{e.what}</div>}
                          {e.consequence && <div className="small muted" style={{ marginTop: 2 }}>→ {e.consequence}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(campaign.bestiary || []).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div className="eyebrow">Bestiario</div>
                    <div style={{ marginTop: 6 }}>
                      {campaign.bestiary.map((t, i) => (
                        <div key={t.id || i} className="rel">
                          <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                            <strong>{t.name}</strong>
                            {t.nature && <span className="chip">{t.nature}</span>}
                          </div>
                          {t.description && <div className="small" style={{ marginTop: 3 }}>{t.description}</div>}
                          {t.tactics && <div className="small muted" style={{ marginTop: 2 }}>Tácticas: {t.tactics}</div>}
                          {t.weakness && <div className="small" style={{ marginTop: 2, color: 'var(--accent)' }}>Debilidad: {t.weakness}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}

          {tab === 'prep' && (
            <div>
              <T label="Objetivo de la sesión" area value={session.objective} onChange={(v) => ps((s) => (s.objective = v))} />

              <div className="row" style={{ margin: '4px 0 10px' }}>
                <button className="primary" disabled={busy} onClick={genDetail}>{busy ? 'Generando guion…' : '✦ Generar guion detallado'}</button>
                <span className="small muted">Escenas con lugar, NPCs, complicaciones y texto de lectura, enlazadas a tu lore.</span>
              </div>

              <T label="Caja de lectura de apertura" area value={session.openingText} onChange={(v) => ps((s) => (s.openingText = v))} />

              <label>Escenario · entidades que pueden salir</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {session.stagedIds.map((id) => { const e = findEntity(id); return e ? (
                  <span key={id} className="badge">{e.name} <button className="danger" style={{ padding: 0, marginLeft: 4 }} onClick={() => ps((s) => (s.stagedIds = s.stagedIds.filter((x) => x !== id)))}>×</button></span>
                ) : null; })}
              </div>
              <Picker placeholder="+ Poner entidad en el escenario" options={entities.filter((e) => !session.stagedIds.includes(e.id))} onPick={(id) => ps((s) => s.stagedIds.push(id))} />

              <label style={{ marginTop: 12 }}>Escenas</label>
              {session.scenes.map((sc, i) => (
                <div className="item" key={sc.id}>
                  <input placeholder="Título de la escena" value={sc.title} onChange={(e) => setScene(i, { title: e.target.value })} />
                  <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <select value={sc.placeId || ''} onChange={(e) => setScene(i, { placeId: e.target.value || null })} style={{ flex: '1 1 160px' }}>
                      <option value="">— lugar —</option>
                      {campaign.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="row" style={{ flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {(sc.npcIds || []).map((id) => { const e = campaign.npcs.find((n) => n.id === id); return e ? (
                      <span key={id} className="badge">{e.name} <button className="danger" style={{ padding: 0, marginLeft: 4 }} onClick={() => setScene(i, { npcIds: sc.npcIds.filter((x) => x !== id) })}>×</button></span>
                    ) : null; })}
                    <Picker placeholder="+ NPC presente" options={campaign.npcs.filter((n) => !(sc.npcIds || []).includes(n.id)).map((n) => ({ ...n, _kind: 'NPC' }))} onPick={(id) => setScene(i, { npcIds: [...(sc.npcIds || []), id] })} />
                  </div>
                  {sc.npcNames && <input placeholder="otros presentes" value={sc.npcNames} onChange={(e) => setScene(i, { npcNames: e.target.value })} style={{ marginTop: 6 }} />}
                  <AutoTextarea ph="El nudo: qué ocurre aquí" value={sc.beat} onChange={(v) => setScene(i, { beat: v })} style={{ marginTop: 6 }} />
                  <details style={{ marginTop: 6 }}>
                    <summary className="small muted" style={{ cursor: 'pointer' }}>complicaciones · revelación · caja de lectura</summary>
                    <SceneList label="Complicaciones" items={sc.complications} onChange={(v) => setScene(i, { complications: v })} />
                    <AutoTextarea ph="Qué se puede revelar aquí" value={sc.reveal} onChange={(v) => setScene(i, { reveal: v })} style={{ marginTop: 6 }} />
                    <AutoTextarea ph="Caja de lectura (para leer en alto)" value={sc.readAloud} onChange={(v) => setScene(i, { readAloud: v })} style={{ marginTop: 6 }} />
                  </details>
                  <div className="item-actions"><button className="danger" onClick={() => ps((s) => (s.scenes = s.scenes.filter((x) => x.id !== sc.id)))}>Eliminar</button></div>
                </div>
              ))}
              <button onClick={() => ps((s) => s.scenes.push(newScene()))}>+ Escena</button>

              <label style={{ marginTop: 12 }}>Relojes a vigilar</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {session.watchedClockIds.map((id) => { const k = campaign.clocks.find((x) => x.id === id); return k ? (
                  <span key={id} className="badge">{k.name} {k.filled}/{k.segments} <button className="danger" style={{ padding: 0, marginLeft: 4 }} onClick={() => ps((s) => (s.watchedClockIds = s.watchedClockIds.filter((x) => x !== id)))}>×</button></span>
                ) : null; })}
              </div>
              <Picker placeholder="+ Vigilar un reloj" options={campaign.clocks.filter((k) => !session.watchedClockIds.includes(k.id))} onPick={(id) => ps((s) => s.watchedClockIds.push(id))} />

              {session.status === 'prep' && <div style={{ marginTop: 14 }}><button className="primary" onClick={() => { ps((s) => (s.status = 'live')); setTab('run'); }}>▶ Empezar la sesión</button></div>}
            </div>
          )}

          {tab === 'run' && (
            <div>
              {session.openingText && <div className="readbox">{session.openingText}</div>}
              <label>Escenas</label>
              {session.scenes.length === 0 && <div className="small muted">Sin escenas previstas. Improvisa con red.</div>}
              {session.scenes.map((sc, i) => {
                const place = campaign.places.find((p) => p.id === sc.placeId);
                const npcs = (sc.npcIds || []).map((id) => campaign.npcs.find((n) => n.id === id)).filter(Boolean);
                return (
                  <div className="item" key={sc.id} style={{ opacity: sc.done ? 0.55 : 1 }}>
                    <div className="row" style={{ alignItems: 'flex-start' }}>
                      <button onClick={() => setScene(i, { done: !sc.done })} style={{ minWidth: 32 }}>{sc.done ? '✓' : '○'}</button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{sc.title || `Escena ${i + 1}`}</strong>
                        {(place || npcs.length || sc.npcNames) && <div className="small muted">{[place && place.name, npcs.map((n) => n.name).join(', '), sc.npcNames].filter(Boolean).join(' · ')}</div>}
                        {sc.beat && <div className="small" style={{ marginTop: 4 }}>{sc.beat}</div>}
                        {sc.readAloud && <div className="readbox">{sc.readAloud}</div>}
                        {(sc.complications || []).length > 0 && <div className="small" style={{ marginTop: 4 }}><em className="muted">Complicaciones:</em><ul style={{ margin: '2px 0 0 16px', padding: 0 }}>{sc.complications.map((c, k) => <li key={k}>{c}</li>)}</ul></div>}
                        {sc.reveal && <div className="small" style={{ marginTop: 4 }}><em className="muted">Puede revelarse:</em> {sc.reveal}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}

              <label style={{ marginTop: 12 }}>Escenario · revelar de un toque</label>
              {session.stagedIds.length === 0 && <div className="small muted">Nada en el escenario.</div>}
              {session.stagedIds.map((id) => {
                const e = findEntity(id); if (!e) return null;
                const hidden = (e.secrets || []).filter((s) => s.visibility !== 'revealed');
                return (
                  <div className="item" key={id}>
                    <strong>{e.name}</strong> <span className="small muted">· {e._kind}</span>
                    {hidden.length === 0 && <div className="small muted">Sin secretos por revelar.</div>}
                    {hidden.map((s) => (
                      <div className="row" key={s.id} style={{ alignItems: 'center', marginTop: 6 }}>
                        <span className="small" style={{ flex: 1 }}>{s.text} <em className="muted">({VISLABEL[s.visibility]})</em></span>
                        <button onClick={() => reveal(id, s.id)}>Revelar</button>
                      </div>
                    ))}
                  </div>
                );
              })}

              {session.watchedClockIds.length > 0 && (
                <>
                  <label style={{ marginTop: 12 }}>Relojes</label>
                  {session.watchedClockIds.map((id) => { const k = campaign.clocks.find((x) => x.id === id); return k ? (
                    <div className="row" key={id} style={{ alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ flex: 1 }}>{k.name}</span>
                      <button onClick={() => setClock(k.id, k.filled - 1)}>−</button>
                      <span className="small muted">{k.filled}/{k.segments}</span>
                      <button onClick={() => setClock(k.id, k.filled + 1)}>+</button>
                    </div>
                  ) : null; })}
                </>
              )}

              <label style={{ marginTop: 12 }}>Iniciativa</label>
              <Initiative session={session} ps={ps} />

              <label style={{ marginTop: 12 }}>Notas rápidas</label>
              <AutoTextarea value={session.log} onChange={(v) => ps((s) => (s.log = v))} ph="Lo que pasa en la mesa…" />

              {session.status !== 'done' && <div style={{ marginTop: 12 }}><button onClick={() => { ps((s) => (s.status = 'done')); setTab('recap'); }}>Cerrar y recapitular →</button></div>}
            </div>
          )}

          {tab === 'recap' && (
            <div>
              <label>Bitácora de la sesión</label>
              <AutoTextarea value={session.log} onChange={(v) => ps((s) => (s.log = v))} ph="Qué pasó, para tu yo de dentro de tres sesiones." />

              <label style={{ marginTop: 12 }}>Se reveló esta sesión</label>
              {session.revealedThisSession.length === 0 && <div className="small muted">No se reveló ningún secreto marcado.</div>}
              {session.revealedThisSession.map((r, i) => { const e = findEntity(r.entityId); const s = e && (e.secrets || []).find((x) => x.id === r.secretId); return (
                <div className="small" key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--line)' }}>✓ <strong>{e?.name}</strong>: {s?.text}</div>
              ); })}

              {campaign.clocks.length > 0 && (
                <>
                  <label style={{ marginTop: 12 }}>Avanza tus relojes</label>
                  {campaign.clocks.map((k) => (
                    <div className="row" key={k.id} style={{ alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ flex: 1 }}>{k.name}</span>
                      <button onClick={() => setClock(k.id, k.filled - 1)}>−</button>
                      <span className="small muted">{k.filled}/{k.segments}</span>
                      <button onClick={() => setClock(k.id, k.filled + 1)}>+</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function T({ label, value, onChange, area }) {
  return (
    <div className="field">
      <label>{label}</label>
      {area ? <AutoTextarea value={value} onChange={onChange} /> : <input value={value || ''} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function SceneList({ label, items, onChange }) {
  const arr = items || [];
  return (
    <div style={{ marginTop: 6 }}>
      <div className="small muted">{label}</div>
      {arr.map((it, i) => (
        <div className="row" key={i} style={{ marginBottom: 6, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><AutoTextarea value={it} onChange={(v) => onChange(arr.map((x, k) => k === i ? v : x))} /></div>
          <button className="danger" onClick={() => onChange(arr.filter((_, k) => k !== i))}>×</button>
        </div>
      ))}
      <button className="small" onClick={() => onChange([...arr, ''])}>+ Añadir</button>
    </div>
  );
}

function Picker({ options, onPick, placeholder }) {
  return (
    <select value="" onChange={(e) => { if (e.target.value) onPick(e.target.value); }}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}{o._kind ? ` · ${o._kind}` : ''}</option>)}
    </select>
  );
}

function Initiative({ session, ps }) {
  const [name, setName] = useState('');
  const [init, setInit] = useState('');
  const list = [...(session.initiative || [])].sort((a, b) => b.init - a.init);
  const cur = list.length ? list[(session.turnIdx || 0) % list.length] : null;
  const add = () => { if (!name.trim()) return; ps((s) => s.initiative.push({ id: newId('ini'), name: name.trim(), init: Number(init) || 0 })); setName(''); setInit(''); };
  return (
    <div>
      {list.map((c) => (
        <div className="row" key={c.id} style={{ alignItems: 'center', padding: '3px 6px', borderRadius: 6, background: cur && cur.id === c.id ? 'var(--accent-soft)' : 'transparent' }}>
          <span className="small" style={{ width: 28, color: 'var(--accent)' }}>{c.init}</span>
          <span style={{ flex: 1 }}>{c.name}</span>
          <button className="danger" onClick={() => ps((s) => (s.initiative = s.initiative.filter((x) => x.id !== c.id)))}>×</button>
        </div>
      ))}
      <div className="row" style={{ marginTop: 6 }}>
        <input style={{ flex: 1 }} placeholder="Combatiente" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input style={{ width: 64 }} placeholder="Init" value={init} onChange={(e) => setInit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add}>Añadir</button>
        {list.length > 0 && <button onClick={() => ps((s) => (s.turnIdx = (s.turnIdx || 0) + 1))}>Siguiente ›</button>}
      </div>
    </div>
  );
}
