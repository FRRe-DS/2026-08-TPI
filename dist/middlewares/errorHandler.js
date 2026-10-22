"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const problem_1 = require("../types/problem");
const errorHandler = (err, req, res, _next) => {
    res.setHeader('Content-Type', 'application/problem+json');
    if (err instanceof problem_1.AppError) {
        const problem = {
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
    if (err instanceof zod_1.ZodError) {
        const invalidParams = err.issues.map((issue) => ({
            name: issue.path.join('.'),
            reason: issue.message
        }));
        const problem = {
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
    const problem = {
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
exports.errorHandler = errorHandler;
