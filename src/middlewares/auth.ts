import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtUserPayload, UserRole } from '../types/auth';
import { AppError } from '../types/problem';

export const authenticateToken = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization') || req.header('authorization');
  if (!authHeader) {
    return next(
      new AppError({
        status: 401,
        title: 'No autenticado',
        detail: 'Encabezado Authorization requerido con formato Bearer <token>'
      })
    );
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return next(
      new AppError({
        status: 401,
        title: 'Formato de autenticación inválido',
        detail: 'El encabezado Authorization debe tener el formato Bearer <token>'
      })
    );
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as Record<string, unknown>;
    
    // Normalizar roles (pueden venir como array o string único)
    let roles: UserRole[] = [];
    if (Array.isArray(decoded.roles)) {
      roles = decoded.roles as UserRole[];
    } else if (typeof decoded.roles === 'string') {
      roles = [decoded.roles as UserRole];
    } else if (typeof decoded.role === 'string') {
      roles = [decoded.role as UserRole];
    }

    const payload: JwtUserPayload = {
      iss: typeof decoded.iss === 'string' ? decoded.iss : undefined,
      aud: typeof decoded.aud === 'string' ? decoded.aud : undefined,
      sub: String(decoded.sub || ''),
      roles,
      exp: typeof decoded.exp === 'number' ? decoded.exp : undefined,
      ...decoded
    };

    req.user = payload;
    next();
  } catch (error) {
    return next(
      new AppError({
        status: 401,
        title: 'Token inválido o expirado',
        detail: (error as Error).message
      })
    );
  }
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError({
          status: 401,
          title: 'No autenticado',
          detail: 'Se requiere autenticación previa'
        })
      );
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(
        new AppError({
          status: 403,
          title: 'Acceso denegado',
          detail: `Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
        })
      );
    }

    next();
  };
};

export const generateDevToken = (
  sub: string,
  roles: UserRole[],
  expiresIn: string = '24h'
): string => {
  return jwt.sign(
    {
      iss: config.jwt.issuer,
      aud: config.jwt.audience,
      sub,
      roles
    },
    config.jwt.secret,
    { algorithm: 'HS256', expiresIn: expiresIn as any }
  );
};
