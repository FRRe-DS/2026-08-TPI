"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const serviceToken_1 = require("./serviceToken");
class HttpClient {
    static DEFAULT_TIMEOUT_MS = 2000;
    static async request(url, options = {}) {
        const method = options.method || 'GET';
        const timeoutMs = options.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;
        const maxRetries = options.retries ?? (method === 'GET' ? 1 : 0);
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json, application/problem+json',
            Authorization: `Bearer ${(0, serviceToken_1.getServiceToken)()}`,
            ...(options.requestId ? { 'X-Request-Id': options.requestId } : {}),
            ...(options.headers || {})
        };
        let attempt = 0;
        let lastError = null;
        while (attempt <= maxRetries) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const response = await fetch(url, {
                    method,
                    headers,
                    body: options.body ? JSON.stringify(options.body) : undefined,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    let errorBody;
                    try {
                        errorBody = await response.json();
                    }
                    catch {
                        errorBody = await response.text();
                    }
                    const err = new Error(`HTTP ${response.status} en ${method} ${url}: ${JSON.stringify(errorBody)}`);
                    err.status = response.status;
                    err.responseBody = errorBody;
                    throw err;
                }
                return (await response.json());
            }
            catch (err) {
                clearTimeout(timeoutId);
                lastError = err;
                // Si es un abort (timeout), personalizar mensaje
                if (err.name === 'AbortError') {
                    lastError = new Error(`Timeout de ${timeoutMs}ms excedido en llamada a ${method} ${url}`);
                }
                attempt++;
                if (attempt <= maxRetries && method === 'GET') {
                    // Reintento único para peticiones GET
                    await new Promise((resolve) => setTimeout(resolve, 150));
                    continue;
                }
                break;
            }
        }
        throw lastError || new Error(`Error de red al conectar con ${url}`);
    }
}
exports.HttpClient = HttpClient;
