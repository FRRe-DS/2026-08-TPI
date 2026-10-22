"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationController = void 0;
const zod_1 = require("zod");
const reservationService_1 = require("../services/reservationService");
const problem_1 = require("../types/problem");
const DireccionSchema = zod_1.z.object({
    direccion: zod_1.z.string().min(1, 'La dirección es obligatoria'),
    latitud: zod_1.z.number().min(-90, 'Latitud debe estar entre -90 y 90').max(90, 'Latitud debe estar entre -90 y 90'),
    longitud: zod_1.z.number().min(-180, 'Longitud debe estar entre -180 y 180').max(180, 'Longitud debe estar entre -180 y 180'),
    alias: zod_1.z.string().nullable().optional(),
    piso: zod_1.z.string().nullable().optional(),
    indicaciones: zod_1.z.string().nullable().optional()
});
const CrearReservaSchema = zod_1.z.object({
    claveIdempotencia: zod_1.z.string().min(1, 'La clave de idempotencia es obligatoria'),
    clienteId: zod_1.z.string().min(1, 'El clienteId es obligatorio'),
    origen: DireccionSchema,
    destino: DireccionSchema,
    tipoVehiculo: zod_1.z.enum(['AUTO', 'MOTO'], {
        errorMap: () => ({ message: "El tipo de vehículo debe ser 'AUTO' o 'MOTO'" })
    }),
    fechaHora: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fechaHora debe tener un formato ISO 8601 válido'
    }),
    zonaHoraria: zod_1.z.string().min(1, 'La zona horaria es obligatoria')
});
const ModificarReservaSchema = zod_1.z.object({
    origen: DireccionSchema.optional(),
    destino: DireccionSchema.optional(),
    tipoVehiculo: zod_1.z.enum(['AUTO', 'MOTO']).optional(),
    fechaHora: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fechaHora debe tener un formato ISO 8601 válido'
    })
        .optional(),
    zonaHoraria: zod_1.z.string().optional()
});
const CancelarReservaSchema = zod_1.z.object({
    motivo: zod_1.z.string().min(3, 'El motivo de cancelación debe tener al menos 3 caracteres')
});
class ReservationController {
    static async crear(req, res, next) {
        try {
            // Soporta también Idempotency-Key en header si no vino en el body
            const idempotencyHeader = req.header('Idempotency-Key') || req.header('idempotency-key');
            const bodyWithIdempotency = {
                ...req.body,
                claveIdempotencia: req.body?.claveIdempotencia || idempotencyHeader
            };
            const validatedData = CrearReservaSchema.parse(bodyWithIdempotency);
            const user = req.user;
            const { reserva, esRepeticion } = await reservationService_1.ReservationService.crearReserva(validatedData, user, req.id);
            const statusCode = esRepeticion ? 200 : 201;
            res.status(statusCode).json(reserva);
        }
        catch (error) {
            next(error);
        }
    }
    static async listar(req, res, next) {
        try {
            const clienteId = req.query.clienteId;
            if (!clienteId || clienteId.trim().length === 0) {
                throw new problem_1.AppError({
                    status: 400,
                    title: 'Parámetro requerido faltante',
                    detail: 'El parámetro de consulta ?clienteId=... es obligatorio.'
                });
            }
            const user = req.user;
            const reservas = await reservationService_1.ReservationService.listarPorCliente(clienteId.trim(), user);
            res.status(200).json(reservas);
        }
        catch (error) {
            next(error);
        }
    }
    static async obtenerPorId(req, res, next) {
        try {
            const id = req.params.id;
            const user = req.user;
            const reserva = await reservationService_1.ReservationService.obtenerPorId(id, user);
            res.status(200).json(reserva);
        }
        catch (error) {
            next(error);
        }
    }
    static async modificar(req, res, next) {
        try {
            const id = req.params.id;
            const validatedData = ModificarReservaSchema.parse(req.body);
            const user = req.user;
            const reservaActualizada = await reservationService_1.ReservationService.modificarReserva(id, validatedData, user, req.id);
            res.status(200).json(reservaActualizada);
        }
        catch (error) {
            next(error);
        }
    }
    static async cancelar(req, res, next) {
        try {
            const id = req.params.id;
            const validatedData = CancelarReservaSchema.parse(req.body);
            const user = req.user;
            const reservaCancelada = await reservationService_1.ReservationService.cancelarReserva(id, validatedData.motivo, user, req.id);
            res.status(200).json(reservaCancelada);
        }
        catch (error) {
            next(error);
        }
    }
    static async historial(req, res, next) {
        try {
            const id = req.params.id;
            const user = req.user;
            const eventos = await reservationService_1.ReservationService.consultarHistorial(id, user);
            res.status(200).json(eventos);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReservationController = ReservationController;
