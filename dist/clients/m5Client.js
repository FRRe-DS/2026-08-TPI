"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M5Client = void 0;
const env_1 = require("../config/env");
const httpClient_1 = require("./httpClient");
class M5Client {
    static async activarSolicitud(data, idempotencyKey, requestId) {
        if (env_1.config.services.useExternalMocks) {
            return this.mockActivarSolicitud(data);
        }
        const url = `${env_1.config.services.m5DespachoUrl}/api/v1/solicitudes`;
        try {
            const response = await httpClient_1.HttpClient.request(url, {
                method: 'POST',
                headers: {
                    'Idempotency-Key': idempotencyKey
                },
                body: data,
                requestId,
                retries: 1 // La activación permite un reintento gracias a la Idempotency-Key
            });
            return response;
        }
        catch (err) {
            console.warn(`[M5Client] Error llamando a M5 (${err.message}). Usando fallback mock.`);
            return this.mockActivarSolicitud(data);
        }
    }
    static mockActivarSolicitud(data) {
        return {
            solicitud_id: `sol-m5-${data.reserva_id.substring(0, 8)}`
        };
    }
}
exports.M5Client = M5Client;
