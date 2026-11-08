import { M7Client, M7EstimarTarifaRequest, M7ProcesarCancelacionRequest } from '../../src/clients/m7Client';
import { HttpClient } from '../../src/clients/httpClient';
import { config } from '../../src/config/env';
import { AppError } from '../../src/types/problem';

describe('M7Client - Pruebas Unitarias de Tarifas y Cancelación Financiera', () => {
  const originalUseExternalMocks = config.services.useExternalMocks;

  const validEstimarPayload: M7EstimarTarifaRequest = {
    distancia_km: 10,
    tiempo_estimado_min: 20,
    tipo_vehiculo: 'AUTO',
    fecha_hora: '2026-11-10T15:00:00Z'
  };

  const validCancelPayload: M7ProcesarCancelacionRequest = {
    reserva_id: 'reserva-uuid-1234',
    cliente_id: 'cliente-01',
    tarifa_estimada: 2000,
    cancelacion_tardia: false,
    minutos_anticipacion: 120
  };

  afterEach(() => {
    jest.restoreAllMocks();
    config.services.useExternalMocks = originalUseExternalMocks;
  });

  describe('Estimación de Tarifa (estimarTarifa)', () => {
    it('debe estimar tarifa para AUTO usando el mock interno', async () => {
      config.services.useExternalMocks = true;
      const res = await M7Client.estimarTarifa(validEstimarPayload);

      expect(res.tarifa_estimada).toBeGreaterThan(0);
      expect(res.moneda).toBe('ARS');
      expect(res.condiciones).toBeDefined();
    });

    it('debe estimar tarifa para MOTO usando el mock interno', async () => {
      config.services.useExternalMocks = true;
      const res = await M7Client.estimarTarifa({
        ...validEstimarPayload,
        tipo_vehiculo: 'MOTO'
      });

      expect(res.tarifa_estimada).toBeGreaterThan(0);
      expect(res.moneda).toBe('ARS');
    });

    it('debe lanzar AppError 503 cuando useExternalMocks = false y M7 no responde', async () => {
      config.services.useExternalMocks = false;
      jest.spyOn(HttpClient, 'request').mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:8087'));

      await expect(M7Client.estimarTarifa(validEstimarPayload)).rejects.toThrow(AppError);

      try {
        await M7Client.estimarTarifa(validEstimarPayload);
      } catch (err) {
        const appErr = err as AppError;
        expect(appErr.status).toBe(503);
        expect(appErr.title).toBe('Dependencia no disponible');
        expect(appErr.detail).toContain('El Módulo de Tarifas (M7) no respondió');
      }
    });

    it('debe retornar la respuesta HTTP real cuando useExternalMocks = false y M7 responde OK', async () => {
      config.services.useExternalMocks = false;
      const mockHttpRes = {
        tarifa_estimada: 3500,
        moneda: 'ARS',
        condiciones: 'Condiciones de prueba'
      };
      jest.spyOn(HttpClient, 'request').mockResolvedValue(mockHttpRes);

      const res = await M7Client.estimarTarifa(validEstimarPayload);
      expect(res).toEqual(mockHttpRes);
    });
  });

  describe('Cancelación Financiera (procesarCancelacion - RF-9.7)', () => {
    it('debe procesar cancelación sin cargo si cancelacion_tardia es false', async () => {
      config.services.useExternalMocks = true;
      const res = await M7Client.procesarCancelacion({
        ...validCancelPayload,
        cancelacion_tardia: false,
        minutos_anticipacion: 120
      });

      expect(res.cargo_aplicado).toBe(0);
      expect(res.estado_financiero).toBe('SIN_CARGO');
      expect(res.detalle).toContain('sin penalidad');
    });

    it('debe aplicar penalidad del 30% si cancelacion_tardia es true', async () => {
      config.services.useExternalMocks = true;
      const res = await M7Client.procesarCancelacion({
        ...validCancelPayload,
        tarifa_estimada: 2000,
        cancelacion_tardia: true,
        minutos_anticipacion: 25
      });

      // 30% de 2000 = 600
      expect(res.cargo_aplicado).toBe(600);
      expect(res.estado_financiero).toBe('CARGO_APLICADO');
      expect(res.detalle).toContain('Cargo del 30% aplicado por cancelación tardía');
    });

    it('debe lanzar AppError 503 al procesar cancelación cuando useExternalMocks = false y M7 falla', async () => {
      config.services.useExternalMocks = false;
      jest.spyOn(HttpClient, 'request').mockRejectedValue(new Error('Timeout de conexión'));

      await expect(M7Client.procesarCancelacion(validCancelPayload)).rejects.toThrow(AppError);

      try {
        await M7Client.procesarCancelacion(validCancelPayload);
      } catch (err) {
        const appErr = err as AppError;
        expect(appErr.status).toBe(503);
        expect(appErr.title).toBe('Dependencia no disponible');
        expect(appErr.detail).toContain('El Módulo de Tarifas (M7) no respondió al procesar la cancelación');
      }
    });

    it('debe retornar la respuesta HTTP real de cancelación cuando M7 responde OK', async () => {
      config.services.useExternalMocks = false;
      const mockCancelHttpRes = {
        reserva_id: 'reserva-uuid-1234',
        cargo_aplicado: 450,
        moneda: 'ARS',
        estado_financiero: 'CARGO_APLICADO' as const,
        detalle: 'Cargo externo aplicado por M7'
      };
      jest.spyOn(HttpClient, 'request').mockResolvedValue(mockCancelHttpRes);

      const res = await M7Client.procesarCancelacion(validCancelPayload);
      expect(res).toEqual(mockCancelHttpRes);
    });
  });
});

