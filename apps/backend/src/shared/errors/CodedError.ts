import {
  apiErrorCodes,
  type ApiErrorCode,
  type ErrorContextByCode,
} from '@ledgerly/shared/types';

export type CodedErrorContract<Code extends ApiErrorCode = ApiErrorCode> = {
  code: Code;
  context: ErrorContextByCode[Code];
};

const apiErrorCodeSet = new Set(Object.values(apiErrorCodes));

export const isCodedError = (error: unknown): error is CodedErrorContract => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<CodedErrorContract>;
  return (
    typeof candidate.code === 'string' &&
    apiErrorCodeSet.has(candidate.code) &&
    !!candidate.context &&
    typeof candidate.context === 'object'
  );
};
