import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { AccountController } from 'src/presentation/controllers/account.controller';
import { CategoryController } from 'src/presentation/controllers/category.controller';
import { CurrencyController } from 'src/presentation/controllers/currency.controller';
import { OperationController } from 'src/presentation/controllers/operation.controller';
import { TransactionController } from 'src/presentation/controllers/transaction.controller';
import { DataBase } from 'src/types';

interface Repositories {
  category: CategoryRepository;
  currency: CurrencyRepository;
  transaction: TransactionRepository;
  account: AccountRepository;
  operation: OperationRepository;
}

interface Controllers {
  category: CategoryController;
  currency: CurrencyController;
  transaction: TransactionController;
  account: AccountController;
  operation: OperationController;
}

export interface AppContainer {
  db: DataBase;
  repositories: Repositories;
  controllers: Controllers;
}
