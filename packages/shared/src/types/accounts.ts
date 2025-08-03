import { z } from "zod";

export type AccountType =
  | "cash"
  | "debit"
  | "credit"
  | "savings"
  | "investment";

import { accountResponseSchema } from "../validation";

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

export type AccountInsertDTO = Omit<AccountBaseDTO, "balance">;

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

export type AccountCreateDTO = AccountBaseDTO;

export type AccountUpdateDTO = Partial<
  Omit<AccountBaseDTO, "userId" | "balance">
>;

export type AccountResponseDTO = z.infer<typeof accountResponseSchema>;
