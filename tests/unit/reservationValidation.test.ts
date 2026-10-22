import { z } from 'zod';

const DireccionSchema = z.object({
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  alias: z.string().nullable().optional(),
  piso: z.string().nullable().optional(),
  indicaciones: z.string().nullable().optional()
});

const CrearReservaSchema = z.object({
  claveIdempotencia: z.string().min(1, 'La clave de idempotencia es obligatoria'),
  clienteId: z.string().min(1, 'El clienteId es obligatorio'),
  origen: DireccionSchema,
  destino: DireccionSchema,
  tipoVehiculo: z.enum(['AUTO', 'MOTO']),
  fechaHora: z.string().refine((val) => !isNaN(Date.parse(val))),
  zonaHoraria: z.string().min(1, 'La zona horaria es obligatoria')
});

const CancelarReservaSchema = z.object({
  motivo: z.string().min(3, 'El motivo de cancelación debe tener al menos 3 caracteres')
});

describe('Reservation Schema Validations (Unit)', () => {
  it('debe validar un payload de creación de reserva correcto', () => {
    const validPayload = {
      claveIdempotencia: 'uuid-1234',
      clienteId: 'cliente-01',
      origen: { direccion: 'Calle 1', latitud: -27.45, longitud: -58.98 },
      destino: { direccion: 'Calle 2', latitud: -27.46, longitud: -58.99 },
      tipoVehiculo: 'AUTO',
      fechaHora: '2026-10-22T18:30:00-03:00',
      zonaHoraria: 'America/Argentina/Buenos_Aires'
    };

    expect(() => CrearReservaSchema.parse(validPayload)).not.toThrow();
  });

  it('debe rechazar tipo de vehículo no admitido (ej: BICICLETA)', () => {
    const invalidPayload = {
      claveIdempotencia: 'uuid-1234',
      clienteId: 'cliente-01',
      origen: { direccion: 'Calle 1', latitud: -27.45, longitud: -58.98 },
      destino: { direccion: 'Calle 2', latitud: -27.46, longitud: -58.99 },
      tipoVehiculo: 'BICICLETA',
      fechaHora: '2026-10-22T18:30:00-03:00',
      zonaHoraria: 'America/Argentina/Buenos_Aires'
    };

    expect(() => CrearReservaSchema.parse(invalidPayload)).toThrow();
  });

  it('debe rechazar coordenadas fuera de rango (-90..90, -180..180)', () => {
    const invalidPayload = {
      claveIdempotencia: 'uuid-1234',
      clienteId: 'cliente-01',
      origen: { direccion: 'Calle 1', latitud: 95.0, longitud: -58.98 },
      destino: { direccion: 'Calle 2', latitud: -27.46, longitud: -58.99 },
      tipoVehiculo: 'AUTO',
      fechaHora: '2026-10-22T18:30:00-03:00',
      zonaHoraria: 'America/Argentina/Buenos_Aires'
    };

    expect(() => CrearReservaSchema.parse(invalidPayload)).toThrow();
  });

  it('debe rechazar motivo de cancelación menor a 3 caracteres', () => {
    expect(() => CancelarReservaSchema.parse({ motivo: 'ab' })).toThrow();
    expect(() => CancelarReservaSchema.parse({ motivo: 'abc' })).not.toThrow();
  });
});
