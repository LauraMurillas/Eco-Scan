import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, test, expect } from 'vitest';
import App from '../src/App';

beforeEach(() => {
  // simple mock fetch for /api/tips
  global.fetch = (url) => {
    if (url && url.endsWith('/api/tips')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ tip: 'Test tip' }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  };
});

afterEach(() => {
  delete global.fetch;
});

test('renders EcoScan title and displays fetched tip', async () => {
  render(<App />);

  const title = screen.getByText(/EcoScan/i);
  expect(title).toBeInTheDocument();

  await waitFor(() => expect(screen.getByText(/Test tip/)).toBeInTheDocument());
});
