import React, { useState, useMemo, useRef, useEffect } from 'react';

// ============================================================================
//  BÚSQUEDA GLOBAL (Ctrl/Cmd+K): encuentra cualquier cosa de la campaña
//  — fichas, secretos, sesiones, misterios, cronología, bestiario, tablas,
//  capítulos de la crónica — y salta a su sitio.
// ============================================================================

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function buildIndex(c) {
  const ix = [];
  const push = (jump, kind, title, texts) => ix.push({ jump, kind, title, hay: norm([title, ...texts].filter(Boolean).join(' § ')), texts });
  (c.places || []).forEach((e) => push({ mode: 'lore', coll: 'places', id: e.id }, 'Lugar', e.name, [e.kind, e.summary, e.description, e.ambience, ...(e.rumors || []), ...(e.dangers || []), ...(e.secrets || []).map((s) => s.text)]));
  (c.npcs || []).forEach((e) => push({ mode: 'lore', coll: 'npcs', id: e.id }, 'NPC', e.name, [e.role, e.summary, e.description, e.goal, e.voice, ...(e.secrets || []).map((s) => s.text)]));
  (c.factions || []).forEach((e) => push({ mode: 'lore', coll: 'factions', id: e.id }, 'Facción', e.name, [e.summary, e.goal, e.resources, ...(e.secrets || []).map((s) => s.text)]));
  (c.sessions || []).forEach((s) => push({ mode: 'mesa', sessionId: s.id }, 'Sesión', `Sesión ${s.number}: ${s.title}`, [s.objective, s.openingText, s.log, ...(s.scenes || []).flatMap((sc) => [sc.title, sc.beat, sc.reveal, sc.readAloud])]));
  (c.mysteries || []).forEach((m) => push({ mode: 'create', stage: 'mysteries' }, 'Misterio', m.name, [m.conclusion, ...(m.clues || []).map((x) => x.text)]));
  (c.clocks || []).forEach((k) => push({ mode: 'create', stage: 'clocks' }, 'Reloj', k.name, [k.trigger]));
  (c.timeline || []).forEach((e) => push({ mode: 'create', stage: 'timeline' }, 'Cronología', `${e.when ? e.when + ' — ' : ''}${e.title}`, [e.what, e.consequence]));
  (c.bestiary || []).forEach((t) => push({ mode: 'create', stage: 'bestiary' }, 'Amenaza', t.name, [t.nature, t.description, t.tactics, t.weakness, t.hook]));
  (c.tables || []).forEach((t) => push({ mode: 'create', stage: 'tables' }, 'Tabla', t.title, t.entries || []));
  (c.arcs || []).forEach((a) => push({ mode: 'create', stage: 'arcs' }, 'Arco', a.name, [a.premise, a.climax]));
  (c.pcs || []).forEach((p) => push({ mode: 'create', stage: 'hooks' }, 'PJ', p.pc || p.concept, [p.concept, p.hook]));
  if (c.truth?.core) push({ mode: 'create', stage: 'truth' }, 'Verdad oculta', 'La verdad oculta', [c.truth.core, ...(c.truth.revelations || []).map((r) => r.what)]);
  (c.chronicle?.chapters || []).forEach((ch, i) => push({ mode: 'cronica' }, 'Crónica', `Capítulo ${i + 1}: ${ch.title}`, [ch.text]));
  return ix;
}

function snippet(entry, q) {
  for (const t of entry.texts) {
    if (!t) continue;
    const i = norm(t).indexOf(q);
    if (i >= 0) {
      const start = Math.max(0, i - 34);
      return (start > 0 ? '…' : '') + String(t).slice(start, i + q.length + 60) + '…';
    }
  }
  return entry.texts.find(Boolean)?.slice(0, 90) || '';
}

export default function SearchPalette({ campaign, onJump, onClose }) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const index = useMemo(() => buildIndex(campaign), [campaign]);

  const results = useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return [];
    const hits = index.filter((e) => e.hay.includes(nq));
    // primero los que coinciden en el título
    hits.sort((a, b) => (norm(b.title).includes(nq) ? 1 : 0) - (norm(a.title).includes(nq) ? 1 : 0));
    return hits.slice(0, 14).map((e) => ({ ...e, snip: snippet(e, nq) }));
  }, [q, index]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setCursor(0); }, [q]);

  const go = (r) => { if (r) { onJump(r.jump); onClose(); } };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[cursor]); }
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Buscar en toda la campaña… (fichas, secretos, sesiones, crónica)"
        />
        {q.trim() && results.length === 0 && <div className="palette-empty">Nada con «{q}». Prueba con otra palabra.</div>}
        {results.length > 0 && (
          <div className="palette-results">
            {results.map((r, i) => (
              <div key={i} className={'palette-row' + (i === cursor ? ' active' : '')}
                   onMouseEnter={() => setCursor(i)} onClick={() => go(r)}>
                <div className="row" style={{ gap: 8, alignItems: 'baseline', minWidth: 0 }}>
                  <span className="chip" style={{ flexShrink: 0 }}>{r.kind}</span>
                  <span className="palette-title">{r.title}</span>
                </div>
                {r.snip && <div className="palette-snip">{r.snip}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="palette-hint">↑↓ moverse · Enter abrir · Esc cerrar</div>
      </div>
    </div>
  );
}
