import { config } from '../config/env';
import { AppError } from '../types/problem';

export class AnticipationValidator {
  public static validar(fechaHoraStr: string, zonaHoraria?: string): Date {
    const fecha = new Date(fechaHoraStr);

    if (isNaN(fecha.getTime())) {
      throw new AppError({
        status: 400,
        title: 'Fecha/hora inválida',
        detail: 'La fecha y hora proporcionada no tiene un formato ISO 8601 válido.'
      });
    }

    if (zonaHoraria) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: zonaHoraria });
      } catch {
        throw new AppError({
          status: 400,
          title: 'Zona horaria inválida',
          detail: `La zona horaria '${zonaHoraria}' no es un identificador IANA válido.`
        });
      }
    }

    const ahora = new Date();
    const diffMs = fecha.getTime() - ahora.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffDias = diffMs / (1000 * 60 * 60 * 24);

    if (diffMinutos < config.anticipation.minMinutes) {
      throw new AppError({
        status: 422,
        title: 'Anticipación insuficiente',
        detail: `La reserva debe realizarse con un mínimo de ${config.anticipation.minMinutes} minutos de anticipación. Tiempo provisto: ${diffMinutos} minutos.`
      });
    }

    if (diffDias > config.anticipation.maxDays) {
      throw new AppError({
        status: 422,
        title: 'Anticipación máxima excedida',
        detail: `La reserva no puede programarse con más de ${config.anticipation.maxDays} días de antelación.`
      });
    }

    return fecha;
  }
}
