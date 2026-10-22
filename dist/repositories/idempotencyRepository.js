"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyRepository = void 0;
const database_1 = require("../config/database");
class IdempotencyRepository {
    static inMemoryCache = new Map();
    static async obtener(clave) {
        try {
            const res = await database_1.db.query('SELECT clave, ruta, codigo_estado, cuerpo_respuesta, creado_en FROM registro_idempotencia WHERE clave = $1', [clave]);
            if (res.rows.length > 0) {
                return {
                    codigoEstado: res.rows[0].codigo_estado,
                    cuerpoRespuesta: res.rows[0].cuerpo_respuesta
                };
            }
        }
        catch {
            // Fallback in-memory
            const cached = this.inMemoryCache.get(clave);
            if (cached) {
                return { codigoEstado: cached.codigoEstado, cuerpoRespuesta: cached.cuerpoRespuesta };
            }
        }
        return null;
    }
    static async guardar(clave, ruta, codigoEstado, cuerpoRespuesta) {
        try {
            await database_1.db.query(`INSERT INTO registro_idempotencia (clave, ruta, codigo_estado, cuerpo_respuesta, creado_en)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (clave) DO NOTHING`, [clave, ruta, codigoEstado, JSON.stringify(cuerpoRespuesta)]);
        }
        catch {
            // Fallback in-memory
            this.inMemoryCache.set(clave, { codigoEstado, cuerpoRespuesta, creadoEn: new Date() });
        }
    }
    static clearMemoryCache() {
        this.inMemoryCache.clear();
    }
}
exports.IdempotencyRepository = IdempotencyRepository;
