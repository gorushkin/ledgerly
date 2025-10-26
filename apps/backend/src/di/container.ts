import { LoginUserUseCase, RegisterUserUseCase } from 'src/application';
import { saveWithIdRetry } from 'src/application/shared/saveWithIdRetry';
import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { TransactionManager } from 'src/infrastructure/db';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { UserRepository } from 'src/infrastructure/db/UsersRepository';
import {
  AuthController,
  AccountController,
  TransactionController,
} from 'src/interfaces/';
import { UserController } from 'src/presentation/controllers/user.controller';

import { AppContainer } from './types';

export const createContainer = (db: DataBase): AppContainer => {
  const transactionManager = new TransactionManager(db);
  const accountRepository = new AccountRepository(db, transactionManager);
  const currencyRepository = new CurrencyRepository(db, transactionManager);
  const transactionRepository = new TransactionRepository(
    db,
    transactionManager,
  );
  const userRepository = new UserRepository(db, transactionManager);

  const repositories: AppContainer['repositories'] = {
    account: accountRepository,
    currency: currencyRepository,
    transaction: transactionRepository,
    user: userRepository,
  };

  const passwordManager = new PasswordManager();

  const services: AppContainer['services'] = {
    passwordManager,
  };

  // Create Account Use Cases
  const createAccountUseCase = new CreateAccountUseCase(
    accountRepository,
    saveWithIdRetry,
  );
  const getAllAccountsUseCase = new GetAllAccountsUseCase(accountRepository);
  const getAccountByIdUseCase = new GetAccountByIdUseCase(accountRepository);
  const updateAccountUseCase = new UpdateAccountUseCase(accountRepository);
  const deleteAccountUseCase = new DeleteAccountUseCase(accountRepository);

  const loginUserUseCase = new LoginUserUseCase(userRepository);

  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    saveWithIdRetry,
  );

  const useCases: AppContainer['useCases'] = {
    account: {
      archiveAccount: deleteAccountUseCase,
      createAccount: createAccountUseCase,
      getAccountById: getAccountByIdUseCase,
      getAllAccounts: getAllAccountsUseCase,
      updateAccount: updateAccountUseCase,
    },
    auth: {
      loginUser: loginUserUseCase,
      registerUser: registerUserUseCase,
    },
  };

  const accountController = new AccountController(
    useCases.account.getAccountById,
    useCases.account.getAllAccounts,
    useCases.account.createAccount,
    useCases.account.updateAccount,
    useCases.account.archiveAccount,
  );

  const userController = new UserController();
  const authController = new AuthController(
    registerUserUseCase,
    loginUserUseCase,
  );

  const transactionController = new TransactionController();

  const controllers: AppContainer['controllers'] = {
    account: accountController,
    auth: authController,
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
