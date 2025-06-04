export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'apiError';
  }
}

export class AuthError extends ApiError {
  constructor(public readonly message = 'Authentication failed') {
    super(message);
    this.statusCode = 401;
    this.message = message || 'Authentication failed';
    this.name = 'AuthError';
  }
}
