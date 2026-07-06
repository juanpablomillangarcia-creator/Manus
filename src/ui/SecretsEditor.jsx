import React from 'react';
import { newSecret } from '../model/schema.js';
import AutoTextarea from './AutoTextarea.jsx';

const VIS = {
  secret:   { label: 'Secreto',   color: '#b0413e' },
  hinted:   { label: 'Insinuado', color: '#b5852f' },
  revealed: { label: 'Revelado',  color: '#3f7d56' },
};
const NEXT = { secret: 'hinted', hinted: 'revealed', revealed: 'secret' };

// secrets: array · onChange: (nextArray) => void
export default function SecretsEditor({ secrets = [], onChange }) {
  const set = (id, patch) => onChange(secrets.map((s) => s.id === id ? { ...s, ...patch } : s));
  const del = (id) => {
    const s = secrets.find((x) => x.id === id);
    const links = [...String(s?.text || '').matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim());
    if (links.length && !confirm(`Este secreto menciona a: ${links.join(', ')}.\n¿Seguro que quieres eliminarlo? El lore de esas fichas no se toca, pero perderás esta conexión.`)) return;
    onChange(secrets.filter((x) => x.id !== id));
  };
  const add = () => onChange([...secrets, newSecret()]);

  return (
    <div>
      <label>Secretos (haz clic en el sello para cambiar su estado)</label>
      {secrets.map((s) => {
        const v = VIS[s.visibility] || VIS.secret;
        return (
          <div key={s.id} style={{ border: `1px solid ${v.color}55`, background: `${v.color}11`, borderRadius: 8, padding: 8, marginBottom: 6 }}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <button
                onClick={() => set(s.id, { visibility: NEXT[s.visibility] || 'secret' })}
                title="Secreto → Insinuado → Revelado"
                style={{ color: v.color, borderColor: `${v.color}88`, whiteSpace: 'nowrap', minWidth: 96, fontSize: 12 }}
              >● {v.label}</button>
              <AutoTextarea style={{ flex: 1 }} ph="El secreto…" value={s.text} onChange={(v) => set(s.id, { text: v })} />
              <button className="danger" onClick={() => del(s.id)}>×</button>
            </div>
            <AutoTextarea style={{ marginTop: 6, fontSize: 13 }} ph="cómo/cuándo sembrarlo o revelarlo (opcional)" value={s.note || ''} onChange={(v) => set(s.id, { note: v })} />
          </div>
        );
      })}
      <button onClick={add}>+ Secreto</button>
    </div>
  );
}
