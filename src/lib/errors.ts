/** An error that is safe to show to the user, with an HTTP status. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, code = "bad_request") => new AppError(400, code, message);
export const unauthorized = (message = "Please log in.") => new AppError(401, "unauthorized", message);
export const forbidden = (message = "You can't do that.", code = "forbidden") => new AppError(403, code, message);
export const notFound = (message = "Not found.") => new AppError(404, "not_found", message);
export const conflict = (message: string, code = "conflict", extra?: Record<string, unknown>) =>
  new AppError(409, code, message, extra);
export const tooMany = (message = "Slow down a little and try again shortly.") =>
  new AppError(429, "rate_limited", message);
