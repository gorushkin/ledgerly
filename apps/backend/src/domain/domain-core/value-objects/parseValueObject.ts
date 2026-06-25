type Parser<T> = {
  parse: (value: unknown) => T;
};

export const parseValueObject = <T>(
  value: unknown,
  parser: Parser<T>,
  createError: (cause: Error, value: unknown) => Error,
): T => {
  try {
    return parser.parse(value);
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw createError(cause, value);
  }
};
