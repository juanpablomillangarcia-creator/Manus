import React, { useState, useRef, useEffect } from 'react';
import AutoTextarea from './AutoTextarea.jsx';
import BookReader from './BookReader.jsx';
import { runChronicleChapter, applyChapter, suggestStyle, chronicleToMarkdown, runHarmonize, applyHarmonize } from '../spine/chronicle.js';
import { hasApiKey, estimatedCost } from '../ai/config.js';

// ---- Dictado por voz (Web Speech API del navegador; gratis, sin clave) ----
function useDictation(onText) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recRef = useRef(null);
  const stop = () => { try { recRef.current?.stop(); } catch {} setListening(false); };
  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'es-ES'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (ev) => {
      let txt = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) txt += ev.results[i][0].transcript + ' ';
      if (txt.trim()) onText(txt.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  };
  useEffect(() => () => stop(), []);
  return { supported, listening, start, stop };
}

// La campaña escrita como un libro: capítulos de prosa generados a partir del
// lore, la cronología y lo jugado en mesa, con el estilo del género elegido.
export default function ChronicleView({ campaign, update, openAISettings }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // id de capítulo en edición
  const [narration, setNarration] = useState('');
  const [narrSession, setNarrSession] = useState('');
  const [saveToLog, setSaveToLog] = useState(true);
  const [reading, setReading] = useState(false);
  const [harmBusy, setHarmBusy] = useState(false);
  const dict = useDictation((txt) => setNarration((n) => (n ? n + ' ' : '') + txt));
  const chron = campaign.chronicle || { style: '', chapters: [] };
  const chapters = chron.chapters || [];
  const style = chron.style || suggestStyle(campaign);
  const setChron = (patch) => update((c) => ({ ...c, chronicle: { ...(c.chronicle || { style: '', chapters: [] }), ...patch } }));

  const write = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    setBusy(true);
    try {
      const ch = await runChronicleChapter({ ...campaign, chronicle: { ...chron, style } });
      update((c) => applyChapter(structuredClone(c), ch));
    } catch (e) { alert('Error al escribir el capítulo: ' + e.message); }
    finally { setBusy(false); }
  };

  const writeFromNarration = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    if (!narration.trim()) { alert('Narra o escribe primero lo que pasó en la sesión.'); return; }
    dict.stop(); setBusy(true);
    try {
      const sess = (campaign.sessions || []).find((s) => s.id === narrSession);
      const ch = await runChronicleChapter({ ...campaign, chronicle: { ...chron, style } }, { narration, sessionLabel: sess ? `la sesión ${sess.number} («${sess.title}»)` : '' });
      update((c) => {
        const next = applyChapter(structuredClone(c), ch);
        if (saveToLog && sess) next.sessions = next.sessions.map((s) => s.id === sess.id ? { ...s, log: (s.log ? s.log + '\n\n' : '') + narration.trim() } : s);
        return next;
      });
      setNarration('');
    } catch (e) { alert('Error al escribir el capítulo: ' + e.message); }
    finally { setBusy(false); }
  };

  const harmonize = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    if (!confirm('Armonizar revisa el libro ENTERO con la IA: reordena capítulos si hace falta, corrige contradicciones y cose los saltos. Reemplaza el texto actual (puedes exportar antes por si acaso). ¿Seguir?')) return;
    setHarmBusy(true);
    try {
      const p = await runHarmonize({ ...campaign, chronicle: { ...chron, style } });
      update((c) => applyHarmonize(structuredClone(c), p));
    } catch (e) { alert('Error al armonizar: ' + e.message); }
    finally { setHarmBusy(false); }
  };

  const exportMd = () => {
    const blob = new Blob([chronicleToMarkdown(campaign)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(campaign.name || 'campana').replace(/\s+/g, '-').toLowerCase()}-cronica.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  const editChapter = (id, patch) => setChron({ chapters: chapters.map((ch) => ch.id === id ? { ...ch, ...patch } : ch) });
  const delChapter = (id) => { if (confirm('¿Eliminar este capítulo? La prosa se perderá.')) setChron({ chapters: chapters.filter((ch) => ch.id !== id) }); };

  const hasPlayed = (campaign.sessions || []).some((s) => (s.log || '').trim());

  return (
    <div>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow">Crónica</div>
            <div className="small muted" style={{ marginTop: 4, lineHeight: 1.55 }}>
              Tu campaña escrita como un libro: cada capítulo narra en prosa literaria el trasfondo y lo que va ocurriendo en mesa
              (bebe de los diarios de sesión de Mesa · Recapitular). El cronista escribe desde dentro del mundo y <em>no</em> destripa
              la verdad oculta ni los secretos no revelados.
            </div>
            {!hasPlayed && chapters.length === 0 && (
              <div className="small muted" style={{ marginTop: 8 }}>
                Aún no hay diarios de sesión: el primer capítulo narrará los orígenes (la cronología) hasta el presente.
              </div>
            )}
          </div>
          <div className="row" style={{ flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {chapters.length > 0 && <button onClick={() => setReading(true)}>📖 Leer como libro</button>}
            {chapters.length > 1 && <button className="ghost" disabled={harmBusy} onClick={harmonize} title="Revisa el libro entero: reordena, corrige contradicciones y cose los saltos">{harmBusy ? 'Revisando…' : 'Armonizar libro'}</button>}
            {chapters.length > 0 && <button className="ghost" onClick={exportMd}>Exportar</button>}
            <button className="primary" disabled={busy} onClick={write} title={estimatedCost()}>
              {busy ? 'Escribiendo…' : chapters.length ? '✦ Escribir siguiente capítulo' : '✦ Escribir el primer capítulo'}
            </button>
          </div>
        </div>
        <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
          <label>Estilo de la pluma (derivado del tono; edítalo a tu gusto)</label>
          <AutoTextarea value={style} onChange={(v) => setChron({ style: v })} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, borderColor: 'var(--accent)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow">Narrar una sesión {dict.listening && <span style={{ color: 'var(--danger)' }}>● grabando</span>}</div>
            <div className="small muted" style={{ marginTop: 2 }}>Cuenta con tu voz (o por escrito) lo que pasó, y la Crónica lo novela como el siguiente capítulo, cosido con el lore.</div>
          </div>
          <div className="row">
            <select value={narrSession} onChange={(e) => setNarrSession(e.target.value)} title="¿De qué sesión es esta narración?">
              <option value="">— sesión (opcional) —</option>
              {(campaign.sessions || []).map((s) => <option key={s.id} value={s.id}>Sesión {s.number}: {s.title}</option>)}
            </select>
            {dict.supported ? (
              <button className={dict.listening ? 'danger' : ''} onClick={() => dict.listening ? dict.stop() : dict.start()}>
                {dict.listening ? '■ Parar' : '🎙 Dictar'}
              </button>
            ) : <span className="small muted" title="El dictado usa el reconocimiento de voz del navegador (Chrome/Edge). Puedes escribir igualmente.">dictado no soportado aquí</span>}
          </div>
        </div>
        <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
          <AutoTextarea value={narration} onChange={setNarration} ph="«Los jugadores llegaron al faro de madrugada; Marsh no estaba, pero encontraron su diario y a la criatura del sótano…»" />
        </div>
        <div className="row" style={{ marginTop: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <label className="small muted" style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={saveToLog} onChange={(e) => setSaveToLog(e.target.checked)} disabled={!narrSession} style={{ width: 'auto' }} />
            guardar también como diario de la sesión elegida
          </label>
          <button className="primary" disabled={busy || !narration.trim()} onClick={writeFromNarration} title={estimatedCost()}>
            {busy ? 'Escribiendo…' : '✦ Escribir capítulo de esta narración'}
          </button>
        </div>
      </div>

      {chapters.length === 0 && (
        <div className="card muted" style={{ textAlign: 'center', padding: '36px 20px' }}>
          El libro está en blanco. Cuando escribas el primer capítulo, aparecerá aquí como páginas de una crónica.
        </div>
      )}

      {chapters.map((ch, i) => (
        <article key={ch.id} className="card chronicle-page">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <h2 className="chronicle-title">Capítulo {i + 1} · {ch.title}</h2>
            <div className="row" style={{ flexShrink: 0 }}>
              <button className="ghost small" onClick={() => setEditing(editing === ch.id ? null : ch.id)}>{editing === ch.id ? 'Cerrar edición' : 'Editar'}</button>
              <button className="danger small" onClick={() => delChapter(ch.id)}>×</button>
            </div>
          </div>
          {editing === ch.id ? (
            <div style={{ marginTop: 10 }}>
              <div className="field"><label>Título</label><AutoTextarea value={ch.title} onChange={(v) => editChapter(ch.id, { title: v })} /></div>
              <div className="field"><label>Texto</label><AutoTextarea value={ch.text} onChange={(v) => editChapter(ch.id, { text: v })} /></div>
            </div>
          ) : (
            <div className="chronicle-prose">
              {String(ch.text || '').split(/\n\s*\n/).map((para, k) => <p key={k}>{para}</p>)}
            </div>
          )}
        </article>
      ))}

      {reading && <BookReader campaign={campaign} onClose={() => setReading(false)} />}
    </div>
  );
}
