import { OperationRepository } from 'src/infrastructure/db/OperationRepository';

import { AccountController } from '../../interfaces/accounts/account.controller';

import { CurrencyController } from './currency.controller';

export class OperationController {
  constructor(
    private readonly repo: OperationRepository,
    private readonly currencyController: CurrencyController,
    private readonly accountController: AccountController,
  ) {}

  // public async validateOperation(operation: OperationCreateDTO) {
  //   const account = await this.accountController.getById(operation.accountId);

  //   if (!account) {
  //     throw new NotFoundError(`Account ${operation.accountId} not found`);
  //   }
  // }
}
