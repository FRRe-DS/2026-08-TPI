export interface InvalidParam {
  name: string;
  reason: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: InvalidParam[];
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly type: string;
  public readonly detail: string;
  public readonly code?: string;
  public readonly invalidParams?: InvalidParam[];

  constructor(options: {
    status: number;
    title: string;
    detail: string;
    code?: string;
    type?: string;
    invalidParams?: InvalidParam[];
  }) {
    super(options.detail);
    this.name = 'AppError';
    this.status = options.status;
    this.title = options.title;
    this.detail = options.detail;
    this.code = options.code;
    this.type = options.type || `https://api.reservas.frre.utn.edu.ar/errors/${this.slugify(options.title)}`;
    this.invalidParams = options.invalidParams;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
