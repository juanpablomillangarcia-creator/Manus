import React, { useState } from 'react';
import AutoTextarea from './AutoTextarea.jsx';
import SecretsEditor from './SecretsEditor.jsx';
import LinkedText from './LinkedText.jsx';
import { allLoreEntities, nameIndex, backlinksFor, COLL_OF } from '../model/lore.js';
import { runDeepen, applyDeepen } from '../spine/deepen.js';
import { newRelation } from '../model/schema.js';
import { referencesTo, deleteEntityCascade, renameEntity } from '../model/cascade.js';
import { hasApiKey, estimatedCost } from '../ai/config.js';

const REL_SUGGEST = ['aliado de', 'enemigo de', 'sirve a', 'gobierna', 'miembro de', 'ubicado en', 'teme a', 'ama a', 'debe un favor a', 'rival de', 'creó'];

// Campo a todo el ancho: etiqueta + caja que crece. Layout siempre equilibrado.
function T({ label, value, onChange, ph }) {
  return (
    <div className="field">
      <label>{label}</label>
      <AutoTextarea value={value} onChange={onChange} ph={ph} />
    </div>
  );
}

function StringList({ label, items, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      {(items || []).map((it, i) => (
        <div className="row" key={i} style={{ marginBottom: 6, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><AutoTextarea value={it} onChange={(v) => onChange(items.map((x, k) => k === i ? v : x))} /></div>
          <button className="danger" onClick={() => onChange(items.filter((_, k) => k !== i))}>×</button>
        </div>
      ))}
      <button className="ghost small" onClick={() => onChange([...(items || []), ''])}>+ Añadir</button>
    </div>
  );
}

function LinkSelect({ label, value, options, onChange, onGo }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="row">
        <select style={{ flex: 1 }} value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        {value && <button onClick={() => onGo(value)} title="Ir">→</button>}
      </div>
    </div>
  );
}

function deepenSummary(coll, j) {
  const out = [];
  if (j.subLocations?.length) out.push(`${j.subLocations.length} sublugares`);
  if (j.npcs?.length) out.push(`${j.npcs.length} NPCs`);
  if (j.members?.length) out.push(`${j.members.length} miembros`);
  if (j.assets?.length) out.push(`${j.assets.length} bienes`);
  if (j.connections?.length) out.push(`${j.connections.length} conexiones`);
  if (j.secrets?.length) out.push(`${j.secrets.length} secretos`);
  if (j.rumors?.length) out.push(`${j.rumors.length} rumores`);
  if (j.expanded || j.appearance) out.push('descripción ampliada');
  return out.join(' · ') || 'detalle';
}

export default function EntityDetail({ campaign, coll, id, update, onSelect, openAISettings, onDeleted }) {
  const entity = campaign[coll].find((x) => x.id === id);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [tab, setTab] = useState('ficha');
  const [nameDraft, setNameDraft] = useState(null); // null = sin edición en curso
  const [delReport, setDelReport] = useState(null);
  if (!entity) return <div className="muted">Selecciona una entidad.</div>;

  const entities = allLoreEntities(campaign);
  const index = nameIndex(entities);
  const refOf = (e) => e ? { ...e, _coll: e._coll || (campaign.places.includes(e) ? 'places' : campaign.npcs.includes(e) ? 'npcs' : 'factions') } : null;
  const goId = (eid) => { const e = entities.find((x) => x.id === eid); if (e) onSelect(e); };
  const edit = (patch) => update((c) => ({ ...c, [coll]: c[coll].map((x) => x.id === id ? { ...x, ...patch } : x) }));

  const children = coll === 'places' ? campaign.places.filter((p) => p.parentId === id) : [];
  const residents = coll === 'places' ? campaign.npcs.filter((n) => n.placeId === id) : [];
  const members = coll === 'factions' ? campaign.npcs.filter((n) => n.factionId === id) : [];
  const outRels = (campaign.relations || []).filter((r) => r.from === id);
  const inRels = (campaign.relations || []).filter((r) => r.to === id);
  const backlinks = backlinksFor(entity, entities);
  const conCount = children.length + residents.length + members.length + outRels.length + inRels.length + backlinks.length;
  const secCount = (entity.secrets || []).length;

  const deepen = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    setBusy(true); setProposal(null);
    try { setProposal(await runDeepen(coll, entity, campaign)); }
    catch (e) { alert('Error al profundizar: ' + e.message); }
    finally { setBusy(false); }
  };
  const acceptDeepen = () => { update((c) => applyDeepen(structuredClone(c), coll, id, proposal)); setProposal(null); };
  const addRelation = (toId, label) => update((c) => ({ ...c, relations: [...(c.relations || []), newRelation({ from: id, to: toId, label })] }));
  const delRelation = (rid) => update((c) => ({ ...c, relations: (c.relations || []).filter((r) => r.id !== rid) }));

  const NameChip = ({ e }) => { const r = refOf(e); return <button className="link-chip" onClick={() => onSelect(r)}>{e.name}</button>; };

  return (
    <div>
      {/* cabecera */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">{COLL_OF[coll]}</div>
          <input
            value={nameDraft ?? entity.name}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => { if (nameDraft != null && nameDraft.trim() && nameDraft.trim() !== entity.name) update((c) => renameEntity(structuredClone(c), coll, id, nameDraft)); setNameDraft(null); }}
            title="Al cambiar el nombre, se actualizan también los [[enlaces]] y menciones en el resto de la campaña"
            style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--display)', border: 'none', background: 'transparent', padding: 0, marginTop: 2, width: '100%' }} />
        </div>
        <div className="row" style={{ flexShrink: 0 }}>
          <button onClick={() => edit({ hidden: !entity.hidden })} className="small" style={{ color: entity.hidden ? 'var(--danger)' : 'var(--muted)' }}>{entity.hidden ? '● Oculto' : '○ Visible'}</button>
          <button className="danger small" onClick={() => setDelReport(referencesTo(campaign, coll, id))} title="Eliminar esta ficha (con aviso de impacto)">Eliminar</button>
          <button className="primary" disabled={busy} onClick={deepen} title={`Genera detalle y entidades hijas enlazadas (${estimatedCost()})`}>{busy ? '…' : '✦ Profundizar'}</button>
        </div>
      </div>

      {delReport && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginTop: 14 }}>
          <strong>¿Eliminar «{entity.name}»?</strong>
          {delReport.total === 0 ? (
            <p className="small muted" style={{ margin: '6px 0 0' }}>Nada más la referencia: se puede borrar sin efectos colaterales.</p>
          ) : (
            <>
              <p className="small muted" style={{ margin: '6px 0 8px' }}>Está enlazada con otras partes de la campaña. Al eliminarla:</p>
              {delReport.items.map((it, i) => (
                <div key={i} className="small" style={{ padding: '4px 0', borderTop: i ? '1px solid var(--line-soft)' : 'none' }}>
                  • {it.text}{it.detail && <span className="muted"> — {it.detail}</span>}
                </div>
              ))}
              <p className="small muted" style={{ margin: '8px 0 0' }}>El texto detallado de las demás fichas se conserva; solo se deshacen los enlaces y pertenencias.</p>
            </>
          )}
          <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setDelReport(null)}>Cancelar</button>
            <button className="danger" onClick={() => { update((c) => deleteEntityCascade(structuredClone(c), coll, id)); setDelReport(null); onDeleted && onDeleted(); }}>Eliminar y limpiar enlaces</button>
          </div>
        </div>
      )}

      {proposal && (
        <div className="proposal">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Profundizar añadirá: {deepenSummary(coll, proposal)}</strong>
            <div className="row"><button onClick={() => setProposal(null)}>Descartar</button><button className="primary" onClick={acceptDeepen}>Añadir y enlazar</button></div>
          </div>
          <details><summary className="small muted" style={{ cursor: 'pointer', marginTop: 6 }}>ver detalle</summary><pre style={{ fontSize: 12 }}>{JSON.stringify(proposal, null, 2)}</pre></details>
        </div>
      )}

      {/* pestañas */}
      <div className="tabs" style={{ margin: '16px 0 18px' }}>
        <button className={tab === 'ficha' ? 'active' : ''} onClick={() => setTab('ficha')}>Ficha</button>
        <button className={tab === 'con' ? 'active' : ''} onClick={() => setTab('con')}>Conexiones{conCount ? ` · ${conCount}` : ''}</button>
        <button className={tab === 'sec' ? 'active' : ''} onClick={() => setTab('sec')}>Secretos{secCount ? ` · ${secCount}` : ''}</button>
      </div>

      {/* ---------- FICHA ---------- */}
      {tab === 'ficha' && (
        <div>
          <T label="Resumen" value={entity.summary} onChange={(v) => edit({ summary: v })} />

          {coll === 'places' && <>
            <div className="grid2">
              <T label="Tipo" value={entity.kind} onChange={(v) => edit({ kind: v })} />
              <LinkSelect label="Contenido en" value={entity.parentId} options={campaign.places.filter((p) => p.id !== id)} onChange={(v) => edit({ parentId: v })} onGo={goId} />
            </div>
            <T label="Gobierno / poder" value={entity.government} onChange={(v) => edit({ government: v })} />
            <T label="Ambiente (sensorial)" value={entity.ambience} onChange={(v) => edit({ ambience: v })} />
          </>}

          {coll === 'npcs' && <>
            <T label="Rol" value={entity.role} onChange={(v) => edit({ role: v })} />
            <T label="Aspecto" value={entity.appearance} onChange={(v) => edit({ appearance: v })} />
            <T label="Objetivo" value={entity.goal} onChange={(v) => edit({ goal: v })} />
            <T label="Voz / manierismo" value={entity.voice} onChange={(v) => edit({ voice: v })} />
            <div className="grid2">
              <LinkSelect label="Facción" value={entity.factionId} options={campaign.factions} onChange={(v) => edit({ factionId: v })} onGo={goId} />
              <LinkSelect label="Lugar" value={entity.placeId} options={campaign.places} onChange={(v) => edit({ placeId: v })} onGo={goId} />
            </div>
          </>}

          {coll === 'factions' && <>
            <T label="Objetivo" value={entity.goal} onChange={(v) => edit({ goal: v })} />
            <div className="grid2">
              <T label="Recursos" value={entity.resources} onChange={(v) => edit({ resources: v })} />
              <T label="Influencia" value={entity.influence} onChange={(v) => edit({ influence: v })} />
            </div>
          </>}

          <div className="field">
            <label>Descripción · enlaza con [[Nombre]]</label>
            <AutoTextarea value={entity.description} ph="Usa [[Nombre]] para enlazar con otras fichas." onChange={(v) => edit({ description: v })} />
            {(entity.description || '').includes('[[') && (
              <div className="small" style={{ marginTop: 6 }}><LinkedText text={entity.description} index={index} onSelect={onSelect} /></div>
            )}
          </div>

          {coll === 'npcs' && <StringList label="Qué quiere de los PJ" items={entity.wants} onChange={(v) => edit({ wants: v })} />}
          {coll === 'places' && <>
            <StringList label="Puntos de interés" items={entity.pointsOfInterest} onChange={(v) => edit({ pointsOfInterest: v })} />
            <StringList label="Rumores" items={entity.rumors} onChange={(v) => edit({ rumors: v })} />
            <StringList label="Peligros" items={entity.dangers} onChange={(v) => edit({ dangers: v })} />
          </>}
        </div>
      )}

      {/* ---------- CONEXIONES ---------- */}
      {tab === 'con' && (
        <div>
          {(children.length > 0 || residents.length > 0 || members.length > 0) && (
            <div className="field">
              <label>Contiene / agrupa</label>
              <div className="row" style={{ gap: 6 }}>
                {children.map((e) => <NameChip key={e.id} e={e} />)}
                {residents.map((e) => <NameChip key={e.id} e={e} />)}
                {members.map((e) => <NameChip key={e.id} e={e} />)}
              </div>
            </div>
          )}

          <div className="field">
            <label>Relaciones</label>
            {outRels.length + inRels.length === 0 && <div className="small muted" style={{ marginBottom: 8 }}>Sin relaciones todavía.</div>}
            {outRels.map((r) => { const t = entities.find((x) => x.id === r.to); return t ? (
              <div className="rel" key={r.id}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <NameChip e={t} />
                  <button className="danger small" onClick={() => delRelation(r.id)}>×</button>
                </div>
                {r.label && <div className="small muted" style={{ marginTop: 4, lineHeight: 1.5 }}>{r.label}</div>}
              </div>
            ) : null; })}
            {inRels.map((r) => { const f = entities.find((x) => x.id === r.from); return f ? (
              <div className="rel" key={r.id}>
                <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                  <NameChip e={f} />
                  <span className="small muted">{r.label} → (esta)</span>
                </div>
              </div>
            ) : null; })}
            <RelAdder entities={entities.filter((e) => e.id !== id)} onAdd={addRelation} />
          </div>

          {backlinks.length > 0 && (
            <div className="field">
              <label>Aparece en (la mencionan con [[…]])</label>
              <div className="row" style={{ gap: 6 }}>{backlinks.map((e) => <NameChip key={e.id} e={e} />)}</div>
            </div>
          )}
        </div>
      )}

      {/* ---------- SECRETOS ---------- */}
      {tab === 'sec' && <SecretsEditor secrets={entity.secrets} onChange={(secrets) => edit({ secrets })} />}
    </div>
  );
}

function RelAdder({ entities, onAdd }) {
  const [tid, setTid] = useState('');
  const [label, setLabel] = useState('');
  return (
    <div className="row" style={{ marginTop: 10, alignItems: 'center' }}>
      <input list="rel-sugg" style={{ flex: '1 1 160px' }} placeholder="cómo (teme a…)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <datalist id="rel-sugg">{REL_SUGGEST.map((s) => <option key={s} value={s} />)}</datalist>
      <select style={{ flex: '2 1 200px' }} value={tid} onChange={(e) => setTid(e.target.value)}>
        <option value="">Vincular con…</option>
        {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <button onClick={() => { if (tid) { onAdd(tid, label.trim() || 'relacionado con'); setTid(''); setLabel(''); } }}>Vincular</button>
    </div>
  );
}
