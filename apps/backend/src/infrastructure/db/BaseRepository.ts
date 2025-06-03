import { withErrorHandling } from 'src/libs/errorHandler';
import { DataBase } from 'src/types';

export class BaseRepository {
  withErrorHandling = withErrorHandling;
  constructor(readonly db: DataBase) {}
}
