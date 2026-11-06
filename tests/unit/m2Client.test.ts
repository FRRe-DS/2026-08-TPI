import { M2Client } from '../../src/clients/m2Client';
import { HttpClient } from '../../src/clients/httpClient';
import { config } from '../../src/config/env';
import { AppError } from '../../src/types/problem';

describe('M2Client - Pruebas de Fallback y Manejo de Errores (Corregido)', () => {
  const originalUseExternalMocks = config.services.useExternalMocks;

  afterEach(() => {
    jest.restoreAllMocks();
    config.services.useExternalMocks = originalUseExternalMocks;
  });

  describe('Cuando el mock está en FALSO (useExternalMocks = false)', () => {
    beforeEach(() => {
      config.services.useExternalMocks = false;
    });

    it('debe lanzar AppError 503 ("Dependencia no disponible") cuando M2 falla por red o caída del servicio', async () => {
      const errorDeRed = new Error('ECONNREFUSED 127.0.0.1:8082');
      jest.spyOn(HttpClient, 'request').mockRejectedValue(errorDeRed);

      try {
        await M2Client.verificarEstadoCuenta('cliente-01');
        fail('Se esperaba que M2Client lanzara un AppError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        const appError = err as AppError;

        expect(appError.status).toBe(503);
        expect(appError.title).toBe('Dependencia no disponible');
        expect(appError.type).toBe('https://api.reservas.frre.utn.edu.ar/errors/dependencia-no-disponible');
        expect(appError.detail).toBe('El Módulo de Clientes (M2) no respondió: ECONNREFUSED 127.0.0.1:8082');
      }
    });

    it('debe lanzar AppError 404 ("Cliente no encontrado") cuando M2 responde con status 404', async () => {
      const error404 = new Error('HTTP 404');
      (error404 as { status?: number }).status = 404;
      jest.spyOn(HttpClient, 'request').mockRejectedValue(error404);

      try {
        await M2Client.verificarEstadoCuenta('cliente-inexistente');
        fail('Se esperaba que M2Client lanzara un AppError 404');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        const appError = err as AppError;

        expect(appError.status).toBe(404);
        expect(appError.title).toBe('Cliente no encontrado');
        expect(appError.detail).toContain('no está registrado en M2');
      }
    });

    it('debe retornar la respuesta exitosa de M2 cuando el servicio responde correctamente', async () => {
      const mockResponse = { cliente_id: 'cliente-01', estado: 'ACTIVO' as const };
      jest.spyOn(HttpClient, 'request').mockResolvedValue(mockResponse);

      const response = await M2Client.verificarEstadoCuenta('cliente-01');
      expect(response).toEqual(mockResponse);
    });
  });

  describe('Cuando el mock está en VERDADERO (useExternalMocks = true)', () => {
    beforeEach(() => {
      config.services.useExternalMocks = true;
    });

    it('resuelve directamente con el mock sin hacer llamadas HTTP', async () => {
      const httpSpy = jest.spyOn(HttpClient, 'request');

      const response = await M2Client.verificarEstadoCuenta('cliente-01');
      expect(response.estado).toBe('ACTIVO');
      expect(httpSpy).not.toHaveBeenCalled();
    });
  });
});

