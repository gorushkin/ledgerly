import { LibsqlError } from '@libsql/client';
import { DBErrorContext } from 'src/presentation/errors';

import { NormalizedDbError } from '../../../infrastructure/db/BaseRepository';

const UNIQUE = 'SQLITE_CONSTRAINT_UNIQUE';
const FOREIGNKEY = 'SQLITE_CONSTRAINT_FOREIGNKEY';

export function adaptLibsqlError(
  error: unknown,
  context?: DBErrorContext,
): NormalizedDbError | null {
  if (!(error instanceof LibsqlError)) return null;

  if (error.code === UNIQUE && context) {
    return {
      field: context.field,
      table: context.tableName,
      type: 'unique',
      value: context.value,
    };
  }

  if (error.code === FOREIGNKEY && context) {
    return {
      field: context.field,
      table: context.tableName,
      type: 'foreign_key',
      value: context.value,
    };
  }

  return { original: error, type: 'unknown' };
}
