import {
  GetAllCommoditiesUseCase,
  GetCommodityByIdUseCase,
  LoginUserUseCase,
  RegisterUserUseCase,
  CreateAccountUseCase,
  CloseAccountUseCase,
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
} from 'src/application';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import {
  TransactionQueryRepository,
  AccountRepository,
  TransactionRepository,
  CommodityRepository,
  UserRepository,
  OperationRepository,
} from 'src/infrastructure/db';
import {
  AccountController,
  AuthController,
  TransactionController,
  CommodityController,
  UserController,
} from 'src/presentation/http';

type Repositories = {
  transaction: TransactionRepository;
  commodity: CommodityRepository;
  transactionQuery: TransactionQueryRepository;
  account: AccountRepository;
  user: UserRepository;
  operation: OperationRepository;
};

type Services = {
  passwordManager: PasswordManager;
};

type AccountUseCases = {
  closeAccount: CloseAccountUseCase;
  createAccount: CreateAccountUseCase;
  getAllAccounts: GetAllAccountsUseCase;
  getAccountById: GetAccountByIdUseCase;
  openAccount: OpenAccountUseCase;
  updateAccount: UpdateAccountUseCase;
  deleteAccount: DeleteAccountUseCase;
};

type AuthUseCases = {
  registerUser: RegisterUserUseCase;
  loginUser: LoginUserUseCase;
};

type TransactionUseCases = {
  createTransaction: CreateTransactionUseCase;
  getTransactionById: GetTransactionByIdUseCase;
  getAllTransactions: GetAllTransactionsUseCase;
  updateTransaction: UpdateTransactionUseCase;
  deleteTransaction: DeleteTransactionUseCase;
};

type CommodityUseCases = {
  getCommodityById: GetCommodityByIdUseCase;
  getAllCommodities: GetAllCommoditiesUseCase;
  updateCommodity: UpdateCommodityUseCase;
  deleteCommodity: DeleteCommodityUseCase;
  createCommodity: CreateCommodityUseCase;
};

type Controllers = {
  account: AccountController;
  user: UserController;
  auth: AuthController;
  transaction: TransactionController;
  commodity: CommodityController;
};

export type AppContainer = {
  db: DataBase;
  repositories: Repositories;
  services: Services;
  useCases: {
    account: AccountUseCases;
    auth: AuthUseCases;
    transaction: TransactionUseCases;
    commodity: CommodityUseCases;
  };
  controllers: Controllers;
};
