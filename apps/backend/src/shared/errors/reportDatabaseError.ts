const reportedErrors = new WeakSet<Error>();

/**
 * Reports a database failure once, regardless of whether it is later handled
 * by an HTTP boundary or propagated to a background job or CLI command.
 */
export const reportDatabaseError = (error: Error): void => {
  if (process.env.NODE_ENV === 'test' || reportedErrors.has(error)) {
    return;
  }

  reportedErrors.add(error);
  console.error('Database error:', error);
};
