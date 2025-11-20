require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require("axios");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require("groq-sdk");

const app = express();

// Configuración de Multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Inicializar clientes de IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Constantes de Contenedores (Colombia)
const CONTENEDORES = {
    BLANCO: "Blanco (Aprovechables)",
    NEGRO: "Negro (No Aprovechables)",
    VERDE: "Verde (Orgánicos)"
};

// Modelo para Análisis
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
 * Genera UNA pregunta para el cuestionario (on-demand).
 */
app.get("/api/create", async (req, res) => {
    try {
        // 1. Generar datos del quiz con Groq (solo 1 item)
        const groqPrompt = `Genera 1 objeto de basura común en Colombia para un quiz de reciclaje.
    Proporciona:
    - name: Nombre del objeto.
    - container: El contenedor correcto (Blanco, Negro, Verde) según la norma colombiana.
    - justification: Breve explicación de por qué va en ese contenedor.
    - imagePrompt: Un prompt detallado para generar una imagen fotorrealista de este objeto en fondo blanco, aislado.

    Responde ÚNICAMENTE con un objeto JSON válido (NO un array). Ejemplo:
    { "name": "Botella PET", "container": "Blanco (Aprovechables)", "justification": "Es plástico limpio.", "imagePrompt": "Una botella de plástico transparente vacía y aplastada, fondo blanco studio lighting" }`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: groqPrompt }],
            model: "openai/gpt-oss-20b",
            temperature: 0.7,
        });

        const groqResponse = chatCompletion.choices[0]?.message?.content || "{}";
        console.log("Respuesta de groq: ", groqResponse);

        // Intentar limpiar la respuesta si tiene markdown
        const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
        let itemData = null;

        if (jsonMatch) {
            try {
                itemData = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Error parseando JSON de Groq:", e);
            }
        }

        // Fallback si Groq falla o devuelve datos inválidos
        if (!itemData || !itemData.name) {
            const fallbacks = [
                { imagePrompt: "realistic photo of a crushed plastic bottle on white background", container: CONTENEDORES.BLANCO, name: "Botella de plástico", justification: "Es material reciclable." },
                { imagePrompt: "realistic photo of a banana peel on white background", container: CONTENEDORES.VERDE, name: "Cáscara de banano", justification: "Es residuo orgánico." },
                { imagePrompt: "realistic photo of an aluminum can on white background", container: CONTENEDORES.BLANCO, name: "Lata de aluminio", justification: "Es metal reciclable." }
            ];
            itemData = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        // ---- 2. Generar imagen con Gemini ----
        console.log("🖼️ Generando imagen con Gemini...");

        // Instanciar el modelo correcto
        const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        const imageResponse = await imageModel.generateContent([
            { text: itemData.imagePrompt }
        ]);

        // Extraer partes con imagen
        const parts = imageResponse.response.candidates[0].content.parts;
        const imageParts = parts.filter(p => p.inlineData);

        if (!imageParts.length) {
            throw new Error("Gemini no devolvió datos de imagen");
        }

        const base64Image = imageParts[0].inlineData.data;

        const finalUrl = `data:image/png;base64,${base64Image}`;

        const questionData = {
            imageUrl: finalUrl,
            wasteName: itemData.name,
            correctContainer: itemData.container,
            justification: itemData.justification
        };

        console.log("✅ Pregunta generada:", questionData.wasteName);
        res.json(questionData);

    } catch (error) {
        console.error("❌ Error global en /api/create:", error);
        res.status(500).json({ error: "Error generando quiz" });
    }
});

/**
 * C. GET /api/tips
 * Genera un consejo aleatorio sobre reciclaje y medio ambiente.
 */
app.get("/api/tips", async (req, res) => {
    try {
        const groqPrompt = `Genera un consejo breve y práctico sobre reciclaje, medio ambiente o cómo ayudar al planeta desde pequeñas acciones cotidianas.
    El consejo debe ser:
    - Corto (máximo 2-3 oraciones)
    - Práctico y fácil de implementar
    - Motivador y positivo
    - Relacionado con Colombia cuando sea posible
    
    Responde ÚNICAMENTE con el texto del consejo, sin formato adicional ni comillas.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: groqPrompt }],
            model: "openai/gpt-oss-20b",
            temperature: 0.8,
        });

        const tip = chatCompletion.choices[0]?.message?.content || "Recuerda separar tus residuos correctamente para facilitar el reciclaje.";
        console.log("✅ Consejo generado:", tip);

        res.json({ tip: tip.trim() });

    } catch (error) {
        console.error("❌ Error en /api/tips:", error);
        // Fallback tips
        const fallbackTips = [
            "Lleva tu propia bolsa reutilizable al supermercado y reduce el uso de plástico.",
            "Separa tus residuos en casa: aprovechables, orgánicos y no aprovechables.",
            "Reutiliza frascos de vidrio para almacenar alimentos en lugar de comprar nuevos contenedores.",
            "Apaga las luces cuando salgas de una habitación y ahorra energía.",
            "Usa una botella reutilizable en lugar de comprar botellas de plástico desechables."
        ];
        const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
        res.json({ tip: randomTip });
    }
});

// Exportar para Vercel Serverless
module.exports = app;
