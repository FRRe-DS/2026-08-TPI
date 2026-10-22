import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/problem';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(
    new AppError({
      status: 404,
      title: 'Recurso no encontrado',
      detail: `La ruta solicitada ${req.method} ${req.originalUrl} no existe en este servidor.`
    })
  );
};
