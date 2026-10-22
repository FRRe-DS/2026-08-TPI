import { db } from '../config/database';
import { HistorialEventoDTO, HistorialEventoEntity, TipoEvento, EstadoReserva } from '../types/reservation';

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
    return {
      id: row.id,
      reservaId: row.reserva_id,
      tipoEvento: row.tipo_evento,
      estadoAnterior: row.estado_anterior,
      estadoNuevo: row.estado_nuevo,
      actor: row.actor,
      detalles: typeof row.detalles === 'string' ? JSON.parse(row.detalles) : row.detalles,
      fechaHora: new Date(row.fecha_hora).toISOString()
    };
  }
}
