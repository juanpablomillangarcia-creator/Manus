# Motor de Campañas

Aplicación web para **tejer campañas de rol** (D&D, Pathfinder, Cthulhu…) profundas e interconectadas: una columna generativa por etapas (premisa → mundo → cronología → facciones → reparto → bestiario → misterios → verdad oculta → sesiones → tablas → ganchos), un **Lore** navegable con enlaces `[[así]]`, backlinks y borrado en cascada con aviso, **generadores procedurales**, **Mesa** para dirigir (chuleta del Director, dados, diarios de sesión) y una **Crónica** que escribe tu campaña como un libro — con dictado por voz, armonizador y lector con páginas.

- **Local-first**: tus campañas viven en tu navegador (localStorage), con instantáneas automáticas y copia completa descargable. El servidor no guarda nada.
- **IA con tu clave**: la generación usa la API de Anthropic directamente desde tu navegador con la clave que configures en *Ajustes de IA* (y OpenAI para mapas/imágenes, vía un pequeño proxy del propio servidor). Las claves no se suben a ningún sitio.

## Ejecutar en local

```bash
npm install
npm run dev        # desarrollo → http://localhost:5173
```

Producción local (lo mismo que ejecuta Render):

```bash
npm run build      # compila a dist/
npm start          # sirve dist/ + /api → http://localhost:3001
```

## Subir a GitHub

```bash
git add -A && git commit -m "Motor de Campañas"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/motor-campanas.git
git push -u origin main
```

## Desplegar en Render

**Opción A — Blueprint (recomendada).** El repo incluye `render.yaml`:
1. En [render.com](https://render.com): **New → Blueprint**.
2. Conecta tu cuenta de GitHub y elige este repositorio.
3. Render lee `render.yaml` y crea el servicio solo. Confirma y despliega.

**Opción B — Manual.** **New → Web Service**, conecta el repo y usa:

| Ajuste | Valor |
| --- | --- |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Plan | Free |

Notas:
- Render asigna el puerto vía `PORT` (el servidor ya lo lee) y da **HTTPS**, necesario para el **dictado por voz** de la Crónica (Chrome/Edge piden origen seguro para el micrófono).
- En el plan Free, el servicio se duerme tras inactividad y tarda ~1 min en despertar. No afecta a tus datos: viven en tu navegador.
- Cada `git push` a `main` redespliega automáticamente.

## Estructura

```
server/     Express: sirve dist/ y el proxy de imágenes (/api/generate-image)
src/
  model/    esquema, almacenamiento, cascada, generadores, dosier
  ai/       cliente de Anthropic, coherencia (contexto + verificador)
  spine/    etapas generativas, profundizar, guion de sesión, crónica
  ui/       vistas (Crear, Lore, Generadores, Mapas, Mesa, Crónica, Jugadores)
public/     favicon
```

## Seguridad de datos

Todo vive en el navegador donde lo uses. La app guarda **instantáneas automáticas** cada ~10 min y ofrece **Descargar copia completa** / **Restaurar** en la lista de campañas. Descarga una copia de vez en cuando, sobre todo antes de limpiar datos del navegador o cambiar de máquina.
