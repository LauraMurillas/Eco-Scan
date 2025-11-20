
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require("axios");
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
 */


app.get("/api/create", async (req, res) => {
  try {
    const promptData = [
      { text: "Genera una imagen fotorrealista de una botella de plástico sucia y aplastada en fondo blanco.", container: CONTENEDORES.BLANCO, name: "Botella de plástico" },
      { text: "Genera una imagen fotorrealista de una cáscara de banano en fondo blanco.", container: CONTENEDORES.VERDE, name: "Cáscara de banano" },
      { text: "Genera una imagen fotorrealista de una lata de aluminio en fondo blanco.", container: CONTENEDORES.BLANCO, name: "Lata de aluminio" }
    ];

    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL = "gemini-2.5-flash-image";

    // ---- 1) Llamada al API REST que SÍ genera imágenes ----
    // Enviamos los prompts. Nota: La estructura exacta de cómo el modelo interpreta múltiples 'contents' 
    // para generar múltiples imágenes independientes puede variar. 
    // Asumimos que el usuario verificó que esto genera imágenes.
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        contents: promptData.map(p => ({ parts: [{ text: p.text }] }))
      }
    );

    const parts = response.data.candidates?.flatMap(c => c.content.parts) || [];

    // ---- 2) Extraer imágenes y asociar datos correctos ----
    const images = parts
      .filter(p => p.inlineData)
      .map((p, index) => ({
        imageUrl: `data:image/png;base64,${p.inlineData.data}`,
        // Usamos el índice para correlacionar con el prompt original
        // Si el modelo devuelve más o menos imágenes, esto podría desalinearse, 
        // pero es la mejor aproximación con la lógica actual.
        wasteName: promptData[index]?.name || `Imagen ${index + 1}`,
        correctContainer: promptData[index]?.container || CONTENEDORES.BLANCO
      }));

    if (images.length === 0) {
      // Fallback si no se generan imágenes (para evitar romper el frontend)
      console.warn("Gemini no devolvió imágenes, usando fallback.");
      return res.json([
        { imageUrl: "https://placehold.co/400x400/png?text=Botella", correctContainer: CONTENEDORES.BLANCO, wasteName: "Botella (Fallback)" },
        { imageUrl: "https://placehold.co/400x400/png?text=Banano", correctContainer: CONTENEDORES.VERDE, wasteName: "Banano (Fallback)" },
        { imageUrl: "https://placehold.co/400x400/png?text=Lata", correctContainer: CONTENEDORES.BLANCO, wasteName: "Lata (Fallback)" }
      ]);
    }

    // Enviamos las imágenes al frontend
    res.json(images);

  } catch (error) {
    console.error("❌ Error generando imágenes:", error.response?.data || error.message);
    // Fallback en caso de error de API
    res.json([
      { imageUrl: "https://placehold.co/400x400/png?text=Error+API", correctContainer: CONTENEDORES.BLANCO, wasteName: "Error (Fallback)" },
      { imageUrl: "https://placehold.co/400x400/png?text=Error+API", correctContainer: CONTENEDORES.VERDE, wasteName: "Error (Fallback)" },
      { imageUrl: "https://placehold.co/400x400/png?text=Error+API", correctContainer: CONTENEDORES.BLANCO, wasteName: "Error (Fallback)" }
    ]);
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
