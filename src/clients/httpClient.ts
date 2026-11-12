import CircuitBreaker from 'opossum';
import { getServiceToken } from './serviceToken';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  requestId?: string;
  timeoutMs?: number;
  retries?: number;
  retryBaseDelayMs?: number;
}

export class HttpClient {
  private static DEFAULT_TIMEOUT_MS = 2000;
  private static DEFAULT_RETRY_BASE_DELAY_MS = 150;
  private static breakers = new Map<string, CircuitBreaker<[string, RequestOptions], unknown>>();

  public static breakerOptions: CircuitBreaker.Options<[string, RequestOptions]> = {
    timeout: false, // El timeout por intento lo maneja AbortController en executeRequest
    errorThresholdPercentage: 50,
    volumeThreshold: 5,
    resetTimeout: 15000,
    rollingCountTimeout: 10000,
    errorFilter: (err: { status?: number }) => {
      // Los errores 4xx (ej. 404 Cliente no encontrado en M2) son respuestas de negocio válidas y no deben abrir el circuito
      return Boolean(err?.status && err.status >= 400 && err.status < 500);
    }
  };

  public static async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const breaker = this.getOrCreateBreaker(url);
    return (await breaker.fire(url, options)) as T;
  }

  private static getServiceKey(url: string): string {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  }

  public static getOrCreateBreaker(url: string): CircuitBreaker<[string, RequestOptions], unknown> {
    const serviceKey = this.getServiceKey(url);
    let breaker = this.breakers.get(serviceKey);

    if (!breaker) {
      breaker = new CircuitBreaker(
        (targetUrl: string, opts: RequestOptions) => this.executeRequest(targetUrl, opts),
        {
          ...this.breakerOptions,
          name: `cb-${serviceKey}`
        }
      );

      breaker.on('open', () => {
        console.warn(`[CircuitBreaker] Circuito ABIERTO para ${serviceKey}`);
      });

      breaker.on('halfOpen', () => {
        console.info(`[CircuitBreaker] Circuito SEMI-ABIERTO (probando recuperación) para ${serviceKey}`);
      });

      breaker.on('close', () => {
        console.info(`[CircuitBreaker] Circuito CERRADO (servicio recuperado) para ${serviceKey}`);
      });

      this.breakers.set(serviceKey, breaker);
    }

    return breaker;
  }

  public static resetBreakers(): void {
    for (const breaker of this.breakers.values()) {
      breaker.shutdown();
    }
    this.breakers.clear();
  }

  public static calculateBackoffDelay(
    attempt: number,
    baseDelayMs: number = this.DEFAULT_RETRY_BASE_DELAY_MS
  ): number {
    return baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  }

  private static async executeRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method || 'GET';
    const timeoutMs = options.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;
    const maxRetries = options.retries ?? (method === 'GET' ? 1 : 0);
    const retryBaseDelayMs = options.retryBaseDelayMs ?? this.DEFAULT_RETRY_BASE_DELAY_MS;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, application/problem+json',
      Authorization: `Bearer ${getServiceToken()}`,
      ...(options.requestId ? { 'X-Request-Id': options.requestId } : {}),
      ...(options.headers || {})
    };

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorBody: unknown;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = await response.text();
          }
          const err = new Error(`HTTP ${response.status} en ${method} ${url}: ${JSON.stringify(errorBody)}`);
          (err as { status?: number }).status = response.status;
          (err as { responseBody?: unknown }).responseBody = errorBody;
          throw err;
        }

        return (await response.json()) as T;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        lastError = err as Error;

        // Si es un abort (timeout), personalizar mensaje
        if ((err as { name?: string }).name === 'AbortError') {
          lastError = new Error(`Timeout de ${timeoutMs}ms excedido en llamada a ${method} ${url}`);
        }

        const status = (err as { status?: number }).status;
        const isClientError = Boolean(status && status >= 400 && status < 500);

        attempt++;
        if (attempt <= maxRetries && !isClientError) {
          // Backoff exponencial para errores transitorios (red, timeout o 5xx) cuando retries > 0
          const delayMs = this.calculateBackoffDelay(attempt, retryBaseDelayMs);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        break;
      }
    }

    throw lastError || new Error(`Error de red al conectar con ${url}`);
  }
}
