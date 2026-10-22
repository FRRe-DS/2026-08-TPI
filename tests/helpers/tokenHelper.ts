import jwt from 'jsonwebtoken';
import { config } from '../../src/config/env';
import { UserRole } from '../../src/types/auth';

export const createTestToken = (
  sub: string = 'test-client-123',
  roles: UserRole[] = ['CLIENTE'],
  expiresIn: string = '1h'
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
