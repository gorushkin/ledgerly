import { AccountCreate, AccountResponse, UUID } from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';

export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly currencyRepository: CurrencyRepository,
  ) {}
  async getAll(userId: UUID): Promise<AccountResponse[]> {
    return this.accountRepository.getAll(userId);
  }

  // async validateAndGetCategory(
  //   userId: UUID,
  //   id: UUID,
  // ): Promise<CategoryResponse> {
  //   await this.userService.validateUser(userId);

  //   const category = await this.categoryRepository.getById(userId, id);

  //   if (!category) {
  //     throw new CategoryNotFoundError(
  //       `Category with id ${id} not found for user ${userId}`,
  //     );
  //   }

  //   return category;
  // }

  // async getById(userId: UUID, id: UUID): Promise<CategoryResponse | undefined> {
  //   return this.validateAndGetCategory(userId, id);
  // }

  async validateCurrency(currencyCode: string): Promise<void> {
    const currency = await this.currencyRepository.getById(currencyCode);

    if (!currency) {
      throw new Error(`Currency with code ${currencyCode} not found`);
    }
  }

  async create(requestBody: AccountCreate): Promise<AccountResponse> {
    await this.validateCurrency(requestBody.originalCurrency);

    return this.accountRepository.create(requestBody);
  }

  // async update(
  //   requestBody: CategoryUpdate,
  // ): Promise<CategoryResponse | undefined> {
  //   await this.validateAndGetCategory(requestBody.userId, requestBody.id);

  //   return this.categoryRepository.update(requestBody.userId, requestBody);
  // }

  // async delete(userId: UUID, id: UUID): Promise<CategoryResponse | undefined> {
  //   await this.validateAndGetCategory(userId, id);

  //   return this.categoryRepository.delete(userId, id);
  // }
}
