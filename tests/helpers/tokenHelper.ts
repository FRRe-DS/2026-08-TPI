import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/env';
import { UserRole } from '../../src/types/auth';
import { jwksClient } from '../../src/middlewares/auth';

// Par de claves RSA generado en memoria para entorno de testing
export const testKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

export const TEST_KID = 'test-keycloak-kid';

/**
 * Mockea la descarga de claves JWKS de Keycloak devolviendo la clave pública de prueba.
 */
export const setupTestJwks = (): void => {
  const mockKey = {
    getPublicKey: () => testKeyPair.publicKey,
    rsaPublicKey: testKeyPair.publicKey,
    kid: TEST_KID
  };

  (jest.spyOn(jwksClient, 'getSigningKey') as any).mockImplementation(
    (kid?: string | null, cb?: (err: Error | null, key?: any) => void) => {
      if (typeof cb === 'function') {
        cb(null, mockKey);
        return;
      }
      return Promise.resolve(mockKey);
    }
  );
};

export interface TestTokenOptions {
  sub?: string;
  roles?: UserRole[];
  realmRoles?: string[];
  clientRoles?: string[];
  expiresIn?: string;
  issuer?: string;
  audience?: string | string[];
  kid?: string;
}

export const createTestToken = (
  sub: string = 'test-client-123',
  roles: UserRole[] = ['CLIENTE'],
  expiresIn: string = '1h',
  options: Partial<TestTokenOptions> = {}
): string => {
  const payload = {
    iss: options.issuer ?? config.keycloak.issuer,
    aud: options.audience ?? config.keycloak.clientId,
    sub,
    roles,
    realm_access: {
      roles: options.realmRoles ?? []
    },
    resource_access: {
      [config.keycloak.clientId]: {
        roles: options.clientRoles ?? []
      }
    }
  };

  return jwt.sign(payload, testKeyPair.privateKey, {
    algorithm: 'RS256',
    keyid: options.kid ?? TEST_KID,
    expiresIn: expiresIn as any
  });
};
