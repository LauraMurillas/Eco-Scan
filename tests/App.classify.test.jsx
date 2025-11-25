import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { test, expect, beforeEach, afterEach } from 'vitest';
import App from '../src/App';

beforeEach(() => {
  global.fetch = (url, options) => {
    // mock analyze
    if (url && url.endsWith('/api/analyze')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          container: 'Blanco (Aprovechables)',
          details: {
            confidence: 'Alta',
            objectName: 'Botella de plástico',
            reason: 'Es plástico reciclable.'
          }
        })
      });
    }

    // mock tips
    if (url && url.endsWith('/api/tips')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ tip: 'Tip de prueba' }) });
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  };
});

afterEach(() => {
  delete global.fetch;
});

test('classify button disabled until file selected and shows result after classification', async () => {
  render(<App />);

  const classifyButton = screen.getByRole('button', { name: /Clasificar Basura|Clasificar Basura/i });
  // button should be disabled initially
  expect(classifyButton).toBeDisabled();

  // create a fake file
  const file = new File(['dummy content'], 'photo.png', { type: 'image/png' });
  const input = screen.getByLabelText(/Selecciona una imagen|Selecciona una imagen/i) || document.querySelector('#file-upload');

  // simulate file selection
  if (input) {
    fireEvent.change(input, { target: { files: [file] } });
  }

  // now button should be enabled
  expect(classifyButton).toBeEnabled();

  // click classify and wait for result
  fireEvent.click(classifyButton);

  await waitFor(() => expect(screen.getByText(/Botella de plástico/i)).toBeInTheDocument());
  expect(screen.getByText(/Blanco \(Aprovechables\)/i)).toBeInTheDocument();
});
