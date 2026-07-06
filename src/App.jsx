import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loadAIConfig } from './ai/config.js';
import { getCampaign, saveCampaign } from './model/store.js';
import CampaignList from './ui/CampaignList.jsx';
import BriefForm from './ui/BriefForm.jsx';
import SpineView from './ui/SpineView.jsx';
import LoreView from './ui/LoreView.jsx';
import GeneratorsView from './ui/GeneratorsView.jsx';
import MapAI from './ui/MapAI.jsx';
import MesaView from './ui/MesaView.jsx';
import PlayerView from './ui/PlayerView.jsx';
import ChronicleView from './ui/ChronicleView.jsx';
import AISettings from './ui/AISettings.jsx';
import BackgroundMotif from './ui/BackgroundMotif.jsx';
import SearchPalette from './ui/SearchPalette.jsx';

export default function App() {
  const [view, setView] = useState('list');      // 'list' | 'brief' | 'spine'
  const [campaign, setCampaign] = useState(null); // campaña cargada en 'spine'
  const [showAI, setShowAI] = useState(false);
  const [mode, setMode] = useState('create'); // 'create' | 'mesa' | 'players'
  const [showSearch, setShowSearch] = useState(false);
  const [loreSel, setLoreSel] = useState(null);   // salto desde la búsqueda
  const [mesaSel, setMesaSel] = useState(null);
  const [createSel, setCreateSel] = useState(null);
  const undoStack = useRef([]);
  const [undoCount, setUndoCount] = useState(0);

  useEffect(() => { loadAIConfig(); }, []);

  // atajos globales: Ctrl/Cmd+K busca, Ctrl/Cmd+Z deshace (fuera de campos de texto)
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setShowSearch((v) => !v); }
      else if (mod && e.key.toLowerCase() === 'z') {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault(); undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openCampaign = (id) => { setCampaign(getCampaign(id)); setView('spine'); };

  // actualiza la campaña en curso y la persiste (apuntando el estado previo
  // en la pila de deshacer, máx. 25)
  const update = useCallback((nextOrFn) => {
    setCampaign((prev) => {
      if (prev) {
        undoStack.current.push(structuredClone(prev));
        if (undoStack.current.length > 25) undoStack.current.shift();
        setUndoCount(undoStack.current.length);
      }
      const next = typeof nextOrFn === 'function' ? nextOrFn(prev) : nextOrFn;
      saveCampaign(next);
      return { ...next };
    });
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setUndoCount(undoStack.current.length);
    saveCampaign(prev);
    setCampaign({ ...prev });
  }, []);

  // salto desde la búsqueda global
  const jump = (j) => {
    setMode(j.mode);
    if (j.coll && j.id) setLoreSel({ coll: j.coll, id: j.id, n: Date.now() });
    if (j.sessionId) setMesaSel({ id: j.sessionId, n: Date.now() });
    if (j.stage) setCreateSel({ stage: j.stage, n: Date.now() });
  };

  return (
    <>
      <BackgroundMotif />
      <div className={`app theme-${view === 'spine' ? mode : 'create'}`}>
      <div className="topbar">
        <div className="brand">Motor de Campañas<small>creación de campañas de rol — D&amp;D · Pathfinder · Cthulhu</small></div>
        <div className="row">
          {view === 'spine' && (
            <div className="modenav">
              {[['create', 'Crear'], ['lore', 'Lore'], ['gen', 'Generadores'], ['maps', 'Mapas'], ['mesa', 'Mesa'], ['cronica', 'Crónica'], ['players', 'Jugadores']].map(([k, l]) => (
                <button key={k} className={mode === k ? 'active' : ''} onClick={() => setMode(k)}>{l}</button>
              ))}
            </div>
          )}
          {view === 'spine' && <button className="ghost" onClick={() => setShowSearch(true)} title="Buscar en toda la campaña (Ctrl+K)">🔍 Buscar</button>}
          {view === 'spine' && undoCount > 0 && <button className="ghost" onClick={undo} title="Deshacer el último cambio (Ctrl+Z)">↩ Deshacer</button>}
          <button className="ghost" onClick={() => setShowAI(true)}>Ajustes de IA</button>
          {view !== 'list' && <button onClick={() => { setCampaign(null); setView('list'); setMode('create'); }}>← Mis campañas</button>}
        </div>
      </div>

      {view === 'list' && (
        <CampaignList onOpen={openCampaign} onNew={() => setView('brief')} />
      )}

      {view === 'brief' && (
        <BriefForm
          onCancel={() => setView('list')}
          onCreate={(camp) => { saveCampaign(camp); setCampaign(camp); setView('spine'); }}
        />
      )}

      {view === 'spine' && campaign && (
        mode === 'players' ? <PlayerView campaign={campaign} />
          : mode === 'cronica' ? <ChronicleView campaign={campaign} update={update} openAISettings={() => setShowAI(true)} />
          : mode === 'mesa' ? <MesaView campaign={campaign} update={update} openAISettings={() => setShowAI(true)} extSession={mesaSel} />            : mode === 'lore' ? <LoreView campaign={campaign} update={update} openAISettings={() => setShowAI(true)} extSel={loreSel} />
              : mode === 'gen' ? <GeneratorsView campaign={campaign} update={update} openAISettings={() => setShowAI(true)} />
              : mode === 'maps' ? <MapAI campaign={campaign} update={update} openAISettings={() => setShowAI(true)} />
                : <SpineView campaign={campaign} update={update} openAISettings={() => setShowAI(true)}  extStage={createSel} />
      )}

      {showAI && <AISettings onClose={() => setShowAI(false)} />}
      {showSearch && view === 'spine' && campaign && <SearchPalette campaign={campaign} onJump={jump} onClose={() => setShowSearch(false)} />}
      </div>
    </>
  );
}
