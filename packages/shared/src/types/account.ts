import { CurrencyCode, IsoDatetimeString, MoneyString, UUID } from "./types";

export type AccountTypeValue =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "currencyTrading"
  | "expense";

export type AccountDomain = {
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

export type AccountCreateDTO = {
  currency: CurrencyCode;
  description: string;
  initialBalance: MoneyString;
  isSystem?: boolean;
  name: string;
  type: AccountTypeValue;
};

export type AccountUpdateDTO = Partial<
  Pick<AccountCreateDTO, "name" | "description" | "type" | "currency">
>;

export type AccountResponseDTO = AccountDomain;
