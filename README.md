# 🌱 EcoScan - Clasificador Inteligente de Basura

**EcoScan** es una aplicación web interactiva que utiliza inteligencia artificial para ayudar a las personas a clasificar correctamente sus residuos según las normas de reciclaje de Colombia. La aplicación combina análisis de imágenes con IA, un sistema de quiz educativo y consejos ecológicos para promover prácticas sostenibles.

## ✨ Características Principales

### 📸 Clasificador de Residuos con IA
- Sube una foto de cualquier residuo
- Análisis automático usando **Google Gemini 2.5 Flash**
- Clasificación en 3 categorías según normas colombianas:
  - **Blanco (Aprovechables)**: Plástico, vidrio, metales, papel, cartón
  - **Verde (Orgánicos)**: Restos de comida, desechos agrícolas
  - **Negro (No Aprovechables)**: Papel higiénico, servilletas contaminadas
- Resultados detallados con nivel de confianza y justificación

### 🎮 Eco-Quiz Interactivo
- Quiz educativo generado dinámicamente con **Groq AI**
- Imágenes generadas por **Gemini 2.5 Flash Image**
- Sistema de puntuación en tiempo real
- Generación on-demand de preguntas (una por vez)
- Feedback inmediato con justificaciones educativas
- Botón flotante siempre accesible

### 💡 Consejos Ecológicos
- Tips diarios sobre reciclaje y medio ambiente
- Generados dinámicamente con **Groq AI**
- Consejos prácticos y motivadores
- Enfocados en acciones cotidianas

### 🎨 Diseño Moderno
- Interfaz intuitiva y atractiva
- Selector de archivos personalizado con drag & drop
- Animaciones suaves y efectos visuales
- Diseño responsive
- Gradientes y efectos modernos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Framework de UI
- **Vite** - Build tool y dev server
- **CSS3** - Estilos personalizados con animaciones

### Backend
- **Node.js** - Runtime
- **Express.js** - Framework web
- **Multer** - Manejo de archivos
- **Axios** - Cliente HTTP

### APIs de IA
- **Google Gemini 2.5 Flash** - Análisis de imágenes de residuos
- **Google Gemini 2.5 Flash Image** - Generación de imágenes para quiz
- **Groq AI** - Generación de preguntas de quiz y consejos ecológicos

## 📋 Requisitos Previos

- **Node.js** >= 16.x
- **npm** o **yarn**
- Claves de API:
  - Google Gemini API Key
  - Groq API Key

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/Eco-Scan.git
cd Eco-Scan
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
GEMINI_API_KEY=tu_clave_de_gemini
GROQ_API_KEY=tu_clave_de_groq
PORT=3000
```

### 4. Ejecutar la aplicación

**Opción 1: Script automático (Windows)**
```bash
# Ejecuta frontend y backend simultáneamente
start.bat
```

**Opción 2: Comando npm (Cualquier plataforma)**
```bash
npm start
```

**Opción 3: Manual (dos terminales)**

**Terminal 1 - Backend:**
```bash
node server.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Abrir en el navegador
```
http://localhost:5173
```


## Pruebas Unitarias y de integración

Asegurate de tener todas las dependencias instaladas
```bash
npm install
```

Luego:
```bash
npm run test:integration
```


## 📁 Estructura del Proyecto

```
Eco-Scan/
├── public/              # Archivos estáticos
├── src/
│   ├── App.jsx         # Componente principal
│   ├── App.css         # Estilos principales
│   ├── QuizModal.jsx   # Componente del quiz
│   ├── QuizModal.css   # Estilos del quiz
│   └── main.jsx        # Punto de entrada
├── server.js           # Servidor backend
├── index.html          # HTML principal
├── package.json        # Dependencias
└── .env               # Variables de entorno
```

## 🔌 Endpoints de la API

### `POST /api/analyze`
Analiza una imagen de residuo y devuelve su clasificación.

**Request:**
- `Content-Type: multipart/form-data`
- `image`: Archivo de imagen

**Response:**
```json
{
  "container": "Blanco (Aprovechables)",
  "details": {
    "objectName": "Botella de plástico",
    "confidence": "Alta",
    "reason": "Es plástico reciclable limpio"
  }
}
```

### `GET /api/create`
Genera una pregunta de quiz con imagen.

**Response:**
```json
{
  "imageUrl": "https://...",
  "wasteName": "Lata de aluminio",
  "correctContainer": "Blanco (Aprovechables)",
  "justification": "El aluminio es 100% reciclable"
}
```

### `GET /api/tips`
Obtiene un consejo ecológico aleatorio.

**Response:**
```json
{
  "tip": "Lleva tu propia bolsa reutilizable al supermercado..."
}
```


### Pruebas Unitarias
**Frontend:**

Asegurate de tener todas las dependencias intaladas
```bash
npm install
```
Luego:
```bash
npm test
```


## 🎯 Características Técnicas

- **Generación on-demand**: Las preguntas del quiz se generan una por una
- **Fallbacks robustos**: Sistema de respaldo para APIs
- **Carga optimizada**: Spinner mientras se generan imágenes
- **Estado reactivo**: Manejo eficiente con React Hooks
- **Diseño modular**: Componentes reutilizables

## 🌍 Normas de Reciclaje (Colombia)

La aplicación sigue el código de colores oficial de Colombia:

- 🤍 **Blanco**: Residuos aprovechables (reciclables)
- 💚 **Verde**: Residuos orgánicos (compostables)
- 🖤 **Negro**: Residuos no aprovechables (basura)

## 🔮 Próximas Mejoras

- [ ] Historial de clasificaciones
- [ ] Estadísticas de reciclaje personal
- [ ] Modo offline con caché
- [ ] Compartir resultados en redes sociales
- [ ] Mapa de puntos de reciclaje cercanos
- [ ] Soporte multiidioma
- [ ] App móvil nativa

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en GitHub.

---

**Hecho con 💚 para un planeta más limpio**
