import { ReservationRepository } from '../repositories/reservationRepository';
import { HistoryRepository } from '../repositories/historyRepository';
import { M5Client } from '../clients/m5Client';
import { M8Client } from '../clients/m8Client';
import { DespachoWebhookDTO, ReservaDTO } from '../types/reservation';
import { JwtUserPayload } from '../types/auth';
import { AppError } from '../types/problem';

export interface ActivarReservaResult {
  reservaId: string;
  solicitudId: string;
  estado: string;
  mensaje: string;
}

export class ActivationService {
  /**
   * RF-9.9 / RF-9.10
   * Activación programada hacia M5 (Solicitud y Despacho) con Idempotency-Key
   */
  public static async activarReserva(
    id: string,
    user: JwtUserPayload,
    requestId?: string
  ): Promise<ReservaDTO> {
    const esAutorizado = user.roles.includes('OPERADOR') || user.roles.includes('SERVICIO');
    if (!esAutorizado) {
      throw new AppError({
        status: 403,
        title: 'Acceso no autorizado',
        detail: 'Solo operadores o procesos de servicio pueden activar reservas en despacho.'
      });
    }

    const reserva = await ReservationRepository.obtenerPorId(id);
    if (!reserva) {
      throw new AppError({
        status: 404,
        title: 'Reserva no encontrada',
        detail: `No existe la reserva con ID ${id}`
      });
    }

    // Idempotencia estricta: si ya posee solicitud_despacho_id, devolvemos la misma sin duplicar hacia M5
    if (reserva.solicitudDespachoId) {
      return reserva;
    }

    // Validar estado CONFIRMADA
    if (reserva.estado !== 'CONFIRMADA') {
      throw new AppError({
        status: 409,
        title: 'Estado incompatible',
        detail: `Solo reservas en estado CONFIRMADA pueden ser activadas en despacho. Estado actual: ${reserva.estado}`
      });
    }

    // Llamada resiliente a M5 con Idempotency-Key
    const m5Response = await M5Client.activarSolicitud(
      {
        reserva_id: reserva.id,
        cliente_id: reserva.clienteId,
        origen: reserva.origen,
        destino: reserva.destino,
        tipo_vehiculo: reserva.tipoVehiculo,
        fecha_hora: reserva.fechaHora,
        zona_horaria: reserva.zonaHoraria,
        tarifa_estimada: reserva.tarifaEstimada || 0
      },
      reserva.claveIdempotencia,
      requestId
    );

    // Guardar solicitud_despacho_id en la base de datos (la reserva sigue CONFIRMADA hasta que M5 avise el resultado)
    await ReservationRepository.actualizar(reserva.id, {
      solicitud_despacho_id: m5Response.solicitud_id
    });

    // Registrar en Historial
    await HistoryRepository.registrar({
      reservaId: reserva.id,
      tipoEvento: 'RESERVA_ACTIVADA',
      estadoAnterior: reserva.estado,
      estadoNuevo: reserva.estado,
      actor: user.sub,
      detalles: {
        solicitudId: m5Response.solicitud_id,
        accion: 'Activación enviada a Solicitud y Despacho (M5)'
      }
    });

    return (await ReservationRepository.obtenerPorId(reserva.id))!;
  }

  /**
   * RF-9.10 / RF-9.11
   * Webhook callback recibido desde M5 notificando resultado de búsqueda de conductor
   */
  public static async procesarWebhookDespacho(
    id: string,
    payload: DespachoWebhookDTO,
    requestId?: string
  ): Promise<{ mensaje: string; reservaId: string; estadoActual: string }> {
    const reserva = await ReservationRepository.obtenerPorId(id);
    if (!reserva) {
      throw new AppError({
        status: 404,
        title: 'Reserva no encontrada',
        detail: `No existe la reserva con ID ${id}`
      });
    }

    // Regla de acuerdo: "Si el mismo aviso llega dos veces, respondemos 200 sin volver a procesarlo."
    if (
      (payload.resultado === 'CONFIRMADA' && reserva.estado === 'ACTIVADA') ||
      (payload.resultado === 'VENCIDA' && reserva.estado === 'VENCIDA')
    ) {
      return {
        mensaje: 'Aviso ya procesado previamente (Idempotente).',
        reservaId: reserva.id,
        estadoActual: reserva.estado
      };
    }

    if (payload.resultado === 'CONFIRMADA') {
      // Pasa a estado ACTIVADA (conductor asignado)
      const actualizada = await ReservationRepository.actualizar(id, {
        estado: 'ACTIVADA',
        solicitud_despacho_id: payload.solicitud_id || reserva.solicitudDespachoId
      });

      await HistoryRepository.registrar({
        reservaId: id,
        tipoEvento: 'RESERVA_ACTIVADA',
        estadoAnterior: reserva.estado,
        estadoNuevo: 'ACTIVADA',
        actor: 'M5_DESPACHO',
        detalles: {
          solicitudId: payload.solicitud_id,
          fecha: payload.fecha
        }
      });

      // Notificar a M8
      M8Client.notificarEvento(
        {
          tipo_evento: 'RESERVA_ACTIVADA',
          reserva_id: id,
          cliente_id: reserva.clienteId,
          fecha_hora: reserva.fechaHora,
          zona_horaria: reserva.zonaHoraria,
          origen_direccion: reserva.origen.direccion,
          destino_direccion: reserva.destino.direccion,
          tipo_vehiculo: reserva.tipoVehiculo,
          tarifa_estimada: reserva.tarifaEstimada,
          ocurrido_en: payload.fecha || new Date().toISOString()
        },
        requestId
      ).catch((err) => console.warn('[M8 Error]', err));

      return {
        mensaje: 'Despacho confirmado y reserva transicionada a ACTIVADA.',
        reservaId: id,
        estadoActual: 'ACTIVADA'
      };
    } else if (payload.resultado === 'VENCIDA') {
      // Pasa a estado VENCIDA (sin conductor)
      const actualizada = await ReservationRepository.actualizar(id, {
        estado: 'VENCIDA',
        solicitud_despacho_id: payload.solicitud_id || reserva.solicitudDespachoId
      });

      await HistoryRepository.registrar({
        reservaId: id,
        tipoEvento: 'RESERVA_VENCIDA',
        estadoAnterior: reserva.estado,
        estadoNuevo: 'VENCIDA',
        actor: 'M5_DESPACHO',
        detalles: {
          solicitudId: payload.solicitud_id,
          fecha: payload.fecha
        }
      });

      // Notificar a M8
      M8Client.notificarEvento(
        {
          tipo_evento: 'RESERVA_VENCIDA',
          reserva_id: id,
          cliente_id: reserva.clienteId,
          fecha_hora: reserva.fechaHora,
          zona_horaria: reserva.zonaHoraria,
          origen_direccion: reserva.origen.direccion,
          destino_direccion: reserva.destino.direccion,
          tipo_vehiculo: reserva.tipoVehiculo,
          tarifa_estimada: reserva.tarifaEstimada,
          ocurrido_en: payload.fecha || new Date().toISOString()
        },
        requestId
      ).catch((err) => console.warn('[M8 Error]', err));

      return {
        mensaje: 'Búsqueda sin conductor y reserva transicionada a VENCIDA.',
        reservaId: id,
        estadoActual: 'VENCIDA'
      };
    } else {
      throw new AppError({
        status: 400,
        title: 'Resultado de despacho no reconocido',
        detail: `El resultado '${payload.resultado}' no es válido. Debe ser CONFIRMADA o VENCIDA.`
      });
    }
  }
}
