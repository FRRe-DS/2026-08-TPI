import { config } from '../config/env';
import { HttpClient } from './httpClient';
import { TipoVehiculo } from '../types/reservation';
import { AppError } from '../types/problem';

export interface M7EstimarTarifaRequest {
  distancia_km: number;
  tiempo_estimado_min: number;
  tipo_vehiculo: TipoVehiculo;
  fecha_hora: string;
}

export interface M7EstimarTarifaResponse {
  tarifa_estimada: number;
  moneda: string;
  condiciones: string;
}

export class M7Client {
  public static async estimarTarifa(
    data: M7EstimarTarifaRequest,
    requestId?: string
  ): Promise<M7EstimarTarifaResponse> {
    if (config.services.useExternalMocks) {
      return this.mockEstimarTarifa(data);
    }

    const url = `${config.services.m7TarifasUrl}/api/v1/tarifas/estimar`;
    try {
      const response = await HttpClient.request<M7EstimarTarifaResponse>(url, {
        method: 'POST',
        body: data,
        requestId
      });
      return response;
    } catch (err: unknown) {
      if (config.services.useExternalMocks) {
        return this.mockEstimarTarifa(data);
      }
      throw new AppError({
        status: 503,
        title: 'Dependencia no disponible',
        detail: `El Módulo de Tarifas (M7) no respondió: ${(err as Error).message}`
      });
    }
  }

  private static mockEstimarTarifa(data: M7EstimarTarifaRequest): M7EstimarTarifaResponse {
    const base = data.tipo_vehiculo === 'AUTO' ? 1500 : 900;
    const porKm = data.tipo_vehiculo === 'AUTO' ? 400 : 250;
    const porMin = data.tipo_vehiculo === 'AUTO' ? 50 : 30;

    const calculo = base + data.distancia_km * porKm + data.tiempo_estimado_min * porMin;
    const tarifaEstimada = Math.round(calculo * 100) / 100;

    return {
      tarifa_estimada: tarifaEstimada,
      moneda: 'ARS',
      condiciones: 'Tarifa sujeta a demoras de tráfico y variaciones climáticas.'
    };
  }
}
