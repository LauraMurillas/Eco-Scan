import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { test, expect, beforeEach, afterEach } from 'vitest';
import QuizModal from '../src/QuizModal';

beforeEach(() => {
  global.fetch = (url) => {
    if (url && url.endsWith('/api/create')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          imageUrl: 'https://via.placeholder.com/150',
          wasteName: 'Botella PET',
          correctContainer: 'Blanco (Aprovechables)',
          justification: 'Es plástico reciclable.'
        })
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  };
});

afterEach(() => {
  delete global.fetch;
});

test('loads a question and displays options', async () => {
  render(<QuizModal isOpen={true} onClose={() => {}} />);

  // wait for waste name to be displayed
  await waitFor(() => expect(screen.getByText(/Botella PET/i)).toBeInTheDocument());

  // options should be present
  expect(screen.getByText('Blanco')).toBeInTheDocument();
  expect(screen.getByText('Negro')).toBeInTheDocument();
  expect(screen.getByText('Verde')).toBeInTheDocument();

  // select correct option and check feedback
  fireEvent.click(screen.getByText('Blanco'));
  expect(screen.getByText(/¡Correcto!|Correcto/i)).toBeInTheDocument();
});
