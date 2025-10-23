import { UUID } from '@ledgerly/shared/types';
import { DataBase } from 'src/db';
import {
  OperationDbInsert,
  OperationDbRow,
  OperationDbUpdate,
} from 'src/db/schema';

export type OperationRepository = {
  create(
    userId: UUID,
    operation: OperationDbInsert,
    tx?: DataBase,
  ): Promise<OperationDbRow>;
  update(
    userId: UUID,
    operation: OperationDbUpdate,
    tx?: DataBase,
  ): Promise<OperationDbRow>;
  getById(
    userId: UUID,
    id: UUID,
    tx?: DataBase,
  ): Promise<OperationDbRow | null>;
  getAllByEntryId(
    userId: UUID,
    entryId: UUID,
    tx?: DataBase,
  ): Promise<OperationDbRow[]>;
  delete(userId: UUID, id: UUID, tx?: DataBase): Promise<boolean>;
  exists(userId: UUID, id: UUID, tx?: DataBase): Promise<boolean>;
};
