import { LoginUserUseCase, RegisterUserUseCase } from 'src/application';
import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
import {
  DeleteTransactionUseCase,
  GetAllTransactionsUseCase,
} from 'src/application/usecases/transaction';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { GetTransactionByIdUseCase } from 'src/application/usecases/transaction/GetTransactionById';
import { UpdateTransactionUseCase } from 'src/application/usecases/transaction/UpdateTransaction';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import {
  TransactionQueryRepository,
  AccountRepository,
  CurrencyRepository,
  TransactionRepository,
  CommodityRepository,
  UserRepository,
} from 'src/infrastructure/db';
import {
  AccountController,
  AuthController,
  TransactionController,
  UserController,
} from 'src/presentation/http';

type Repositories = {
  currency: CurrencyRepository;
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

type Controllers = {
  account: AccountController;
  user: UserController;
  auth: AuthController;
  transaction: TransactionController;
};

export type AppContainer = {
  db: DataBase;
  repositories: Repositories;
  services: Services;
  useCases: {
    account: AccountUseCases;
    auth: AuthUseCases;
    transaction: TransactionUseCases;
  };
  controllers: Controllers;
};
