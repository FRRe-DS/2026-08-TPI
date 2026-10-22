"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const startServer = async () => {
    const app = (0, app_1.createApp)();
    // Inicializar esquema de base de datos
    await database_1.db.initDb();
    const server = app.listen(env_1.config.port, () => {
        console.log(`=======================================================`);
        console.log(`🚀 M9 - Reservas de Viajes corriendo en http://localhost:${env_1.config.port}`);
        console.log(`📑 Swagger UI disponible en: http://localhost:${env_1.config.port}/docs`);
        console.log(`🩺 Healthcheck: http://localhost:${env_1.config.port}/health`);
        console.log(`🌍 Entorno: ${env_1.config.nodeEnv}`);
        console.log(`=======================================================`);
    });
    const gracefulShutdown = async (signal) => {
        console.log(`\nRecibida señal ${signal}. Cerrando servidor gracefulmente...`);
        server.close(async () => {
            await database_1.db.close();
            console.log('Servidor y conexiones a PostgreSQL cerradas.');
            process.exit(0);
        });
    };
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};
if (require.main === module) {
    startServer().catch((err) => {
        console.error('Error fatal al iniciar servidor M9:', err);
        process.exit(1);
    });
}
