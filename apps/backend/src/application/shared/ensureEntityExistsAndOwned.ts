import { UUID } from '@ledgerly/shared/types';
import { User } from 'src/domain';

import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from '../application.errors';

export type EnsureEntityExistsAndOwnedFn = <T extends { userId: UUID }>(
  user: User,
  promise: (userId: UUID, entityId: UUID) => Promise<T | null>,
  entityId: UUID,
  entityName: string,
) => Promise<T>;

export const ensureEntityExistsAndOwned: EnsureEntityExistsAndOwnedFn = async <
  T extends { userId: UUID },
>(
  user: User,
  promise: (userId: UUID, entityId: UUID) => Promise<T | null>,
  entityId: UUID,
  entityName: string,
): Promise<T> => {
  const entity = await promise(user.getId().valueOf(), entityId);
  if (!entity) {
    throw new EntityNotFoundError(entityName);
  }

  if (!user.verifyOwnership(entity.userId)) {
    throw new UnauthorizedAccessError(entityName);
  }

  return entity;
};
