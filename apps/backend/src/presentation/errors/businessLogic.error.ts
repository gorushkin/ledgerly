import { AppError } from './AppError';

export class BusinessLogicError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 400, cause);
  }
}

export class UnbalancedTransactionError extends BusinessLogicError {
  constructor(diff: number) {
    super(`Сумма операций не сбалансирована. Разница: ${diff}`);
  }
}
