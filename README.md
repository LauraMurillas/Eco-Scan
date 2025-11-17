# Reconocimiento de Residuos con Gemini 2.5 Flash Image (local)

Esta es una app sencilla para subir una imagen, enviarla a la API Gemini 2.5 Flash Image y recibir una descripción junto con una clasificación heurística de residuos.

Características
- Interfaz minimal: subir imagen desde el ordenador, ver previsualización y resultado.
- Backend Express que envía la imagen a la API Gemini (configurable) y devuelve texto interpretado.
- Clasificación local en 3 categorías (aprovechables, orgánicos, no aprovechables).

Requisitos
- Node.js (>=16)
- Cuenta/credenciales para la API Gemini 2.5 Flash Image (proporciona `GEMINI_API_URL` y `GEMINI_API_KEY`).

Setup y ejecución (local)

1) Copia `.env.example` a `.env` y completa las variables:

```
GEMINI_API_URL=https://your-gemini-image-endpoint
GEMINI_API_KEY=YOUR_API_KEY
PORT=3000
```

Nota: La URL y el formato exacto de la petición pueden variar dependiendo del proveedor/versión de la API. Este proyecto usa un cuerpo JSON con `model: "gemini-2.5-flash"`, un campo `image.content` con base64 y `prompt` con instrucciones. Ajusta `server.js` si tu endpoint requiere otro esquema (multipart, fields con nombre diferente, etc.).

2) Instala dependencias:

```powershell
npm install
```

3) Ejecuta en desarrollo:

```powershell
npm run dev
```

4) Abre en tu navegador:

```
http://localhost:3000
```

Notas importantes
- La integración con Gemini aquí es genérica. Si usas la API de Google Generative AI (o un SDK), adapta `GEMINI_API_URL` y el formato del body en `server.js` según la documentación oficial.
- Mantén tu `GEMINI_API_KEY` en variables de entorno. No la subas al repositorio.

Siguientes pasos opcionales (puedo implementarlos):
- Mejorar el análisis de la respuesta de Gemini para extraer etiquetas/score.
- Añadir autenticación y límites por usuario.
- Sustituir heurística simple por un mapeo más robusto (p.ej. usar clasificación ML extra).
- Empaquetar con Docker.

Si quieres, continúo con:
- Ejecutar pruebas locales y probar la llamada real a Gemini (necesitaré tu `GEMINI_API_URL` y `GEMINI_API_KEY` o instrucciones para obtenerlas).
- Convertir a TypeScript y/o Next.js si prefieres.
