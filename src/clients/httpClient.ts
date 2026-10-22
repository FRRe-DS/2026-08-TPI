import { getServiceToken } from './serviceToken';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  requestId?: string;
  timeoutMs?: number;
  retries?: number;
}

export class HttpClient {
  private static DEFAULT_TIMEOUT_MS = 2000;

  public static async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method || 'GET';
    const timeoutMs = options.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;
    const maxRetries = options.retries ?? (method === 'GET' ? 1 : 0);

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

        attempt++;
        if (attempt <= maxRetries && method === 'GET') {
          // Reintento único para peticiones GET
          await new Promise((resolve) => setTimeout(resolve, 150));
          continue;
        }
        break;
      }
    }

    throw lastError || new Error(`Error de red al conectar con ${url}`);
  }
}
