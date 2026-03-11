import { UUID } from '@ledgerly/shared/types';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import { User } from 'src/domain';
import { Id } from 'src/domain/domain-core';

export type EnsureEntityExistsAndOwnedFn = <
  T extends { belongsToUser: (userId: Id) => boolean },
>(
  user: User,
  promise: (userId: UUID, entityId: UUID) => Promise<T | null>,
  entityId: UUID,
  entityName: string,
) => Promise<T>;

export const ensureEntityExistsAndOwned: EnsureEntityExistsAndOwnedFn = async <
  T extends { belongsToUser: (userId: Id) => boolean },
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

  if (!entity.belongsToUser(user.getId())) {
    throw new UnauthorizedAccessError(entityName);
  }

  return entity;
};
