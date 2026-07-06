import React, { useState, useEffect } from 'react';
import AutoTextarea from './AutoTextarea.jsx';
import { newMap, newId } from '../model/schema.js';
import { callClaude } from '../ai/client.js';
import { getAIConfig, hasApiKey, hasImageKey } from '../ai/config.js';

const MAP_KINDS = [['region', 'Región'], ['ciudad', 'Ciudad'], ['pueblo', 'Pueblo / aldea'], ['castillo', 'Castillo'], ['muralla', 'Muralla / fortificación'], ['cueva', 'Interior de cueva'], ['mazmorra', 'Mazmorra'], ['puerto', 'Puerto'], ['costa', 'Costa / isla'], ['mundo', 'Mundo / continente']];
const SIZES = [['pequena', 'Pequeña (un valle)'], ['mediana', 'Mediana (una región)'], ['grande', 'Grande (un reino)']];
const STYLES = [['tinta-fantasia', 'Tinta y acuarela (Tolkien)'], ['sepia-antiguo', 'Pergamino antiguo sepia'], ['color-pintado', 'Pintado a todo color'], ['cenital-battlemap', 'Cenital realista (battlemap)'], ['isometrico', 'Isométrico estilizado'], ['lapiz', 'Boceto a lápiz']];
const STYLE_EN = { 'tinta-fantasia': 'hand-drawn fantasy map, ink linework with soft watercolor washes, Tolkien/Middle-earth cartography style, aged paper', 'sepia-antiguo': 'antique aged-parchment map, sepia tones, old-world cartography, weathered edges', 'color-pintado': 'richly painted full-color fantasy map, illustrated, vibrant', 'cenital-battlemap': 'top-down realistic battlemap, tactical, subtle grid, high detail', 'isometrico': 'isometric stylized illustrated map, clean shapes', 'lapiz': 'monochrome pencil-sketch map, hand-drawn graphite' };
const ORIENTS = [['apaisado', 'Apaisado'], ['cuadrado', 'Cuadrado'], ['vertical', 'Vertical']];
const SIZE_PX = { apaisado: '1536x1024', cuadrado: '1024x1024', vertical: '1024x1536' };
const EL_KINDS = ['río', 'camino', 'ciudad', 'pueblo', 'castillo', 'fortaleza', 'torre', 'muralla', 'cueva', 'mazmorra', 'lago', 'mar', 'puerto', 'bosque', 'montañas', 'colinas', 'pantano', 'desierto', 'ruinas', 'puente', 'isla', 'distrito', 'marcador'];
const POS = [['', '—'], ['centro', 'centro'], ['arriba', 'arriba (norte)'], ['abajo', 'abajo (sur)'], ['izquierda', 'izquierda (oeste)'], ['derecha', 'derecha (este)'], ['sup-izq', 'esq. sup. izq.'], ['sup-der', 'esq. sup. der.'], ['inf-izq', 'esq. inf. izq.'], ['inf-der', 'esq. inf. der.'], ['fondo', 'al fondo'], ['primer-plano', 'primer plano']];
const POS_EN = { centro: 'center', arriba: 'top (north)', abajo: 'bottom (south)', izquierda: 'left (west)', derecha: 'right (east)', 'sup-izq': 'top-left corner', 'sup-der': 'top-right corner', 'inf-izq': 'bottom-left corner', 'inf-der': 'bottom-right corner', fondo: 'far background', 'primer-plano': 'foreground' };

// Normaliza cualquier mapa (incluidos los del editor antiguo, ya retirado) al
// formato actual, para que el render nunca se rompa por campos ausentes.
function normalizeMap(m) {
  return {
    id: m.id || newId('map'),
    name: m.name || 'Mapa',
    source: m.source || 'manual',
    kind: MAP_KINDS.some((k) => k[0] === m.kind) ? m.kind : 'region',
    size: SIZES.some((s) => s[0] === m.size) ? m.size : 'mediana',
    style: STYLES.some((s) => s[0] === m.style) ? m.style : 'tinta-fantasia',
    orientation: ORIENTS.some((o) => o[0] === m.orientation) ? m.orientation : 'apaisado',
    notes: typeof m.notes === 'string' ? m.notes : '',
    elements: Array.isArray(m.elements) ? m.elements : [],
    prompt: typeof m.prompt === 'string' ? m.prompt : '',
    image: typeof m.image === 'string' ? m.image : '',
  };
}

export default function MapAI({ campaign, update, openAISettings }) {
  const maps = campaign.maps || [];
  const [mapId, setMapId] = useState(maps[0]?.id || null);
  const [busy, setBusy] = useState('');
  const raw = maps.find((m) => m.id === mapId) || null;
  const map = raw ? normalizeMap(raw) : null;

  // Migra de una vez los mapas con formato antiguo guardados en el navegador.
  useEffect(() => {
    const ms = campaign.maps || [];
    if (ms.some((m) => !Array.isArray(m.elements))) {
      update((c) => ({ ...c, maps: (c.maps || []).map(normalizeMap) }));
    }
  }, []); // eslint-disable-line

  const patch = (fn) => update((c) => ({ ...c, maps: c.maps.map((m) => m.id === mapId ? fn(normalizeMap(m)) : m) }));
  const createMap = () => { const m = newMap({ orientation: 'apaisado' }); update((c) => ({ ...c, maps: [...(c.maps || []), m] })); setMapId(m.id); };
  const deleteMap = () => { if (!confirm('¿Borrar este mapa?')) return; update((c) => ({ ...c, maps: c.maps.filter((m) => m.id !== mapId) })); setMapId(null); };

  const placeName = (id) => (campaign.places.find((p) => p.id === id) || {}).name || '';
  const addEl = (preset = {}) => patch((m) => ({ ...m, elements: [...m.elements, { id: newId('el'), kind: 'río', placeId: '', text: '', named: true, pos: '', relation: '', ...preset }] }));
  const editEl = (id, p) => patch((m) => ({ ...m, elements: m.elements.map((e) => e.id === id ? { ...e, ...p } : e) }));
  const delEl = (id) => patch((m) => ({ ...m, elements: m.elements.filter((e) => e.id !== id) }));
  const populateFromLore = () => {
    const places = (campaign.places || []).filter((p) => !p.parentId).slice(0, 20);
    if (!places.length) { alert('No hay lugares en el lore.'); return; }
    const guess = (k) => { k = (k || '').toLowerCase(); return /ciudad|capital/.test(k) ? 'ciudad' : /castillo|fortal/.test(k) ? 'castillo' : /pueblo|aldea/.test(k) ? 'pueblo' : /cueva/.test(k) ? 'cueva' : /bosque/.test(k) ? 'bosque' : /monta/.test(k) ? 'montañas' : /lago|mar|puerto/.test(k) ? 'puerto' : 'ciudad'; };
    patch((m) => ({ ...m, elements: [...m.elements, ...places.map((p) => ({ id: newId('el'), kind: guess(p.kind), placeId: p.id, text: '', named: true, pos: '', relation: '' }))] }));
  };

  const buildSpec = (m) => {
    const lines = m.elements.map((e) => {
      const name = e.placeId ? placeName(e.placeId) : e.text;
      const lbl = e.named ? (name ? `labeled exactly "${name}"` : 'with a label') : 'with NO label';
      const pos = e.pos ? `, positioned ${POS_EN[e.pos]}` : '';
      const rel = e.relation ? `, note: ${e.relation}` : '';
      return `- ${e.kind}${name ? ` (${name})` : ''}, ${lbl}${pos}${rel}`;
    }).join('\n');
    return `MAP TYPE: ${(MAP_KINDS.find((k) => k[0] === m.kind) || [])[1]}\nSCOPE: ${(SIZES.find((s) => s[0] === m.size) || [])[1] || m.size}\nART STYLE: ${STYLE_EN[m.style] || m.style}\n${m.notes ? `EXTRA NOTES: ${m.notes}\n` : ''}ELEMENTS (place each exactly as described):\n${lines || '- (none yet)'}`;
  };

  const compile = async () => {
    if (!hasApiKey()) { openAISettings(); return; }
    setBusy('compile');
    try {
      const { text } = await callClaude({
        system: 'You are a world-class prompt engineer for fantasy MAP image generation. You turn a structured spec into ONE single, detailed English prompt for an image model. Rules: honor each element\'s described position and spatial relationship; render legible labels ONLY for elements marked with a label, using the EXACT given spelling; elements marked "NO label" must carry no text at all; any feature that "leaves the map" must be shown entering/exiting the frame edge WITHOUT depicting the off-map place; match the requested art style precisely; add tasteful cartographic framing (decorative border, compass rose) only if it suits the style; explicitly discourage random gibberish text and invented extra labels. Output ONLY the final prompt, with no preamble, no quotes, no explanation.',
        userPrompt: `Build the image prompt from this spec:\n\n${buildSpec(map)}`,
        maxTokens: 900,
      });
      patch((m) => ({ ...m, prompt: text.trim() }));
    } catch (e) { alert('Error al compilar el prompt: ' + e.message); }
    finally { setBusy(''); }
  };

  const generate = async () => {
    if (!hasImageKey()) { openAISettings(); return; }
    if (!map.prompt) { alert('Primero compila el prompt maestro.'); return; }
    setBusy('image');
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', prompt: map.prompt, key: getAIConfig().imageKey, size: SIZE_PX[map.orientation] || '1536x1024' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error del servidor de imágenes.');
      patch((m) => ({ ...m, image: data.image }));
    } catch (e) { alert('No se pudo generar la imagen: ' + e.message + '\n\n(Necesitas tu clave de OpenAI en Ajustes de IA y la app corriendo con npm run dev o npm start.)'); }
    finally { setBusy(''); }
  };

  if (!map) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Mapas (IA)</h2>
        {maps.length > 0 && <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>{maps.map((m) => <button key={m.id} onClick={() => setMapId(m.id)}>{m.name}</button>)}</div>}
        <div className="card">
          <p className="muted">Describe el mapa y sus elementos (enlazados a tu lore), Claude redacta un prompt maestro muy específico y se genera la imagen con un modelo de alta calidad.</p>
          <button className="primary" onClick={createMap}>+ Nuevo mapa</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 420px', minWidth: 320 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div className="row" style={{ gap: 6 }}>
            <select value={mapId} onChange={(e) => setMapId(e.target.value)}>{maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <button className="ghost small" onClick={createMap}>+ Nuevo</button>
            <button className="danger small" onClick={deleteMap}>Borrar</button>
          </div>
        </div>

        <div className="card">
          <div className="field"><label>Nombre</label><input value={map.name} onChange={(e) => patch((m) => ({ ...m, name: e.target.value }))} /></div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 160px' }}><label>Tipo</label><select value={map.kind} onChange={(e) => patch((m) => ({ ...m, kind: e.target.value }))}>{MAP_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div className="field" style={{ flex: '1 1 160px' }}><label>Alcance</label><select value={map.size} onChange={(e) => patch((m) => ({ ...m, size: e.target.value }))}>{SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div className="field" style={{ flex: '1 1 160px' }}><label>Estilo</label><select value={map.style} onChange={(e) => patch((m) => ({ ...m, style: e.target.value }))}>{STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div className="field" style={{ flex: '1 1 120px' }}><label>Formato</label><select value={map.orientation} onChange={(e) => patch((m) => ({ ...m, orientation: e.target.value }))}>{ORIENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <div className="field"><label>Notas de ambiente (opcional)</label><AutoTextarea value={map.notes} onChange={(v) => patch((m) => ({ ...m, notes: v }))} ph="invierno, atardecer, montañoso…" /></div>

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <label style={{ margin: 0 }}>Elementos del mapa</label>
            <div className="row"><button className="ghost small" onClick={populateFromLore}>⌖ Desde lore</button><button className="small" onClick={() => addEl()}>+ Elemento</button></div>
          </div>
          {map.elements.length === 0 && <div className="small muted" style={{ margin: '6px 0' }}>Añade ríos, caminos, ciudades, una torre al fondo, una cueva con nombre… cada uno con su posición y su relación.</div>}
          {map.elements.map((e) => (
            <div className="item" key={e.id}>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                <select value={e.kind} onChange={(ev) => editEl(e.id, { kind: ev.target.value })} style={{ flex: '0 0 120px' }}>{EL_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
                <select value={e.placeId} onChange={(ev) => editEl(e.id, { placeId: ev.target.value })} style={{ flex: '1 1 140px' }}>
                  <option value="">— del lore o libre —</option>
                  {campaign.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {!e.placeId && <input placeholder="nombre / descripción" value={e.text} onChange={(ev) => editEl(e.id, { text: ev.target.value })} style={{ flex: '1 1 140px' }} />}
              </div>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 5, alignItems: 'center' }}>
                <label className="row small" style={{ gap: 4, margin: 0 }}><input type="checkbox" checked={e.named} onChange={(ev) => editEl(e.id, { named: ev.target.checked })} /> con nombre</label>
                <select value={e.pos} onChange={(ev) => editEl(e.id, { pos: ev.target.value })} style={{ flex: '0 0 130px' }}>{POS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                <input placeholder='relación ("hasta el puerto", "sale del mapa al oeste")' value={e.relation} onChange={(ev) => editEl(e.id, { relation: ev.target.value })} style={{ flex: '1 1 160px' }} />
                <button className="danger" onClick={() => delEl(e.id)}>×</button>
              </div>
            </div>
          ))}

          <div className="row" style={{ marginTop: 12 }}>
            <button className="primary" disabled={busy === 'compile'} onClick={compile}>{busy === 'compile' ? 'Redactando…' : '✦ Compilar prompt maestro'}</button>
          </div>
        </div>

        {map.prompt && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="eyebrow">Prompt maestro (editable)</div>
              <button className="ghost small" onClick={() => navigator.clipboard?.writeText(map.prompt)}>Copiar</button>
            </div>
            <AutoTextarea value={map.prompt} onChange={(v) => patch((m) => ({ ...m, prompt: v }))} style={{ fontSize: 13 }} />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="primary" disabled={busy === 'image'} onClick={generate}>{busy === 'image' ? 'Generando imagen…' : '🗺 Generar mapa'}</button>
              {!hasImageKey() && <span className="small muted">Necesita tu clave de OpenAI en Ajustes de IA.</span>}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 360px', minWidth: 300 }}>
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Resultado</div>
          {map.image
            ? <><img src={map.image} alt={map.name} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--line)' }} />
              <div className="row" style={{ marginTop: 8 }}><a href={map.image} download={`${map.name}.png`}><button>Descargar</button></a><button onClick={generate} disabled={busy === 'image'}>Regenerar</button></div></>
            : <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Aún sin imagen. Define los elementos, compila el prompt y genera.</div>}
        </div>
        <div className="small muted" style={{ marginTop: 8 }}>
          Aviso honesto: ni el mejor modelo coloca cada elemento con precisión milimétrica ni rotula siempre perfecto. El flujo es <strong>generar → regenerar → quedarte con la buena</strong>. Para nombres exactos, gpt-image-1 es de lo mejor, pero conviene revisarlos.
        </div>
      </div>
    </div>
  );
}
