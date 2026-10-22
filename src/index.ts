import { createApp } from './app';
import { config } from './config/env';
import { db } from './config/database';

const startServer = async () => {
  const app = createApp();

  // Inicializar esquema de base de datos
  await db.initDb();

  const server = app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 M9 - Reservas de Viajes corriendo en http://localhost:${config.port}`);
    console.log(`📑 Swagger UI disponible en: http://localhost:${config.port}/docs`);
    console.log(`🩺 Healthcheck: http://localhost:${config.port}/health`);
    console.log(`🌍 Entorno: ${config.nodeEnv}`);
    console.log(`=======================================================`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`\nRecibida señal ${signal}. Cerrando servidor gracefulmente...`);
    server.close(async () => {
      await db.close();
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
