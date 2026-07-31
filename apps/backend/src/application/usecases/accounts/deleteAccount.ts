import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { AccountOperationPolicy } from 'src/application/services';
import { Account } from 'src/domain/accounts';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class DeleteAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    private readonly accountOperationPolicy: AccountOperationPolicy,
    private readonly transactionManager: TransactionManagerInterface,
  ) {
    super(accountRepository);
  }

  async execute(user: User, accountId: UUID): Promise<AccountResponseDTO> {
    const accountSnapshot = await this.transactionManager.run(async () => {
      await this.accountOperationPolicy.assertNoActiveOperations(
        user.getId().valueOf(),
        accountId,
      );

      const accountData = await this.ensureAccountExistsAndOwned(
        user,
        accountId,
      );
      const account = Account.restore(accountData);

      const result = account.delete();

      if (result === 'changed') {
        await this.accountRepository.delete(
          user.getId().valueOf(),
          accountId,
          account.toSnapshot(),
        );
      }

      return account.toSnapshot();
    });

    return AccountMapper.toResponseDTOFromSnapshot(accountSnapshot);
  }
}
