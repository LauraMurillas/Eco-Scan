import request from 'supertest';
import app from '../server.js'; 
import { vi, describe, test, expect } from 'vitest';


vi.mock('groq-sdk', () => {
  return {
    Groq: class {
      constructor() {}
      chat = {
        completions: {
          create: async () => ({
            choices: [{ message: { content: 'Respuesta simulada' } }],
          }),
        },
      };
    },
  };
});



describe('Integración API /classify', () => {
  test('responde con clasificación simulada', async () => {
    const res = await request(app)
      .post('/api/classify')
      .send({ image: 'mock' });

    expect(res.status).toBe(200);
    expect(res.body.label).toBe('Plástico');
  });
});