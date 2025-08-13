import { AccountCreateDTO } from '@ledgerly/shared/types';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { TransactionService } from 'src/services/transaction.service';
import { UserService } from 'src/services/user.service';
import { describe, expect, it, vi } from 'vitest';

describe('TransactionService', () => {
  const transactionRepository = {
    getAll: vi.fn(),
  };

  const accountDataInsert: AccountCreateDTO = {
    initialBalance: 1000,
    name: 'Test Account',
    originalCurrency: 'USD',
    type: 'liability',
    userId: 'first-user-id',
  };

  const transactionService = new TransactionService(
    transactionRepository as unknown as TransactionRepository,
    {} as UserService, // Mock UserService if needed
  );

  describe('getAll', () => {
    it.todo(
      'should call the repository method with the correct user ID',
      async () => {
        const userId = accountDataInsert.userId;

        await transactionService.getAllByUserId(userId);

        expect(transactionRepository.getAll).toHaveBeenCalledWith(userId);
      },
    );
  });
});
