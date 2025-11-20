import React, { useState } from 'react';
import './App.css';
import QuizModal from './QuizModal';

const BASE_URL = 'http://localhost:3000/api';

function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [classificationResult, setClassificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isQuizOpen, setIsQuizOpen] = useState(false);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setClassificationResult(null);
            setError(null);
        }
    };

    const handleClassify = async () => {
        if (!selectedFile) {
            setError('Por favor, selecciona una imagen primero.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setClassificationResult(null);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await fetch(`${BASE_URL}/analyze`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Error en la clasificación');
            }

            const data = await response.json();
            setClassificationResult(data);
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error al clasificar la imagen. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            <h1>Eco-Scan: Clasificador de Basura</h1>

            <div className="upload-section">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {previewUrl && (
                    <img src={previewUrl} alt="Vista previa" className="preview-image" />
                )}

                <button
                    onClick={handleClassify}
                    disabled={!selectedFile || isLoading}
                >
                    {isLoading ? 'Clasificando...' : 'Clasificar Basura'}
                </button>

                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>

            {classificationResult && (
                <div className="result-section">
                    <h2>Resultado:</h2>
                    <p><strong>Descripción:</strong> {classificationResult.description}</p>
                    <p><strong>Categoría:</strong> {classificationResult.classification}</p>
                </div>
            )}

            <div className="quiz-trigger">
                <p>¿Quieres poner a prueba tus conocimientos?</p>
                <button onClick={() => setIsQuizOpen(true)}>
                    Jugar Quiz de Reciclaje
                </button>
            </div>

            <QuizModal
                isOpen={isQuizOpen}
                onClose={() => setIsQuizOpen(false)}
            />
        </div>
    );
}

export default App;
