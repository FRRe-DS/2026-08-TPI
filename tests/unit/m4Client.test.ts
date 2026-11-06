import { M4Client, M4ValidarEstimarRequest } from '../../src/clients/m4Client';
import { HttpClient } from '../../src/clients/httpClient';
import { config } from '../../src/config/env';
import { AppError } from '../../src/types/problem';

describe('M4Client - Pruebas de Fallback y Manejo de Errores', () => {
  const originalUseExternalMocks = config.services.useExternalMocks;

  const validPayload: M4ValidarEstimarRequest = {
    origen: { latitud: -27.4606, longitud: -58.9839 },
    destino: { latitud: -27.4512, longitud: -58.9867 },
    tipo_vehiculo: 'AUTO',
    fecha_hora: '2026-11-10T15:00:00Z'
  };

  afterEach(() => {
    jest.restoreAllMocks();
    config.services.useExternalMocks = originalUseExternalMocks;
  });

  describe('Cuando el mock está en FALSO (useExternalMocks = false)', () => {
    beforeEach(() => {
      config.services.useExternalMocks = false;
    });

    it('debe lanzar AppError 503 ("Dependencia no disponible") cuando M4 falla', async () => {
      // Simulamos que la llamada HTTP al Módulo 4 falla (ej: servicio caído, timeout o error de red)
      const errorDeRed = new Error('ECONNREFUSED 127.0.0.1:8084');
      jest.spyOn(HttpClient, 'request').mockRejectedValue(errorDeRed);

      try {
        await M4Client.validarYEstimar(validPayload);
        fail('Se esperaba que M4Client lanzara un AppError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        const appError = err as AppError;

        // Comprobamos exactamente las propiedades del error devuelto:
        expect(appError.status).toBe(503);
        expect(appError.title).toBe('Dependencia no disponible');
        expect(appError.type).toBe('https://api.reservas.frre.utn.edu.ar/errors/dependencia-no-disponible');
        expect(appError.detail).toBe('El Módulo de Ubicación (M4) no respondió: ECONNREFUSED 127.0.0.1:8084');
      }
    });

    it('debe retornar la respuesta exitosa de M4 cuando el servicio responde correctamente', async () => {
      const mockM4Response = {
        origen_valido: true,
        destino_valido: true,
        motivo: null,
        distancia_km: 12.5,
        tiempo_estimado_min: 20
      };

      jest.spyOn(HttpClient, 'request').mockResolvedValue(mockM4Response);

      const response = await M4Client.validarYEstimar(validPayload);
      expect(response).toEqual(mockM4Response);
      expect(HttpClient.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cuando el mock está en VERDADERO (useExternalMocks = true)', () => {
    beforeEach(() => {
      config.services.useExternalMocks = true;
    });

    it('debe resolver con los datos calculados por el mock interno sin realizar llamadas HTTP', async () => {
      const httpSpy = jest.spyOn(HttpClient, 'request');

      const response = await M4Client.validarYEstimar(validPayload);

      expect(response.origen_valido).toBe(true);
      expect(response.destino_valido).toBe(true);
      expect(response.distancia_km).toBeGreaterThan(0);
      expect(response.tiempo_estimado_min).toBeGreaterThan(0);
      // No debe haber intentado comunicarse por HTTP
      expect(httpSpy).not.toHaveBeenCalled();
    });
  });
});
