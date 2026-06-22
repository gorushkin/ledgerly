import type { UUID } from "./types";

export const apiErrorCodes = {
  accountNotFoundInContext: "ACCOUNT_NOT_FOUND_IN_CONTEXT",
  badRequest: "BAD_REQUEST",
  conflict: "CONFLICT",
  conflictingOperationIds: "CONFLICTING_OPERATION_IDS",
  currencyMismatch: "CURRENCY_MISMATCH",
  deletedEntityOperation: "DELETED_ENTITY_OPERATION",
  emptyOperations: "EMPTY_OPERATIONS",
  entityNotFound: "ENTITY_NOT_FOUND",
  excessiveOperations: "EXCESSIVE_OPERATIONS",
  insufficientOperations: "INSUFFICIENT_OPERATIONS",
  internalServerError: "INTERNAL_SERVER_ERROR",
  invalidAccountType: "INVALID_ACCOUNT_TYPE",
  invalidAmount: "INVALID_AMOUNT",
  invalidDate: "INVALID_DATE",
  invalidEmail: "INVALID_EMAIL",
  invalidIdentifier: "INVALID_IDENTIFIER",
  invalidMoneyAmount: "INVALID_MONEY_AMOUNT",
  invalidName: "INVALID_NAME",
  invalidPassword: "INVALID_PASSWORD",
  invalidTimestamp: "INVALID_TIMESTAMP",
  invalidVersion: "INVALID_VERSION",
  notFound: "NOT_FOUND",
  operationAlreadyAttachedToTransaction:
    "OPERATION_ALREADY_ATTACHED_TO_TRANSACTION",
  operationIdMismatch: "OPERATION_ID_MISMATCH",
  operationNotFoundInTransaction: "OPERATION_NOT_FOUND_IN_TRANSACTION",
  operationTransactionMismatch: "OPERATION_TRANSACTION_MISMATCH",
  operationUserMismatch: "OPERATION_USER_MISMATCH",
  transactionUnbalanced: "TRANSACTION_UNBALANCED",
  unauthorized: "UNAUTHORIZED",
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
  ACCOUNT_NOT_FOUND_IN_CONTEXT: {
    accountId: string;
    operationId: string;
  };
  BAD_REQUEST: Record<string, never>;
  CONFLICT: Record<string, never>;
  CONFLICTING_OPERATION_IDS: {
    conflict:
      | "DUPLICATE_IN_DELETE"
      | "DUPLICATE_IN_UPDATE"
      | "UPDATE_AND_DELETE";
    operationIds: UUID[];
  };
  CURRENCY_MISMATCH: {
    expectedCurrency: string;
    receivedCurrency: string;
  };
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
  INTERNAL_SERVER_ERROR: Record<string, never>;
  INVALID_ACCOUNT_TYPE: {
    receivedType: string;
  };
  INVALID_AMOUNT: {
    field?: string;
    reason: "NOT_INTEGER_MINOR_UNITS";
    received: string;
  };
  INVALID_DATE: {
    reason: "INVALID_FORMAT";
  };
  INVALID_EMAIL: {
    reason: "INVALID_FORMAT";
  };
  INVALID_IDENTIFIER: {
    reason: "INVALID_FORMAT";
  };
  INVALID_MONEY_AMOUNT: {
    reason: "INVALID_INTEGER_MINOR_UNITS";
  };
  INVALID_NAME: {
    reason: "EMPTY";
  };
  INVALID_PASSWORD: {
    reason: "POLICY_VIOLATION";
  };
  INVALID_TIMESTAMP: {
    reason: "INVALID_FORMAT";
  };
  INVALID_VERSION: {
    reason: "NON_NEGATIVE_INTEGER";
    received: number;
  };
  NOT_FOUND: Record<string, never>;
  OPERATION_ALREADY_ATTACHED_TO_TRANSACTION: {
    operationId: UUID;
    transactionId: UUID;
  };
  OPERATION_ID_MISMATCH: {
    expectedOperationId: UUID;
    receivedOperationId: UUID;
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
  UNAUTHORIZED: Record<string, never>;
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
