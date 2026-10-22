import { db } from '../config/database';

export interface RegistroIdempotencia {
  clave: string;
  ruta: string;
  codigoEstado: number;
  cuerpoRespuesta: unknown;
  creadoEn: Date;
}

export class IdempotencyRepository {
  private static inMemoryCache = new Map<string, { codigoEstado: number; cuerpoRespuesta: unknown; creadoEn: Date }>();

  public static async obtener(clave: string): Promise<{ codigoEstado: number; cuerpoRespuesta: unknown } | null> {
    try {
      const res = await db.query(
        'SELECT clave, ruta, codigo_estado, cuerpo_respuesta, creado_en FROM registro_idempotencia WHERE clave = $1',
        [clave]
      );
      if (res.rows.length > 0) {
        return {
          codigoEstado: res.rows[0].codigo_estado,
          cuerpoRespuesta: res.rows[0].cuerpo_respuesta
        };
      }
    } catch {
      // Fallback in-memory
      const cached = this.inMemoryCache.get(clave);
      if (cached) {
        return { codigoEstado: cached.codigoEstado, cuerpoRespuesta: cached.cuerpoRespuesta };
      }
    }
    return null;
  }

  public static async guardar(
    clave: string,
    ruta: string,
    codigoEstado: number,
    cuerpoRespuesta: unknown
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO registro_idempotencia (clave, ruta, codigo_estado, cuerpo_respuesta, creado_en)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (clave) DO NOTHING`,
        [clave, ruta, codigoEstado, JSON.stringify(cuerpoRespuesta)]
      );
    } catch {
      // Fallback in-memory
      this.inMemoryCache.set(clave, { codigoEstado, cuerpoRespuesta, creadoEn: new Date() });
    }
  }

  public static clearMemoryCache(): void {
    this.inMemoryCache.clear();
  }
}
