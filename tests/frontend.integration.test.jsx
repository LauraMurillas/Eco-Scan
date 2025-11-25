import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App.jsx';
import { server } from './mocks/server';


beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('clasifica imagen y muestra resultado', async () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Clasificar/i));

  const resultado = await screen.findByText(/Plástico/i);
  expect(resultado).toBeInTheDocument();
});

test('muestra error si la API falla', async () => {
  server.use(
    rest.post(`${import.meta.env.VITE_API_URL}/classify`, (req, res, ctx) =>
      res(ctx.status(500))
    )
  );

  render(<App />);
  fireEvent.click(screen.getByText(/Clasificar/i));

  const error = await screen.findByText(/Error/i);
  expect(error).toBeInTheDocument();
});