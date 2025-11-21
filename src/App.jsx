import React, { useState, useEffect } from 'react';
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
    const [ecoTip, setEcoTip] = useState('Cargando consejo...');

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

    // Fetch eco tip on component mount
    useEffect(() => {
        const fetchTip = async () => {
            try {
                const response = await fetch(`${BASE_URL}/tips`);
                const data = await response.json();
                setEcoTip(data.tip);
            } catch (err) {
                console.error('Error fetching tip:', err);
                setEcoTip('Recuerda separar tus residuos para facilitar el reciclaje.');
            }
        };
        fetchTip();
    }, []);

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">EcoScan</h1>
                <p className="app-subtitle">Clasificador de Desechos</p>
            </header>

            <div className="eco-tip-section">
                <div className="tip-icon">💡</div>
                <p className="tip-text">{ecoTip}</p>
            </div>

            <div className="upload-section">
                <label htmlFor="file-upload" className="file-upload-label">
                    <div className="upload-icon">📁</div>
                    <p className="upload-text">
                        {selectedFile ? selectedFile.name : 'Selecciona una imagen'}
                    </p>
                    <p className="upload-subtext">
                        o arrastra y suelta aquí
                    </p>
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input-hidden"
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
                    <p><strong>Objeto:</strong> {classificationResult.details?.objectName}</p>
                    <p><strong>Contenedor:</strong> {classificationResult.container}</p>
                    <p><strong>Razón:</strong> {classificationResult.details?.reason}</p>
                    <p><strong>Confianza:</strong> {classificationResult.details?.confidence}</p>
                </div>
            )}

            <QuizModal
                isOpen={isQuizOpen}
                onClose={() => setIsQuizOpen(false)}
            />

            {/* Floating Quiz Button */}
            <button
                className="floating-quiz-btn"
                onClick={() => setIsQuizOpen(true)}
                title="Jugar Quiz de Reciclaje"
            >
                🎮 Eco-Quiz
            </button>
        </div>
    );
}

export default App;
