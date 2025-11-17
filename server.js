require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Helper: classify based on returned text
function classifyText(text) {
  const lower = text.toLowerCase();

  // categories keywords
  const aprovechables = ["plástico", "plastico", "vidrio", "metal", "metales", "papel", "cartón", "carton", "lata", "botella"];
  const organicos = ["comida", "resto", "restos", "orgánico", "organico", "fruta", "vegetal", "cáscara", "cascar", "hojas", "desechos agrícolas", "agricol"];
  const noAprovechables = ["papel higiénico", "servilleta", "servilletas", "papel contaminado", "papel metalizado", "papel metalico", "papeles contaminados", "cartón contaminado", "carton contaminado"];

  for (const k of aprovechables) {
    if (lower.includes(k)) return "Residuos Aprovechables (plástico, vidrio, metales, papel y cartón)";
  }
  for (const k of organicos) {
    if (lower.includes(k)) return "Residuos Organicos Aprovechables (restos de comida y desechos agrícolas)";
  }
  for (const k of noAprovechables) {
    if (lower.includes(k)) return "Residuos NO Aprovechables (papel higiénico; servilletas; papeles y cartones contaminados; papeles metalizados)";
  }
  return "No se reconoció un desecho claro en la imagen.";
}

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen.' });

    const buffer = req.file.buffer;
    const base64 = buffer.toString('base64');

    const GEMINI_API_URL = process.env.GEMINI_API_URL || '';
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

    if (!GEMINI_API_URL || !GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_URL o GEMINI_API_KEY no configurados en .env' });
    }

    // Build prompt: ask Gemini to describe image and detect any waste item
    const prompt = `Eres un asistente que analiza imágenes y detecta basura o desechos. Describe brevemente lo que aparece en la imagen y, si identificas desechos, clasifícalos en una de estas categorías EXACTAS: \n1) Residuos Aprovechables (incluye plástico, vidrio, metales, papel y cartón)\n2) Residuos Organicos Aprovechables (incluye restos de comida y desechos agrícolas)\n3) Residuos NO Aprovechables (incluye papel higiénico; servilletas, papeles y cartones contaminados con comida; papeles metalizados)\nDevuelve la respuesta en texto simple en español con: 1) descripción breve, 2) la categoría encontrada (si aplica) y 3) una o dos etiquetas (palabras) identificadas.`;

    // NOTE: the exact Gemini Image API HTTP format may vary. Here we send a JSON body with model and image content.
    // Adjust GEMINI_API_URL to the correct Google Generative API endpoint for 'gemini-2.5-flash' Image.

    const body = {
      model: 'gemini-2.5-flash',
      // This key name may need to be adapted depending on the exact Gemini image endpoint.
      // We include the image as base64 and a text prompt for image understanding.
      image: {
        content: base64
      },
      prompt: prompt
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Error desde Gemini API', details: text });
    }

    const data = await response.json();

    // The response shape can vary. We try common fields then fallback.
    let aiText = '';
    if (data.output && typeof data.output === 'string') aiText = data.output;
    else if (data.output && Array.isArray(data.output) && data.output.length > 0) aiText = data.output[0].content || JSON.stringify(data.output[0]);
    else if (data.result && typeof data.result === 'string') aiText = data.result;
    else aiText = JSON.stringify(data);

    const classification = classifyText(aiText);

    res.json({ description: aiText, classification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno', details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
