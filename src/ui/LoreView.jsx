import React, { useState, useEffect } from 'react';
import EntityDetail from './EntityDetail.jsx';
import { newPlace, newNPC, newFaction } from '../model/schema.js';

const TYPES = [['places', 'Lugares', newPlace], ['npcs', 'NPCs', newNPC], ['factions', 'Facciones', newFaction]];

export default function LoreView({ campaign, update, openAISettings, extSel }) {
  const [sel, setSel] = useState(null);       // { coll, id }
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(null);

  const places = campaign.places || [];
  const npcs = campaign.npcs || [];
  const factions = campaign.factions || [];

  const select = (e) => { setHistory((h) => (sel ? [...h, sel] : h)); setSel({ coll: e._coll || e.coll, id: e.id }); };
  const selectRaw = (coll, id) => { setHistory((h) => (sel ? [...h, sel] : h)); setSel({ coll, id }); };
  const back = () => setHistory((h) => { if (!h.length) return h; setSel(h[h.length - 1]); return h.slice(0, -1); });
  const toIndex = () => { setSel(null); setHistory([]); };
  useEffect(() => { if (extSel) { setSel({ coll: extSel.coll, id: extSel.id }); setHistory([]); } }, [extSel?.n]);
  const create = (coll, factory) => { const e = factory({ name: 'Nueva ficha' }); update((c) => ({ ...c, [coll]: [...c[coll], e] })); selectRaw(coll, e.id); };

  const q = query.trim().toLowerCase();
  const matches = (e) => !q || e.name.toLowerCase().includes(q) || (e.summary || '').toLowerCase().includes(q);
  const childrenOf = (id) => places.filter((p) => p.parentId === id);
  const isRoot = (p) => !p.parentId || !places.some((x) => x.id === p.parentId);
  const showSection = (coll) => !filter || filter === coll;

  const Card = ({ coll, e, kind, sub }) => (
    <button onClick={() => selectRaw(coll, e.id)} className="lore-card">
      <div className="lore-card-top">
        <span className="lore-card-name">{e.name}</span>
        {kind ? <span className="chip">{kind}</span> : null}
        {e.hidden ? <span className="chip chip-hidden">oculto</span> : null}
      </div>
      {sub ? <div className="lore-card-sub">{sub}</div> : null}
    </button>
  );

  // ---------- DETALLE (pantalla completa) ----------
  if (sel) {
    return (
      <div>
        <div className="row" style={{ marginBottom: 14 }}>
          <button onClick={toIndex}>← Índice</button>
          <button className="ghost" disabled={!history.length} onClick={back}>Anterior</button>
          {history.length > 0 && <span className="small muted">{history.length} atrás</span>}
        </div>
        <div className="card">
          <EntityDetail campaign={campaign} coll={sel.coll} id={sel.id} update={update} onSelect={select} openAISettings={openAISettings} onDeleted={toIndex} />
        </div>
      </div>
    );
  }

  // ---------- ÍNDICE (rejilla) ----------
  const empty = places.length + npcs.length + factions.length === 0;
  return (
    <div>
      <div className="row" style={{ gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="Buscar lore…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 340 }} />
        <div className="modenav" style={{ marginLeft: 'auto' }}>
          <button className={!filter ? 'active' : ''} onClick={() => setFilter(null)}>Todo</button>
          {TYPES.map(([coll, label]) => <button key={coll} className={filter === coll ? 'active' : ''} onClick={() => setFilter(filter === coll ? null : coll)}>{label}</button>)}
        </div>
      </div>
      <div className="row" style={{ gap: 6, marginBottom: 20 }}>
        {TYPES.map(([coll, label, factory]) => <button key={coll} className="ghost small" onClick={() => create(coll, factory)}>+ {label.replace(/s$/, '')}</button>)}
      </div>

      {empty && <div className="card muted">Sin entidades todavía. Genera la campaña en «Crear» o añade una ficha con los botones de arriba.</div>}

      {showSection('places') && places.length > 0 && (
        <section style={{ marginBottom: 30 }}>
          <div className="eyebrow lore-section">Lugares</div>
          {places.filter(isRoot).map((city) => {
            const allKids = childrenOf(city.id);
            const kids = q ? allKids.filter(matches) : allKids;
            if (q && !matches(city) && kids.length === 0) return null;
            return (
              <div key={city.id} className="lore-group">
                <button onClick={() => selectRaw('places', city.id)} className="lore-group-head">
                  <span>{city.name}</span>
                  {city.kind ? <span className="chip">{city.kind}</span> : null}
                  {city.hidden ? <span className="chip chip-hidden">oculto</span> : null}
                </button>
                {kids.length > 0 && (
                  <div className="lore-grid lore-children">
                    {kids.map((k) => <Card key={k.id} coll="places" e={k} kind={k.kind} sub={k.summary} />)}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {showSection('npcs') && npcs.length > 0 && (
        <section style={{ marginBottom: 30 }}>
          <div className="eyebrow lore-section">NPCs</div>
          <div className="lore-grid">
            {npcs.filter(matches).sort((a, b) => a.name.localeCompare(b.name)).map((e) => {
              const place = places.find((p) => p.id === e.placeId);
              const sub = [place ? place.name : null, e.role || e.summary].filter(Boolean).join(' · ');
              return <Card key={e.id} coll="npcs" e={e} sub={sub} />;
            })}
          </div>
        </section>
      )}

      {showSection('factions') && factions.length > 0 && (
        <section>
          <div className="eyebrow lore-section">Facciones</div>
          <div className="lore-grid">
            {factions.filter(matches).sort((a, b) => a.name.localeCompare(b.name)).map((e) => <Card key={e.id} coll="factions" e={e} kind={e.kind || ''} sub={e.summary} />)}
          </div>
        </section>
      )}
    </div>
  );
}
