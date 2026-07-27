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
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import {
  TransactionQueryRepository,
  AccountRepository,
  TransactionRepository,
  CommodityRepository,
  UserRepository,
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
};

type Services = {
  passwordManager: PasswordManager;
};

type AccountUseCases = {
  createAccount: CreateAccountUseCase;
  getAllAccounts: GetAllAccountsUseCase;
  getAccountById: GetAccountByIdUseCase;
  updateAccount: UpdateAccountUseCase;
  archiveAccount: DeleteAccountUseCase;
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
  archiveCommodity: ArchiveCommodityUseCase;
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
