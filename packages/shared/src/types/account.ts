import { CurrencyCode, IsoDatetimeString, MoneyString, UUID } from "./types";

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense";

export type AccountDomain = {
  createdAt: IsoDatetimeString;
  currency: CurrencyCode;
  currentClearedBalanceLocal: string;
  description: string;
  id: UUID;
  initialBalance: string;
  name: string;
  type: AccountType;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type AccountCreateDTO = {
  currency: CurrencyCode;
  description: string;
  initialBalance: MoneyString;
  name: string;
  type: AccountType;
  userId: UUID;
};

export type AccountUpdateDTO = Partial<
  Pick<AccountCreateDTO, "name" | "description" | "type" | "currency">
>;

export type AccountResponseDTO = AccountDomain;
