export async function withErrorHandling<T>(
  action: () => Promise<T>,
  errorMessage: string,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
}
