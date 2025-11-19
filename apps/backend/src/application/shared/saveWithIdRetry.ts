import { RecordAlreadyExistsError } from 'src/presentation/errors';

const DEFAULT_MAX_RETRIES = 3;

export type SaveWithIdRetryType = <
  InsertDto,
  Entity extends { toPersistence(): InsertDto },
  ResponseDto,
>(
  repoInsert: (dto: InsertDto) => Promise<ResponseDto>,
  entityFactory: () => Entity,
  retries?: number,
) => Promise<Entity>;

export const saveWithIdRetry: SaveWithIdRetryType = async <
  T,
  E extends { toPersistence: () => T },
  K,
>(
  promise: (data: T) => Promise<K>,
  entityFactory: () => E,
  retries: number = DEFAULT_MAX_RETRIES,
): Promise<E> => {
  try {
    const newEntity = entityFactory();
    await promise(newEntity.toPersistence());
    return newEntity;
  } catch (error) {
    if (error instanceof RecordAlreadyExistsError && retries > 0) {
      return await saveWithIdRetry(promise, entityFactory, retries - 1);
    }
    throw new Error('Failed to create entity');
  }
};
