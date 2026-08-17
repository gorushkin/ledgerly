import {
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { AccountOperationPolicy } from 'src/application/services';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import { mapRepositoryAlreadyExists } from 'src/application/shared/repositoryConflictMapper';
import { Account, AccountSnapshot } from 'src/domain/accounts';
import { ClosedAccountOperationError } from 'src/domain/domain.errors';
import { User } from 'src/domain/users/user.entity';

export class UpdateAccountUseCase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    private readonly accountOperationPolicy: AccountOperationPolicy,
    private readonly transactionManager: TransactionManagerInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
  ) {}

  private async checkAccountUpdateValidity(
    user: User,
    accountId: UUID,
    account: Account,
    data: AccountUpdateDTO,
  ): Promise<void> {
    if (account.closed && data.type !== undefined) {
      throw ClosedAccountOperationError.forUpdate(accountId);
    }

    if (data.type && data.type !== account.toSnapshot().type) {
      await this.accountOperationPolicy.assertNoActiveOperations(
        user.getId().valueOf(),
        accountId,
      );
    }
  }

  async execute(
    user: User,
    accountId: UUID,
    data: AccountUpdateDTO,
  ): Promise<AccountResponseDTO> {
    const accountSnapshot = await this.transactionManager.run(async () => {
      const accountData = await this.ensureOwnedSnapshot<AccountSnapshot>({
        entityId: accountId,
        entityType: Account.entityType,
        getOwnerId: (account) => account.userId,
        load: this.accountRepository.getById.bind(this.accountRepository),
        user,
      });

      const account = Account.restore(accountData);
      await this.checkAccountUpdateValidity(user, accountId, account, data);

      account.update(AccountMapper.toUpdateProps(data));

      await mapRepositoryAlreadyExists(
        () =>
          this.accountRepository.update(
            user.getId().valueOf(),
            accountId,
            account.toSnapshot(),
          ),
        [
          {
            entityType: 'account',
            field: 'name',
            tableName: 'accounts',
          },
        ],
      );

      return account.toSnapshot();
    });

    return AccountMapper.toResponseDTOFromSnapshot(accountSnapshot);
  }
}
