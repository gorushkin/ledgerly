import { saveWithIdRetry } from 'src/application/shared/saveWithIdRetry';
import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { AccountController } from 'src/interfaces/accounts/account.controller';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { CurrencyController } from 'src/presentation/controllers/currency.controller';
import { TransactionController } from 'src/presentation/controllers/transaction.controller';
import { UserController } from 'src/presentation/controllers/user.controller';
import { AuthService } from 'src/services/auth.service';
import { TransactionService } from 'src/services/transaction.service';
import { UserService } from 'src/services/user.service';
import { DataBase } from 'src/types';

import { AppContainer } from './types';

export const createContainer = (db: DataBase): AppContainer => {
  const accountRepository = new AccountRepository(db);
  const currencyRepository = new CurrencyRepository(db);
  const transactionRepository = new TransactionRepository(db);
  const userRepository = new UsersRepository(db);

  const repositories: AppContainer['repositories'] = {
    account: accountRepository,
    currency: currencyRepository,
    transaction: transactionRepository,
    user: userRepository,
  };

  const passwordManager = new PasswordManager();
  const authService = new AuthService(userRepository, passwordManager);
  const userService = new UserService(userRepository, passwordManager);
  const transactionService = new TransactionService(
    transactionRepository,
    null as any, // TODO: Add OperationRepository when ready
    db,
  );

  const services: AppContainer['services'] = {
    auth: authService,
    passwordManager,
    transaction: transactionService,
    user: userService,
  };

  // Create Account Use Cases
  const createAccountUseCase = new CreateAccountUseCase(
    accountRepository,
    userRepository,
    saveWithIdRetry,
  );
  const getAllAccountsUseCase = new GetAllAccountsUseCase(
    accountRepository,
    userRepository,
  );
  const getAccountByIdUseCase = new GetAccountByIdUseCase(
    accountRepository,
    userRepository,
  );
  const updateAccountUseCase = new UpdateAccountUseCase(
    accountRepository,
    userRepository,
  );
  const deleteAccountUseCase = new DeleteAccountUseCase(
    accountRepository,
    userRepository,
  );

  const useCases: AppContainer['useCases'] = {
    account: {
      archiveAccount: deleteAccountUseCase,
      createAccount: createAccountUseCase,
      getAccountById: getAccountByIdUseCase,
      getAllAccounts: getAllAccountsUseCase,
      updateAccount: updateAccountUseCase,
    },
  };

  const accountController = new AccountController(
    useCases.account.getAccountById,
    useCases.account.getAllAccounts,
    useCases.account.createAccount,
    useCases.account.updateAccount,
    useCases.account.archiveAccount,
  );
  const currencyController = new CurrencyController(repositories.currency);

  const transactionController = new TransactionController(transactionService);
  const userController = new UserController(userService);
  const authController = new AuthController(authService);

  const controllers: AppContainer['controllers'] = {
    account: accountController,
    auth: authController,
    currency: currencyController,
    transaction: transactionController,
    user: userController,
  };

  return {
    controllers,
    db,
    repositories,
    services,
    useCases,
  };
};
