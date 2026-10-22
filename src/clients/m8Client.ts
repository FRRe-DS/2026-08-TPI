import { config } from '../config/env';
import { HttpClient } from './httpClient';
import { TipoEvento, TipoVehiculo } from '../types/reservation';

export interface M8NotificacionEventoRequest {
  tipo_evento: TipoEvento;
  reserva_id: string;
  cliente_id: string;
  fecha_hora: string;
  zona_horaria: string;
  origen_direccion: string;
  destino_direccion: string;
  tipo_vehiculo: TipoVehiculo;
  tarifa_estimada: number | null;
  motivo_cancelacion?: string | null;
  ocurrido_en: string;
}

export class M8Client {
  public static async notificarEvento(
    evento: M8NotificacionEventoRequest,
    requestId?: string
  ): Promise<void> {
    if (config.services.useExternalMocks) {
      console.log(`[M8Client Mock] Notificación enviada: ${evento.tipo_evento} para reserva ${evento.reserva_id}`);
      return;
    }

    const url = `${config.services.m8NotificacionesUrl}/api/v1/notificaciones/eventos`;
    try {
      await HttpClient.request(url, {
        method: 'POST',
        body: evento,
        requestId,
        timeoutMs: 2000
      });
      console.log(`[M8Client] Evento ${evento.tipo_evento} entregado a M8 exitosamente.`);
    } catch (err: unknown) {
      // Regla de negocio explícita: "Si M8 no responde: la reserva sigue su curso. Un aviso fallido no cancela ni revierte la reserva."
      console.warn(`[M8Client] No se pudo entregar la notificación a M8 (${(err as Error).message}). La operación continúa.`);
    }
  }
}
