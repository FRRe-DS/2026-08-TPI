import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {
  authenticateToken,
  requireRoles,
  extractAndNormalizeRoles,
  isServiceRole,
  isServiceUser,
  isAuthorizedPrivilegedUser
} from '../../src/middlewares/auth';
import { createTestToken, TEST_KID, testKeyPair } from '../helpers/tokenHelper';
import { config } from '../../src/config/env';
import { AppError } from '../../src/types/problem';

describe('Auth Middleware con Keycloak JWKS (RS256) y Normalización de Roles', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      header: jest.fn()
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe('Verificación de Encabezado Authorization', () => {
    it('debe rechazar con 401 si no se envía encabezado Authorization', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);

      await authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0] as unknown as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(401);
      expect(error.title).toBe('No autenticado');
    });

    it('debe rechazar con 401 si el esquema no es Bearer', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue('Basic dXNlcjpwYXNz');

      await authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0] as unknown as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(401);
      expect(error.title).toBe('Formato de autenticación inválido');
    });

    it('debe rechazar con 401 si el token no tiene formato JWT o carece de header kid', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue('Bearer token-sin-formato-valido');

      await authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0] as unknown as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(401);
      expect(error.title).toBe('Token inválido');
    });
  });

  describe('Verificación Criptográfica Asimétrica (RS256, Issuer, Expiración)', () => {
    it('debe autenticar exitosamente un token RS256 con firma válida e issuer oficial', async () => {
      const token = createTestToken('user-sub-001', ['CLIENTE']);
      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${token}`);

      await authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.sub).toBe('user-sub-001');
      expect(mockRequest.user?.roles).toContain('CLIENTE');
    });

    it('debe rechazar un token firmado con una clave privada diferente (firma inválida)', async () => {
      // Generar otro par de claves RSA distinto
      const otherKeyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      const invalidToken = jwt.sign(
        {
          iss: config.keycloak.issuer,
          aud: config.keycloak.clientId,
          sub: 'hacker-sub',
          roles: ['CLIENTE']
        },
        otherKeyPair.privateKey,
        {
          algorithm: 'RS256',
          keyid: TEST_KID,
          expiresIn: '1h'
        }
      );

      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${invalidToken}`);

      await authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0] as unknown as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(401);
      expect(error.title).toBe('Token inválido o expirado');
    });

    it('debe rechazar un token expirado', async () => {
      const expiredToken = createTestToken('user-sub-exp', ['CLIENTE'], '-10s');
      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${expiredToken}`);

      await authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0] as unknown as AppError;
      expect(error.status).toBe(401);
      expect(error.detail).toContain('jwt expired');
    });

    it('debe rechazar un token emitido por un issuer no oficial', async () => {
      const wrongIssuerToken = createTestToken('user-sub-wrong-iss', ['CLIENTE'], '1h', {
        issuer: 'http://malicious-issuer.com/auth'
      });
      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${wrongIssuerToken}`);

      await authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0] as unknown as AppError;
      expect(error.status).toBe(401);
      expect(error.detail).toContain('jwt issuer invalid');
    });
  });

  describe('Mapeo y Normalización de Roles (extractAndNormalizeRoles)', () => {
    it('debe unificar y deduplicar roles desde claim raíz, realm_access y resource_access[grupo-08]', () => {
      const decodedPayload = {
        roles: ['CLIENTE', 'ADMIN'],
        realm_access: {
          roles: ['CLIENTE', 'default-roles-ds-2026-realm', 'offline_access']
        },
        resource_access: {
          'grupo-08': {
            roles: ['reservas-be', 'OPERADOR']
          },
          'otro-modulo': {
            roles: ['otro-rol-no-propio'] // No debe incluirse
          }
        }
      };

      const normalizedRoles = extractAndNormalizeRoles(decodedPayload);

      expect(normalizedRoles).toEqual([
        'CLIENTE',
        'ADMIN',
        'default-roles-ds-2026-realm',
        'offline_access',
        'reservas-be',
        'OPERADOR'
      ]);
      // Verificar que 'CLIENTE' no esté duplicado
      const clienteCount = normalizedRoles.filter((r) => r === 'CLIENTE').length;
      expect(clienteCount).toBe(1);
    });

    it('debe tolerar roles como string único (fallback legacy)', () => {
      const decodedPayload = {
        roles: 'CONDUCTOR'
      };

      const normalizedRoles = extractAndNormalizeRoles(decodedPayload);
      expect(normalizedRoles).toEqual(['CONDUCTOR']);
    });
  });

  describe('Control de Acceso Basado en Roles (requireRoles)', () => {
    it('debe permitir el acceso si el usuario posee uno de los roles permitidos', () => {
      mockRequest.user = {
        sub: 'operador-1',
        roles: ['reservas-be', 'OPERADOR']
      };

      const middleware = requireRoles(['OPERADOR', 'SERVICIO']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('debe permitir el acceso comparando de forma case-insensitive', () => {
      mockRequest.user = {
        sub: 'cliente-1',
        roles: ['cliente'] // En minúscula
      };

      const middleware = requireRoles(['CLIENTE']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('debe rechazar con 403 Forbidden si el usuario no tiene los roles requeridos', () => {
      mockRequest.user = {
        sub: 'cliente-1',
        roles: ['CLIENTE']
      };

      const middleware = requireRoles(['OPERADOR', 'SERVICIO']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0] as unknown as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(403);
      expect(error.title).toBe('Acceso denegado');
    });

    it('debe rechazar con 401 si req.user no está definido', () => {
      mockRequest.user = undefined;

      const middleware = requireRoles(['CLIENTE']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const error = nextFunction.mock.calls[0][0] as unknown as AppError;
      expect(error.status).toBe(401);
      expect(error.title).toBe('No autenticado');
    });

    it('debe permitir acceso a rutas con rol SERVICIO a tokens con roles oficiales *-be (reservas-be, solicitud-be, clientes-be)', () => {
      // Ruta que requiere SERVICIO (ej: callback M5)
      const middleware = requireRoles(['SERVICIO']);

      // 1. Probar con reservas-be
      mockRequest.user = { sub: 'service-account-grupo-08', roles: ['reservas-be'] };
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();

      // 2. Probar con solicitud-be
      mockRequest.user = { sub: 'service-account-grupo-04', roles: ['solicitud-be'] };
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();

      // 3. Probar con clientes-be
      mockRequest.user = { sub: 'service-account-grupo-01', roles: ['clientes-be'] };
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe('Reconocimiento Centralizado de Roles de Servicio (Helpers)', () => {
    it('isServiceRole debe reconocer roles de backend con sufijo -be y rol legacy SERVICIO', () => {
      expect(isServiceRole('SERVICIO')).toBe(true);
      expect(isServiceRole('servicio')).toBe(true);
      expect(isServiceRole('reservas-be')).toBe(true);
      expect(isServiceRole('solicitud-be')).toBe(true);
      expect(isServiceRole('clientes-be')).toBe(true);
      expect(isServiceRole('notificaciones-be')).toBe(true);
      expect(isServiceRole('cualquier-modulo-be')).toBe(true);

      // Roles no de servicio
      expect(isServiceRole('CLIENTE')).toBe(false);
      expect(isServiceRole('CONDUCTOR')).toBe(false);
      expect(isServiceRole('OPERADOR')).toBe(false);
      expect(isServiceRole('')).toBe(false);
    });

    it('isServiceUser debe evaluar correctamente si el usuario tiene rol de servicio', () => {
      expect(isServiceUser({ sub: '1', roles: ['reservas-be'] })).toBe(true);
      expect(isServiceUser({ sub: '2', roles: ['solicitud-be'] })).toBe(true);
      expect(isServiceUser({ sub: '3', roles: ['SERVICIO'] })).toBe(true);
      expect(isServiceUser({ sub: '4', roles: ['CLIENTE'] })).toBe(false);
      expect(isServiceUser(undefined)).toBe(false);
    });

    it('isAuthorizedPrivilegedUser debe autorizar a operadores y servicios backend por igual', () => {
      expect(isAuthorizedPrivilegedUser({ sub: 'op-1', roles: ['OPERADOR'] })).toBe(true);
      expect(isAuthorizedPrivilegedUser({ sub: 'op-2', roles: ['operador'] })).toBe(true);
      expect(isAuthorizedPrivilegedUser({ sub: 'srv-1', roles: ['reservas-be'] })).toBe(true);
      expect(isAuthorizedPrivilegedUser({ sub: 'srv-2', roles: ['clientes-be'] })).toBe(true);
      expect(isAuthorizedPrivilegedUser({ sub: 'srv-3', roles: ['solicitud-be'] })).toBe(true);
      expect(isAuthorizedPrivilegedUser({ sub: 'srv-4', roles: ['SERVICIO'] })).toBe(true);

      // Usuarios regulares no privilegiados
      expect(isAuthorizedPrivilegedUser({ sub: 'usr-1', roles: ['CLIENTE'] })).toBe(false);
      expect(isAuthorizedPrivilegedUser({ sub: 'usr-2', roles: ['CONDUCTOR'] })).toBe(false);
      expect(isAuthorizedPrivilegedUser(undefined)).toBe(false);
    });
  });
});
