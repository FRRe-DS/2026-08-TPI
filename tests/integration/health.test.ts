import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health and Documentation Endpoints', () => {
  const app = createApp();

  it('GET /health debe responder con código 200 o 503 con encabezado X-Request-Id', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /docs debe responder con Swagger UI (200 o redirección 301)', async () => {
    const res = await request(app).get('/docs/');
    expect([200, 301]).toContain(res.status);
  });

  it('GET /openapi.yaml debe retornar el contrato OpenAPI', async () => {
    const res = await request(app).get('/openapi.yaml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('openapi: 3.0.3');
  });

  it('Ruta inexistente debe retornar RFC 7807 problem+json 404', async () => {
    const res = await request(app).get('/ruta-inexistente-xyz');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.title).toBe('Recurso no encontrado');
    expect(res.body.status).toBe(404);
  });
});
