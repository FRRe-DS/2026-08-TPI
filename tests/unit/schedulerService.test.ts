import { ReservationScheduler } from '../../src/services/schedulerService';
import { ReservationRepository } from '../../src/repositories/reservationRepository';
import { ActivationService } from '../../src/services/activationService';
import { ReservaDTO } from '../../src/types/reservation';

describe('ReservationScheduler (RF-9.9)', () => {
  afterEach(() => {
    ReservationScheduler.stop();
    jest.restoreAllMocks();
  });

  it('debe buscar y activar reservas dentro de la ventana de 20 minutos', async () => {
    const reservaMock: Partial<ReservaDTO> = {
      id: 'reserva-sched-001',
      estado: 'CONFIRMADA',
      fechaHora: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      solicitudDespachoId: null
    };

    const spyObtener = jest
      .spyOn(ReservationRepository, 'obtenerPendientesDeActivacion')
      .mockResolvedValue([reservaMock as ReservaDTO]);

    const spyActivar = jest
      .spyOn(ActivationService, 'activarReserva')
      .mockResolvedValue(reservaMock as ReservaDTO);

    await ReservationScheduler.ejecutarCiclo();

    expect(spyObtener).toHaveBeenCalledWith(20);
    expect(spyActivar).toHaveBeenCalledWith(
      'reserva-sched-001',
      expect.objectContaining({ roles: expect.arrayContaining(['reservas-be']) }),
      expect.stringMatching(/^sched-/)
    );
  });

  it('no debe llamar a activarReserva si no hay reservas pendientes', async () => {
    jest.spyOn(ReservationRepository, 'obtenerPendientesDeActivacion').mockResolvedValue([]);
    const spyActivar = jest.spyOn(ActivationService, 'activarReserva');

    await ReservationScheduler.ejecutarCiclo();

    expect(spyActivar).not.toHaveBeenCalled();
  });

  it('debe iniciar y detener el scheduler correctamente', () => {
    jest.useFakeTimers();
    const spyCiclo = jest.spyOn(ReservationScheduler, 'ejecutarCiclo').mockImplementation(async () => {});

    ReservationScheduler.start(5000);
    expect(spyCiclo).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5000);
    expect(spyCiclo).toHaveBeenCalledTimes(2);

    ReservationScheduler.stop();
    jest.advanceTimersByTime(10000);
    expect(spyCiclo).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});

