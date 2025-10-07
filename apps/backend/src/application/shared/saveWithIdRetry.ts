import { RecordAlreadyExistsError } from 'src/presentation/errors';

const DEFAULT_MAX_RETRIES = 3;

export const saveWithIdRetry = async <
  T,
  E extends { toPersistence: () => T },
  K,
>(
  entity: E,
  promise: (data: T) => Promise<K>,
  onError: () => E,
  retries: number = DEFAULT_MAX_RETRIES,
): Promise<K> => {
  try {
    return await promise(entity.toPersistence());
  } catch (error) {
    if (error instanceof RecordAlreadyExistsError && retries > 0) {
      const regeneratedEntity = onError();
      return await saveWithIdRetry(
        regeneratedEntity,
        promise,
        onError,
        retries - 1,
      );
    }
    throw new Error('Failed to create account');
  }
};
