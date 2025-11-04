import { LoginUserUseCase, RegisterUserUseCase } from 'src/application';
import { AccountFactory } from 'src/application/services';
import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
import { DataBase } from 'src/db';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
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

type Repositories = {
  currency: CurrencyRepository;
  transaction: TransactionRepository;
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
  };
  controllers: Controllers;
  factories: Factories;
};
