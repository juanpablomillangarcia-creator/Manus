import React, { useState, useRef } from 'react';
import { listCampaigns, deleteCampaign, getCampaign, exportCampaign, exportBinder, importCampaignFromFile, exportAllData, importAllFromFile, listSnapshots, restoreSnapshot } from '../model/store.js';
import { ARCHETYPES } from '../model/archetypes.js';

export default function CampaignList({ onOpen, onNew }) {
  const [, force] = useState(0);
  const fileRef = useRef(null);
  const camps = listCampaigns();

  const refresh = () => force((n) => n + 1);
  const onImport = async (file) => {
    try { await importCampaignFromFile(file); refresh(); }
    catch (e) { alert('No se pudo importar: ' + e.message); }
  };

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Mis campañas</h2>
        <div className="row">
          <button onClick={() => fileRef.current?.click()}>↑ Importar JSON</button>
          <button className="primary" onClick={onNew}>+ Nueva campaña</button>
          <input ref={fileRef} type="file" accept="application/json" hidden
            onChange={(e) => e.target.files[0] && onImport(e.target.files[0])} />
        </div>
      </div>

      {camps.length === 0 && (
        <div className="card muted">
          Aún no hay campañas. Pulsa <strong>Nueva campaña</strong> para empezar por el brief
          (tipo, escala, tono) y dejar que la columna generativa teja el primer borrador.
        </div>
      )}

      {camps.map((c) => {
        const full = getCampaign(c.id) || {};
        const stats = [
          (full.places || []).length && `${full.places.length} lugares`,
          (full.npcs || []).length && `${full.npcs.length} NPCs`,
          (full.factions || []).length && `${full.factions.length} facciones`,
          (full.sessions || []).length && `${full.sessions.length} sesiones`,
        ].filter(Boolean).join(' · ');
        return (
          <div key={c.id} className="card camp-row" style={{ cursor: 'pointer' }} onClick={() => onOpen(c.id)}>
            <div style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 10, alignItems: 'baseline' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 18 }}>{c.name}</div>
                <span className="chip">{ARCHETYPES[c.archetype]?.label || c.archetype}</span>
              </div>
              <div className="meta" style={{ marginTop: 5 }}>{stats || 'sin contenido todavía'} · actualizada {new Date(c.updatedAt).toLocaleDateString()}</div>
            </div>
            <div className="row" onClick={(e) => e.stopPropagation()}>
              <button className="ghost" onClick={() => exportBinder(getCampaign(c.id))} title="Dosier legible para leer o imprimir">Dosier</button>
              <button className="ghost" onClick={() => exportCampaign(getCampaign(c.id))} title="Copia de seguridad (JSON)">Exportar</button>
              <button className="danger" onClick={() => { if (confirm(`¿Borrar "${c.name}"?`)) { deleteCampaign(c.id); refresh(); } }}>Borrar</button>
              <button className="primary" onClick={() => onOpen(c.id)}>Abrir</button>
            </div>
          </div>
        );
      })}

      <div className="card" style={{ marginTop: 22, padding: '14px 18px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="eyebrow">Seguridad de tus datos</div>
            <div className="small muted" style={{ marginTop: 3 }}>
              Todo vive en este navegador. Descarga una copia completa de vez en cuando; además, la app guarda sola instantáneas rotativas cada 10 minutos.
            </div>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <button className="ghost" onClick={() => exportAllData()} title="Todas las campañas en un solo archivo">Descargar copia completa</button>
            <label className="ghost" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 14px', fontSize: 14 }}>
              Restaurar desde archivo
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = '';
                if (!f) return;
                try { const n = await importAllFromFile(f); alert(`Restauradas/actualizadas ${n} campaña(s).`); refresh(); }
                catch (err) { alert('No se pudo restaurar: ' + err.message); }
              }} />
            </label>
            {listSnapshots().length > 0 && (
              <button className="ghost" title="Vuelve a la última instantánea automática" onClick={() => {
                const snaps = listSnapshots();
                const s0 = snaps[0];
                if (confirm(`Restaurar la instantánea automática del ${new Date(s0.at).toLocaleString()} (${s0.campaigns} campaña(s)). Sobrescribe el estado actual. ¿Seguir?`)) {
                  try { restoreSnapshot(s0.key); refresh(); alert('Instantánea restaurada.'); }
                  catch (err) { alert(err.message); }
                }
              }}>Restaurar instantánea</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
