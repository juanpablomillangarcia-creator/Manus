import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { generateImage, readJsonBody } from './server/imageProxy.js';

// Plugin: expone /api/generate-image durante `npm run dev` (mismo origen, sin CORS).
function imageProxyPlugin() {
  return {
    name: 'image-proxy',
    configureServer(server) {
      server.middlewares.use('/api/generate-image', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('POST only'); }
        const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
        try {
          const out = await generateImage(await readJsonBody(req));
          send(200, out);
        } catch (e) { send(400, { error: String(e.message || e) }); }
      });
    },
  };
}

// App local-first: los datos viven en el navegador. El server/ de Express sirve
// el build y aloja el mismo proxy de imágenes en producción.
export default defineConfig({
  plugins: [react(), imageProxyPlugin()],
  build: { outDir: 'dist' },
});
