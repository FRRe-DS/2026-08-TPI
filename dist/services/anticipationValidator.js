"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnticipationValidator = void 0;
const env_1 = require("../config/env");
const problem_1 = require("../types/problem");
class AnticipationValidator {
    static validar(fechaHoraStr, zonaHoraria) {
        const fecha = new Date(fechaHoraStr);
        if (isNaN(fecha.getTime())) {
            throw new problem_1.AppError({
                status: 400,
                title: 'Fecha/hora inválida',
                detail: 'La fecha y hora proporcionada no tiene un formato ISO 8601 válido.'
            });
        }
        if (zonaHoraria) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: zonaHoraria });
            }
            catch {
                throw new problem_1.AppError({
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
        if (diffMinutos < env_1.config.anticipation.minMinutes) {
            throw new problem_1.AppError({
                status: 422,
                title: 'Anticipación insuficiente',
                detail: `La reserva debe realizarse con un mínimo de ${env_1.config.anticipation.minMinutes} minutos de anticipación. Tiempo provisto: ${diffMinutos} minutos.`
            });
        }
        if (diffDias > env_1.config.anticipation.maxDays) {
            throw new problem_1.AppError({
                status: 422,
                title: 'Anticipación máxima excedida',
                detail: `La reserva no puede programarse con más de ${env_1.config.anticipation.maxDays} días de antelación.`
            });
        }
        return fecha;
    }
}
exports.AnticipationValidator = AnticipationValidator;
