import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { AccountController } from 'src/presentation/controllers/account.controller';
import { CategoryController } from 'src/presentation/controllers/category.controller';
import { CurrencyController } from 'src/presentation/controllers/currency.controller';
import { OperationController } from 'src/presentation/controllers/operation.controller';
import { TransactionController } from 'src/presentation/controllers/transaction.controller';
import { UserController } from 'src/presentation/controllers/user.controller';
import { DataBase } from 'src/types';

import { AppContainer } from './types';

export const createContainer = (db: DataBase): AppContainer => {
  const operationRepository = new OperationRepository(db);
  const accountRepository = new AccountRepository(db);
  const categoryRepository = new CategoryRepository(db);
  const currencyRepository = new CurrencyRepository(db);
  const transactionRepository = new TransactionRepository(
    db,
    operationRepository,
  );

  const userRepository = new UsersRepository(db);

  const repositories: AppContainer['repositories'] = {
    account: accountRepository,
    category: categoryRepository,
    currency: currencyRepository,
    operation: operationRepository,
    transaction: transactionRepository,
    user: userRepository,
  };

  const accountController = new AccountController(repositories.account);

  const currencyController = new CurrencyController(repositories.currency);

  const categoryController = new CategoryController(repositories.category);

  const operationController = new OperationController(
    operationRepository,
    currencyController,
    accountController,
  );

  const transactionController = new TransactionController(
    repositories.transaction,
    operationController,
  );

  const userController = new UserController(userRepository);

  const controllers: AppContainer['controllers'] = {
    account: accountController,
    category: categoryController,
    currency: currencyController,
    operation: operationController,
    transaction: transactionController,
    user: userController,
  };

  return {
    controllers,
    db,
    repositories,
  };
};
