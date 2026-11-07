import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestToken } from '../helpers/tokenHelper';
import { v4 as uuidv4 } from 'uuid';

describe('Ciclo de Vida de Reservas (RF-9.1, RF-9.2, RF-9.3, RF-9.4, RF-9.5, RF-9.6, RF-9.7, RF-9.12)', () => {
  const app = createApp();

  const clienteId = 'cliente-test-001';
  const tokenCliente = createTestToken(clienteId, ['CLIENTE']);
  const tokenOperador = createTestToken('operador-admin', ['OPERADOR']);

  const fechaValida = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

  let reservaCreadaId: string;
  const claveIdempotencia = uuidv4();

  it('Rechazar creación sin token JWT con RFC 7807 (401)', async () => {
    const res = await request(app)
      .post('/reservas')
      .send({
        claveIdempotencia: uuidv4(),
        clienteId,
        origen: { direccion: 'Av. Sarmiento 1500', latitud: -27.4606, longitud: -58.9839 },
        destino: { direccion: 'Av. 25 de Mayo 800', latitud: -27.4512, longitud: -58.9867 },
        tipoVehiculo: 'AUTO',
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });

    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.codigo).toBe('NO_AUTENTICADO');
  });

  it('Rechazar creación si el token CLIENTE no coincide con clienteId (403)', async () => {
    const res = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        claveIdempotencia: uuidv4(),
        clienteId: 'otro-cliente-distinto',
        origen: { direccion: 'Av. Sarmiento 1500', latitud: -27.4606, longitud: -58.9839 },
        destino: { direccion: 'Av. 25 de Mayo 800', latitud: -27.4512, longitud: -58.9867 },
        tipoVehiculo: 'AUTO',
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });

    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.codigo).toBe('NO_AUTORIZADO');
  });

  it('Rechazar creación si el cliente está bloqueado en M2 (422)', async () => {
    const idBloqueado = 'cliente-bloqueado-999';
    const tokenBloqueado = createTestToken(idBloqueado, ['CLIENTE']);

    const res = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenBloqueado}`)
      .send({
        claveIdempotencia: uuidv4(),
        clienteId: idBloqueado,
        origen: { direccion: 'Av. Sarmiento 1500', latitud: -27.4606, longitud: -58.9839 },
        destino: { direccion: 'Av. 25 de Mayo 800', latitud: -27.4512, longitud: -58.9867 },
        tipoVehiculo: 'AUTO',
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });

    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.mensaje).toBe('Cliente bloqueado');
  });

  it('Rechazar creación si la ubicación está fuera de cobertura en M4 (422)', async () => {
    const res = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        claveIdempotencia: uuidv4(),
        clienteId,
        origen: { direccion: 'Pekín, China', latitud: 39.9042, longitud: 116.4074 },
        destino: { direccion: 'Av. 25 de Mayo 800', latitud: -27.4512, longitud: -58.9867 },
        tipoVehiculo: 'AUTO',
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });

    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.mensaje).toBe('Ubicación no válida');
  });

  it('Crear reserva exitosamente en estado CONFIRMADA con tarifa estimada (201)', async () => {
    const res = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .set('X-Request-Id', 'req-trace-test-01')
      .send({
        claveIdempotencia,
        clienteId,
        origen: {
          direccion: 'Av. Sarmiento 1500',
          latitud: -27.4606,
          longitud: -58.9839,
          alias: 'Casa',
          piso: '2B',
          indicaciones: 'Portón negro'
        },
        destino: {
          direccion: 'Av. 25 de Mayo 800',
          latitud: -27.4512,
          longitud: -58.9867
        },
        tipoVehiculo: 'AUTO',
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });

    expect(res.status).toBe(201);
    expect(res.headers['x-request-id']).toBe('req-trace-test-01');
    const reserva = res.body.reserva || res.body;
    expect(reserva.id).toBeDefined();
    expect(reserva.estado).toBe('CONFIRMADA');
    expect(reserva.clienteId).toBe(clienteId);
    expect(reserva.tipoVehiculo).toBe('AUTO');
    expect(reserva.tarifaEstimada).toBeGreaterThan(0);
    expect(reserva.moneda).toBe('ARS');

    reservaCreadaId = reserva.id;
  });

  it('Idempotencia estricta: reenvío con la misma claveIdempotencia devuelve 200 y misma reserva', async () => {
    const res = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        claveIdempotencia,
        clienteId,
        origen: {
          direccion: 'Av. Sarmiento 1500',
          latitud: -27.4606,
          longitud: -58.9839,
          alias: 'Casa',
          piso: '2B',
          indicaciones: 'Portón negro'
        },
        destino: {
          direccion: 'Av. 25 de Mayo 800',
          latitud: -27.4512,
          longitud: -58.9867
        },
        tipoVehiculo: 'AUTO',
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });

    expect(res.status).toBe(200);
    const reserva = res.body.reserva || res.body;
    expect(reserva.id).toBe(reservaCreadaId);
  });

  it('Rechazar creación con misma clave de idempotencia pero datos distintos (409 CONFLICTO_IDEMPOTENCIA)', async () => {
    const res = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        claveIdempotencia,
        clienteId,
        origen: { direccion: 'Av. Sarmiento 1500', latitud: -27.4606, longitud: -58.9839 },
        destino: { direccion: 'Av. 25 de Mayo 800', latitud: -27.4512, longitud: -58.9867 },
        tipoVehiculo: 'MOTO', // Diferente vehículo
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });

    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe('CONFLICTO_IDEMPOTENCIA');
  });

  it('Listar reservas de un cliente (200)', async () => {
    const res = await request(app)
      .get(`/reservas?clienteId=${clienteId}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].id).toBe(reservaCreadaId);
  });

  it('Consultar reserva por ID (200)', async () => {
    const res = await request(app)
      .get(`/reservas/${reservaCreadaId}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(reservaCreadaId);
    expect(res.body.origen.direccion).toBe('Av. Sarmiento 1500');
  });

  it('Modificar o reprogramar reserva activa (PATCH /reservas/:id) recalcula tarifa', async () => {
    const nuevaFecha = new Date(Date.now() + 5 * 3600 * 1000).toISOString();
    const res = await request(app)
      .patch(`/reservas/${reservaCreadaId}`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        tipoVehiculo: 'MOTO',
        fechaHora: nuevaFecha
      });

    expect(res.status).toBe(200);
    expect(res.body.tipoVehiculo).toBe('MOTO');
    expect(res.body.tarifaEstimada).toBeDefined();
  });

  it('Rechazar cancelación con motivo menor a 3 caracteres (400)', async () => {
    const res = await request(app)
      .post(`/reservas/${reservaCreadaId}/cancelar`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'no' });

    expect(res.status).toBe(400);
  });

  it('Cancelar reserva activa con motivo válido (200)', async () => {
    const res = await request(app)
      .post(`/reservas/${reservaCreadaId}/cancelar`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Cambio de planes de viaje' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('CANCELADA');
    expect(res.body.motivoCancelacion).toBe('Cambio de planes de viaje');
  });

  it('Rechazar modificación de una reserva ya CANCELADA (409 Conflict)', async () => {
    const res = await request(app)
      .patch(`/reservas/${reservaCreadaId}`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ tipoVehiculo: 'AUTO' });

    expect(res.status).toBe(409);
    expect(res.body.mensaje).toBe('Estado no modificable');
  });

  it('Rechazar cancelación de una reserva ya CANCELADA (409 Conflict)', async () => {
    const res = await request(app)
      .post(`/reservas/${reservaCreadaId}/cancelar`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Reintento de cancelación' });

    expect(res.status).toBe(409);
  });

  it('Consultar historial de auditoría de la reserva (GET /reservas/:id/historial)', async () => {
    const res = await request(app)
      .get(`/reservas/${reservaCreadaId}/historial`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const eventos = res.body.map((e: any) => e.tipoEvento);
    expect(eventos).toContain('RESERVA_CREADA');
    expect(eventos).toContain('RESERVA_MODIFICADA');
    expect(eventos).toContain('RESERVA_CANCELADA');
  });
});
