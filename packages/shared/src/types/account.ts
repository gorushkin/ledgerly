import { IsoDatetimeString, AmountString, UUID } from "./types";

export type AccountTypeValue =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "currencyTrading"
  | "expense";

export type AccountDomain = {
  commodityId: UUID;
  createdAt: IsoDatetimeString;
  currentClearedBalanceLocal: AmountString;
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

export type AccountCreateDTO = {
  commodityId: UUID;
  description: string;
  initialBalance: AmountString;
  name: string;
  type: AccountTypeValue;
};

export type AccountUpdateDTO = Partial<
  Pick<AccountCreateDTO, "name" | "description" | "type">
>;

export type AccountResponseDTO = AccountDomain;
