import { UUID } from "./auth";
import { IsoDatetimeString } from "./types";

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type Money = Brand<bigint, "Money">;

export type FxRateScaled = Brand<bigint, "FxRateScaled">;

export type PerIdStatus =
  | "deleted"
  | "already_deleted"
  | "restored"
  | "already_alive"
  | "updated"
  | "not_found";

export type OperationDomain = {
  accountId: UUID;
  baseAmount: Money;
  createdAt: IsoDatetimeString;
  description: string;
  hash: string;
  id: UUID;
  isTombstone: boolean;
  localAmount: Money;
  rateBasePerLocal: FxRateScaled;
  transactionId: UUID;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type OperationCreateDTO = {
  accountId: UUID;
  baseAmount: Money;
  description: string;
  isTombstone?: boolean;
  localAmount?: Money;
  rateBasePerLocal?: FxRateScaled;
  transactionId: UUID;
  userId: UUID;
};

export type OperationUpdateDTO = Partial<
  Pick<
    OperationCreateDTO,
    | "description"
    | "baseAmount"
    | "localAmount"
    | "rateBasePerLocal"
    | "accountId"
    | "isTombstone"
  >
>;

export type OperationResponseDTO = OperationDomain;
