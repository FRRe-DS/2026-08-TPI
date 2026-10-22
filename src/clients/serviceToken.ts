import jwt from 'jsonwebtoken';
import { config } from '../config/env';

/**
 * Genera el token JWT con rol SERVICIO para autenticar las llamadas de M9 a otros módulos.
 * Según los acuerdos:
 * sub: "m9-reservas"
 * roles: ["SERVICIO"]
 */
export const getServiceToken = (): string => {
  return jwt.sign(
    {
      iss: config.jwt.issuer,
      aud: config.jwt.audience,
      sub: 'm9-reservas',
      roles: ['SERVICIO']
    },
    config.jwt.secret,
    { algorithm: 'HS256', expiresIn: '1h' as any }
  );
};
