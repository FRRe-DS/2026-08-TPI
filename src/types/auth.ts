export type UserRole = 'CLIENTE' | 'CONDUCTOR' | 'OPERADOR' | 'SERVICIO';

export interface JwtUserPayload {
  iss?: string;
  aud?: string;
  sub: string;
  roles: UserRole[];
  exp?: number;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      id?: string;
    }
  }
}
