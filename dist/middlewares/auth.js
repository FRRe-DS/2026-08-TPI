"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDevToken = exports.requireRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const problem_1 = require("../types/problem");
const authenticateToken = (req, _res, next) => {
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (!authHeader) {
        return next(new problem_1.AppError({
            status: 401,
            title: 'No autenticado',
            detail: 'Encabezado Authorization requerido con formato Bearer <token>'
        }));
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return next(new problem_1.AppError({
            status: 401,
            title: 'Formato de autenticación inválido',
            detail: 'El encabezado Authorization debe tener el formato Bearer <token>'
        }));
    }
    const token = parts[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        // Normalizar roles (pueden venir como array o string único)
        let roles = [];
        if (Array.isArray(decoded.roles)) {
            roles = decoded.roles;
        }
        else if (typeof decoded.roles === 'string') {
            roles = [decoded.roles];
        }
        else if (typeof decoded.role === 'string') {
            roles = [decoded.role];
        }
        const payload = {
            iss: typeof decoded.iss === 'string' ? decoded.iss : undefined,
            aud: typeof decoded.aud === 'string' ? decoded.aud : undefined,
            sub: String(decoded.sub || ''),
            roles,
            exp: typeof decoded.exp === 'number' ? decoded.exp : undefined,
            ...decoded
        };
        req.user = payload;
        next();
    }
    catch (error) {
        return next(new problem_1.AppError({
            status: 401,
            title: 'Token inválido o expirado',
            detail: error.message
        }));
    }
};
exports.authenticateToken = authenticateToken;
const requireRoles = (allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new problem_1.AppError({
                status: 401,
                title: 'No autenticado',
                detail: 'Se requiere autenticación previa'
            }));
        }
        const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
        if (!hasRole) {
            return next(new problem_1.AppError({
                status: 403,
                title: 'Acceso denegado',
                detail: `Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
            }));
        }
        next();
    };
};
exports.requireRoles = requireRoles;
const generateDevToken = (sub, roles, expiresIn = '24h') => {
    return jsonwebtoken_1.default.sign({
        iss: env_1.config.jwt.issuer,
        aud: env_1.config.jwt.audience,
        sub,
        roles
    }, env_1.config.jwt.secret, { algorithm: 'HS256', expiresIn: expiresIn });
};
exports.generateDevToken = generateDevToken;
