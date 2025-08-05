export type AccountType =
  | "cash"
  | "debit"
  | "credit"
  | "savings"
  | "investment";

import { UUID } from "./auth";

type AccountBaseDTO = {
  balance: number;
  description?: string;
  initialBalance: number;
  name: string;
  originalCurrency: string;
  type: AccountType;
  userId: UUID;
};

export type AccountInsertDTO = AccountBaseDTO;

export type AccountUpdateDbDTO = {
  initialBalance?: number;
  name?: string;
  originalCurrency?: string;
  type?: AccountType;
};

export type AccountDbRowDTO = AccountBaseDTO & {
  createdAt: string;
  id: UUID;
  updatedAt: string;
};

export type AccountCreateDTO = Omit<AccountBaseDTO, "balance">;

export type AccountUpdateDTO = Partial<
  Omit<AccountBaseDTO, "userId" | "balance">
>;

export type AccountResponseDTO = AccountBaseDTO & {
  createdAt: string;
  id: UUID;
  updatedAt: string;
};
