import { UUID } from '@ledgerly/shared/types';
import { AccountHasActiveOperationsError } from 'src/application/application.errors';
import type { OperationRepositoryInterface } from 'src/application/interfaces';

export class AccountOperationPolicy {
  constructor(
    private readonly operationRepository: OperationRepositoryInterface,
  ) {}

  async assertNoActiveOperations(userId: UUID, accountId: UUID): Promise<void> {
    const hasActiveOperations =
      await this.operationRepository.existsActiveByAccountId(userId, accountId);

    if (hasActiveOperations) {
      throw new AccountHasActiveOperationsError(accountId);
    }
  }
}
