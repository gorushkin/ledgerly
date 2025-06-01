import { OperationCreateDTO } from '@ledgerly/shared/types';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';

import { BadRequestError, NotFoundError } from '../errors/httpErrors';

import { AccountController } from './account.controller';
import { CurrencyController } from './currency.controller';

export class OperationController {
  constructor(
    private readonly repo: OperationRepository,
    private readonly currencyController: CurrencyController,
    private readonly accountController: AccountController,
  ) {}

  public async validateOperation(operation: OperationCreateDTO) {
    const account = await this.accountController.getById(operation.accountId);

    if (!account) {
      throw new NotFoundError(`Account ${operation.accountId} not found`);
    }

    const baseCurrency = await this.currencyController.getById(
      operation.baseCurrency,
    );

    if (!baseCurrency) {
      throw new NotFoundError(
        `Base currency ${operation.baseCurrency} not found`,
      );
    }

    const originalCurrency = await this.currencyController.getById(
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
