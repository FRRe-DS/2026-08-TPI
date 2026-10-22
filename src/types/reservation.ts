export type TipoVehiculo = 'AUTO' | 'MOTO';

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'ACTIVADA' | 'CANCELADA' | 'VENCIDA';

export type TipoEvento =
  | 'RESERVA_CREADA'
  | 'RESERVA_CONFIRMADA'
  | 'RESERVA_MODIFICADA'
  | 'RESERVA_CANCELADA'
  | 'RESERVA_RECORDATORIO'
  | 'RESERVA_ACTIVADA'
  | 'RESERVA_VENCIDA';

export interface Direccion {
  direccion: string;
  latitud: number;
  longitud: number;
  alias?: string | null;
  piso?: string | null;
  indicaciones?: string | null;
}

export interface ReservaEntity {
  id: string;
  clave_idempotencia: string;
  cliente_id: string;
  origen_direccion: string;
  origen_latitud: number;
  origen_longitud: number;
  origen_alias: string | null;
  origen_piso: string | null;
  origen_indicaciones: string | null;
  destino_direccion: string;
  destino_latitud: number;
  destino_longitud: number;
  destino_alias: string | null;
  destino_piso: string | null;
  destino_indicaciones: string | null;
  tipo_vehiculo: TipoVehiculo;
  fecha_hora: Date;
  zona_horaria: string;
  estado: EstadoReserva;
  tarifa_estimada: number | null;
  moneda: string;
  condiciones_tarifa: string | null;
  solicitud_despacho_id: string | null;
  motivo_cancelacion: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

export interface ReservaDTO {
  id: string;
  claveIdempotencia: string;
  clienteId: string;
  origen: Direccion;
  destino: Direccion;
  tipoVehiculo: TipoVehiculo;
  fechaHora: string;
  zonaHoraria: string;
  estado: EstadoReserva;
  tarifaEstimada: number | null;
  moneda: string;
  condicionesTarifa: string | null;
  solicitudDespachoId: string | null;
  motivoCancelacion: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CrearReservaDTO {
  claveIdempotencia: string;
  clienteId: string;
  origen: Direccion;
  destino: Direccion;
  tipoVehiculo: TipoVehiculo;
  fechaHora: string;
  zonaHoraria: string;
}

export interface ModificarReservaDTO {
  origen?: Direccion;
  destino?: Direccion;
  tipoVehiculo?: TipoVehiculo;
  fechaHora?: string;
  zonaHoraria?: string;
}

export interface CancelarReservaDTO {
  motivo: string;
}

export interface HistorialEventoEntity {
  id: string;
  reserva_id: string;
  tipo_evento: TipoEvento;
  estado_anterior: EstadoReserva | null;
  estado_nuevo: EstadoReserva;
  actor: string | null;
  detalles: Record<string, unknown> | null;
  fecha_hora: Date;
}

export interface HistorialEventoDTO {
  id: string;
  reservaId: string;
  tipoEvento: TipoEvento;
  estadoAnterior: EstadoReserva | null;
  estadoNuevo: EstadoReserva;
  actor: string | null;
  detalles: Record<string, unknown> | null;
  fechaHora: string;
}

export interface DespachoWebhookDTO {
  solicitud_id: string;
  resultado: 'CONFIRMADA' | 'VENCIDA';
  fecha: string;
}
