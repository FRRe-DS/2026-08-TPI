"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * Genera el token JWT con rol SERVICIO para autenticar las llamadas de M9 a otros módulos.
 * Según los acuerdos:
 * sub: "m9-reservas"
 * roles: ["SERVICIO"]
 */
const getServiceToken = () => {
    return jsonwebtoken_1.default.sign({
        iss: env_1.config.jwt.issuer,
        aud: env_1.config.jwt.audience,
        sub: 'm9-reservas',
        roles: ['SERVICIO']
    }, env_1.config.jwt.secret, { algorithm: 'HS256', expiresIn: '1h' });
};
exports.getServiceToken = getServiceToken;
