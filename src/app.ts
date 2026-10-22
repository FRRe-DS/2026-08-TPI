import express, { Application } from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middlewares/requestId';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import healthRoutes from './routes/healthRoutes';
import reservationRoutes from './routes/reservationRoutes';
import docRoutes from './routes/docRoutes';

export const createApp = (): Application => {
  const app = express();

  // Middlewares globales
  app.use(cors());
  app.use(express.json());
  app.use(requestIdMiddleware);

  // Rutas
  app.use(healthRoutes);
  app.use(docRoutes);
  app.use('/reservas', reservationRoutes);

  // Manejo de 404 y errores RFC 7807
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp();
