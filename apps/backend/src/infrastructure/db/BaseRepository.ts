import { DataBase } from 'src/types';

import { DatabaseError } from './errors';

export class BaseRepository {
  constructor(readonly db: DataBase) {}

  protected async executeDatabaseOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`Database error: ${errorMessage}`, error);
      throw new DatabaseError(errorMessage, error as Error);
    }
  }
}
