require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// 1. Configuración de Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Permitir acceso desde el frontend React
  methods: ['GET', 'POST']
}));
app.use(express.json());

// 2. Configuración de Multer (Almacenamiento en memoria)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 3. Inicialización de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY no encontrada en variables de entorno.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Constantes de Contenedores (Colombia)
const CONTENEDORES = {
  BLANCO: "Blanco (Aprovechables)",
  NEGRO: "Negro (No Aprovechables)",
  VERDE: "Verde (Orgánicos)"
};

// Modelo para Análisis (Usamos gemini-1.5-flash como reemplazo del inexistente 2.5)
const MODEL_NAME = "gemini-2.5-flash-image";

// --- RUTAS ---

/**
 * A. POST /api/analyze
 * Clasifica una imagen de residuo.
 */
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen.' });
    }

    // Convertir buffer a Base64
    const imageBase64 = req.file.buffer.toString('base64');

    // Prompt de Clasificación
    const prompt = `Analiza esta imagen de un residuo. 
        1. Identifica qué objeto es.
        2. Clasifícalo en uno de los siguientes contenedores de reciclaje de Colombia:
           - Blanco (Aprovechables): Plástico, vidrio, metales, papel, cartón.
           - Verde (Orgánicos): Restos de comida, desechos agrícolas.
           - Negro (No Aprovechables): Papel higiénico, servilletas, papeles contaminados, cartón contaminado.
        
        Responde ÚNICAMENTE con un objeto JSON válido con este formato (sin markdown):
        {
            "container": "Color del Contenedor",
            "details": {
                "confidence": "Alta/Media/Baja",
                "objectName": "Nombre del objeto",
                "reason": "Breve explicación"
            }
        }`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: imageBase64
        }
      }
    ]);

    const responseText = result.response.text();

    // Limpiar el texto para obtener solo el JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonResponse = JSON.parse(jsonMatch[0]);
      res.json(jsonResponse);
    } else {
      throw new Error("No se pudo parsear la respuesta de Gemini como JSON.");
    }

  } catch (error) {
    console.error("Error en /api/analyze:", error);
    res.status(500).json({ error: 'Error al procesar la imagen.', details: error.message });
  }
});

/**
 * B. GET /api/create
 * Genera preguntas para el cuestionario.
 * NOTA: Gemini 1.5 Flash NO genera imágenes. 
 * Simularemos la generación usando descripciones o placeholders para cumplir el requisito funcional.
 */
app.get('/api/create', async (req, res) => {
  try {
    const count = 3;
    const questions = [];
    const wasteTypes = [
      { type: "botella de plástico", container: CONTENEDORES.BLANCO },
      { type: "cáscara de banano", container: CONTENEDORES.VERDE },
      { type: "servilleta sucia", container: CONTENEDORES.NEGRO },
      { type: "lata de aluminio", container: CONTENEDORES.BLANCO },
      { type: "manzana mordida", container: CONTENEDORES.VERDE },
      { type: "papel higiénico usado", container: CONTENEDORES.NEGRO }
    ];

    // Seleccionar 3 tipos aleatorios
    const selectedWastes = [];
    while (selectedWastes.length < count) {
      const random = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
      if (!selectedWastes.includes(random)) {
        selectedWastes.push(random);
      }
    }

    // Generar "Imágenes" (URLs simuladas o placeholders)
    // En un entorno real con acceso a Imagen 3, aquí llamaríamos a la API de generación.
    // Para este MVP, usaremos un servicio de placeholders con texto.

    for (const waste of selectedWastes) {
      // Simulamos la llamada a Gemini para obtener una descripción (opcional, aquí usamos el tipo directamente)
      // const prompt = `Genera una imagen realista de: ${waste.type}`;

      // Usamos placehold.co para visualizar el "residuo"
      const imageUrl = `https://placehold.co/400x400/png?text=${encodeURIComponent(waste.type)}`;

      questions.push({
        imageUrl: imageUrl,
        correctContainer: waste.container,
        wasteName: waste.type
      });
    }

    res.json(questions);

  } catch (error) {
    console.error("Error en /api/create:", error);
    res.status(500).json({ error: 'Error al generar el cuestionario.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
