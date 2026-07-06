// ============================================================================
//  Servidor mínimo (Express)
//  Fase 1: solo sirve el build de Vite (carpeta dist/). Queda como punto de
//  anclaje para cuentas / compartir / sincronización en fases futuras
//  (mismo enfoque que ARCANUM: SQLite local / Postgres-Neon en la nube).
// ============================================================================
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateImage } from './imageProxy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '20mb' }));
app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

app.post('/api/generate-image', async (req, res) => {
  try { res.json(await generateImage(req.body || {})); }
  catch (e) { res.status(400).json({ error: String(e.message || e) }); }
});

// (Fase futura) aquí montarán /api/register, /api/login, /api/documents, /api/shared…

const dist = path.join(__dirname, '..', 'dist');
// Los assets de Vite llevan hash en el nombre → caché larga e inmutable.
// El index.html NUNCA se cachea (si no, los usuarios no verían versiones nuevas).
app.use(express.static(dist, { index: false, maxAge: '1y', immutable: true }));
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, () => console.log(`[motor-campanas] http://localhost:${PORT}`));
