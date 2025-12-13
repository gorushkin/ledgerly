import { Entry } from 'src/domain';

import { UpdateEntryRequestDTO } from '../dto';

export type EntryCompareResult =
  | 'updatedMetadata'
  | 'updatedFinancial'
  | 'updatedBoth'
  | 'unchanged';

export const compareEntry = (
  existing: Entry,
  incoming: UpdateEntryRequestDTO,
): EntryCompareResult => {
  const updatedMetadata = existing.description !== incoming.description;

  const updatedFinancial = incoming.operations !== undefined;

  if (updatedMetadata && updatedFinancial) {
    return 'updatedBoth';
  }

  if (updatedMetadata) {
    return 'updatedMetadata';
  }

  if (updatedFinancial) {
    return 'updatedFinancial';
  }

  return 'unchanged';
};
