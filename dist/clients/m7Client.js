"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M7Client = void 0;
const env_1 = require("../config/env");
const httpClient_1 = require("./httpClient");
class M7Client {
    static async estimarTarifa(data, requestId) {
        if (env_1.config.services.useExternalMocks) {
            return this.mockEstimarTarifa(data);
        }
        const url = `${env_1.config.services.m7TarifasUrl}/api/v1/tarifas/estimar`;
        try {
            const response = await httpClient_1.HttpClient.request(url, {
                method: 'POST',
                body: data,
                requestId
            });
            return response;
        }
        catch (err) {
            console.warn(`[M7Client] Error llamando a M7 (${err.message}). Usando fallback mock.`);
            return this.mockEstimarTarifa(data);
        }
    }
    static mockEstimarTarifa(data) {
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
exports.M7Client = M7Client;
