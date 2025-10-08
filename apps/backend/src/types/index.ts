import { UUID } from '@ledgerly/shared/types';
import { ResultSet } from '@libsql/client';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { db } from 'src/db';
import * as schema from 'src/db/schemas';

export type DataBase = LibSQLDatabase<typeof schema>;

export type TxType = SQLiteTransaction<
  'async',
  ResultSet,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

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
