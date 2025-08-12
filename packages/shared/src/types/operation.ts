import { UUID } from "./auth";

export type OperationBaseDTO = {
  accountId: UUID;
  description: string;
  hash: string;
  id: UUID;
  isTombstone?: boolean;
  localAmount: number;
  originalAmount: number;
  transactionId: UUID;
  userId: UUID;
};

export type OperationInsertDTO = OperationBaseDTO & {
  createdAt: string;
  updatedAt: string;
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
