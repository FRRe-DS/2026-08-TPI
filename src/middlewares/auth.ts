import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { config } from '../config/env';
import { JwtUserPayload, UserRole } from '../types/auth';
import { AppError } from '../types/problem';

// Cliente JWKS con caché en memoria y rate limiting para claves públicas de Keycloak
export const jwksClient = jwksRsa({
  jwksUri: config.keycloak.jwksUri,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutos
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

/**
 * Extrae y unifica los roles del usuario desde las distintas fuentes del token de Keycloak:
 * 1. payload.roles (claim raíz generado por el mapper de la cátedra)
 * 2. payload.realm_access.roles
 * 3. payload.resource_access[KEYCLOAK_CLIENT_ID]?.roles
 * 4. Fallback legacy a payload.role si existe como string
 */
export const extractAndNormalizeRoles = (decoded: Record<string, unknown>): UserRole[] => {
  const rolesFound: string[] = [];

  // 1. payload.roles (claim raíz)
  if (Array.isArray(decoded.roles)) {
    for (const r of decoded.roles) {
      if (typeof r === 'string' && r.trim()) rolesFound.push(r.trim());
    }
  } else if (typeof decoded.roles === 'string' && decoded.roles.trim()) {
    rolesFound.push(decoded.roles.trim());
  } else if (typeof decoded.role === 'string' && decoded.role.trim()) {
    rolesFound.push(decoded.role.trim());
  }

  // 2. payload.realm_access.roles
  const realmAccess = decoded.realm_access as { roles?: unknown } | undefined;
  if (realmAccess && Array.isArray(realmAccess.roles)) {
    for (const r of realmAccess.roles) {
      if (typeof r === 'string' && r.trim()) rolesFound.push(r.trim());
    }
  }

  // 3. payload.resource_access[KEYCLOAK_CLIENT_ID]?.roles
  const resourceAccess = decoded.resource_access as Record<string, { roles?: unknown }> | undefined;
  const clientResource = resourceAccess?.[config.keycloak.clientId];
  if (clientResource && Array.isArray(clientResource.roles)) {
    for (const r of clientResource.roles) {
      if (typeof r === 'string' && r.trim()) rolesFound.push(r.trim());
    }
  }

  // Deduplicar respetando orden de aparición
  return Array.from(new Set(rolesFound));
};

export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
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
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || typeof decodedHeader !== 'object' || !decodedHeader.header?.kid) {
      return next(
        new AppError({
          status: 401,
          title: 'Token inválido',
          detail: 'El token no posee un encabezado JWT válido o carece de key ID (kid)'
        })
      );
    }

    const signingKey = await jwksClient.getSigningKey(decodedHeader.header.kid);
    const publicKey = signingKey.getPublicKey();

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: config.keycloak.issuer
    }) as Record<string, unknown>;

    const roles = extractAndNormalizeRoles(decoded);

    const payload: JwtUserPayload = {
      iss: typeof decoded.iss === 'string' ? decoded.iss : undefined,
      aud:
        Array.isArray(decoded.aud) || typeof decoded.aud === 'string'
          ? (decoded.aud as string | string[])
          : undefined,
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

/**
 * Roles reconocidos de servicios backend (M2M) y legacy
 */
export const SERVICE_ROLES: string[] = [
  'SERVICIO',
  'reservas-be',
  'clientes-be',
  'solicitud-be',
  'conductores-be',
  'ubicacion-be',
  'viajes-be',
  'tarifas-be',
  'notificaciones-be'
];

/**
 * Determina si un rol corresponde a un servicio backend.
 * Acepta 'SERVICIO', roles explícitos ('reservas-be', 'clientes-be', 'solicitud-be', etc.)
 * y cualquier rol que termine con el sufijo oficial '-be'.
 */
export const isServiceRole = (role: string): boolean => {
  if (!role || typeof role !== 'string') return false;
  const normalized = role.trim().toLowerCase();
  return (
    normalized === 'servicio' ||
    normalized.endsWith('-be') ||
    SERVICE_ROLES.some((sr) => sr.toLowerCase() === normalized)
  );
};

/**
 * Determina si un usuario autenticado posee al menos un rol de servicio backend.
 */
export const isServiceUser = (user?: JwtUserPayload): boolean => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((role) => isServiceRole(role));
};

/**
 * Determina si el usuario tiene privilegios administrativos o de servicio backend
 * (OPERADOR, ADMIN o cualquier rol de servicio *-be / SERVICIO).
 * Estos usuarios pueden operar sin restricción de pertenencia a un cliente específico.
 */
export const isAuthorizedPrivilegedUser = (user?: JwtUserPayload): boolean => {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((role) => {
    const normalized = role.trim().toLowerCase();
    return (
      normalized === 'operador' ||
      normalized === 'admin' ||
      normalized === 'administrador' ||
      isServiceRole(role)
    );
  });
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

    // 1. Si la ruta admite algún rol de servicio y el usuario posee un rol de servicio, autorizar
    const routeAllowsService = allowedRoles.some((ar) => isServiceRole(ar));
    if (routeAllowsService && isServiceUser(req.user)) {
      return next();
    }

    // 2. Coincidencia directa (case-insensitive) con la lista de roles permitidos
    const hasRole = req.user.roles.some((userRole) =>
      allowedRoles.some(
        (allowed) =>
          allowed === userRole ||
          allowed.toUpperCase() === userRole.toUpperCase()
      )
    );

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
      iss: config.keycloak.issuer,
      aud: config.keycloak.clientId,
      sub,
      roles,
      realm_access: { roles },
      resource_access: {
        [config.keycloak.clientId]: { roles }
      }
    },
    config.jwt.secret,
    { algorithm: 'HS256', expiresIn: expiresIn as any }
  );
};
