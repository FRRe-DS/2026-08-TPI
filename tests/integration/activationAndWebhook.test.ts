import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestToken } from '../helpers/tokenHelper';
import { v4 as uuidv4 } from 'uuid';

describe('Activación y Webhook de Despacho hacia M5 (RF-9.9, RF-9.10, RF-9.11)', () => {
  const app = createApp();

  const clienteId = 'cliente-despacho-002';
  const tokenCliente = createTestToken(clienteId, ['CLIENTE']);
  const tokenOperador = createTestToken('operador-m9', ['OPERADOR']);
  const tokenServicio = createTestToken('m5-despacho', ['SERVICIO']);

  const fechaValida = new Date(Date.now() + 3 * 3600 * 1000).toISOString();

  let reserva1Id: string;
  let reserva2Id: string;

  beforeAll(async () => {
    // Crear reserva 1
    const res1 = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        claveIdempotencia: uuidv4(),
        clienteId,
        origen: { direccion: 'Av. Las Heras 750', latitud: -27.4512, longitud: -58.9867 },
        destino: { direccion: 'Av. Castelli 1200', latitud: -27.4606, longitud: -58.9839 },
        tipoVehiculo: 'AUTO',
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });
    reserva1Id = res1.body.reserva?.id || res1.body.id;

    // Crear reserva 2
    const res2 = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        claveIdempotencia: uuidv4(),
        clienteId,
        origen: { direccion: 'Av. 9 de Julio 500', latitud: -27.4530, longitud: -58.9840 },
        destino: { direccion: 'Av. San Martín 200', latitud: -27.4580, longitud: -58.9810 },
        tipoVehiculo: 'MOTO',
        fechaHora: fechaValida,
        zonaHoraria: 'America/Argentina/Buenos_Aires'
      });
    reserva2Id = res2.body.reserva?.id || res2.body.id;
  });

  it('Rechazar activación invocada por un rol CLIENTE (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/reservas/${reserva1Id}/activar`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(res.status).toBe(403);
  });

  it('Activar reserva en M5 con rol OPERADOR devuelve solicitudId (200)', async () => {
    const res = await request(app)
      .post(`/reservas/${reserva1Id}/activar`)
      .set('Authorization', `Bearer ${tokenOperador}`);

    expect(res.status).toBe(200);
    expect(res.body.solicitudDespachoId).toBeDefined();
    expect(res.body.id).toBe(reserva1Id);
    expect(res.body.estado).toBe('CONFIRMADA'); // Continúa CONFIRMADA hasta el resultado de M5
  });

  it('Reactivación de la misma reserva es estrictamente idempotente (200)', async () => {
    const res = await request(app)
      .post(`/reservas/${reserva1Id}/activar`)
      .set('Authorization', `Bearer ${tokenOperador}`);

    expect(res.status).toBe(200);
    expect(res.body.solicitudDespachoId).toBeDefined();
    expect(res.body.id).toBe(reserva1Id);
  });

  it('Webhook M5: Rechazar callback si no posee rol SERVICIO (403)', async () => {
    const res = await request(app)
      .post(`/reservas/${reserva1Id}/despacho`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        solicitud_id: 'sol-m5-test',
        resultado: 'CONFIRMADA',
        fecha: new Date().toISOString()
      });

    expect(res.status).toBe(403);
  });

  it('Webhook M5: Confirmar asignación transiciona reserva a ACTIVADA (200)', async () => {
    const res = await request(app)
      .post(`/reservas/${reserva1Id}/despacho`)
      .set('Authorization', `Bearer ${tokenServicio}`)
      .send({
        solicitud_id: 'sol-m5-9988',
        resultado: 'CONFIRMADA',
        fecha: new Date().toISOString()
      });

    expect(res.status).toBe(200);
    expect(res.body.estadoActual).toBe('ACTIVADA');

    // Verificar estado persistido
    const check = await request(app)
      .get(`/reservas/${reserva1Id}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(check.body.estado).toBe('ACTIVADA');
  });

  it('Webhook M5: Repetición del mismo callback CONFIRMADA es idempotente (200)', async () => {
    const res = await request(app)
      .post(`/reservas/${reserva1Id}/despacho`)
      .set('Authorization', `Bearer ${tokenServicio}`)
      .send({
        solicitud_id: 'sol-m5-9988',
        resultado: 'CONFIRMADA',
        fecha: new Date().toISOString()
      });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('Idempotente');
  });

  it('Webhook M5: Resultado VENCIDA transiciona reserva a VENCIDA (200)', async () => {
    // Activar reserva 2
    await request(app)
      .post(`/reservas/${reserva2Id}/activar`)
      .set('Authorization', `Bearer ${tokenServicio}`);

    // Callback de no conductor disponible (VENCIDA)
    const res = await request(app)
      .post(`/reservas/${reserva2Id}/despacho`)
      .set('Authorization', `Bearer ${tokenServicio}`)
      .send({
        solicitud_id: 'sol-m5-vencida-1',
        resultado: 'VENCIDA',
        fecha: new Date().toISOString()
      });

    expect(res.status).toBe(200);
    expect(res.body.estadoActual).toBe('VENCIDA');

    // Verificar estado persistido
    const check = await request(app)
      .get(`/reservas/${reserva2Id}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(check.body.estado).toBe('VENCIDA');
  });

  it('Consultar historial de auditoría de activación y vencimiento (RF-9.12)', async () => {
    const res = await request(app)
      .get(`/reservas/${reserva2Id}/historial`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(res.status).toBe(200);
    const eventos = res.body.map((e: any) => e.tipoEvento);
    expect(eventos).toContain('RESERVA_ACTIVADA');
    expect(eventos).toContain('RESERVA_VENCIDA');
  });
});
