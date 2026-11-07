import { ReservationRepository } from '../repositories/reservationRepository';
import { ActivationService } from './activationService';
import { JwtUserPayload } from '../types/auth';

const SYSTEM_USER: JwtUserPayload = {
  sub: 'SISTEMA_SCHEDULER',
  roles: ['SERVICIO']
};

export class ReservationScheduler {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Inicia el proceso de monitoreo periódico de reservas próximas a activarse
   */
  public static start(intervalMs: number = 30000): void {
    if (this.timer) return;

    console.log(`[Scheduler] Iniciado (revisión cada ${intervalMs / 1000}s, ventana: 20 min)`);
    // Ejecución inicial inmediata
    this.ejecutarCiclo();

    this.timer = setInterval(() => {
      this.ejecutarCiclo();
    }, intervalMs);
  }

  /**
   * Detiene el timer para un apagado limpio (Graceful Shutdown)
   */
  public static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] Detenido');
    }
  }

  /**
   * Ciclo de verificación y activación de reservas pendientes en ventana de despacho
   */
  public static async ejecutarCiclo(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // Buscar reservas CONFIRMADA sin despacho a menos de 20 minutos de su fecha_hora
      const reservasPendientes = await ReservationRepository.obtenerPendientesDeActivacion(20);
      if (reservasPendientes.length > 0) {
        console.log(`[Scheduler] ${reservasPendientes.length} reserva(s) encontrada(s) en ventana de despacho.`);
      }

      for (const reserva of reservasPendientes) {
        try {
          console.log(`[Scheduler] Activando reserva ${reserva.id} para viaje a las ${reserva.fechaHora}...`);
          await ActivationService.activarReserva(
            reserva.id,
            SYSTEM_USER,
            `sched-${Date.now()}`
          );
          console.log(`[Scheduler] Reserva ${reserva.id} activada exitosamente hacia M5.`);
        } catch (error) {
          console.error(`[Scheduler] Error al activar reserva ${reserva.id}:`, error);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error en ciclo de verificación:', err);
    } finally {
      this.isRunning = false;
    }
  }
}

