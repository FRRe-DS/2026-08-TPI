import { db } from '../config/database';
import {
  HistorialEventoDTO,
  HistorialEventoEntity,
  TipoEvento,
  EstadoReserva,
  TipoCambioHistorial,
  RolActorHistorial
} from '../types/reservation';

export class HistoryRepository {
  private static inMemoryHistory: HistorialEventoEntity[] = [];

  public static async registrar(evento: {
    reservaId: string;
    tipoEvento: TipoEvento;
    estadoAnterior: EstadoReserva | null;
    estadoNuevo: EstadoReserva;
    actor: string | null;
    detalles?: Record<string, unknown> | null;
  }): Promise<HistorialEventoDTO> {
    try {
      const res = await db.query(
        `INSERT INTO historial_reservas (
          reserva_id, tipo_evento, estado_anterior, estado_nuevo, actor, detalles, fecha_hora
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, reserva_id, tipo_evento, estado_anterior, estado_nuevo, actor, detalles, fecha_hora`,
        [
          evento.reservaId,
          evento.tipoEvento,
          evento.estadoAnterior,
          evento.estadoNuevo,
          evento.actor,
          evento.detalles ? JSON.stringify(evento.detalles) : null
        ]
      );

      return this.mapToDTO(res.rows[0]);
    } catch {
      // Fallback in-memory
      const newEntity: HistorialEventoEntity = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        reserva_id: evento.reservaId,
        tipo_evento: evento.tipoEvento,
        estado_anterior: evento.estadoAnterior,
        estado_nuevo: evento.estadoNuevo,
        actor: evento.actor,
        detalles: evento.detalles || null,
        fecha_hora: new Date()
      };
      this.inMemoryHistory.push(newEntity);
      return this.mapToDTO(newEntity);
    }
  }

  public static async listarPorReserva(reservaId: string): Promise<HistorialEventoDTO[]> {
    try {
      const res = await db.query(
        `SELECT id, reserva_id, tipo_evento, estado_anterior, estado_nuevo, actor, detalles, fecha_hora
         FROM historial_reservas
         WHERE reserva_id = $1
         ORDER BY fecha_hora ASC`,
        [reservaId]
      );
      return res.rows.map((row) => this.mapToDTO(row));
    } catch {
      // Fallback in-memory
      return this.inMemoryHistory
        .filter((h) => h.reserva_id === reservaId)
        .sort((a, b) => a.fecha_hora.getTime() - b.fecha_hora.getTime())
        .map((h) => this.mapToDTO(h));
    }
  }

  public static clearMemory(): void {
    this.inMemoryHistory = [];
  }

  private static mapToDTO(row: any): HistorialEventoDTO {
    const tipoEvento: TipoEvento = row.tipo_evento;
    const detalles = typeof row.detalles === 'string' ? JSON.parse(row.detalles) : (row.detalles || null);
    const fechaIso = new Date(row.fecha_hora).toISOString();

    let tipoCambio: TipoCambioHistorial = 'MODIFICACION';
    switch (tipoEvento) {
      case 'RESERVA_CREADA':
        tipoCambio = 'CREACION';
        break;
      case 'RESERVA_CONFIRMADA':
        tipoCambio = 'CONFIRMACION';
        break;
      case 'RESERVA_MODIFICADA':
        tipoCambio = 'MODIFICACION';
        break;
      case 'RESERVA_CANCELADA':
        tipoCambio = 'CANCELACION';
        break;
      case 'RESERVA_ACTIVADA':
        tipoCambio = 'ACTIVACION';
        break;
      case 'RESERVA_VENCIDA':
        tipoCambio = 'VENCIMIENTO';
        break;
      default:
        tipoCambio = 'MODIFICACION';
    }

    let campoModificado: string | null = 'estado';
    let valorAnterior: string | null = row.estado_anterior || null;
    let valorNuevo: string | null = row.estado_nuevo || null;
    let motivo: string | null = null;

    if (tipoEvento === 'RESERVA_MODIFICADA') {
      campoModificado = 'reserva';
      if (detalles && detalles.cambios) {
        valorAnterior = JSON.stringify(detalles.cambios);
      }
    } else if (tipoEvento === 'RESERVA_CANCELADA') {
      campoModificado = 'estado';
      motivo = detalles?.motivo || null;
    }

    const actorStr = String(row.actor || '');
    let rolActor: RolActorHistorial = 'CLIENTE';
    if (
      actorStr.toLowerCase().includes('operador') ||
      actorStr.toLowerCase().includes('admin')
    ) {
      rolActor = 'OPERADOR';
    } else if (
      actorStr.toLowerCase().includes('m5') ||
      actorStr.toLowerCase().includes('sistema') ||
      actorStr.toLowerCase().includes('scheduler') ||
      actorStr.toLowerCase().includes('service') ||
      !row.actor
    ) {
      rolActor = 'SISTEMA';
    } else {
      rolActor = 'CLIENTE';
    }

    return {
      id: row.id,
      reservaId: row.reserva_id,
      tipoEvento,
      estadoAnterior: row.estado_anterior,
      estadoNuevo: row.estado_nuevo,
      actor: row.actor,
      detalles,
      fechaHora: fechaIso,
      tipoCambio,
      campoModificado,
      valorAnterior,
      valorNuevo,
      actorId: row.actor,
      rolActor,
      motivo,
      fechaCambio: fechaIso
    };
  }
}
