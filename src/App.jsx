import { useState } from 'react'

function App() {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [description, setDescription] = useState('')
    const [classification, setClassification] = useState('')
    const [analyzing, setAnalyzing] = useState(false)

    const handleFileChange = (e) => {
        const f = e.target.files[0]
        if (!f) return
        setFile(f)
        setPreview(URL.createObjectURL(f))
        // Reset results when new file is selected
        setDescription('')
        setClassification('')
    }

    const handleAnalyze = async () => {
        if (!file) return alert('Selecciona una imagen primero.')

        setAnalyzing(true)
        const form = new FormData()
        form.append('image', file)

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: form
            })

            const json = await res.json()
            if (!res.ok) {
                alert('Error: ' + (json.error || JSON.stringify(json)))
                return
            }

            setDescription(json.description || 'Sin descripción')
            setClassification(json.classification || 'Sin clasificación')
        } catch (err) {
            alert('Error de red o servidor: ' + err.message)
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <div>
            <h1>Reconocimiento de Residuos (Gemini 2.5 Flash Image)</h1>

            <div className="card">
                <label htmlFor="image">Sube una imagen (desde tu ordenador):</label>
                <input id="image" type="file" accept="image/*" onChange={handleFileChange} />
                <div>
                    <button id="send" onClick={handleAnalyze} disabled={analyzing}>
                        {analyzing ? 'Analizando...' : 'Analizar imagen'}
                    </button>
                </div>
            </div>

            {preview && (
                <div className="card" id="previewCard">
                    <strong>Previsualización:</strong>
                    <img id="preview" className="preview" src={preview} alt="preview" />
                </div>
            )}

            {(description || classification) && (
                <div className="card" id="outputCard">
                    <strong>Descripción (desde Gemini):</strong>
                    <div className="result" id="description">{description}</div>
                    <strong>Clasificación (heurística):</strong>
                    <div id="classification">{classification}</div>
                </div>
            )}
        </div>
    )
}

export default App
