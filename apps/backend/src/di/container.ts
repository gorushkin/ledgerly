import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { AccountController } from 'src/presentation/controllers/account.controller';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { CurrencyController } from 'src/presentation/controllers/currency.controller';
import { OperationController } from 'src/presentation/controllers/operation.controller';
import { TransactionController } from 'src/presentation/controllers/transaction.controller';
import { UserController } from 'src/presentation/controllers/user.controller';
import { AccountService } from 'src/services/account.service';
import { AuthService } from 'src/services/auth.service';
import { TransactionService } from 'src/services/transaction.service';
import { UserService } from 'src/services/user.service';
import { DataBase } from 'src/types';

import { AppContainer } from './types';

export const createContainer = (db: DataBase): AppContainer => {
  const operationRepository = new OperationRepository(db);
  const accountRepository = new AccountRepository(db);
  const currencyRepository = new CurrencyRepository(db);
  const transactionRepository = new TransactionRepository(db);
  const userRepository = new UsersRepository(db);

  const repositories: AppContainer['repositories'] = {
    account: accountRepository,
    currency: currencyRepository,
    operation: operationRepository,
    transaction: transactionRepository,
    user: userRepository,
  };

  const passwordManager = new PasswordManager();
  const authService = new AuthService(userRepository, passwordManager);
  const userService = new UserService(userRepository, passwordManager);
  const accountService = new AccountService(
    accountRepository,
    currencyRepository,
  );
  const transactionService = new TransactionService(
    transactionRepository,
    operationRepository,
    db,
  );

  const services: AppContainer['services'] = {
    account: accountService,
    auth: authService,
    passwordManager,
    transaction: transactionService,
    user: userService,
  };

  const accountController = new AccountController(services.account);
  const currencyController = new CurrencyController(repositories.currency);
  const operationController = new OperationController(
    operationRepository,
    currencyController,
    accountController,
  );

  const transactionController = new TransactionController(transactionService);
  const userController = new UserController(userService);
  const authController = new AuthController(authService);

  const controllers: AppContainer['controllers'] = {
    account: accountController,
    auth: authController,
    currency: currencyController,
    operation: operationController,
    transaction: transactionController,
    user: userController,
  };

  return {
    controllers,
    db,
    repositories,
    services,
  };
};
