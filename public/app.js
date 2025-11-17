const input = document.getElementById('image');
const send = document.getElementById('send');
const preview = document.getElementById('preview');
const previewCard = document.getElementById('previewCard');
const outputCard = document.getElementById('outputCard');
const descriptionEl = document.getElementById('description');
const classificationEl = document.getElementById('classification');

let currentFile = null;

input.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  currentFile = f;
  const url = URL.createObjectURL(f);
  preview.src = url;
  previewCard.style.display = 'block';
  outputCard.style.display = 'none';
});

send.addEventListener('click', async () => {
  if (!currentFile) return alert('Selecciona una imagen primero.');

  send.disabled = true;
  send.textContent = 'Analizando...';

  const form = new FormData();
  form.append('image', currentFile);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: form
    });

    const json = await res.json();
    if (!res.ok) {
      alert('Error: ' + (json.error || JSON.stringify(json)));
      return;
    }

    descriptionEl.textContent = json.description || 'Sin descripción';
    classificationEl.textContent = json.classification || 'Sin clasificación';
    outputCard.style.display = 'block';
  } catch (err) {
    alert('Error de red o servidor: ' + err.message);
  } finally {
    send.disabled = false;
    send.textContent = 'Analizar imagen';
  }
});
