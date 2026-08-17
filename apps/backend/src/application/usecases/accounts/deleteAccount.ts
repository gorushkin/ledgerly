import { UUID } from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountOperationPolicy } from 'src/application/services';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import type { AccountSnapshot } from 'src/domain/accounts';
import { Account } from 'src/domain/accounts';
import { User } from 'src/domain/users/user.entity';

export class DeleteAccountUseCase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    private readonly accountOperationPolicy: AccountOperationPolicy,
    private readonly transactionManager: TransactionManagerInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
  ) {}

  async execute(user: User, accountId: UUID): Promise<void> {
    await this.transactionManager.run(async () => {
      const accountData = await this.ensureOwnedSnapshot<AccountSnapshot>({
        entityId: accountId,
        entityType: Account.entityType,
        getOwnerId: (account) => account.userId,
        load: this.accountRepository.getByIdForLifecycle.bind(
          this.accountRepository,
        ),
        user,
      });

      const account = Account.restore(accountData);

      if (account.isDeleted()) {
        return;
      }

      await this.accountOperationPolicy.assertNoActiveOperations(
        user.getId().valueOf(),
        accountId,
      );

      account.delete();

      await this.accountRepository.delete(
        user.getId().valueOf(),
        accountId,
        account.toSnapshot(),
      );
    });
  }
}
