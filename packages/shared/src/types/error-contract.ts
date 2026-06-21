import type { UUID } from "./types";

export const apiErrorCodes = {
  entityNotFound: "ENTITY_NOT_FOUND",
  invalidAmount: "INVALID_AMOUNT",
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
