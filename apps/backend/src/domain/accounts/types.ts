import {
  AccountTypeValue,
  CurrencyCode,
  IsoDatetimeString,
  MoneyString,
  UUID,
} from '@ledgerly/shared/types';

export type AccountSnapshot = {
  createdAt: IsoDatetimeString;
  currency: CurrencyCode;
  currentClearedBalanceLocal: MoneyString;
  description: string;
  id: UUID;
  initialBalance: MoneyString;
  isSystem: boolean;
  isTombstone: boolean;
  name: string;
  type: AccountTypeValue;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type AccountUpdateData = Partial<{
  currency: CurrencyCode;
  description: string;
  isSystem: boolean;
  name: string;
  type: AccountTypeValue;
}>;
