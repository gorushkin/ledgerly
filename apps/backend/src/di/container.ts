import {
  GetAllCommoditiesUseCase,
  GetCommodityByIdUseCase,
  LoginUserUseCase,
  RegisterUserUseCase,
  CreateAccountUseCase,
  DeleteAccountUseCase,
  GetAccountByIdUseCase,
  GetAllAccountsUseCase,
  UpdateAccountUseCase,
  DeleteTransactionUseCase,
  GetAllTransactionsUseCase,
  GetTransactionByIdUseCase,
  UpdateTransactionUseCase,
  CreateTransactionUseCase,
  UpdateCommodityUseCase,
  ArchiveCommodityUseCase,
  CreateCommodityUseCase,
} from 'src/application';
import { AccountOperationPolicy } from 'src/application/services/AccountOperationPolicy/account-operation.policy';
import { TransactionContextLoader } from 'src/application/services/TransactionService';
import { ensureEntityExistsAndOwned } from 'src/application/shared/ensureEntityExistsAndOwned';
import { ensureOwnedSnapshot } from 'src/application/shared/ensureOwnedSnapshot';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import {
  TransactionRepository,
  TransactionQueryRepository,
  OperationRepository,
  TransactionManager,
  AccountRepository,
  UserRepository,
} from 'src/infrastructure/db';
import { CommodityRepository } from 'src/infrastructure/db';
import {
  AccountController,
  AuthController,
  CommodityController,
  TransactionController,
  UserController,
} from 'src/presentation/http';

import { AppContainer } from './types';

export const createContainer = (db: DataBase): AppContainer => {
  // Repositories
  const transactionManager = new TransactionManager(db);

  const accountRepository = new AccountRepository(transactionManager);
  const commodityRepository = new CommodityRepository(transactionManager);
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
    commodity: commodityRepository,
    operation: operationRepository,
    transaction: transactionRepository,
    transactionQuery: transactionQueryRepository,
    user: userRepository,
  };

  // Services and Factories

  const transactionContextLoader = new TransactionContextLoader(
    accountRepository,
  );

  const accountOperationPolicy = new AccountOperationPolicy(
    operationRepository,
  );

  const passwordManager = new PasswordManager();

  const services: AppContainer['services'] = {
    passwordManager,
  };

  // Create Account Use Cases
  const createAccountUseCase = new CreateAccountUseCase(
    accountRepository,
    transactionManager,
  );
  const getAllAccountsUseCase = new GetAllAccountsUseCase(accountRepository);
  const getAccountByIdUseCase = new GetAccountByIdUseCase(accountRepository);
  const updateAccountUseCase = new UpdateAccountUseCase(
    accountRepository,
    accountOperationPolicy,
  );
  const deleteAccountUseCase = new DeleteAccountUseCase(
    accountRepository,
    accountOperationPolicy,
  );

  const loginUserUseCase = new LoginUserUseCase(userRepository);

  const registerUserUseCase = new RegisterUserUseCase(userRepository);

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

  const getCommodityByIdUseCase = new GetCommodityByIdUseCase(
    commodityRepository,
  );

  const getAllCommoditiesUseCase = new GetAllCommoditiesUseCase(
    commodityRepository,
  );

  const updateCommodityUseCase = new UpdateCommodityUseCase(
    commodityRepository,
    ensureOwnedSnapshot,
  );

  const archiveCommodityUseCase = new ArchiveCommodityUseCase(
    commodityRepository,
    ensureOwnedSnapshot,
  );

  const createCommodityUseCase = new CreateCommodityUseCase(
    commodityRepository,
  );

  const commodityController = new CommodityController(
    getCommodityByIdUseCase,
    getAllCommoditiesUseCase,
    createCommodityUseCase,
    updateCommodityUseCase,
    archiveCommodityUseCase,
  );

  const useCases: AppContainer['useCases'] = {
    account: {
      createAccount: createAccountUseCase,
      deleteAccount: deleteAccountUseCase,
      getAccountById: getAccountByIdUseCase,
      getAllAccounts: getAllAccountsUseCase,
      updateAccount: updateAccountUseCase,
    },
    auth: {
      loginUser: loginUserUseCase,
      registerUser: registerUserUseCase,
    },
    commodity: {
      archiveCommodity: archiveCommodityUseCase,
      createCommodity: createCommodityUseCase,
      getAllCommodities: getAllCommoditiesUseCase,
      getCommodityById: getCommodityByIdUseCase,
      updateCommodity: updateCommodityUseCase,
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
    useCases.account.deleteAccount,
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
    commodity: commodityController,
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
