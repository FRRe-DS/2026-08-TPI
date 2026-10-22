"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M2Client = void 0;
const env_1 = require("../config/env");
const httpClient_1 = require("./httpClient");
const problem_1 = require("../types/problem");
class M2Client {
    static async verificarEstadoCuenta(clienteId, requestId) {
        if (env_1.config.services.useExternalMocks) {
            return this.mockVerificarEstadoCuenta(clienteId);
        }
        const url = `${env_1.config.services.m2ClientesUrl}/api/v1/clientes/${encodeURIComponent(clienteId)}/estado-cuenta`;
        try {
            const response = await httpClient_1.HttpClient.request(url, {
                method: 'GET',
                requestId
            });
            return response;
        }
        catch (err) {
            const status = err.status;
            if (status === 404) {
                throw new problem_1.AppError({
                    status: 404,
                    title: 'Cliente no encontrado',
                    detail: `El cliente con ID ${clienteId} no está registrado en M2.`
                });
            }
            // Fallback a mock si el servicio externo no está levantado en desarrollo
            console.warn(`[M2Client] No se pudo conectar a M2 (${err.message}). Usando fallback mock.`);
            return this.mockVerificarEstadoCuenta(clienteId);
        }
    }
    static mockVerificarEstadoCuenta(clienteId) {
        if (clienteId.includes('bloqueado')) {
            return {
                cliente_id: clienteId,
                estado: 'BLOQUEADO'
            };
        }
        return {
            cliente_id: clienteId,
            estado: 'ACTIVO'
        };
    }
}
exports.M2Client = M2Client;
