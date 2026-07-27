import { UUID } from '@ledgerly/shared/types';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import { User } from 'src/domain';

export type EnsureOwnedSnapshotOptions<T> = {
  entityId: UUID;
  entityType: string;
  getOwnerId: (entity: T) => UUID;
  load: (userId: UUID, entityId: UUID) => Promise<T | null>;
  user: User;
};

export type EnsureOwnedSnapshotFn = <T>(
  options: EnsureOwnedSnapshotOptions<T>,
) => Promise<T>;

export const ensureOwnedSnapshot: EnsureOwnedSnapshotFn = async <T>({
  entityId,
  entityType,
  getOwnerId,
  load,
  user,
}: EnsureOwnedSnapshotOptions<T>): Promise<T> => {
  const entity = await load(user.getId().valueOf(), entityId);

  if (!entity) {
    throw new EntityNotFoundError({ entityId, entityType });
  }

  if (!user.verifyOwnership(getOwnerId(entity))) {
    throw new UnauthorizedAccessError({ entityId, entityType });
  }

  return entity;
};
