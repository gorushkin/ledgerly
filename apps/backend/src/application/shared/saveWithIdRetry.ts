import { RecordAlreadyExistsError } from 'src/presentation/errors';

const DEFAULT_MAX_RETRIES = 3;

export type SaveWithIdRetryType = <
  InsertDto,
  Entity extends { toPersistence(): InsertDto; setId(): void },
  ResponseDto,
>(
  entity: Entity,
  promise: (dto: InsertDto) => Promise<ResponseDto>,
  retries?: number,
) => Promise<ResponseDto>;

export const saveWithIdRetry: SaveWithIdRetryType = async <
  T,
  E extends { toPersistence: () => T; setId: () => void },
  K,
>(
  entity: E,
  promise: (data: T) => Promise<K>,
  retries: number = DEFAULT_MAX_RETRIES,
): Promise<K> => {
  try {
    return await promise(entity.toPersistence());
  } catch (error) {
    if (error instanceof RecordAlreadyExistsError && retries > 0) {
      entity.setId();
      return await saveWithIdRetry(entity, promise, retries - 1);
    }
    throw new Error('Failed to create account');
  }
};
