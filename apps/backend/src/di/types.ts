import { CreateAccountUseCase } from 'src/application/usecases/accounts/createAccount';
import { DeleteAccountUseCase } from 'src/application/usecases/accounts/deleteAccount';
import { GetAccountByIdUseCase } from 'src/application/usecases/accounts/getAccountById';
import { GetAllAccountsUseCase } from 'src/application/usecases/accounts/getAllAccounts';
import { UpdateAccountUseCase } from 'src/application/usecases/accounts/updateAccount';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { AccountController } from 'src/interfaces/accounts/account.controller';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { CurrencyController } from 'src/presentation/controllers/currency.controller';
import { TransactionController } from 'src/presentation/controllers/transaction.controller';
import { UserController } from 'src/presentation/controllers/user.controller';
import { AuthService } from 'src/services/auth.service';
import { TransactionService } from 'src/services/transaction.service';
import { UserService } from 'src/services/user.service';
import { DataBase } from 'src/types';

type Repositories = {
  currency: CurrencyRepository;
  transaction: TransactionRepository;
  account: AccountRepository;
  user: UsersRepository;
};

type Services = {
  auth: AuthService;
  user: UserService;
  passwordManager: PasswordManager;
  transaction: TransactionService;
};

type AccountUseCases = {
  createAccount: CreateAccountUseCase;
  getAllAccounts: GetAllAccountsUseCase;
  getAccountById: GetAccountByIdUseCase;
  updateAccount: UpdateAccountUseCase;
  archiveAccount: DeleteAccountUseCase;
};

type Controllers = {
  currency: CurrencyController;
  transaction: TransactionController;
  account: AccountController;
  user: UserController;
  auth: AuthController;
};

export type AppContainer = {
  db: DataBase;
  repositories: Repositories;
  services: Services;
  useCases: {
    account: AccountUseCases;
  };
  controllers: Controllers;
};
