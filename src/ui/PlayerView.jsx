import React from 'react';

// "Lo que tu mesa sabe": entidades no ocultas + solo secretos revelados.
export default function PlayerView({ campaign: c }) {
  const visible = (arr) => (arr || []).filter((e) => !e.hidden);
  const revealed = (e) => (e.secrets || []).filter((s) => s.visibility === 'revealed');

  const Section = ({ title, items, sub }) => items.length ? (
    <section style={{ marginBottom: 28 }}>
      <div className="eyebrow lore-section">{title}</div>
      <div className="lore-grid">
        {items.map((e) => (
          <div key={e.id} className="lore-card" style={{ cursor: 'default' }}>
            <div className="lore-card-top">
              <span className="lore-card-name">{e.name}</span>
              {sub(e) ? <span className="chip">{sub(e)}</span> : null}
            </div>
            {(e.summary || e.description) && <div className="lore-card-sub" style={{ WebkitLineClamp: 4 }}>{e.summary || e.description}</div>}
            {revealed(e).length > 0 && (
              <div style={{ marginTop: 4, borderTop: '1px solid var(--line-soft)', paddingTop: 7 }}>
                {revealed(e).map((s) => <div key={s.id} className="small" style={{ color: 'var(--accent)', lineHeight: 1.45 }}>• {s.text}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const total = visible(c.places).length + visible(c.factions).length + visible(c.npcs).length;
  return (
    <div>
      <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', marginBottom: 18 }}>
        <div className="eyebrow">Vista de jugadores</div>
        <div className="small muted" style={{ marginTop: 2 }}>Lo que tu mesa sabe ahora mismo: solo entidades visibles y secretos ya revelados. Lo demás queda oculto.</div>
      </div>

      {(c.premise || c.pitch) && (
        <div className="card" style={{ marginBottom: 18 }}>
          {c.pitch && <p className="prose" style={{ fontStyle: 'italic', margin: 0 }}>{c.pitch}</p>}
          {c.premise && <p className="small muted" style={{ marginBottom: 0, marginTop: c.pitch ? 8 : 0 }}>{c.premise}</p>}
        </div>
      )}

      <Section title="Lugares" items={visible(c.places)} sub={(p) => p.kind} />
      <Section title="Facciones" items={visible(c.factions)} sub={() => ''} />
      <Section title="Personajes conocidos" items={visible(c.npcs)} sub={(n) => n.role} />

      {total === 0 && <div className="card muted">Tu mesa aún no conoce nada visible. Marca entidades como visibles y revela secretos desde la vista del Director.</div>}
    </div>
  );
}
