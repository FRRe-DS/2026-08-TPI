import { AnticipationValidator } from '../../src/services/anticipationValidator';
import { AppError } from '../../src/types/problem';

describe('AnticipationValidator (RF-9.2)', () => {
  it('debe rechazar una fecha en el pasado', () => {
    const fechaPasada = new Date(Date.now() - 3600 * 1000).toISOString();
    expect(() => {
      AnticipationValidator.validar(fechaPasada);
    }).toThrow(AppError);
  });

  it('debe rechazar una reserva con menos de 30 minutos de anticipación', () => {
    const fechaInmediata = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    expect(() => {
      AnticipationValidator.validar(fechaInmediata);
    }).toThrow(AppError);
  });

  it('debe rechazar una reserva con más de 30 días de anticipación', () => {
    const fechaLejana = new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString();
    expect(() => {
      AnticipationValidator.validar(fechaLejana);
    }).toThrow(AppError);
  });

  it('debe aceptar una fecha válida con 2 horas de anticipación', () => {
    const fechaValida = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const result = AnticipationValidator.validar(fechaValida, 'America/Argentina/Buenos_Aires');
    expect(result).toBeInstanceOf(Date);
  });

  it('debe rechazar una zona horaria inválida', () => {
    const fechaValida = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    expect(() => {
      AnticipationValidator.validar(fechaValida, 'Zona/Invalida_Falsa');
    }).toThrow(AppError);
  });
});
