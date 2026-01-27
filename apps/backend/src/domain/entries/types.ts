import { IsoDatetimeString, MoneyString, UUID } from '@ledgerly/shared/types';

import { Account } from '../accounts';
import { User } from '../users/user.entity';

import { Entry } from './entry.entity';

export type TradingOperationDTO = {
  user: User;
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
};
