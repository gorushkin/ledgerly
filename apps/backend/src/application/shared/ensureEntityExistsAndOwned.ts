import { UUID } from '@ledgerly/shared/types';
import { User } from 'src/domain';

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
    throw new Error(`${entityName} not found`);
  }

  if (!user.verifyOwnership(entity.userId)) {
    throw new Error(`${entityName} does not belong to the user`);
  }

  return entity;
};
