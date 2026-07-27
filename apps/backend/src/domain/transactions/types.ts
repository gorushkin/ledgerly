import { IsoDateString, UUID, IsoDatetimeString } from '@ledgerly/shared/types';

import { Account } from '../accounts';
import { DateValue, Id } from '../domain-core';
import {
  CreateOperationProps,
  OperationProps,
  OperationSnapshot,
  UpdateOperationProps,
} from '../operations/types';

export type TransactionUpdateData = {
  description: string;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
};

export type TransactionBuildContext = {
  accountsMap: Map<UUID, Account>;
};

export type CreateTransactionProps = {
  description: string;
  postingDate: DateValue;
  transactionDate: DateValue;
  operations: OperationProps[];
  commodityId: Id;
};

export type OperationsPatch = {
  create: CreateOperationProps[];
  update: UpdateOperationProps[];
  delete: Id[];
} | null;

export type UpdateTransactionProps = {
  metadata?: TransactionUpdateData;
  operations?: OperationsPatch;
};

export type TransactionSnapshot = {
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  isTombstone: boolean;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  commodityId: UUID;
  operations: OperationSnapshot[];
  version: number;
};

export type TransactionSnapshotWithDetails = TransactionSnapshot & {
  operations: OperationSnapshot[];
};
