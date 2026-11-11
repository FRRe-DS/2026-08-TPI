export type UserRole =
  | 'CLIENTE'
  | 'CONDUCTOR'
  | 'OPERADOR'
  | 'SERVICIO'
  | 'reservas-be'
  | (string & {});

export interface KeycloakRealmAccess {
  roles?: string[];
}

export interface KeycloakResourceAccess {
  [clientId: string]: {
    roles?: string[];
  };
}

export interface JwtUserPayload {
  iss?: string;
  aud?: string | string[];
  sub: string;
  roles: UserRole[];
  exp?: number;
  realm_access?: KeycloakRealmAccess;
  resource_access?: KeycloakResourceAccess;
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
