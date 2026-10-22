import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ReservationService } from '../services/reservationService';
import { AppError } from '../types/problem';

const DireccionSchema = z.object({
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  latitud: z.number().min(-90, 'Latitud debe estar entre -90 y 90').max(90, 'Latitud debe estar entre -90 y 90'),
  longitud: z.number().min(-180, 'Longitud debe estar entre -180 y 180').max(180, 'Longitud debe estar entre -180 y 180'),
  alias: z.string().nullable().optional(),
  piso: z.string().nullable().optional(),
  indicaciones: z.string().nullable().optional()
});

const CrearReservaSchema = z.object({
  claveIdempotencia: z.string().min(1, 'La clave de idempotencia es obligatoria'),
  clienteId: z.string().min(1, 'El clienteId es obligatorio'),
  origen: DireccionSchema,
  destino: DireccionSchema,
  tipoVehiculo: z.enum(['AUTO', 'MOTO'], {
    errorMap: () => ({ message: "El tipo de vehículo debe ser 'AUTO' o 'MOTO'" })
  }),
  fechaHora: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'La fechaHora debe tener un formato ISO 8601 válido'
  }),
  zonaHoraria: z.string().min(1, 'La zona horaria es obligatoria')
});

const ModificarReservaSchema = z.object({
  origen: DireccionSchema.optional(),
  destino: DireccionSchema.optional(),
  tipoVehiculo: z.enum(['AUTO', 'MOTO']).optional(),
  fechaHora: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'La fechaHora debe tener un formato ISO 8601 válido'
    })
    .optional(),
  zonaHoraria: z.string().optional()
});

const CancelarReservaSchema = z.object({
  motivo: z.string().min(3, 'El motivo de cancelación debe tener al menos 3 caracteres')
});

export class ReservationController {
  public static async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Soporta también Idempotency-Key en header si no vino en el body
      const idempotencyHeader = req.header('Idempotency-Key') || req.header('idempotency-key');
      const bodyWithIdempotency = {
        ...req.body,
        claveIdempotencia: req.body?.claveIdempotencia || idempotencyHeader
      };

      const validatedData = CrearReservaSchema.parse(bodyWithIdempotency);
      const user = req.user!;

      const { reserva, esRepeticion } = await ReservationService.crearReserva(
        validatedData,
        user,
        req.id
      );

      const statusCode = esRepeticion ? 200 : 201;
      res.status(statusCode).json(reserva);
    } catch (error) {
      next(error);
    }
  }

  public static async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clienteId = req.query.clienteId as string;
      if (!clienteId || clienteId.trim().length === 0) {
        throw new AppError({
          status: 400,
          title: 'Parámetro requerido faltante',
          detail: 'El parámetro de consulta ?clienteId=... es obligatorio.'
        });
      }

      const user = req.user!;
      const reservas = await ReservationService.listarPorCliente(clienteId.trim(), user);
      res.status(200).json(reservas);
    } catch (error) {
      next(error);
    }
  }

  public static async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const user = req.user!;
      const reserva = await ReservationService.obtenerPorId(id, user);
      res.status(200).json(reserva);
    } catch (error) {
      next(error);
    }
  }

  public static async modificar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const validatedData = ModificarReservaSchema.parse(req.body);
      const user = req.user!;

      const reservaActualizada = await ReservationService.modificarReserva(
        id,
        validatedData,
        user,
        req.id
      );
      res.status(200).json(reservaActualizada);
    } catch (error) {
      next(error);
    }
  }

  public static async cancelar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const validatedData = CancelarReservaSchema.parse(req.body);
      const user = req.user!;

      const reservaCancelada = await ReservationService.cancelarReserva(
        id,
        validatedData.motivo,
        user,
        req.id
      );
      res.status(200).json(reservaCancelada);
    } catch (error) {
      next(error);
    }
  }

  public static async historial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const user = req.user!;
      const eventos = await ReservationService.consultarHistorial(id, user);
      res.status(200).json(eventos);
    } catch (error) {
      next(error);
    }
  }
}
