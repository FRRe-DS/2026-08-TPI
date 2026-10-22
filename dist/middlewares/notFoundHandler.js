"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const problem_1 = require("../types/problem");
const notFoundHandler = (req, _res, next) => {
    next(new problem_1.AppError({
        status: 404,
        title: 'Recurso no encontrado',
        detail: `La ruta solicitada ${req.method} ${req.originalUrl} no existe en este servidor.`
    }));
};
exports.notFoundHandler = notFoundHandler;
