import {
  IsoDateString,
  UUID,
  CurrencyCode,
  MoneyString,
  IsoDatetimeString,
} from '@ledgerly/shared/types';

import { Account } from '../accounts';
import { EntrySnapshot } from '../entries/types';
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

export type EntryOperation = {
  accountId: UUID;
  amount: MoneyString;
  description: string;
};

export type TransactionEntry = {
  description: string;
  operations: [EntryOperation, EntryOperation];
};

export type CreateTransactionProps = {
  description: string;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  entries: TransactionEntry[];
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
