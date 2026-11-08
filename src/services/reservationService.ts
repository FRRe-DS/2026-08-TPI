import { ReservationRepository } from '../repositories/reservationRepository';
import { HistoryRepository } from '../repositories/historyRepository';
import { IdempotencyRepository } from '../repositories/idempotencyRepository';
import { AnticipationValidator } from './anticipationValidator';
import { M2Client } from '../clients/m2Client';
import { M4Client } from '../clients/m4Client';
import { M7Client } from '../clients/m7Client';
import { M8Client } from '../clients/m8Client';
import {
  CrearReservaDTO,
  ModificarReservaDTO,
  ReservaDTO,
  HistorialEventoDTO
} from '../types/reservation';
import { JwtUserPayload } from '../types/auth';
import { AppError } from '../types/problem';
import { config } from '../config/env';

export class ReservationService {
  /**
   * RF-9.1, RF-9.2, RF-9.3, RF-9.4, RF-9.5, RF-9.8, RF-9.10
   * Creación de reserva con validación completa, estimación de tarifa e idempotencia
   */
  public static async crearReserva(
    data: CrearReservaDTO,
    user: JwtUserPayload,
    requestId?: string
  ): Promise<{ reserva: ReservaDTO; esRepeticion: boolean }> {
    // 1. Verificación de Idempotencia previa (RF-9.10 / RNF-09)
    const existenteIdempotente = await IdempotencyRepository.obtener(data.claveIdempotencia);
    if (existenteIdempotente) {
      const reserva = existenteIdempotente.cuerpoRespuesta as ReservaDTO;
      if (reserva && reserva.clienteId) {
        this.validarCoincidenciaIdempotencia(reserva, data);
      }
      return {
        reserva,
        esRepeticion: true
      };
    }

    const reservaExistente = await ReservationRepository.obtenerPorClaveIdempotencia(data.claveIdempotencia);
    if (reservaExistente) {
      this.validarCoincidenciaIdempotencia(reservaExistente, data);
      await IdempotencyRepository.guardar(data.claveIdempotencia, '/reservas', 200, reservaExistente);
      return {
        reserva: reservaExistente,
        esRepeticion: true
      };
    }

    // 2. Control de Autorización (el cliente solo crea para sí mismo, operadores/servicios pueden crear para otros)
    const esAdmin = user.roles.includes('OPERADOR') || user.roles.includes('SERVICIO');
    if (!esAdmin && user.sub !== data.clienteId) {
      throw new AppError({
        status: 403,
        title: 'Acceso no autorizado',
        detail: `No tiene permisos para crear una reserva para el cliente ${data.clienteId}`
      });
    }

    // 3. Validación de Ventana de Anticipación (RF-9.2)
    AnticipationValidator.validar(data.fechaHora, data.zonaHoraria);

    // 4. Validación de Cuenta de Cliente en M2 (RF-9.3)
    const estadoCuenta = await M2Client.verificarEstadoCuenta(data.clienteId, requestId);
    if (estadoCuenta.estado === 'BLOQUEADO') {
      throw new AppError({
        status: 422,
        title: 'Cliente bloqueado',
        detail: `El cliente ${data.clienteId} se encuentra bloqueado para realizar reservas.`
      });
    }

    // 5. Validación de Ubicaciones y Cobertura en M4 (RF-9.3 / RF-9.4)
    const estimacionUbicacion = await M4Client.validarYEstimar(
      {
        origen: { latitud: data.origen.latitud, longitud: data.origen.longitud },
        destino: { latitud: data.destino.latitud, longitud: data.destino.longitud },
        tipo_vehiculo: data.tipoVehiculo,
        fecha_hora: data.fechaHora
      },
      requestId
    );

    if (!estimacionUbicacion.origen_valido || !estimacionUbicacion.destino_valido) {
      throw new AppError({
        status: 422,
        title: 'Ubicación no válida',
        detail: `Origen o destino no válidos en M4. Motivo: ${estimacionUbicacion.motivo || 'FUERA_DE_COBERTURA'}`
      });
    }

    // 6. Estimación de Tarifa en M7 (RF-9.4)
    const estimacionTarifa = await M7Client.estimarTarifa(
      {
        distancia_km: estimacionUbicacion.distancia_km,
        tiempo_estimado_min: estimacionUbicacion.tiempo_estimado_min,
        tipo_vehiculo: data.tipoVehiculo,
        fecha_hora: data.fechaHora
      },
      requestId
    );

    // 7. Persistencia en Base de Datos (Estado CONFIRMADA)
    const reservaCreada = await ReservationRepository.crear({
      claveIdempotencia: data.claveIdempotencia,
      clienteId: data.clienteId,
      origen: data.origen,
      destino: data.destino,
      tipoVehiculo: data.tipoVehiculo,
      fechaHora: data.fechaHora,
      zonaHoraria: data.zonaHoraria,
      estado: 'CONFIRMADA',
      tarifaEstimada: estimacionTarifa.tarifa_estimada,
      moneda: estimacionTarifa.moneda || 'ARS',
      condicionesTarifa: estimacionTarifa.condiciones
    });

    // 8. Registro de Auditoría / Historial (RF-9.12)
    await HistoryRepository.registrar({
      reservaId: reservaCreada.id,
      tipoEvento: 'RESERVA_CREADA',
      estadoAnterior: null,
      estadoNuevo: 'CONFIRMADA',
      actor: user.sub,
      detalles: {
        origen: data.origen.direccion,
        destino: data.destino.direccion,
        distanciaKm: estimacionUbicacion.distancia_km,
        tiempoEstimadoMin: estimacionUbicacion.tiempo_estimado_min,
        tarifaEstimada: estimacionTarifa.tarifa_estimada
      }
    });

    // 9. Notificación a M8 (RF-9.8 - Asíncrono no bloqueante)
    M8Client.notificarEvento(
      {
        tipo_evento: 'RESERVA_CONFIRMADA',
        reserva_id: reservaCreada.id,
        cliente_id: reservaCreada.clienteId,
        fecha_hora: reservaCreada.fechaHora,
        zona_horaria: reservaCreada.zonaHoraria,
        origen_direccion: reservaCreada.origen.direccion,
        destino_direccion: reservaCreada.destino.direccion,
        tipo_vehiculo: reservaCreada.tipoVehiculo,
        tarifa_estimada: reservaCreada.tarifaEstimada,
        ocurrido_en: new Date().toISOString()
      },
      requestId
    ).catch((err) => console.warn('[M8 Error]', err));

    // 10. Cachear en Idempotencia
    await IdempotencyRepository.guardar(data.claveIdempotencia, '/reservas', 201, reservaCreada);

    return {
      reserva: reservaCreada,
      esRepeticion: false
    };
  }

  /**
   * Listar reservas por cliente
   */
  public static async listarPorCliente(clienteId: string, user: JwtUserPayload): Promise<ReservaDTO[]> {
    const esAdmin = user.roles.includes('OPERADOR') || user.roles.includes('SERVICIO');
    if (!esAdmin && user.sub !== clienteId) {
      throw new AppError({
        status: 403,
        title: 'Acceso no autorizado',
        detail: 'No tiene permisos para ver las reservas de otro cliente'
      });
    }

    return ReservationRepository.listarPorCliente(clienteId);
  }

  /**
   * Consultar reserva por ID
   */
  public static async obtenerPorId(id: string, user: JwtUserPayload): Promise<ReservaDTO> {
    const reserva = await ReservationRepository.obtenerPorId(id);
    if (!reserva) {
      throw new AppError({
        status: 404,
        title: 'Reserva no encontrada',
        detail: `No existe ninguna reserva con el identificador ${id}`
      });
    }

    const esAdmin = user.roles.includes('OPERADOR') || user.roles.includes('SERVICIO') || user.roles.includes('CONDUCTOR');
    if (!esAdmin && user.sub !== reserva.clienteId) {
      throw new AppError({
        status: 403,
        title: 'Acceso no autorizado',
        detail: 'No tiene permisos para ver esta reserva'
      });
    }

    return reserva;
  }

  /**
   * RF-9.6 Modificar o reprogramar reserva
   */
  public static async modificarReserva(
    id: string,
    data: ModificarReservaDTO,
    user: JwtUserPayload,
    requestId?: string
  ): Promise<ReservaDTO> {
    const reserva = await this.obtenerPorId(id, user);

    // Validación de estado permitido
    if (reserva.estado !== 'PENDIENTE' && reserva.estado !== 'CONFIRMADA') {
      throw new AppError({
        status: 409,
        title: 'Estado no modificable',
        detail: `La reserva se encuentra en estado '${reserva.estado}' y no puede ser modificada.`
      });
    }

    // Si ya fue enviada a despacho, tampoco se permite modificar
    if (reserva.solicitudDespachoId) {
      throw new AppError({
        status: 409,
        title: 'Reserva en despacho',
        detail: 'La reserva ya fue enviada a despacho y no admite modificaciones.'
      });
    }

    let nuevaFechaHora = reserva.fechaHora;
    let nuevaZonaHoraria = reserva.zonaHoraria;
    if (data.fechaHora) {
      AnticipationValidator.validar(data.fechaHora, data.zonaHoraria || reserva.zonaHoraria);
      nuevaFechaHora = data.fechaHora;
      if (data.zonaHoraria) nuevaZonaHoraria = data.zonaHoraria;
    }

    const nuevoOrigen = data.origen || reserva.origen;
    const nuevoDestino = data.destino || reserva.destino;
    const nuevoTipoVehiculo = data.tipoVehiculo || reserva.tipoVehiculo;

    const rutaOCambioVehiculo =
      Boolean(data.origen) || Boolean(data.destino) || Boolean(data.tipoVehiculo);

    let nuevaTarifa = reserva.tarifaEstimada;
    let nuevasCondiciones = reserva.condicionesTarifa;

    if (rutaOCambioVehiculo || Boolean(data.fechaHora)) {
      // Re-estimar con M4 y M7
      const estimacionUbicacion = await M4Client.validarYEstimar(
        {
          origen: { latitud: nuevoOrigen.latitud, longitud: nuevoOrigen.longitud },
          destino: { latitud: nuevoDestino.latitud, longitud: nuevoDestino.longitud },
          tipo_vehiculo: nuevoTipoVehiculo,
          fecha_hora: nuevaFechaHora
        },
        requestId
      );

      if (!estimacionUbicacion.origen_valido || !estimacionUbicacion.destino_valido) {
        throw new AppError({
          status: 422,
          title: 'Ubicación no válida',
          detail: `Ubicación no válida en M4: ${estimacionUbicacion.motivo || 'FUERA_DE_COBERTURA'}`
        });
      }

      const estimacionTarifa = await M7Client.estimarTarifa(
        {
          distancia_km: estimacionUbicacion.distancia_km,
          tiempo_estimado_min: estimacionUbicacion.tiempo_estimado_min,
          tipo_vehiculo: nuevoTipoVehiculo,
          fecha_hora: nuevaFechaHora
        },
        requestId
      );

      nuevaTarifa = estimacionTarifa.tarifa_estimada;
      nuevasCondiciones = estimacionTarifa.condiciones;
    }

    const reservaActualizada = await ReservationRepository.actualizar(id, {
      origen_direccion: nuevoOrigen.direccion,
      origen_latitud: nuevoOrigen.latitud,
      origen_longitud: nuevoOrigen.longitud,
      origen_alias: nuevoOrigen.alias || null,
      origen_piso: nuevoOrigen.piso || null,
      origen_indicaciones: nuevoOrigen.indicaciones || null,
      destino_direccion: nuevoDestino.direccion,
      destino_latitud: nuevoDestino.latitud,
      destino_longitud: nuevoDestino.longitud,
      destino_alias: nuevoDestino.alias || null,
      destino_piso: nuevoDestino.piso || null,
      destino_indicaciones: nuevoDestino.indicaciones || null,
      tipo_vehiculo: nuevoTipoVehiculo,
      fecha_hora: nuevaFechaHora,
      zona_horaria: nuevaZonaHoraria,
      tarifa_estimada: nuevaTarifa,
      condiciones_tarifa: nuevasCondiciones
    });

    if (!reservaActualizada) {
      throw new AppError({
        status: 500,
        title: 'Error de actualización',
        detail: 'No se pudo actualizar la reserva en la base de datos.'
      });
    }

    // Registrar en Historial (RF-9.12)
    await HistoryRepository.registrar({
      reservaId: id,
      tipoEvento: 'RESERVA_MODIFICADA',
      estadoAnterior: reserva.estado,
      estadoNuevo: reservaActualizada.estado,
      actor: user.sub,
      detalles: {
        cambios: data,
        nuevaTarifa
      }
    });

    // Notificar a M8 (RF-9.8)
    M8Client.notificarEvento(
      {
        tipo_evento: 'RESERVA_MODIFICADA',
        reserva_id: reservaActualizada.id,
        cliente_id: reservaActualizada.clienteId,
        fecha_hora: reservaActualizada.fechaHora,
        zona_horaria: reservaActualizada.zonaHoraria,
        origen_direccion: reservaActualizada.origen.direccion,
        destino_direccion: reservaActualizada.destino.direccion,
        tipo_vehiculo: reservaActualizada.tipoVehiculo,
        tarifa_estimada: reservaActualizada.tarifaEstimada,
        ocurrido_en: new Date().toISOString()
      },
      requestId
    ).catch((err) => console.warn('[M8 Error]', err));

    return reservaActualizada;
  }

  /**
   * RF-9.7 Cancelación de reserva
   */
  public static async cancelarReserva(
    id: string,
    motivo: string,
    user: JwtUserPayload,
    requestId?: string
  ): Promise<ReservaDTO> {
    if (!motivo || motivo.trim().length < 3) {
      throw new AppError({
        status: 400,
        title: 'Motivo inválido',
        detail: 'El motivo de cancelación debe contener al menos 3 caracteres.'
      });
    }

    const reserva = await this.obtenerPorId(id, user);

    if (reserva.estado !== 'PENDIENTE' && reserva.estado !== 'CONFIRMADA') {
      throw new AppError({
        status: 409,
        title: 'Cancelación no permitida',
        detail: `No se puede cancelar una reserva en estado '${reserva.estado}'.`
      });
    }

    if (reserva.solicitudDespachoId) {
      throw new AppError({
        status: 409,
        title: 'Cancelación rechazada',
        detail: 'La reserva ya fue enviada a despacho y no puede ser cancelada directamente.'
      });
    }

    // Calcular minutos restantes hasta la hora programada del viaje (RF-9.7)
    const ahora = new Date();
    const fechaViaje = new Date(reserva.fechaHora);
    const minutosRestantes = Math.floor((fechaViaje.getTime() - ahora.getTime()) / (1000 * 60));
    const esCancelacionTardia = minutosRestantes < config.anticipation.freeCancellationMinutes;

    // Integrar con M7 para evaluar/aplicar cargos de cancelación
    const resultadoFinanciero = await M7Client.procesarCancelacion(
      {
        reserva_id: reserva.id,
        cliente_id: reserva.clienteId,
        tarifa_estimada: reserva.tarifaEstimada || 0,
        cancelacion_tardia: esCancelacionTardia,
        minutos_anticipacion: minutosRestantes
      },
      requestId
    );
    const reservaCancelada = await ReservationRepository.actualizar(id, {
      estado: 'CANCELADA',
      motivo_cancelacion: motivo.trim()
    });

    if (!reservaCancelada) {
      throw new AppError({
        status: 500,
        title: 'Error de cancelación',
        detail: 'No se pudo registrar la cancelación de la reserva.'
      });
    }

    // Registrar en Historial
    await HistoryRepository.registrar({
      reservaId: id,
      tipoEvento: 'RESERVA_CANCELADA',
      estadoAnterior: reserva.estado,
      estadoNuevo: 'CANCELADA',
      actor: user.sub,
      detalles: {
        motivo: motivo.trim(),
        cancelacionTardia: esCancelacionTardia,
        cargoAplicado: resultadoFinanciero.cargo_aplicado,
        estadoFinanciero: resultadoFinanciero.estado_financiero
      }
    });

    // Notificar a M8
    M8Client.notificarEvento(
      {
        tipo_evento: 'RESERVA_CANCELADA',
        reserva_id: reservaCancelada.id,
        cliente_id: reservaCancelada.clienteId,
        fecha_hora: reservaCancelada.fechaHora,
        zona_horaria: reservaCancelada.zonaHoraria,
        origen_direccion: reservaCancelada.origen.direccion,
        destino_direccion: reservaCancelada.destino.direccion,
        tipo_vehiculo: reservaCancelada.tipoVehiculo,
        tarifa_estimada: reservaCancelada.tarifaEstimada,
        motivo_cancelacion: motivo.trim(),
        ocurrido_en: new Date().toISOString()
      },
      requestId
    ).catch((err) => console.warn('[M8 Error]', err));

    return reservaCancelada;
  }

  /**
   * RF-9.12 Consultar Historial
   */
  public static async consultarHistorial(id: string, user: JwtUserPayload): Promise<HistorialEventoDTO[]> {
    await this.obtenerPorId(id, user);
    return HistoryRepository.listarPorReserva(id);
  }

  /**
   * RNF-09: Validar que una clave de idempotencia repetida coincida exactamente en sus datos
   */
  private static validarCoincidenciaIdempotencia(reserva: ReservaDTO, data: CrearReservaDTO): void {
    const coincideCliente = reserva.clienteId === data.clienteId;
    const coincideVehiculo = reserva.tipoVehiculo === data.tipoVehiculo;
    const coincideFecha = new Date(reserva.fechaHora).getTime() === new Date(data.fechaHora).getTime();
    const coincideOrigen =
      Math.abs(reserva.origen.latitud - data.origen.latitud) < 0.0001 &&
      Math.abs(reserva.origen.longitud - data.origen.longitud) < 0.0001;
    const coincideDestino =
      Math.abs(reserva.destino.latitud - data.destino.latitud) < 0.0001 &&
      Math.abs(reserva.destino.longitud - data.destino.longitud) < 0.0001;

    if (!coincideCliente || !coincideVehiculo || !coincideFecha || !coincideOrigen || !coincideDestino) {
      throw new AppError({
        status: 409,
        code: 'CONFLICTO_IDEMPOTENCIA',
        title: 'Conflicto de idempotencia',
        detail: 'La clave de idempotencia ya fue utilizada con datos diferentes'
      });
    }
  }
}
