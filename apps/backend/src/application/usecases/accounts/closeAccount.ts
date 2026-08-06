import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { Account } from 'src/domain/accounts';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class CloseAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    private readonly transactionManager: TransactionManagerInterface,
  ) {
    super(accountRepository);
  }

  async execute(user: User, accountId: UUID): Promise<AccountResponseDTO> {
    const accountSnapshot = await this.transactionManager.run(async () => {
      const accountData = await this.ensureAccountExistsAndOwned(
        user,
        accountId,
      );
      const account = Account.restore(accountData);

      const result = account.close();

      if (result === 'changed') {
        await this.accountRepository.close(
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
