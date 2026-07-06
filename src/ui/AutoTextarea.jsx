import React from 'react';

// Caja de texto que crece para mostrar TODO el contenido: nada de scroll
// interno ni de tener que arrastrar la rueda para leer.
export default function AutoTextarea({ value, onChange, ph, mono, style, readOnly }) {
  const ref = React.useRef(null);
  const fit = () => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } };
  React.useEffect(fit, [value]);
  React.useEffect(() => { const f = () => fit(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return (
    <textarea
      ref={ref} rows={1} value={value ?? ''} placeholder={ph} readOnly={readOnly}
      onChange={(e) => onChange && onChange(e.target.value)}
      style={{ overflow: 'hidden', resize: 'none', minHeight: 0, ...(mono ? { fontFamily: 'var(--mono)', fontSize: 13 } : {}), ...style }}
    />
  );
}
