import { IsoDatetimeString, MoneyString, UUID } from '@ledgerly/shared/types';

import { Account } from '../accounts';
import { Id } from '../domain-core';
import { OperationSnapshot, OperationDraft } from '../operations/types';

import { Entry } from './entry.entity';

// TODO: move to the application layer
export type TradingOperationDTO = {
  userId: Id;
  entry: Entry;
  rawAmount: MoneyString;
  description: string;
  account: Account;
};

export type EntrySnapshot = {
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  isTombstone: boolean;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  transactionId: UUID;
  operations: OperationSnapshot[];
  version: number;
};

export type EntryDraft = {
  description: string;
  operations: [OperationDraft, OperationDraft];
};

export type EntryUpdate = {
  description: string;
  operations?: [OperationDraft, OperationDraft];
  id: UUID;
};
