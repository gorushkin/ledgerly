import { ErrorMeta } from 'src/presentation/errors';
import { AuthErrors } from 'src/presentation/errors/auth.errors';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';

export abstract class BaseService {
  protected ensureEntityExists<T>(
    entity: T | undefined | null,
    message = 'Entity not found',
    _meta?: ErrorMeta,
  ): T {
    if (!entity) {
      throw new NotFoundError(message);
    }
    return entity;
  }

  protected ensureAuthorized(
    condition: boolean,
    message = 'Access denied',
    _meta?: ErrorMeta,
  ): void {
    if (!condition) {
      throw new AuthErrors.UnauthorizedError(message);
    }
  }
}
