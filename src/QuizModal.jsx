import React, { useState, useEffect, useCallback } from 'react';
import './QuizModal.css';

const BASE_URL = import.meta.env.VITE_API_URL;

const QuizModal = ({ isOpen, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [showContinue, setShowContinue] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    const fetchQuestion = useCallback(async () => {
        setLoading(true);
        setImageLoaded(false);
        setError(null);
        setSelectedOption(null);
        setIsCorrect(null);
        setShowContinue(false);

        try {
            const response = await fetch(`${BASE_URL}/create`);
            if (!response.ok) {
                throw new Error('Error al cargar pregunta');
            }
            const data = await response.json();
            setCurrentQuestion(data);
            setQuestionCount(prev => prev + 1);
            // Note: loading will be set to false when image loads (onLoad event)
        } catch (err) {
            console.error(err);
            setError('No se pudo conectar con el servidor.');
            // Fallback mock data
            setCurrentQuestion({
                imageUrl: 'https://via.placeholder.com/300?text=Error',
                correctContainer: 'Blanco',
                wasteName: 'Item de prueba',
                justification: 'Modo demo'
            });
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setScore(0);
            setQuestionCount(0);
            setQuizFinished(false);
            setSelectedOption(null);
            setIsCorrect(null);
            setShowContinue(false);
            fetchQuestion();
        }
    }, [isOpen, fetchQuestion]);

    const handleOptionClick = (option) => {
        if (selectedOption) return; // Prevent multiple clicks

        setSelectedOption(option);

        // Backend returns e.g. "Blanco (Aprovechables)", option is "Blanco"
        // Check if the backend string starts with the option
        const correct = currentQuestion.correctContainer.startsWith(option);

        setIsCorrect(correct);
        if (correct) {
            setScore(prev => prev + 1);
        }

        // Show continue button instead of auto-advancing
        setShowContinue(true);
    };

    const handleContinue = () => {
        if (questionCount >= 3) {
            setQuizFinished(true);
        } else {
            fetchQuestion();
        }
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
        setLoading(false);
    };

    const handleFinish = () => {
        setQuizFinished(true);
    };

    if (!isOpen) return null;

    const options = ['Blanco', 'Negro', 'Verde'];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>&times;</button>

                <h2>Mini Quiz de Reciclaje</h2>

                {loading && (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p className="loading-text">Generando pregunta...</p>
                        <p className="loading-subtext">Por favor espera un momento</p>
                    </div>
                )}

                {!quizFinished && currentQuestion && (
                    <div className="quiz-container" style={{ display: loading ? 'none' : 'block' }}>
                        <div className="progress">
                            Pregunta {questionCount} | Puntuación: {score}
                        </div>

                        <img
                            src={currentQuestion.imageUrl}
                            alt="Residuo a clasificar"
                            className="quiz-image"
                            onLoad={handleImageLoad}
                        />

                        <p><strong>{currentQuestion.wasteName}</strong></p>
                        <p>¿En qué contenedor va esto?</p>

                        <div className="options-grid">
                            {options.map(option => (
                                <button
                                    key={option}
                                    className={`option-btn ${selectedOption === option
                                        ? (isCorrect ? 'correct' : 'incorrect')
                                        : ''
                                        }`}
                                    onClick={() => handleOptionClick(option)}
                                    disabled={selectedOption !== null}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {selectedOption && (
                            <div className={`feedback ${isCorrect ? 'success' : 'error'}`}>
                                <div className="feedback-result">
                                    {isCorrect ? '¡Correcto!' : `Incorrecto. Era ${currentQuestion.correctContainer}`}
                                </div>
                                {currentQuestion.justification && (
                                    <div className="feedback-justification">
                                        <strong>Justificación:</strong> {currentQuestion.justification}
                                    </div>
                                )}
                            </div>
                        )}

                        {showContinue && (
                            <div className="continue-section">
                                {questionCount < 3 ? (
                                    <button className="continue-btn" onClick={handleContinue}>
                                        Continuar
                                    </button>
                                ) : (
                                    <button className="continue-btn" onClick={handleFinish}>
                                        Ver Resultados
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {quizFinished && (
                    <div className="score-screen">
                        <h3>¡Quiz Terminado!</h3>
                        <div className="score-display">
                            Tu puntuación: {score} / {questionCount}
                        </div>
                        <button onClick={onClose}>Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizModal;
