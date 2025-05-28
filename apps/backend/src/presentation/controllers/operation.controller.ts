import { OperationCreateDTO } from '@ledgerly/shared/types';
import { accountRepository } from 'src/infrastructure/db/AccountRepository';

import { BadRequestError, NotFoundError } from '../errors/httpErrors';

import { currencyController } from './currency.controller';

export class OperationController {
  async validateOperations(operations: OperationCreateDTO[]) {
    const totalSum = operations.reduce((sum, op) => sum + op.localAmount, 0);
    if (totalSum !== 0) {
      throw new BadRequestError('Сумма всех операций должна быть равна 0');
    }

    if (operations.length < 2) {
      throw new BadRequestError(
        'Транзакция должна содержать минимум 2 операции',
      );
    }

    for (const operation of operations) {
      await this.validateOperation(operation);
    }
  }

  private async validateOperation(operation: OperationCreateDTO) {
    const account = await accountRepository.getAccountById(operation.accountId);

    if (!account) {
      throw new NotFoundError(`Account ${operation.accountId} not found`);
    }

    const baseCurrency = await currencyController.getById(
      operation.baseCurrency,
    );

    if (!baseCurrency) {
      throw new NotFoundError(
        `Base currency ${operation.baseCurrency} not found`,
      );
    }

    const originalCurrency = await currencyController.getById(
      operation.originalCurrency,
    );

    if (!originalCurrency) {
      throw new NotFoundError(
        `Original currency ${operation.originalCurrency} not found`,
      );
    }

    if (operation.originalCurrency !== account.currencyCode) {
      throw new BadRequestError(
        `Currency mismatch: account ${account.id} uses ${account.currencyCode}, but operation uses ${operation.originalCurrency}`,
      );
    }
  }
}

export const operationController = new OperationController();
