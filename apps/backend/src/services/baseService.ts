import {
  NotFoundError,
  ForbiddenError,
  ErrorMeta,
} from 'src/presentation/errors';

export abstract class BaseService {
  protected ensureEntityExists<T>(
    entity: T | undefined | null,
    message = 'Entity not found',
    meta?: ErrorMeta,
  ): T {
    if (!entity) {
      throw new NotFoundError(message, meta);
    }
    return entity;
  }

  protected ensureAuthorized(
    condition: boolean,
    message = 'Access denied',
    meta?: ErrorMeta,
  ): void {
    if (!condition) {
      throw new ForbiddenError(message, meta);
    }
  }
}
