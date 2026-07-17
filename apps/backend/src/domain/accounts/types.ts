import {
  AccountTypeValue,
  CurrencyCode,
  IsoDatetimeString,
  AmountString,
  UUID,
} from '@ledgerly/shared/types';

export type AccountSnapshot = {
  createdAt: IsoDatetimeString;
  currency: CurrencyCode;
  currentClearedBalanceLocal: AmountString;
  commodityId: UUID;
  description: string;
  id: UUID;
  initialBalance: AmountString;
  isSystem: boolean;
  isTombstone: boolean;
  name: string;
  type: AccountTypeValue;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type AccountUpdateProps = Partial<{
  currency: CurrencyCode;
  description: string;
  name: string;
  type: AccountTypeValue;
}>;
