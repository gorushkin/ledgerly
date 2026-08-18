import {
  GetAllCommoditiesUseCase,
  GetCommodityByIdUseCase,
  LoginUserUseCase,
  RegisterUserUseCase,
  CloseAccountUseCase,
  CreateAccountUseCase,
  DeleteAccountUseCase,
  GetAccountByIdUseCase,
  GetAllAccountsUseCase,
  OpenAccountUseCase,
  UpdateAccountUseCase,
  DeleteTransactionUseCase,
  GetAllTransactionsUseCase,
  GetTransactionByIdUseCase,
  UpdateTransactionUseCase,
  CreateTransactionUseCase,
  UpdateCommodityUseCase,
  DeleteCommodityUseCase,
  CreateCommodityUseCase,
  CloseCommodityUseCase,
  OpenCommodityUseCase,
  GetCurrentUserUseCase,
  UpdateCurrentUserUseCase,
} from 'src/application';
import {
  AccountOperationPolicy,
  CommodityReferencePolicy,
  TransactionContextLoader,
} from 'src/application/services';
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

  const commodityReferencePolicy = new CommodityReferencePolicy(
    commodityRepository,
    accountRepository,
    transactionRepository,
  );

  const passwordManager = new PasswordManager();

  const services: AppContainer['services'] = {
    passwordManager,
  };

  // Create Account Use Cases
  const createAccountUseCase = new CreateAccountUseCase(
    accountRepository,
    transactionManager,
    commodityReferencePolicy,
  );
  const getAllAccountsUseCase = new GetAllAccountsUseCase(accountRepository);
  const getAccountByIdUseCase = new GetAccountByIdUseCase(
    accountRepository,
    ensureOwnedSnapshot,
  );
  const updateAccountUseCase = new UpdateAccountUseCase(
    accountRepository,
    accountOperationPolicy,
    transactionManager,
    ensureOwnedSnapshot,
  );
  const deleteAccountUseCase = new DeleteAccountUseCase(
    accountRepository,
    accountOperationPolicy,
    transactionManager,
    ensureOwnedSnapshot,
  );
  const closeAccountUseCase = new CloseAccountUseCase(
    accountRepository,
    transactionManager,
    ensureOwnedSnapshot,
  );
  const openAccountUseCase = new OpenAccountUseCase(
    accountRepository,
    transactionManager,
    ensureOwnedSnapshot,
  );

  const loginUserUseCase = new LoginUserUseCase(userRepository);

  const registerUserUseCase = new RegisterUserUseCase(userRepository);

  const getCurrentUserUseCase = new GetCurrentUserUseCase();
  const getUpdateCurrentUserUseCase = new UpdateCurrentUserUseCase(
    userRepository,
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

  const getCommodityByIdUseCase = new GetCommodityByIdUseCase(
    commodityRepository,
  );

  const getAllCommoditiesUseCase = new GetAllCommoditiesUseCase(
    commodityRepository,
  );

  const updateCommodityUseCase = new UpdateCommodityUseCase(
    commodityRepository,
    ensureOwnedSnapshot,
    transactionManager,
  );

  const deleteCommodityUseCase = new DeleteCommodityUseCase(
    commodityRepository,
    ensureOwnedSnapshot,
    commodityReferencePolicy,
    transactionManager,
  );

  const createCommodityUseCase = new CreateCommodityUseCase(
    commodityRepository,
  );

  const closeCommodityUseCase = new CloseCommodityUseCase(
    commodityRepository,
    ensureOwnedSnapshot,
    transactionManager,
  );

  const openCommodityUseCase = new OpenCommodityUseCase(
    commodityRepository,
    ensureOwnedSnapshot,
    transactionManager,
  );

  const commodityController = new CommodityController(
    getCommodityByIdUseCase,
    getAllCommoditiesUseCase,
    createCommodityUseCase,
    updateCommodityUseCase,
    deleteCommodityUseCase,
    closeCommodityUseCase,
    openCommodityUseCase,
  );

  const useCases: AppContainer['useCases'] = {
    account: {
      closeAccount: closeAccountUseCase,
      createAccount: createAccountUseCase,
      deleteAccount: deleteAccountUseCase,
      getAccountById: getAccountByIdUseCase,
      getAllAccounts: getAllAccountsUseCase,
      openAccount: openAccountUseCase,
      updateAccount: updateAccountUseCase,
    },
    auth: {
      loginUser: loginUserUseCase,
      registerUser: registerUserUseCase,
    },
    commodity: {
      closeCommodity: closeCommodityUseCase,
      createCommodity: createCommodityUseCase,
      deleteCommodity: deleteCommodityUseCase,
      getAllCommodities: getAllCommoditiesUseCase,
      getCommodityById: getCommodityByIdUseCase,
      openCommodity: openCommodityUseCase,
      updateCommodity: updateCommodityUseCase,
    },
    transaction: {
      createTransaction: createTransactionUseCase,
      deleteTransaction: deleteTransactionUseCase,
      getAllTransactions: getAllTransactionsUseCase,
      getTransactionById: getTransactionByIdUseCase,
      updateTransaction: updateTransactionUseCase,
    },
    user: {
      getCurrentUser: getCurrentUserUseCase,
      updateCurrentUser: getUpdateCurrentUserUseCase,
    },
  };

  const accountController = new AccountController(
    useCases.account.getAccountById,
    useCases.account.getAllAccounts,
    useCases.account.createAccount,
    useCases.account.updateAccount,
    useCases.account.deleteAccount,
    useCases.account.closeAccount,
    useCases.account.openAccount,
  );

  const userController = new UserController(
    getCurrentUserUseCase,
    getUpdateCurrentUserUseCase,
  );

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
