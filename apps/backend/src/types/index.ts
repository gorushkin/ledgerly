import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { db } from 'src/db';
import * as schema from 'src/db/schemas';

export type DataBase = LibSQLDatabase<typeof schema>;

export abstract class BaseRepository {
  protected db = db;
}

export abstract class BaseRepositoryNew {
  protected db: DataBase;

  constructor(db: DataBase) {
    this.db = db;
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface TokenGenerator {
  signToken(payload: JWTPayload): Promise<string>;
}
