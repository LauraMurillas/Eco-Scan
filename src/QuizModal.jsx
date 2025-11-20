import React, { useState, useEffect, useCallback } from 'react';
import './QuizModal.css';

const BASE_URL = 'http://localhost:3000/api';

const QuizModal = ({ isOpen, onClose }) => {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [quizFinished, setQuizFinished] = useState(false);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${BASE_URL}/create?count=3`);
            if (!response.ok) {
                throw new Error('Error al cargar preguntas');
            }
            const data = await response.json();
            // Ensure data is an array
            if (Array.isArray(data)) {
                setQuestions(data);
            } else {
                // Fallback mock data if API returns something else or fails
                console.warn('API did not return an array, using mock data');
                setQuestions([
                    { imageUrl: 'https://via.placeholder.com/300?text=Botella+Plastico', correctContainer: 'Amarillo' },
                    { imageUrl: 'https://via.placeholder.com/300?text=Manzana', correctContainer: 'Verde' },
                    { imageUrl: 'https://via.placeholder.com/300?text=Papel', correctContainer: 'Azul' }
                ]);
            }
        } catch (err) {
            console.error(err);
            setError('No se pudo conectar con el servidor de preguntas. Usando modo demo.');
            // Fallback mock data for demo purposes if backend is missing
            setQuestions([
                { imageUrl: 'https://via.placeholder.com/300?text=Botella+Plastico', correctContainer: 'Amarillo' },
                { imageUrl: 'https://via.placeholder.com/300?text=Manzana', correctContainer: 'Verde' },
                { imageUrl: 'https://via.placeholder.com/300?text=Papel', correctContainer: 'Azul' }
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setCurrentIndex(0);
            setScore(0);
            setQuizFinished(false);
            setSelectedOption(null);
            setIsCorrect(null);
            fetchQuestions();
        }
    }, [isOpen, fetchQuestions]);

    const handleOptionClick = (option) => {
        if (selectedOption) return; // Prevent multiple clicks

        setSelectedOption(option);
        const currentQuestion = questions[currentIndex];
        const correct = option === currentQuestion.correctContainer;

        setIsCorrect(correct);
        if (correct) {
            setScore(prev => prev + 1);
        }

        // Wait a bit before moving to next question
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsCorrect(null);
            } else {
                setQuizFinished(true);
            }
        }, 1500);
    };

    if (!isOpen) return null;

    const options = ['Azul', 'Amarillo', 'Verde', 'Gris'];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>&times;</button>

                <h2>Mini Quiz de Reciclaje</h2>

                {loading && <p>Cargando preguntas...</p>}

                {!loading && !quizFinished && questions.length > 0 && (
                    <div className="quiz-container">
                        <div className="progress">
                            Pregunta {currentIndex + 1} de {questions.length}
                        </div>

                        <img
                            src={questions[currentIndex].imageUrl}
                            alt="Residuo a clasificar"
                            className="quiz-image"
                        />

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
                                {isCorrect ? '¡Correcto!' : `Incorrecto. Era ${questions[currentIndex].correctContainer}`}
                            </div>
                        )}
                    </div>
                )}

                {quizFinished && (
                    <div className="score-screen">
                        <h3>¡Quiz Terminado!</h3>
                        <div className="score-display">
                            Tu puntuación: {score} / {questions.length}
                        </div>
                        <button onClick={onClose}>Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizModal;
