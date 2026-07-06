// ============================================================================
//  PERSISTENCIA (local-first)
//  Fase 1: privada y solo-DM. Los datos viven en el navegador.
//  La interfaz está pensada para que un backend (cuentas/compartir) pueda
//  sustituir estas funciones sin tocar el resto de la app en fases futuras.
// ============================================================================

const KEY = 'ce.data.v1';
import { campaignToMarkdown } from './binder.js';
import { normalizeCampaign } from './schema.js';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { campaigns: {} };
  } catch {
    return { campaigns: {} };
  }
}
function writeAll(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
  catch (e) { console.warn('No se pudo guardar (almacenamiento lleno o privado):', e); return false; }
}

export function listCampaigns() {
  const db = readAll();
  return Object.values(db.campaigns)
    .map((c) => ({ id: c.id, name: c.name, archetype: c.archetype, updatedAt: c.updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getCampaign(id) {
  return normalizeCampaign(readAll().campaigns[id] || null);
}

export function saveCampaign(camp) {
  const db = readAll();
  db.campaigns[camp.id] = camp;
  writeAll(db);
  maybeSnapshot(db);
  return camp;
}

// ── Copias de seguridad automáticas ──────────────────────────────────────
// Instantáneas rotativas del almacén completo (2 ranuras), como mucho una
// cada 10 minutos. Si el navegador se queda sin espacio, falla en silencio:
// nunca debe romper un guardado normal.
const SNAP_KEYS = [KEY + '.snap.a', KEY + '.snap.b'];
const SNAP_META = KEY + '.snap.meta';
const SNAP_EVERY_MS = 10 * 60 * 1000;

function maybeSnapshot(db) {
  try {
    const meta = JSON.parse(localStorage.getItem(SNAP_META) || '{}');
    const now = Date.now();
    if (meta.last && now - meta.last < SNAP_EVERY_MS) return;
    const slot = meta.next === 1 ? 1 : 0;
    localStorage.setItem(SNAP_KEYS[slot], JSON.stringify({ at: now, db }));
    localStorage.setItem(SNAP_META, JSON.stringify({ last: now, next: slot === 0 ? 1 : 0 }));
  } catch { /* sin espacio: la copia es prescindible, el guardado no */ }
}

export function listSnapshots() {
  return SNAP_KEYS.map((k) => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      const { at, db } = JSON.parse(raw);
      return { key: k, at, campaigns: Object.keys(db.campaigns || {}).length };
    } catch { return null; }
  }).filter(Boolean).sort((a, b) => b.at - a.at);
}

export function restoreSnapshot(key) {
  const raw = localStorage.getItem(key);
  if (!raw) throw new Error('Esa copia ya no existe.');
  const { db } = JSON.parse(raw);
  if (!db || !db.campaigns) throw new Error('Copia corrupta.');
  writeAll(db);
  return Object.keys(db.campaigns).length;
}

// ── Exportar / restaurar TODO (todas las campañas en un archivo) ────────
export function exportAllData() {
  const db = readAll();
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...db }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `motor-campanas-todo-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAllFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data.campaigns !== 'object') throw new Error('No es una copia completa válida.');
        const db = readAll();
        let n = 0;
        Object.values(data.campaigns).forEach((c) => { if (c && c.id) { db.campaigns[c.id] = c; n++; } });
        writeAll(db);
        resolve(n);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}

export function deleteCampaign(id) {
  const db = readAll();
  delete db.campaigns[id];
  writeAll(db);
}

// ---- Exportar / importar (sin ataduras) ----
export function exportCampaign(camp) {
  const blob = new Blob([JSON.stringify(camp, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(camp.name || 'campana').replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBinder(camp) {
  const md = campaignToMarkdown(camp);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(camp.name || 'campana').replace(/\s+/g, '-').toLowerCase()}-dosier.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importCampaignFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !data.id || !('archetype' in data)) throw new Error('No es una campaña válida.');
        saveCampaign(data);
        resolve(data);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}
