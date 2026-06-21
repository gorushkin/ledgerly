import type { UUID } from "./types";

export const apiErrorCodes = {
  entityNotFound: "ENTITY_NOT_FOUND",
  invalidAmount: "INVALID_AMOUNT",
  transactionUnbalanced: "TRANSACTION_UNBALANCED",
  unauthorizedAccess: "UNAUTHORIZED_ACCESS",
  versionConflict: "VERSION_CONFLICT",
} as const;

export type ApiErrorCode = (typeof apiErrorCodes)[keyof typeof apiErrorCodes];

export type ErrorContextByCode = {
  ENTITY_NOT_FOUND: {
    entityId?: UUID;
    entityType: string;
  };
  INVALID_AMOUNT: {
    field?: string;
    reason: "NOT_INTEGER_MINOR_UNITS";
    received: string;
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
