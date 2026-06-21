import type { UUID } from "./types";

export const apiErrorCodes = {
  deletedEntityOperation: "DELETED_ENTITY_OPERATION",
  emptyOperations: "EMPTY_OPERATIONS",
  entityNotFound: "ENTITY_NOT_FOUND",
  excessiveOperations: "EXCESSIVE_OPERATIONS",
  insufficientOperations: "INSUFFICIENT_OPERATIONS",
  invalidAmount: "INVALID_AMOUNT",
  invalidVersion: "INVALID_VERSION",
  operationNotFoundInTransaction: "OPERATION_NOT_FOUND_IN_TRANSACTION",
  operationTransactionMismatch: "OPERATION_TRANSACTION_MISMATCH",
  operationUserMismatch: "OPERATION_USER_MISMATCH",
  transactionUnbalanced: "TRANSACTION_UNBALANCED",
  unauthorizedAccess: "UNAUTHORIZED_ACCESS",
  validationFailed: "VALIDATION_FAILED",
  versionConflict: "VERSION_CONFLICT",
} as const;

export type ApiErrorCode = (typeof apiErrorCodes)[keyof typeof apiErrorCodes];

export type ValidationFieldErrorCode =
  | "INVALID_FORMAT"
  | "INVALID_TYPE"
  | "INVALID_VALUE"
  | "REQUIRED"
  | "TOO_BIG"
  | "TOO_SMALL";

export type ValidationFieldError = {
  code: ValidationFieldErrorCode;
  path: string;
};

export type ErrorContextByCode = {
  DELETED_ENTITY_OPERATION: {
    entityType: string;
    operation: "update";
  };
  EMPTY_OPERATIONS: Record<string, never>;
  ENTITY_NOT_FOUND: {
    entityId?: UUID;
    entityType: string;
  };
  EXCESSIVE_OPERATIONS: {
    maximum: number;
    received: number;
  };
  INSUFFICIENT_OPERATIONS: {
    minimum: number;
    received: number;
  };
  INVALID_AMOUNT: {
    field?: string;
    reason: "NOT_INTEGER_MINOR_UNITS";
    received: string;
  };
  INVALID_VERSION: {
    reason: "NON_NEGATIVE_INTEGER";
    received: number;
  };
  OPERATION_NOT_FOUND_IN_TRANSACTION: {
    operationId: UUID;
    transactionId: UUID;
  };
  OPERATION_TRANSACTION_MISMATCH: {
    operationId: UUID;
    transactionId: UUID;
  };
  OPERATION_USER_MISMATCH: {
    operationId: UUID;
    transactionId: UUID;
  };
  TRANSACTION_UNBALANCED: {
    difference: string;
    entityType: string;
    transactionId: UUID;
  };
  UNAUTHORIZED_ACCESS: {
    entityId?: UUID;
    entityType: string;
  };
  VALIDATION_FAILED: {
    fields: ValidationFieldError[];
  };
  VERSION_CONFLICT: {
    actualVersion?: number;
    entityId?: UUID;
    entityType: string;
    expectedVersion: number;
  };
};

export type ApiErrorResponse = {
  [Code in ApiErrorCode]: {
    code: Code;
    context: ErrorContextByCode[Code];
    error: true;
  };
}[ApiErrorCode];
