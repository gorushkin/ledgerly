import { LoginUserUseCase, RegisterUserUseCase } from 'src/application';
import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
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
import { DataBase } from 'src/types';

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

export type AppContainer = {
  db: DataBase;
  repositories: Repositories;
  services: Services;
  useCases: {
    account: AccountUseCases;
    auth: AuthUseCases;
  };
  controllers: Controllers;
};
