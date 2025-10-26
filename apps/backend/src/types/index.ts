import { UUID } from '@ledgerly/shared/types';
import { db, DataBase } from 'src/db';

export abstract class BaseRepository {
  protected db = db;
}

export abstract class BaseRepositoryNew {
  protected db: DataBase;

  constructor(db: DataBase) {
    this.db = db;
  }
}

export type JWTPayload = {
  userId: UUID;
  email: string;
};

export type TokenGenerator = {
  signToken(payload: JWTPayload): Promise<string>;
};
