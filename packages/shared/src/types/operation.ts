import { UUID } from "./auth";

export type OperationBaseDTO = {
  accountId: UUID;
  categoryId: UUID;
  description: string;
  hash: string;
  id: UUID;
  isTombstone?: boolean;
  localAmount: number;
  originalAmount: number;
  transactionId: UUID;
  userId: UUID;
};

export type OperationInsertDTO = OperationBaseDTO;
export type OperationDBRowDTO = OperationBaseDTO & {
  createdAt: string;
  updatedAt: string;
};

export type OperationCreateDTO = OperationBaseDTO;

export type OperationRaw = Omit<OperationBaseDTO, "hash">;

export type OperationResponseDTO = OperationCreateDTO & {
  createdAt: string;
  updatedAt: string;
  userId: UUID;
};
