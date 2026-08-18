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
  CloseCommodityUseCase,
  OpenCommodityUseCase,
} from 'src/application';
import type {
  AccountRepositoryInterface,
  CommodityRepositoryInterface,
  OperationRepositoryInterface,
  TransactionQueryRepositoryInterface,
  TransactionRepositoryInterface,
  UserRepositoryInterface,
} from 'src/application/interfaces';
import { GetCurrentUserUseCase } from 'src/application/usecases/users/getCurrentUser';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import {
  AccountController,
  AuthController,
  TransactionController,
  CommodityController,
  UserController,
} from 'src/presentation/http';

type Repositories = {
  transaction: TransactionRepositoryInterface;
  commodity: CommodityRepositoryInterface;
  transactionQuery: TransactionQueryRepositoryInterface;
  account: AccountRepositoryInterface;
  user: UserRepositoryInterface;
  operation: OperationRepositoryInterface;
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
  closeCommodity: CloseCommodityUseCase;
  createCommodity: CreateCommodityUseCase;
  deleteCommodity: DeleteCommodityUseCase;
  getCommodityById: GetCommodityByIdUseCase;
  getAllCommodities: GetAllCommoditiesUseCase;
  openCommodity: OpenCommodityUseCase;
  updateCommodity: UpdateCommodityUseCase;
};

// TODO: check if we need UserUseCases and AuthUseCases to be separate or if we can merge them into one. For now, we keep them separate for clarity and future expansion.
type UserUseCases = {
  getCurrentUser: GetCurrentUserUseCase;
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
    user: UserUseCases;
  };
  controllers: Controllers;
};
