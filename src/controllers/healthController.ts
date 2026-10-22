import { Request, Response } from 'express';
import { db } from '../config/database';
import { AppError } from '../types/problem';

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.setHeader('Content-Type', 'application/problem+json');
    res.status(503).json({
      type: 'https://api.reservas.frre.utn.edu.ar/errors/servicio-no-disponible',
      title: 'Base de datos no disponible',
      status: 503,
      detail: 'No se pudo establecer conexión con la base de datos PostgreSQL.',
      instance: '/health'
    });
  }
};
