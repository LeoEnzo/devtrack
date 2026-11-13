export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function badRequest(message: string, details?: unknown) {
  return new HttpError(400, message, details);
}

export function unauthorized(message = "Nao autenticado") {
  return new HttpError(401, message);
}

export function notFound(message = "Recurso nao encontrado") {
  return new HttpError(404, message);
}

export function conflict(message: string) {
  return new HttpError(409, message);
}
