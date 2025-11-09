import { RecordAlreadyExistsError } from 'src/presentation/errors';

const DEFAULT_MAX_RETRIES = 3;

export type SaveWithIdRetryType = <
  InsertDto,
  Entity extends { toPersistence(): InsertDto },
  ResponseDto,
>(
  entity: Entity,
  promise: (dto: InsertDto) => Promise<ResponseDto>,
  entityFactory: () => Entity,
  retries?: number,
) => Promise<ResponseDto>;

export const saveWithIdRetry: SaveWithIdRetryType = async <
  T,
  E extends { toPersistence: () => T },
  K,
>(
  entity: E,
  promise: (data: T) => Promise<K>,
  entityFactory: () => E,
  retries: number = DEFAULT_MAX_RETRIES,
): Promise<K> => {
  try {
    return await promise(entity.toPersistence());
  } catch (error) {
    if (error instanceof RecordAlreadyExistsError && retries > 0) {
      const newEntity = entityFactory();
      return await saveWithIdRetry(
        newEntity,
        promise,
        entityFactory,
        retries - 1,
      );
    }
    throw new Error('Failed to create entity');
  }
};
