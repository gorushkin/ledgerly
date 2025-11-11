import { LoginUserUseCase, RegisterUserUseCase } from 'src/application';
import { AccountFactory } from 'src/application/services';
import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { GetTransactionByIdUseCase } from 'src/application/usecases/transaction/GetTransactionById';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { EntryRepository } from 'src/infrastructure/db/entries/entry.repository';
import { OperationRepository } from 'src/infrastructure/db/operations/operation.repository';
import { TransactionRepository } from 'src/infrastructure/db/transaction/transaction.repository';
import { UserRepository } from 'src/infrastructure/db/UsersRepository';
import {
  AuthController,
  AccountController,
  TransactionController,
} from 'src/interfaces/';
import { UserController } from 'src/presentation/controllers/user.controller';

type Repositories = {
  currency: CurrencyRepository;
  transaction: TransactionRepository;
  account: AccountRepository;
  user: UserRepository;
  operation: OperationRepository;
  entry: EntryRepository;
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
};

type Controllers = {
  account: AccountController;
  user: UserController;
  auth: AuthController;
  transaction: TransactionController;
};

type Factories = {
  account: AccountFactory;
  // operation: OperationFactory;
  // entry: EntryFactory;
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
  factories: Factories;
};
