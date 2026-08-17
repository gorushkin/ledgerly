import type { ErrorContextByCode } from '@ledgerly/shared/types';
import { EntityAlreadyExistsError } from 'src/application/application.errors';
import { RecordAlreadyExistsError } from 'src/infrastructure/errors';

type EntityAlreadyExistsContext = ErrorContextByCode['ENTITY_ALREADY_EXISTS'];

type RepositoryConflictMapping = EntityAlreadyExistsContext & {
  tableName: string;
};

type PublicAlreadyExistsField = EntityAlreadyExistsContext['field'];
type PublicAlreadyExistsEntityType = EntityAlreadyExistsContext['entityType'];
type PublicContextByEntityType = {
  [EntityType in PublicAlreadyExistsEntityType]: Extract<
    EntityAlreadyExistsContext,
    { entityType: EntityType }
  >;
};

const publicFieldByDiagnosticField: Partial<
  Record<string, PublicAlreadyExistsField>
> = {
  accountName: 'name',
  code: 'code',
  email: 'email',
  name: 'name',
};

const normalizeField = (field: string): PublicAlreadyExistsField | undefined =>
  publicFieldByDiagnosticField[field];

const publicContextByEntityType = {
  account: { entityType: 'account', field: 'name' },
  commodity: { entityType: 'commodity', field: 'code' },
  user: { entityType: 'user', field: 'email' },
} satisfies PublicContextByEntityType;

const toPublicContext = (
  mapping: RepositoryConflictMapping,
): EntityAlreadyExistsContext => publicContextByEntityType[mapping.entityType];

const findMapping = (
  error: RecordAlreadyExistsError,
  mappings: readonly RepositoryConflictMapping[],
): RepositoryConflictMapping | undefined => {
  const diagnostic = error.context?.unique ?? error.context;
  const tableName = diagnostic?.tableName;
  const field = diagnostic?.field;

  if (!tableName || !field) return undefined;

  const normalizedField = normalizeField(field);
  if (!normalizedField) return undefined;

  return mappings.find(
    (mapping) =>
      mapping.tableName === tableName && mapping.field === normalizedField,
  );
};

export const mapRepositoryAlreadyExists = async <T>(
  operation: () => Promise<T>,
  mappings: readonly RepositoryConflictMapping[],
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RecordAlreadyExistsError) {
      const mapping = findMapping(error, mappings);

      if (mapping) {
        throw new EntityAlreadyExistsError(toPublicContext(mapping));
      }
    }

    throw error;
  }
};
