import React from 'react';
import { parseLinks } from '../model/lore.js';

// Renderiza texto con enlaces [[Nombre]]: clicable si resuelve, atenuado si no.
export default function LinkedText({ text, index, onSelect, muted }) {
  if (!text) return <span className="muted">—</span>;
  const segs = parseLinks(text);
  return (
    <span style={{ whiteSpace: 'pre-wrap', color: muted ? 'var(--muted)' : 'inherit' }}>
      {segs.map((s, i) => {
        if (s.t === 'text') return <span key={i}>{s.v}</span>;
        const e = index[s.v.toLowerCase()];
        return e
          ? <button key={i} className="ghost" style={{ padding: 0, color: 'var(--accent)', textDecoration: 'underline' }} onClick={() => onSelect(e)}>{s.v}</button>
          : <span key={i} style={{ color: 'var(--muted)', borderBottom: '1px dashed var(--muted)' }}>{s.v}</span>;
      })}
    </span>
  );
}
