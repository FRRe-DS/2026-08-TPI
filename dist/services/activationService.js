"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivationService = void 0;
const reservationRepository_1 = require("../repositories/reservationRepository");
const historyRepository_1 = require("../repositories/historyRepository");
const m5Client_1 = require("../clients/m5Client");
const m8Client_1 = require("../clients/m8Client");
const problem_1 = require("../types/problem");
class ActivationService {
    /**
     * RF-9.9 / RF-9.10
     * Activación programada hacia M5 (Solicitud y Despacho) con Idempotency-Key
     */
    static async activarReserva(id, user, requestId) {
        const esAutorizado = user.roles.includes('OPERADOR') || user.roles.includes('SERVICIO');
        if (!esAutorizado) {
            throw new problem_1.AppError({
                status: 403,
                title: 'Acceso no autorizado',
                detail: 'Solo operadores o procesos de servicio pueden activar reservas en despacho.'
            });
        }
        const reserva = await reservationRepository_1.ReservationRepository.obtenerPorId(id);
        if (!reserva) {
            throw new problem_1.AppError({
                status: 404,
                title: 'Reserva no encontrada',
                detail: `No existe la reserva con ID ${id}`
            });
        }
        // Idempotencia estricta: si ya posee solicitud_despacho_id, devolvemos la misma sin duplicar hacia M5
        if (reserva.solicitudDespachoId) {
            return {
                reservaId: reserva.id,
                solicitudId: reserva.solicitudDespachoId,
                estado: reserva.estado,
                mensaje: 'La reserva ya fue activada previamente en despacho (Idempotente).'
            };
        }
        // Validar estado CONFIRMADA
        if (reserva.estado !== 'CONFIRMADA') {
            throw new problem_1.AppError({
                status: 409,
                title: 'Estado incompatible',
                detail: `Solo reservas en estado CONFIRMADA pueden ser activadas en despacho. Estado actual: ${reserva.estado}`
            });
        }
        // Llamada resiliente a M5 con Idempotency-Key
        const m5Response = await m5Client_1.M5Client.activarSolicitud({
            reserva_id: reserva.id,
            cliente_id: reserva.clienteId,
            origen: reserva.origen,
            destino: reserva.destino,
            tipo_vehiculo: reserva.tipoVehiculo,
            fecha_hora: reserva.fechaHora,
            zona_horaria: reserva.zonaHoraria,
            tarifa_estimada: reserva.tarifaEstimada || 0
        }, reserva.claveIdempotencia, requestId);
        // Guardar solicitud_despacho_id en la base de datos (la reserva sigue CONFIRMADA hasta que M5 avise el resultado)
        await reservationRepository_1.ReservationRepository.actualizar(reserva.id, {
            solicitud_despacho_id: m5Response.solicitud_id
        });
        // Registrar en Historial
        await historyRepository_1.HistoryRepository.registrar({
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
        return {
            reservaId: reserva.id,
            solicitudId: m5Response.solicitud_id,
            estado: reserva.estado,
            mensaje: 'Solicitud de despacho enviada exitosamente a M5.'
        };
    }
    /**
     * RF-9.10 / RF-9.11
     * Webhook callback recibido desde M5 notificando resultado de búsqueda de conductor
     */
    static async procesarWebhookDespacho(id, payload, requestId) {
        const reserva = await reservationRepository_1.ReservationRepository.obtenerPorId(id);
        if (!reserva) {
            throw new problem_1.AppError({
                status: 404,
                title: 'Reserva no encontrada',
                detail: `No existe la reserva con ID ${id}`
            });
        }
        // Regla de acuerdo: "Si el mismo aviso llega dos veces, respondemos 200 sin volver a procesarlo."
        if ((payload.resultado === 'CONFIRMADA' && reserva.estado === 'ACTIVADA') ||
            (payload.resultado === 'VENCIDA' && reserva.estado === 'VENCIDA')) {
            return {
                mensaje: 'Aviso ya procesado previamente (Idempotente).',
                reservaId: reserva.id,
                estadoActual: reserva.estado
            };
        }
        if (payload.resultado === 'CONFIRMADA') {
            // Pasa a estado ACTIVADA (conductor asignado)
            const actualizada = await reservationRepository_1.ReservationRepository.actualizar(id, {
                estado: 'ACTIVADA',
                solicitud_despacho_id: payload.solicitud_id || reserva.solicitudDespachoId
            });
            await historyRepository_1.HistoryRepository.registrar({
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
            m8Client_1.M8Client.notificarEvento({
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
            }, requestId).catch((err) => console.warn('[M8 Error]', err));
            return {
                mensaje: 'Despacho confirmado y reserva transicionada a ACTIVADA.',
                reservaId: id,
                estadoActual: 'ACTIVADA'
            };
        }
        else if (payload.resultado === 'VENCIDA') {
            // Pasa a estado VENCIDA (sin conductor)
            const actualizada = await reservationRepository_1.ReservationRepository.actualizar(id, {
                estado: 'VENCIDA',
                solicitud_despacho_id: payload.solicitud_id || reserva.solicitudDespachoId
            });
            await historyRepository_1.HistoryRepository.registrar({
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
            m8Client_1.M8Client.notificarEvento({
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
            }, requestId).catch((err) => console.warn('[M8 Error]', err));
            return {
                mensaje: 'Búsqueda sin conductor y reserva transicionada a VENCIDA.',
                reservaId: id,
                estadoActual: 'VENCIDA'
            };
        }
        else {
            throw new problem_1.AppError({
                status: 400,
                title: 'Resultado de despacho no reconocido',
                detail: `El resultado '${payload.resultado}' no es válido. Debe ser CONFIRMADA o VENCIDA.`
            });
        }
    }
}
exports.ActivationService = ActivationService;
