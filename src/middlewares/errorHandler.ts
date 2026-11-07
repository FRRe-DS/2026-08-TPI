import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types/problem';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // 1. Errores de validación de Zod (ej: tipoVehiculo inválido o campos faltantes)
  if (err instanceof ZodError) {
    const detalles = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Los datos enviados en la solicitud no son válidos',
      detalle: detalles
    });
    return;
  }

  // 2. JSON mal formado sintácticamente (ej: llaves sin cerrar)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      codigo: 'JSON_INVALIDO',
      mensaje: 'El cuerpo de la solicitud no es un JSON válido',
      detalle: err.message
    });
    return;
  }

  // 3. Errores de negocio controlados (AppError)
  if (err instanceof AppError) {
    // Mapeo simple de status a código de Grupo 9
    let codigo = 'ERROR';
    if (err.status === 400) codigo = 'DATOS_INVALIDOS';
    if (err.status === 401) codigo = 'NO_AUTENTICADO';
    if (err.status === 403) codigo = 'NO_AUTORIZADO';
    if (err.status === 404) codigo = 'NO_ENCONTRADA';
    if (err.status === 409) codigo = 'ESTADO_INVALIDO';
    if (err.status === 422) codigo = 'REGLA_NEGOCIO_INVALIDA';
    if (err.status === 503) codigo = 'SERVICIO_NO_DISPONIBLE';

    res.status(err.status).json({
      codigo,
      mensaje: err.title,
      detalle: err.detail || null
    });
    return;
  }

  // 4. Errores inesperados del servidor (500)
  console.error('[Error no controlado]:', err);
  res.status(500).json({
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ocurrió un error inesperado en el servidor',
    detalle: process.env.NODE_ENV === 'development' ? err.message : null
  });
};