import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8089', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/m9_reservas',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'm9_reservas'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'clave-secreta-desarrollo-compartida-utn-frre-m9',
    issuer: process.env.JWT_ISSUER || 'utn-frre-arquitectura',
    audience: process.env.JWT_AUDIENCE || 'utn-frre-ecosistema'
  },

  anticipation: {
    minMinutes: parseInt(process.env.ANTICIPACION_MINIMA_MINUTOS || '30', 10),
    maxDays: parseInt(process.env.ANTICIPACION_MAXIMA_DIAS || '30', 10)
  },

  services: {
    m2ClientesUrl: process.env.M2_CLIENTES_URL || 'http://localhost:8082',
    m4UbicacionUrl: process.env.M4_UBICACION_URL || 'http://localhost:8084',
    m5DespachoUrl: process.env.M5_DESPACHO_URL || 'http://localhost:8085',
    m7TarifasUrl: process.env.M7_TARIFAS_URL || 'http://localhost:8087',
    m8NotificacionesUrl: process.env.M8_NOTIFICACIONES_URL || 'http://localhost:8088',
    useExternalMocks: process.env.USE_EXTERNAL_MOCKS === 'true' || process.env.NODE_ENV === 'test'
  }
};
