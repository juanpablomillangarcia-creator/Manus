// ============================================================================
//  MÓDULO 5e (activable)
//  Matemática de encuentros: umbrales de XP por nivel, XP por CR y multiplicador
//  por número de enemigos (DMG). Núcleo agnóstico intacto: esto solo se usa si
//  campaign.system === '5e'.
// ============================================================================

// Umbrales de XP por nivel de personaje: [fácil, media, difícil, mortal]
export const XP_THRESHOLDS = {
  1: [25, 50, 75, 100], 2: [50, 100, 150, 200], 3: [75, 150, 225, 400],
  4: [125, 250, 375, 500], 5: [250, 500, 750, 1100], 6: [300, 600, 900, 1400],
  7: [350, 750, 1100, 1700], 8: [450, 900, 1400, 2100], 9: [550, 1100, 1600, 2400],
  10: [600, 1200, 1900, 2800], 11: [800, 1600, 2400, 3600], 12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100], 14: [1250, 2500, 3800, 5700], 15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200], 17: [2000, 3900, 5900, 8800], 18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900], 20: [2800, 5700, 8500, 12700],
};

// XP por CR
export const CR_XP = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900,
  '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000,
  '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000,
  '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
  '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
};

export const CR_LIST = Object.keys(CR_XP);

export const crToXp = (cr) => CR_XP[String(cr)] ?? 0;

// Multiplicador de XP por número de enemigos (DMG)
export function encounterMultiplier(n) {
  if (n <= 1) return 1;
  if (n === 2) return 1.5;
  if (n <= 6) return 2;
  if (n <= 10) return 2.5;
  if (n <= 14) return 3;
  return 4;
}

const clampLevel = (l) => Math.max(1, Math.min(20, Math.round(l) || 1));

// Presupuesto del grupo: suma de umbrales de cada PJ → { easy, medium, hard, deadly }
export function partyBudget(levels) {
  const sum = [0, 0, 0, 0];
  levels.forEach((l) => { const t = XP_THRESHOLDS[clampLevel(l)]; for (let i = 0; i < 4; i++) sum[i] += t[i]; });
  return { easy: sum[0], medium: sum[1], hard: sum[2], deadly: sum[3] };
}

// Evalúa un encuentro: lista de monstruos [{ cr }] contra los niveles del grupo
export function evaluateEncounter(levels, monsters) {
  const rawXP = monsters.reduce((a, m) => a + crToXp(m.cr), 0);
  const mult = encounterMultiplier(monsters.length);
  const adjustedXP = Math.round(rawXP * mult);
  const budget = partyBudget(levels);
  let difficulty = 'Trivial';
  if (adjustedXP >= budget.deadly) difficulty = 'Mortal';
  else if (adjustedXP >= budget.hard) difficulty = 'Difícil';
  else if (adjustedXP >= budget.medium) difficulty = 'Media';
  else if (adjustedXP >= budget.easy) difficulty = 'Fácil';
  return { rawXP, adjustedXP, multiplier: mult, budget, difficulty };
}

export const DIFFICULTY_COLOR = {
  Trivial: '#6b6b73', 'Fácil': '#3f7d56', Media: '#b5852f', 'Difícil': '#c2691f', Mortal: '#b0413e',
};
