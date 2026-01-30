import {
  IsoDateString,
  UUID,
  CurrencyCode,
  IsoDatetimeString,
} from '@ledgerly/shared/types';

import { Account } from '../accounts';
import { EntryDraft, EntrySnapshot } from '../entries/types';
import { OperationSnapshot } from '../operations/types';

export type TransactionUpdateData = {
  description?: string;
  postingDate?: IsoDateString;
  transactionDate?: IsoDateString;
};

export type TransactionBuildContext = {
  accountsMap: Map<UUID, Account>;
  systemAccountsMap: Map<CurrencyCode, Account>;
};

export type CreateTransactionProps = {
  description: string;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  entries: EntryDraft[];
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
  entries: EntrySnapshot[];
  version: number;
};

export type TransactionWithEntriesAndOperations = TransactionSnapshot & {
  entries: (EntrySnapshot & {
    operations: OperationSnapshot[];
  })[];
};
