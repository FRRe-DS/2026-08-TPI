import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from './env';

export const pool = new Pool(
  config.database.url
    ? { connectionString: config.database.url }
    : {
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database
      }
);

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

export const db = {
  query: async <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> => {
    return pool.query<T>(text, params);
  },

  getClient: async () => {
    return pool.connect();
  },

  initDb: async (): Promise<void> => {
    try {
      const schemaPath = path.join(__dirname, '../../sql/01_init_schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(sql);
        console.log('Esquema de base de datos PostgreSQL inicializado exitosamente.');
      }
    } catch (error) {
      console.warn('Aviso: No se pudo inicializar el esquema SQL automáticamente:', (error as Error).message);
    }
  },

  close: async (): Promise<void> => {
    await pool.end();
  }
};
