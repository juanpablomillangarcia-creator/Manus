import React from 'react';
import dragonImg from '../assets/bg-dragon.png';
import cthulhuImg from '../assets/bg-cthulhu.png';

// Atmósfera de horror cósmico / abismo: campo de estrellas + nebulosas muy
// tenues (en los colores de la paleta) + un sello arcano apagado. Sutil, para
// dar ambiente sin ensuciar la lectura. Estrellas deterministas (semilla fija).
function stars(n, seed) {
  let s = seed; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return Array.from({ length: n }).map(() => ({ x: rnd() * 1400, y: rnd() * 900, r: 0.4 + rnd() * 1.5, o: 0.15 + rnd() * 0.6 }));
}
const STARS = stars(150, 9173);
const BRIGHT = stars(14, 5521);

export default function BackgroundMotif() {
  return (
    <div className="bg-motif" aria-hidden="true">
      <svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="neb-violet" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b48fd0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#b48fd0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="neb-teal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5db0ab" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#5db0ab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="neb-blood" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#cb6f63" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#cb6f63" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vign" cx="50%" cy="42%" r="75%">
            <stop offset="55%" stopColor="#12151b" stopOpacity="0" />
            <stop offset="100%" stopColor="#06080c" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* nubes de nebulosa, muy tenues */}
        <ellipse cx="300" cy="240" rx="540" ry="420" fill="url(#neb-violet)" />
        <ellipse cx="1150" cy="680" rx="560" ry="460" fill="url(#neb-teal)" />
        <ellipse cx="1080" cy="180" rx="380" ry="320" fill="url(#neb-blood)" />

        {/* campo de estrellas */}
        <g fill="#dfe6f2">
          {STARS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} opacity={p.o} />)}
        </g>
        {BRIGHT.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <circle r="6" fill="url(#star-glow)" opacity="0.5" />
            <circle r="1.1" fill="#fff" opacity="0.9" />
          </g>
        ))}

        {/* sello arcano apagado, centrado */}
        <g transform="translate(700 430)" fill="none" stroke="#cfd6e2" strokeOpacity="0.045" strokeWidth="1.3">
          <circle r="330" /><circle r="312" />
          {Array.from({ length: 60 }).map((_, i) => { const a = (i / 60) * Math.PI * 2; const r1 = 312, r2 = i % 5 === 0 ? 286 : 298; return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} />; })}
          <path d="M0,-250 L226,154 L-195,97 L243,-56 L-243,-56 L195,97 L-226,154 Z" />
          <circle r="190" strokeOpacity="0.03" />
        </g>

        <rect x="0" y="0" width="1400" height="900" fill="url(#vign)" />
      </svg>
      <img src={cthulhuImg} className="bg-creature bg-cthulhu" alt="" />
      <img src={dragonImg} className="bg-creature bg-dragon" alt="" />
    </div>
  );
}
