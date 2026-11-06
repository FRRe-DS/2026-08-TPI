import { M5Client, M5CrearSolicitudRequest } from '../../src/clients/m5Client';
import { HttpClient } from '../../src/clients/httpClient';
import { config } from '../../src/config/env';
import { AppError } from '../../src/types/problem';

describe('M5Client - Pruebas de Fallback y Manejo de Errores (Corregido)', () => {
  const originalUseExternalMocks = config.services.useExternalMocks;

  const validPayload: M5CrearSolicitudRequest = {
    reserva_id: 'reserva-12345678-abcd',
    cliente_id: 'cliente-01',
    origen: { direccion: 'Av. Corrientes 1234', latitud: -27.46, longitud: -58.98 },
    destino: { direccion: 'Av. San Martín 500', latitud: -27.45, longitud: -58.99 },
    tipo_vehiculo: 'AUTO',
    fecha_hora: '2026-11-10T16:00:00Z',
    zona_horaria: 'America/Argentina/Buenos_Aires',
    tarifa_estimada: 4500
  };

  afterEach(() => {
    jest.restoreAllMocks();
    config.services.useExternalMocks = originalUseExternalMocks;
  });

  describe('Cuando el mock está en FALSO (useExternalMocks = false) y M5 se cae', () => {
    beforeEach(() => {
      config.services.useExternalMocks = false;
    });

    it('debe lanzar AppError 503 ("Dependencia no disponible") cuando M5 falla', async () => {
      // 1. Simulamos que el microservicio real M5 está completamente caído
      const errorDeConexion = new Error('ECONNREFUSED 127.0.0.1:8085');
      jest.spyOn(HttpClient, 'request').mockRejectedValue(errorDeConexion);

      try {
        await M5Client.activarSolicitud(validPayload, 'idempotency-key-123');
        fail('Se esperaba que M5Client lanzara un AppError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        const appError = err as AppError;

        expect(appError.status).toBe(503);
        expect(appError.title).toBe('Dependencia no disponible');
        expect(appError.type).toBe('https://api.reservas.frre.utn.edu.ar/errors/dependencia-no-disponible');
        expect(appError.detail).toBe('El Módulo de Despacho (M5) no respondió: ECONNREFUSED 127.0.0.1:8085');
      }
    });

    it('debe devolver la respuesta real del servicio M5 si este responde correctamente', async () => {
      const mockRealResponse = { solicitud_id: 'sol-real-desde-m5-9999' };
      jest.spyOn(HttpClient, 'request').mockResolvedValue(mockRealResponse);

      const response = await M5Client.activarSolicitud(validPayload, 'idempotency-key-123');
      expect(response).toEqual(mockRealResponse);
    });
  });

  describe('Cuando el mock está en VERDADERO (useExternalMocks = true)', () => {
    beforeEach(() => {
      config.services.useExternalMocks = true;
    });

    it('resuelve directamente con el mock sin hacer llamadas HTTP', async () => {
      const httpSpy = jest.spyOn(HttpClient, 'request');

      const response = await M5Client.activarSolicitud(validPayload, 'idempotency-key-123');

      expect(response.solicitud_id).toBe('sol-m5-reserva-');
      expect(httpSpy).not.toHaveBeenCalled();
    });
  });
});
