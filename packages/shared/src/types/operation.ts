import { UUID } from "./auth";
import { CurrencyCode, IsoDatetimeString } from "./types";

export type Money = {
  amount: bigint; // minor units
  currency: CurrencyCode;
};

export type FxRateScaled = {
  base: CurrencyCode; // BASE currency (system)
  local: CurrencyCode; // account currency
  scale: 9; // fixed for unification
  value: bigint; // 1.234567890 → 1234567890n at SCALE=9
};

export type OperationBaseDTO = {
  accountId: UUID;
  baseAmount: number;
  description: string;
  hash: string;
  id: UUID;
  isTombstone?: boolean;
  localAmount: number | null;
  rateBasePerLocal: string | null;
  transactionId: UUID;
  userId: UUID;
};

export type OperationDBRowDTO = OperationBaseDTO & {
  createdAt: string;
  updatedAt: string;
};

export type OperationCreateDTO = OperationBaseDTO & {
  createdAt: string;
  updatedAt: string;
};

export type OperationDbPreHashDTO = Omit<OperationCreateDTO, "hash">;

export type OperationResponseDTO = OperationCreateDTO & {
  createdAt: string;
  updatedAt: string;
  userId: UUID;
};

// Repository

export type OperationDbRow = {
  accountId: UUID;
  baseAmount: number; // INTEGER (minor units), not null
  createdAt: IsoDatetimeString; // TEXT ISO
  description: string;
  hash: string;
  id: UUID;
  isTombstone: boolean;
  localAmount: number | null; // INTEGER (minor units), nullable
  rateBasePerLocal: string | null; // TEXT decimal (e.g. "1.23456789"), nullable
  transactionId: UUID;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type OperationDbInsert = Omit<
  OperationDbRow,
  "id" | "hash" | "createdAt" | "updatedAt"
> & {
  hash?: string;
  id?: UUID;
};

export type OperationDbUpdate = Partial<
  Omit<
    OperationDbRow,
    "id" | "userId" | "transactionId" | "createdAt" | "updatedAt" | "hash"
  >
>;

// Domain / Service

export type OperationEntity = {
  accountId: UUID;
  baseAmount: Money; // BASE currency
  createdAt: IsoDatetimeString;
  description: string;
  hash: string;
  id: UUID;
  isTombstone: boolean;
  localAmount: Money | null; // account currency (может быть null)
  rateBasePerLocal: FxRateScaled | null;
  transactionId: UUID;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type OperationServiceCreate = {
  accountId: UUID;
  baseAmount: Money;
  description: string;
  isTombstone?: boolean; // default false
  localAmount?: Money | null; // optional
  rateBasePerLocal?: FxRateScaled | null;
  transactionId: UUID;
  userId: UUID;
};

export type OperationServiceUpdate = Partial<
  Pick<
    OperationServiceCreate,
    | "description"
    | "baseAmount"
    | "localAmount"
    | "rateBasePerLocal"
    | "accountId"
    | "isTombstone"
  >
>;
