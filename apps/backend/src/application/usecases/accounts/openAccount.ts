import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import { Account, AccountSnapshot } from 'src/domain/accounts';
import { User } from 'src/domain/users/user.entity';

export class OpenAccountUseCase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    private readonly transactionManager: TransactionManagerInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
  ) {}

  async execute(user: User, accountId: UUID): Promise<AccountResponseDTO> {
    const accountSnapshot = await this.transactionManager.run(async () => {
      const accountData = await this.ensureOwnedSnapshot<AccountSnapshot>({
        entityId: accountId,
        entityType: Account.entityType,
        getOwnerId: (account) => account.userId,
        load: this.accountRepository.getById.bind(this.accountRepository),
        user,
      });
      const account = Account.restore(accountData);

      const result = account.open();

      if (result === 'changed') {
        await this.accountRepository.open(
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
