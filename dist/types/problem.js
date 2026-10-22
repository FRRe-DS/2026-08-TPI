"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    status;
    title;
    type;
    detail;
    invalidParams;
    constructor(options) {
        super(options.detail);
        this.name = 'AppError';
        this.status = options.status;
        this.title = options.title;
        this.detail = options.detail;
        this.type = options.type || `https://api.reservas.frre.utn.edu.ar/errors/${this.slugify(options.title)}`;
        this.invalidParams = options.invalidParams;
    }
    slugify(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
}
exports.AppError = AppError;
