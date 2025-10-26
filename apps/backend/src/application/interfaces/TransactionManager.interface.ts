// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TransactionContext = {
  // Контекст транзакции - пока пустой, можно расширить при необходимости
};

export type TransactionManagerInterface = {
  run<T>(callback: (context: TransactionContext) => Promise<T>): Promise<T>;
};
