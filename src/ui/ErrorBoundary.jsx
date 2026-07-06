import React from 'react';

// Red de seguridad: si algo revienta al renderizar, en vez de dejar la página
// en gris, muestra un aviso claro y opciones de recuperación. Los datos están
// a salvo en el navegador, así que recargar casi siempre resuelve.
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('Error de render capturado:', err, info); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: 24 }}>
        <div className="card">
          <div className="eyebrow">Algo se ha torcido</div>
          <h2 style={{ marginTop: 6 }}>La página encontró un error</h2>
          <p className="muted">Tus campañas están guardadas en el navegador y no se han perdido. Recarga para volver; si el error se repite en una campaña concreta, dímelo y lo arreglo.</p>
          <pre style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>{String(this.state.err?.message || this.state.err)}</pre>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="primary" onClick={() => window.location.reload()}>Recargar</button>
          </div>
        </div>
      </div>
    );
  }
}
