"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./env");
exports.pool = new pg_1.Pool(env_1.config.database.url
    ? { connectionString: env_1.config.database.url }
    : {
        host: env_1.config.database.host,
        port: env_1.config.database.port,
        user: env_1.config.database.user,
        password: env_1.config.database.password,
        database: env_1.config.database.database
    });
exports.pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
});
exports.db = {
    query: async (text, params) => {
        return exports.pool.query(text, params);
    },
    getClient: async () => {
        return exports.pool.connect();
    },
    initDb: async () => {
        try {
            const schemaPath = path_1.default.join(__dirname, '../../sql/01_init_schema.sql');
            if (fs_1.default.existsSync(schemaPath)) {
                const sql = fs_1.default.readFileSync(schemaPath, 'utf8');
                await exports.pool.query(sql);
                console.log('Esquema de base de datos PostgreSQL inicializado exitosamente.');
            }
        }
        catch (error) {
            console.warn('Aviso: No se pudo inicializar el esquema SQL automáticamente:', error.message);
        }
    },
    close: async () => {
        await exports.pool.end();
    }
};
