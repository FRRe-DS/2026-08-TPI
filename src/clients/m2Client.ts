import { config } from '../config/env';
import { HttpClient } from './httpClient';
import { AppError } from '../types/problem';

export interface M2EstadoCuentaResponse {
  cliente_id: string;
  estado: 'ACTIVO' | 'BLOQUEADO';
}

export class M2Client {
  public static async verificarEstadoCuenta(clienteId: string, requestId?: string): Promise<M2EstadoCuentaResponse> {
    if (config.services.useExternalMocks) {
      return this.mockVerificarEstadoCuenta(clienteId);
    }

    const url = `${config.services.m2ClientesUrl}/api/v1/clientes/${encodeURIComponent(clienteId)}/estado-cuenta`;
    try {
      const response = await HttpClient.request<M2EstadoCuentaResponse>(url, {
        method: 'GET',
        requestId
      });
      return response;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 404) {
        throw new AppError({
          status: 404,
          title: 'Cliente no encontrado',
          detail: `El cliente con ID ${clienteId} no está registrado en M2.`
        });
      }

      if (config.services.useExternalMocks) {
        return this.mockVerificarEstadoCuenta(clienteId);
      }

      throw new AppError({
        status: 503,
        title: 'Dependencia no disponible',
        detail: `El Módulo de Clientes (M2) no respondió: ${(err as Error).message}`
      });
    }
  }

  private static mockVerificarEstadoCuenta(clienteId: string): M2EstadoCuentaResponse {
    if (clienteId.includes('bloqueado')) {
      return {
        cliente_id: clienteId,
        estado: 'BLOQUEADO'
      };
    }

    return {
      cliente_id: clienteId,
      estado: 'ACTIVO'
    };
  }
}
