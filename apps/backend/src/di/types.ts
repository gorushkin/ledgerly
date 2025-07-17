import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { AccountController } from 'src/presentation/controllers/account.controller';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { CategoryController } from 'src/presentation/controllers/category.controller';
import { CurrencyController } from 'src/presentation/controllers/currency.controller';
import { OperationController } from 'src/presentation/controllers/operation.controller';
import { TransactionController } from 'src/presentation/controllers/transaction.controller';
import { UserController } from 'src/presentation/controllers/user.controller';
import { AccountService } from 'src/services/account.service';
import { AuthService } from 'src/services/auth.service';
import { CategoryService } from 'src/services/category.service';
import { TransactionService } from 'src/services/transaction.service';
import { UserService } from 'src/services/user.service';
import { DataBase } from 'src/types';

type Repositories = {
  category: CategoryRepository;
  currency: CurrencyRepository;
  transaction: TransactionRepository;
  account: AccountRepository;
  operation: OperationRepository;
  user: UsersRepository;
};

type Services = {
  auth: AuthService;
  user: UserService;
  passwordManager: PasswordManager;
  category: CategoryService;
  transaction: TransactionService;
  account: AccountService;
};

type Controllers = {
  category: CategoryController;
  currency: CurrencyController;
  transaction: TransactionController;
  account: AccountController;
  operation: OperationController;
  user: UserController;
  auth: AuthController;
};

export type AppContainer = {
  db: DataBase;
  repositories: Repositories;
  services: Services;
  controllers: Controllers;
};
