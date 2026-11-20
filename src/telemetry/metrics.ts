import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('m9-reservas-viajes', '1.0.0');

// Métrica 1: Tasa de creación de reservas y resultado (éxito, idempotencia, rechazo)
export const reservasCreadasCounter = meter.createCounter('reservas_creadas_total', {
  description: 'Total de intentos de creación de reservas discriminados por resultado y tipo de vehículo'
});

// Métrica 2: Activaciones de reservas hacia M5 y su duración
export const reservasActivacionesCounter = meter.createCounter('reservas_activaciones_total', {
  description: 'Total de activaciones y resultados de despacho hacia M5'
});

export const reservasActivacionDuracionHistogram = meter.createHistogram('reservas_activacion_duracion_ms', {
  description: 'Duración de la llamada de activación hacia M5 en milisegundos',
  unit: 'ms'
});

// Métrica 3: Cancelaciones y modificaciones/reprogramaciones
export const reservasCancelacionesCounter = meter.createCounter('reservas_cancelaciones_total', {
  description: 'Total de reservas canceladas discriminadas por cancelación tardía'
});

export const reservasModificacionesCounter = meter.createCounter('reservas_modificaciones_total', {
  description: 'Total de reservas modificadas o reprogramadas'
});
