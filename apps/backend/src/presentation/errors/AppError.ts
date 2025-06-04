export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
