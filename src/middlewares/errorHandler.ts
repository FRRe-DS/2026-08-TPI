import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ProblemDetails } from '../types/problem';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.setHeader('Content-Type', 'application/problem+json');

  if (err instanceof AppError) {
    const problem: ProblemDetails = {
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance: req.originalUrl,
      invalidParams: err.invalidParams
    };
    res.status(err.status).json(problem);
    return;
  }

  if (err instanceof ZodError) {
    const invalidParams = err.issues.map((issue) => ({
      name: issue.path.join('.'),
      reason: issue.message
    }));

    const problem: ProblemDetails = {
      type: 'https://api.reservas.frre.utn.edu.ar/errors/datos-invalidos',
      title: 'Datos de solicitud inválidos',
      status: 400,
      detail: 'El cuerpo o parámetros de la petición no cumplen con el formato esperado.',
      instance: req.originalUrl,
      invalidParams
    };
    res.status(400).json(problem);
    return;
  }

  // Error inesperado / no controlado
  console.error('[Unhandled Error]', err);
  const problem: ProblemDetails = {
    type: 'https://api.reservas.frre.utn.edu.ar/errors/error-interno',
    title: 'Error interno del servidor',
    status: 500,
    detail: process.env.NODE_ENV === 'production' 
      ? 'Ocurrió un error inesperado al procesar la solicitud.' 
      : err.message || 'Error interno no especificado.',
    instance: req.originalUrl
  };

  res.status(500).json(problem);
};
