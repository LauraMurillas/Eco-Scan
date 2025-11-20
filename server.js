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

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurado en .env' });
    }

    // Build prompt: ask Gemini to describe image and detect any waste item
    const prompt = `Eres un asistente que analiza imágenes y detecta basura o desechos. Describe brevemente lo que aparece en la imagen y, si identificas desechos, clasifícalos en una de estas categorías EXACTAS: \n1) Residuos Aprovechables (incluye plástico, vidrio, metales, papel y cartón)\n2) Residuos Organicos Aprovechables (incluye restos de comida y desechos agrícolas)\n3) Residuos NO Aprovechables (incluye papel higiénico; servilletas, papeles y cartones contaminados con comida; papeles metalizados)\nDevuelve la respuesta en texto simple en español con: 1) descripción breve, 2) la categoría encontrada (si aplica) y 3) una o dos etiquetas (palabras) identificadas.`;

    // URL for Gemini 1.5 Flash
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64
            }
          }
        ]
      }]
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Error desde Gemini API', details: text });
    }

    const data = await response.json();

    // The response shape for Gemini 1.5 Flash
    let aiText = '';
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      aiText = data.candidates[0].content.parts[0].text;
    } else {
      aiText = JSON.stringify(data);
    }

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
