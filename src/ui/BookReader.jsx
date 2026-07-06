import React, { useMemo, useState, useEffect } from 'react';

// ============================================================================
//  LECTOR DE LIBRO: la Crónica como un libro de verdad, página a página.
//  Pagina la prosa por párrafos (respetando capítulos), portada, animación de
//  paso de página y navegación con flechas / teclado.
// ============================================================================

const CHARS_PER_PAGE = 1150;

// Divide los capítulos en páginas. Cada página: { kind:'cover'|'chapter'|'text', ... }
function paginate(campaign) {
  const chs = campaign.chronicle?.chapters || [];
  const pages = [{ kind: 'cover', title: `Crónica de ${campaign.name || 'la campaña'}`, sub: (campaign.pitch || campaign.premise || '').slice(0, 160) }];
  chs.forEach((ch, ci) => {
    const paras = String(ch.text || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
    let buf = [], len = 0, first = true;
    const flush = () => {
      if (!buf.length) return;
      pages.push({ kind: 'text', chapter: ci + 1, chTitle: ch.title, paras: buf, opensChapter: first });
      first = false; buf = []; len = 0;
    };
    paras.forEach((para) => {
      // párrafos larguísimos: trocear por frases
      if (para.length > CHARS_PER_PAGE) {
        const sentences = para.match(/[^.!?…]+[.!?…]+["»]?\s*/g) || [para];
        let chunk = '';
        sentences.forEach((sen) => {
          if ((chunk + sen).length > CHARS_PER_PAGE - 100 && chunk) {
            if (len + chunk.length > CHARS_PER_PAGE && buf.length) flush();
            buf.push(chunk.trim()); len += chunk.length; chunk = '';
            if (len > CHARS_PER_PAGE - 200) flush();
          }
          chunk += sen;
        });
        if (chunk.trim()) {
          if (len + chunk.length > CHARS_PER_PAGE && buf.length) flush();
          buf.push(chunk.trim()); len += chunk.length;
        }
      } else {
        if (len + para.length > CHARS_PER_PAGE && buf.length) flush();
        buf.push(para); len += para.length;
      }
    });
    flush();
  });
  return pages;
}

export default function BookReader({ campaign, onClose }) {
  const pages = useMemo(() => paginate(campaign), [campaign]);
  const [idx, setIdx] = useState(0);
  const [turn, setTurn] = useState(null); // 'next' | 'prev' (animación)

  const go = (dir) => {
    const n = idx + dir;
    if (n < 0 || n >= pages.length) return;
    setTurn(dir > 0 ? 'next' : 'prev');
    setTimeout(() => { setIdx(n); setTurn(null); }, 190);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pg = pages[idx];
  return (
    <div className="book-overlay" onClick={onClose}>
      <div className="book-frame" onClick={(e) => e.stopPropagation()}>
        <button className="book-close" onClick={onClose} title="Cerrar (Esc)">×</button>

        <div className={'book-page' + (pg.kind === 'cover' ? ' book-cover' : '') + (turn ? ` turning-${turn}` : '')} onClick={() => go(1)} title="Clic o → para pasar página">
          {pg.kind === 'cover' ? (
            <div className="book-cover-inner">
              <div className="book-ornament">✦ ✦ ✦</div>
              <h1>{pg.title}</h1>
              {pg.sub && <p className="book-cover-sub">{pg.sub}</p>}
              <div className="book-ornament" style={{ marginTop: 'auto' }}>✦</div>
            </div>
          ) : (
            <>
              {pg.opensChapter && (
                <div className="book-chapter-head">
                  <div className="book-chapter-num">Capítulo {pg.chapter}</div>
                  <div className="book-chapter-title">{pg.chTitle}</div>
                </div>
              )}
              {!pg.opensChapter && <div className="book-running-head">{pg.chTitle}</div>}
              <div className={'book-text' + (pg.opensChapter ? ' with-dropcap' : '')}>
                {pg.paras.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="book-folio">{idx}</div>
            </>
          )}
        </div>

        <div className="book-nav">
          <button disabled={idx === 0} onClick={() => go(-1)}>← Anterior</button>
          <span className="book-count">{idx === 0 ? 'Portada' : `Página ${idx} de ${pages.length - 1}`}</span>
          <button disabled={idx >= pages.length - 1} onClick={() => go(1)}>Siguiente →</button>
        </div>
      </div>
    </div>
  );
}
