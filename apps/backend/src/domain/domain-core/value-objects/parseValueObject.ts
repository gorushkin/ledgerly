type Parser<T> = {
  parse: (value: unknown) => T;
};

export const parseValueObject = <T>(
  value: unknown,
  parser: Parser<T>,
  createError: (value: unknown) => Error,
): T => {
  try {
    return parser.parse(value);
  } catch {
    throw createError(value);
  }
};
