import { HttpClient } from '../../src/clients/httpClient';
import { M2Client } from '../../src/clients/m2Client';
import { M4Client } from '../../src/clients/m4Client';
import { M5Client } from '../../src/clients/m5Client';
import { config } from '../../src/config/env';
import { AppError } from '../../src/types/problem';

describe('HttpClient - Circuit Breaker (opossum)', () => {
  const originalUseExternalMocks = config.services.useExternalMocks;
  const originalFetch = global.fetch;
  const originalBreakerOptions = { ...HttpClient.breakerOptions };

  beforeEach(() => {
    config.services.useExternalMocks = false;
    HttpClient.breakerOptions = {
      ...originalBreakerOptions,
      volumeThreshold: 3,
      errorThresholdPercentage: 50,
      resetTimeout: 100
    };
    HttpClient.resetBreakers();
  });

  afterEach(() => {
    HttpClient.resetBreakers();
    HttpClient.breakerOptions = { ...originalBreakerOptions };
    config.services.useExternalMocks = originalUseExternalMocks;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('debe crear Circuit Breakers independientes por cada módulo (M2, M4, M5, M7) y compartirlo entre rutas del mismo origen', () => {
    const breakerM2 = HttpClient.getOrCreateBreaker('http://localhost:8082/api/v1/clientes/1/estado-cuenta');
    const breakerM4 = HttpClient.getOrCreateBreaker('http://localhost:8084/api/v1/ubicaciones/validar-estimar');
    const breakerM5 = HttpClient.getOrCreateBreaker('http://localhost:8085/api/v1/solicitudes');
    const breakerM7Estimar = HttpClient.getOrCreateBreaker('http://localhost:8087/api/v1/tarifas/estimar');
    const breakerM7Cancelar = HttpClient.getOrCreateBreaker('http://localhost:8087/api/v1/tarifas/cancelacion');

    expect(breakerM2).not.toBe(breakerM4);
    expect(breakerM4).not.toBe(breakerM5);
    expect(breakerM5).not.toBe(breakerM7Estimar);
    // Ambas rutas de M7 comparten el mismo origen y por ende el mismo Circuit Breaker
    expect(breakerM7Estimar).toBe(breakerM7Cancelar);
  });

  it('debe abrir el circuito tras superar el umbral de fallos y rechazar en modo fail-fast (503) sin llamar a fetch', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:8084'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const payloadM4 = {
      origen: { latitud: -27.45, longitud: -58.98 },
      destino: { latitud: -27.46, longitud: -58.99 },
      tipo_vehiculo: 'AUTO' as const,
      fecha_hora: '2026-11-12T15:00:00Z'
    };

    // 3 fallos consecutivos (alcanza volumeThreshold = 3 con 100% de error)
    for (let i = 0; i < 3; i++) {
      await expect(M4Client.validarYEstimar(payloadM4)).rejects.toThrow(AppError);
    }

    const breakerM4 = HttpClient.getOrCreateBreaker(`${config.services.m4UbicacionUrl}/api/v1/ubicaciones/validar-estimar`);
    expect(breakerM4.opened).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // 4ta llamada: el circuito está ABIERTO -> falla rápido con 503 sin invocar fetch nuevamente
    await expect(M4Client.validarYEstimar(payloadM4)).rejects.toMatchObject({
      status: 503,
      title: 'Dependencia no disponible'
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('no debe afectar a otros módulos cuando el circuito de un módulo está abierto', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('8084')) {
        return Promise.reject(new Error('M4 caído'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ cliente_id: 'cliente-01', estado: 'ACTIVO' })
      });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    // Abrir el circuito de M4 (8084)
    for (let i = 0; i < 3; i++) {
      await expect(
        HttpClient.request('http://localhost:8084/api/v1/ubicaciones/validar-estimar', { method: 'POST' })
      ).rejects.toThrow();
    }

    const breakerM4 = HttpClient.getOrCreateBreaker('http://localhost:8084/api/v1/ubicaciones/validar-estimar');
    const breakerM2 = HttpClient.getOrCreateBreaker('http://localhost:8082/api/v1/clientes/cliente-01/estado-cuenta');

    expect(breakerM4.opened).toBe(true);
    expect(breakerM2.closed).toBe(true);

    // M2 sigue respondiendo normalmente
    const resM2 = await M2Client.verificarEstadoCuenta('cliente-01');
    expect(resM2.estado).toBe('ACTIVO');
  });

  it('no debe abrir el circuito ante errores HTTP 4xx (ej. 404 Cliente no encontrado en M2)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ mensaje: 'No encontrado' })
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    // 5 respuestas 404 consecutivas (supera volumeThreshold = 3)
    for (let i = 0; i < 5; i++) {
      await expect(M2Client.verificarEstadoCuenta(`inexistente-${i}`)).rejects.toMatchObject({
        status: 404,
        title: 'Cliente no encontrado'
      });
    }

    const breakerM2 = HttpClient.getOrCreateBreaker(`${config.services.m2ClientesUrl}/api/v1/clientes/1/estado-cuenta`);
    expect(breakerM2.opened).toBe(false);
    expect(breakerM2.closed).toBe(true);
    // Sin reintentos duplicados ante 404 (1 llamada por cada consulta)
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('debe ejecutar reintentos con backoff exponencial configurados en M5Client (POST con Idempotency-Key y retries: 2) ante fallos transitorios', async () => {
    const backoffSpy = jest.spyOn(HttpClient, 'calculateBackoffDelay');
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ solicitud_id: 'sol-m5-reintento-ok' })
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await M5Client.activarSolicitud(
      {
        reserva_id: 'reserva-1234',
        cliente_id: 'cliente-01',
        origen: { direccion: 'Origen 1', latitud: -27.45, longitud: -58.98 },
        destino: { direccion: 'Destino 2', latitud: -27.46, longitud: -58.99 },
        tipo_vehiculo: 'AUTO',
        fecha_hora: '2026-11-12T15:00:00Z',
        zona_horaria: 'America/Argentina/Buenos_Aires',
        tarifa_estimada: 3000
      },
      'idemp-key-m5-001'
    );

    expect(res.solicitud_id).toBe('sol-m5-reintento-ok');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(backoffSpy).toHaveBeenNthCalledWith(1, 1, 150);
    expect(backoffSpy).toHaveBeenNthCalledWith(2, 2, 150);
    expect(backoffSpy).toHaveNthReturnedWith(1, 150);
    expect(backoffSpy).toHaveNthReturnedWith(2, 300);
  });

  it('debe calcular retardos progresivos con backoff exponencial (150ms -> 300ms -> 600ms) y respetar retryBaseDelayMs', async () => {
    expect(HttpClient.calculateBackoffDelay(1)).toBe(150);
    expect(HttpClient.calculateBackoffDelay(2)).toBe(300);
    expect(HttpClient.calculateBackoffDelay(3)).toBe(600);

    const backoffSpy = jest.spyOn(HttpClient, 'calculateBackoffDelay');
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fallo 1'))
      .mockRejectedValueOnce(new Error('Fallo 2'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ cliente_id: 'cliente-01', estado: 'ACTIVO' })
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await HttpClient.request<{ estado: string }>(
      'http://localhost:8082/api/v1/clientes/cliente-01/estado-cuenta',
      { method: 'GET', retries: 2, retryBaseDelayMs: 20 }
    );

    expect(res.estado).toBe('ACTIVO');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(backoffSpy).toHaveBeenNthCalledWith(1, 1, 20);
    expect(backoffSpy).toHaveBeenNthCalledWith(2, 2, 20);
    expect(backoffSpy).toHaveNthReturnedWith(1, 20);
    expect(backoffSpy).toHaveNthReturnedWith(2, 40);
  });

  it('debe transicionar a HALF-OPEN tras resetTimeout y cerrar el circuito si el servicio se recupera', async () => {
    let debeFallar = true;
    const fetchMock = jest.fn().mockImplementation(() => {
      if (debeFallar) {
        return Promise.reject(new Error('Servicio caído temporalmente'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ tarifa_estimada: 2500, moneda: 'ARS', condiciones: 'OK' })
      });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const urlM7 = 'http://localhost:8087/api/v1/tarifas/estimar';

    // Provocar apertura del circuito de M7
    for (let i = 0; i < 3; i++) {
      await expect(HttpClient.request(urlM7, { method: 'POST' })).rejects.toThrow();
    }

    const breakerM7 = HttpClient.getOrCreateBreaker(urlM7);
    expect(breakerM7.opened).toBe(true);

    // Esperar a que transicione a HALF-OPEN (resetTimeout = 100ms en este test)
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(breakerM7.halfOpen).toBe(true);

    // Ahora M7 se recupera y responde 200 OK
    debeFallar = false;
    const respuesta = await HttpClient.request<{ tarifa_estimada: number }>(urlM7, { method: 'POST' });

    expect(respuesta.tarifa_estimada).toBe(2500);
    expect(breakerM7.closed).toBe(true);
    expect(breakerM7.opened).toBe(false);
  });
});
