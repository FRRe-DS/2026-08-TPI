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

export interface M7ProcesarCancelacionRequest {
  reserva_id: string;
  cliente_id: string;
  tarifa_estimada: number;
  cancelacion_tardia: boolean;
  minutos_anticipacion: number;
}

export interface M7ProcesarCancelacionResponse {
  reserva_id: string;
  cargo_aplicado: number;
  moneda: string;
  estado_financiero: 'SIN_CARGO' | 'CARGO_APLICADO';
  detalle: string;
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
      throw new AppError({
        status: 503,
        title: 'Dependencia no disponible',
        detail: `El Módulo de Tarifas (M7) no respondió: ${(err as Error).message}`
      });
    }
  }

  public static async procesarCancelacion(
    data: M7ProcesarCancelacionRequest,
    requestId?: string
  ): Promise<M7ProcesarCancelacionResponse> {
    if (config.services.useExternalMocks) {
      return this.mockProcesarCancelacion(data);
    }

    const url = `${config.services.m7TarifasUrl}/api/v1/tarifas/cancelacion`;
    try {
      const response = await HttpClient.request<M7ProcesarCancelacionResponse>(url, {
        method: 'POST',
        body: data,
        requestId
      });
      return response;
    } catch (err: unknown) {
      throw new AppError({
        status: 503,
        title: 'Dependencia no disponible',
        detail: `El Módulo de Tarifas (M7) no respondió al procesar la cancelación: ${(err as Error).message}`
      });
    }
  }

  private static mockProcesarCancelacion(
    data: M7ProcesarCancelacionRequest
  ): M7ProcesarCancelacionResponse {
    if (!data.cancelacion_tardia) {
      return {
        reserva_id: data.reserva_id,
        cargo_aplicado: 0,
        moneda: 'ARS',
        estado_financiero: 'SIN_CARGO',
        detalle: 'Cancelación realizada dentro de la ventana permitida sin penalidad.'
      };
    }

    // Penalidad del 30% sobre la tarifa estimada por cancelación tardía
    const cargo = Math.round(data.tarifa_estimada * 0.3 * 100) / 100;

    return {
      reserva_id: data.reserva_id,
      cargo_aplicado: cargo,
      moneda: 'ARS',
      estado_financiero: 'CARGO_APLICADO',
      detalle: `Cargo del 30% aplicado por cancelación tardía (${data.minutos_anticipacion} min antes del viaje).`
    };
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
