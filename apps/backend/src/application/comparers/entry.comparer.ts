import { UUID } from '@ledgerly/shared/types';
import { Entry, Operation } from 'src/domain';

import { UpdateEntryRequestDTO } from '../dto';

import { compareOperation } from './operation.comparer';

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

  let updatedFinancial = false;

  const thisOps = existing.getOperations().filter((op) => !op.isSystem);

  const thisOpsMap = new Map<UUID, Operation>();

  thisOps.forEach((op) => {
    thisOpsMap.set(op.getId().valueOf(), op);
  });

  incoming.operations.forEach((op) => {
    const existingOp = thisOpsMap.get(op.id);
    if (!existingOp) {
      updatedFinancial = true;
      return;
    }
    const compareResult = compareOperation(existingOp, op);
    if (compareResult === 'different') {
      updatedFinancial = true;
      return;
    }
  });

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
