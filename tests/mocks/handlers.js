import { rest } from 'msw';   // <-- correcto

export const handlers = [
  rest.post('/api/classify', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ label: 'Plástico', confidence: 0.92 })
    );
  }),
];
