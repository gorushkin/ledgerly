import { LibsqlError } from '@libsql/client';
import { DBErrorContext } from 'src/presentation/errors';

import { NormalizedDbError } from '../../../infrastructure/db/BaseRepository';

const UNIQUE = 'SQLITE_CONSTRAINT_UNIQUE';
const FOREIGNKEY = 'SQLITE_CONSTRAINT_FOREIGNKEY';
const PRIMARYKEY = 'SQLITE_CONSTRAINT_PRIMARYKEY';

export function adaptLibsqlError(
  error: unknown,
  context?: DBErrorContext,
): NormalizedDbError | null {
  if (!(error instanceof LibsqlError)) return null;
  // TODO: fix types
  if (context) {
    if (error.code === UNIQUE) {
      return {
        field: context.field ?? '',
        table: context.tableName ?? '',
        type: 'unique',
        value: context.value,
      };
    }

    if (error.code === FOREIGNKEY) {
      return {
        field: context.field ?? '',
        table: context.tableName ?? '',
        type: 'foreign_key',
        value: context.value,
      };
    }

    if (error.code === PRIMARYKEY) {
      return {
        field: context.field ?? '',
        table: context.tableName ?? '',
        type: 'primary_key',
        value: context.value,
      };
    }
  }

  return { original: error, type: 'unknown' };
}
