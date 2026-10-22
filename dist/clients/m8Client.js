"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M8Client = void 0;
const env_1 = require("../config/env");
const httpClient_1 = require("./httpClient");
class M8Client {
    static async notificarEvento(evento, requestId) {
        if (env_1.config.services.useExternalMocks) {
            console.log(`[M8Client Mock] Notificación enviada: ${evento.tipo_evento} para reserva ${evento.reserva_id}`);
            return;
        }
        const url = `${env_1.config.services.m8NotificacionesUrl}/api/v1/notificaciones/eventos`;
        try {
            await httpClient_1.HttpClient.request(url, {
                method: 'POST',
                body: evento,
                requestId,
                timeoutMs: 2000
            });
            console.log(`[M8Client] Evento ${evento.tipo_evento} entregado a M8 exitosamente.`);
        }
        catch (err) {
            // Regla de negocio explícita: "Si M8 no responde: la reserva sigue su curso. Un aviso fallido no cancela ni revierte la reserva."
            console.warn(`[M8Client] No se pudo entregar la notificación a M8 (${err.message}). La operación continúa.`);
        }
    }
}
exports.M8Client = M8Client;
