// ============================================================================
//  Proxy de generación de imágenes
//  Se llama desde el navegador a /api/generate-image (mismo origen → sin CORS).
//  La clave del usuario llega en el cuerpo y se usa solo aquí, en su máquina.
//  Proveedor por defecto: OpenAI gpt-image-1 (bueno siguiendo instrucciones y
//  con texto más legible). Fácil de ampliar a otros proveedores.
// ============================================================================

export async function generateImage({ provider = 'openai', prompt, key, size = '1536x1024' }) {
  if (!prompt) throw new Error('Falta el prompt.');
  if (!key) throw new Error('Falta la clave de imagen (configúrala en Ajustes de IA).');

  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size, n: 1 }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || `Error ${r.status} del proveedor.`);
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('El proveedor no devolvió ninguna imagen.');
    return { image: 'data:image/png;base64,' + b64 };
  }

  throw new Error('Proveedor de imágenes no soportado: ' + provider);
}

// Lee el cuerpo JSON de una petición (para el middleware de Vite, estilo connect)
export function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
