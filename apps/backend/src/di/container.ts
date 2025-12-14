import {
  LoginUserUseCase,
  RegisterUserUseCase,
  TransactionMapper,
} from 'src/application';
import {
  AccountFactory,
  EntriesService,
  OperationFactory,
} from 'src/application/services';
import {
  EntriesContextLoader,
  EntryCreator,
  EntryUpdater,
} from 'src/application/services/EntriesService';
import { ensureEntityExistsAndOwned } from 'src/application/shared/ensureEntityExistsAndOwned';
import { saveWithIdRetry } from 'src/application/shared/saveWithIdRetry';
import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { GetAllTransactionsUseCase } from 'src/application/usecases/transaction/GetAllTransactions';
import { GetTransactionByIdUseCase } from 'src/application/usecases/transaction/GetTransactionById';
import { UpdateTransactionUseCase } from 'src/application/usecases/transaction/UpdateTransaction';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { TransactionManager } from 'src/infrastructure/db';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { EntryRepository } from 'src/infrastructure/db/entries/entry.repository';
import { OperationRepository } from 'src/infrastructure/db/operations/operation.repository';
import { TransactionQueryRepository } from 'src/infrastructure/db/transaction/transaction-query.repository';
import { TransactionRepository } from 'src/infrastructure/db/transaction/transaction.repository';
import { UserRepository } from 'src/infrastructure/db/user/user.repository';
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
  const transactionRepository = new TransactionRepository(transactionManager);
  const transactionQueryRepository = new TransactionQueryRepository(
    transactionManager,
  );
  const userRepository = new UserRepository(transactionManager);
  const operationRepository = new OperationRepository(transactionManager);
  const entryRepository = new EntryRepository(transactionManager);

  // Mappers

  const transactionMapper = new TransactionMapper();

  const repositories: AppContainer['repositories'] = {
    account: accountRepository,
    currency: currencyRepository,
    entry: entryRepository,
    operation: operationRepository,
    transaction: transactionRepository,
    transactionQuery: transactionQueryRepository,
    user: userRepository,
  };

  // Services and Factories

  const accountFactory = new AccountFactory(accountRepository, saveWithIdRetry);

  const operationFactory = new OperationFactory(
    operationRepository,
    saveWithIdRetry,
  );

  const entriesContextLoader = new EntriesContextLoader(
    accountRepository,
    accountFactory,
  );

  const entryCreator = new EntryCreator(operationFactory, entryRepository);

  const entriesUpdater = new EntryUpdater(
    operationFactory,
    entryRepository,
    operationRepository,
    entryCreator,
  );

  const passwordManager = new PasswordManager();

  const entriesService = new EntriesService(
    entriesContextLoader,
    entryCreator,
    entriesUpdater,
  );

  const services: AppContainer['services'] = {
    entriesService,
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
    entriesService,
    saveWithIdRetry,
    transactionMapper,
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
    entriesService,
    ensureEntityExistsAndOwned,
    transactionMapper,
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
