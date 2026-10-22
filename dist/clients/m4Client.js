"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M4Client = void 0;
const env_1 = require("../config/env");
const httpClient_1 = require("./httpClient");
class M4Client {
    static async validarYEstimar(data, requestId) {
        if (env_1.config.services.useExternalMocks) {
            return this.mockValidarYEstimar(data);
        }
        const url = `${env_1.config.services.m4UbicacionUrl}/api/v1/ubicaciones/validar-estimar`;
        try {
            const response = await httpClient_1.HttpClient.request(url, {
                method: 'POST',
                body: data,
                requestId
            });
            return response;
        }
        catch (err) {
            console.warn(`[M4Client] Error llamando a M4 (${err.message}). Usando fallback mock.`);
            return this.mockValidarYEstimar(data);
        }
    }
    static mockValidarYEstimar(data) {
        const { origen, destino } = data;
        // Validación de rangos geográficos básicos
        if (origen.latitud < -90 || origen.latitud > 90 ||
            origen.longitud < -180 || origen.longitud > 180 ||
            destino.latitud < -90 || destino.latitud > 90 ||
            destino.longitud < -180 || destino.longitud > 180) {
            return {
                origen_valido: false,
                destino_valido: false,
                motivo: 'COORDENADAS_INVALIDAS',
                distancia_km: 0,
                tiempo_estimado_min: 0
            };
        }
        // Coordenadas especiales de prueba para simular fuera de cobertura (ej: lat > 0)
        if (origen.latitud > 0 || destino.latitud > 0) {
            return {
                origen_valido: origen.latitud <= 0,
                destino_valido: destino.latitud <= 0,
                motivo: 'FUERA_DE_COBERTURA',
                distancia_km: 0,
                tiempo_estimado_min: 0
            };
        }
        // Cálculo aproximado de distancia euclidiana escalada a km
        const dLat = (destino.latitud - origen.latitud) * 111;
        const dLon = (destino.longitud - origen.longitud) * 111 * Math.cos((origen.latitud * Math.PI) / 180);
        const distancia = Math.sqrt(dLat * dLat + dLon * dLon);
        const distanciaKm = Math.max(1.0, Math.round(distancia * 100) / 100) || 7.35;
        const tiempoMin = Math.max(5, Math.round(distanciaKm * 2.5));
        return {
            origen_valido: true,
            destino_valido: true,
            motivo: null,
            distancia_km: distanciaKm,
            tiempo_estimado_min: tiempoMin
        };
    }
}
exports.M4Client = M4Client;
