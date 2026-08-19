export const apiSuccessCodes = {
  userPasswordChanged: "USER_PASSWORD_CHANGED",
} as const;

export type ApiSuccessCode =
  (typeof apiSuccessCodes)[keyof typeof apiSuccessCodes];

export type ApiSuccessResponse<Code extends ApiSuccessCode = ApiSuccessCode> = {
  code: Code;
};
