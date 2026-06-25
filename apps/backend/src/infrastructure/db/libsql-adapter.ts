import { LibsqlError } from '@libsql/client';

import { type NormalizedDbError } from './BaseRepository';
import {
  type DBErrorContext,
  type DBErrorDiagnosticContext,
} from './DatabaseErrors';

const UNIQUE = 'SQLITE_CONSTRAINT_UNIQUE';
const FOREIGNKEY = 'SQLITE_CONSTRAINT_FOREIGNKEY';
const PRIMARYKEY = 'SQLITE_CONSTRAINT_PRIMARYKEY';

const toNormalizedContext = (
  type: NormalizedDbError['type'],
  context: DBErrorContext,
): DBErrorDiagnosticContext => {
  if (type === 'unique') return context.unique ?? context;
  if (type === 'foreign_key') return context.foreignKey ?? context;
  if (type === 'primary_key') return context.primaryKey ?? context;

  return context;
};

export function adaptLibsqlError(
  error: unknown,
  context?: DBErrorContext,
): NormalizedDbError | null {
  if (!(error instanceof LibsqlError)) return null;
  // TODO: fix types
  if (context) {
    if (error.code === UNIQUE) {
      const normalizedContext = toNormalizedContext('unique', context);
      return {
        field: normalizedContext.field ?? '',
        table: normalizedContext.tableName ?? '',
        type: 'unique',
        value: normalizedContext.value,
      };
    }

    if (error.code === FOREIGNKEY) {
      const normalizedContext = toNormalizedContext('foreign_key', context);
      return {
        field: normalizedContext.field ?? '',
        table: normalizedContext.tableName ?? '',
        type: 'foreign_key',
        value: normalizedContext.value,
      };
    }

    if (error.code === PRIMARYKEY) {
      const normalizedContext = toNormalizedContext('primary_key', context);
      return {
        field: normalizedContext.field ?? '',
        table: normalizedContext.tableName ?? '',
        type: 'primary_key',
        value: normalizedContext.value,
      };
    }
  }

  return { original: error, type: 'unknown' };
}
