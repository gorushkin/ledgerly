import {
  AccountTypeValue,
  IsoDatetimeString,
  AmountString,
  UUID,
} from '@ledgerly/shared/types';

export type AccountSnapshot = {
  createdAt: IsoDatetimeString;
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
  description: string;
  name: string;
  type: AccountTypeValue;
}>;
