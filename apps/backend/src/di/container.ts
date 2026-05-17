import { LoginUserUseCase, RegisterUserUseCase } from 'src/application';
import { AccountFactory } from 'src/application/services';
import { TransactionContextLoader } from 'src/application/services/TransactionService';
import { ensureEntityExistsAndOwned } from 'src/application/shared/ensureEntityExistsAndOwned';
import { saveWithIdRetry } from 'src/application/shared/saveWithIdRetry';
import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { DeleteTransactionUseCase } from 'src/application/usecases/transaction/DeleteTransaction';
import { GetAllTransactionsUseCase } from 'src/application/usecases/transaction/GetAllTransactions';
import { GetTransactionByIdUseCase } from 'src/application/usecases/transaction/GetTransactionById';
import { UpdateTransactionUseCase } from 'src/application/usecases/transaction/UpdateTransaction';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import {
  TransactionRepository,
  TransactionQueryRepository,
  OperationRepository,
  CurrencyRepository,
  TransactionManager,
  AccountRepository,
  UserRepository,
} from 'src/infrastructure/db';
import {
  AuthController,
  AccountController,
  TransactionController,
} from 'src/interfaces/';
import { UserController } from 'src/presentation/controllers/user.controller';

import { AppContainer } from './types';

export const createContainer = (db: DataBase): AppContainer => {
  // Repositories
  const transactionManager = new TransactionManager(db);

  const accountRepository = new AccountRepository(transactionManager);
  const currencyRepository = new CurrencyRepository(transactionManager);
  const operationRepository = new OperationRepository(transactionManager);
  const transactionRepository = new TransactionRepository(
    operationRepository,
    transactionManager,
  );
  const transactionQueryRepository = new TransactionQueryRepository(
    transactionManager,
  );
  const userRepository = new UserRepository(transactionManager);

  // Mappers

  const repositories: AppContainer['repositories'] = {
    account: accountRepository,
    currency: currencyRepository,
    operation: operationRepository,
    transaction: transactionRepository,
    transactionQuery: transactionQueryRepository,
    user: userRepository,
  };

  // Services and Factories

  const accountFactory = new AccountFactory(accountRepository, saveWithIdRetry);

  const transactionContextLoader = new TransactionContextLoader(
    accountRepository,
  );

  const passwordManager = new PasswordManager();

  const services: AppContainer['services'] = {
    passwordManager,
  };

  // Create Account Use Cases
  const createAccountUseCase = new CreateAccountUseCase(accountFactory);
  const getAllAccountsUseCase = new GetAllAccountsUseCase(accountRepository);
  const getAccountByIdUseCase = new GetAccountByIdUseCase(accountRepository);
  const updateAccountUseCase = new UpdateAccountUseCase(accountRepository);
  const deleteAccountUseCase = new DeleteAccountUseCase(accountRepository);

  const loginUserUseCase = new LoginUserUseCase(userRepository);

  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    saveWithIdRetry,
  );

  const createTransactionUseCase = new CreateTransactionUseCase(
    transactionManager,
    transactionRepository,
    transactionContextLoader,
  );

  const getTransactionByIdUseCase = new GetTransactionByIdUseCase(
    transactionQueryRepository,
  );

  const getAllTransactionsUseCase = new GetAllTransactionsUseCase(
    transactionQueryRepository,
    accountRepository,
  );

  const updateTransactionUseCase = new UpdateTransactionUseCase(
    transactionManager,
    transactionRepository,
    ensureEntityExistsAndOwned,
    transactionContextLoader,
  );

  const deleteTransactionUseCase = new DeleteTransactionUseCase(
    transactionManager,
    transactionRepository,
    ensureEntityExistsAndOwned,
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
    transaction: {
      createTransaction: createTransactionUseCase,
      deleteTransaction: deleteTransactionUseCase,
      getAllTransactions: getAllTransactionsUseCase,
      getTransactionById: getTransactionByIdUseCase,
      updateTransaction: updateTransactionUseCase,
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

  const transactionController = new TransactionController(
    createTransactionUseCase,
    getTransactionByIdUseCase,
    getAllTransactionsUseCase,
    updateTransactionUseCase,
    deleteTransactionUseCase,
  );

  const controllers: AppContainer['controllers'] = {
    account: accountController,
    auth: authController,
    transaction: transactionController,
    user: userController,
  };

  const factories: AppContainer['factories'] = {
    account: accountFactory,
  };

  return {
    controllers,
    db,
    factories,
    repositories,
    services,
    useCases,
  };
};
