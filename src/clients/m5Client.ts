import { config } from '../config/env';
import { HttpClient } from './httpClient';
import { Direccion, TipoVehiculo } from '../types/reservation';

export interface M5CrearSolicitudRequest {
  reserva_id: string;
  cliente_id: string;
  origen: Direccion;
  destino: Direccion;
  tipo_vehiculo: TipoVehiculo;
  fecha_hora: string;
  zona_horaria: string;
  tarifa_estimada: number;
}

export interface M5CrearSolicitudResponse {
  solicitud_id: string;
}

export class M5Client {
  public static async activarSolicitud(
    data: M5CrearSolicitudRequest,
    idempotencyKey: string,
    requestId?: string
  ): Promise<M5CrearSolicitudResponse> {
    if (config.services.useExternalMocks) {
      return this.mockActivarSolicitud(data);
    }

    const url = `${config.services.m5DespachoUrl}/api/v1/solicitudes`;
    try {
      const response = await HttpClient.request<M5CrearSolicitudResponse>(url, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey
        },
        body: data,
        requestId,
        retries: 1 // La activación permite un reintento gracias a la Idempotency-Key
      });
      return response;
    } catch (err: unknown) {
      console.warn(`[M5Client] Error llamando a M5 (${(err as Error).message}). Usando fallback mock.`);
      return this.mockActivarSolicitud(data);
    }
  }

  private static mockActivarSolicitud(data: M5CrearSolicitudRequest): M5CrearSolicitudResponse {
    return {
      solicitud_id: `sol-m5-${data.reserva_id.substring(0, 8)}`
    };
  }
}
