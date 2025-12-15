import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

import { Account, Entry, User } from '..';
import {
  Id,
  Timestamp,
  Amount,
  EntityIdentity,
  EntityTimestamps,
  SoftDelete,
  ParentChildRelation,
} from '../domain-core';

export class Operation {
  private constructor(
    public readonly identity: EntityIdentity,
    public readonly timestamps: EntityTimestamps,
    public readonly softDelete: SoftDelete,
    public readonly ownership: ParentChildRelation,
    public readonly entryRelation: ParentChildRelation,
    public readonly accountRelation: ParentChildRelation,
    public readonly amount: Amount,
    public readonly description: string,
    public readonly isSystem: boolean,
  ) {}

  // TODO: replaces separated account parameters accountId and isSystem with whole Account entity
  static create(
    user: User,
    account: Account,
    entry: Entry,
    amount: Amount,
    description: string,
  ): Operation {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();

    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const entryRelation = ParentChildRelation.create(
      entry.getId(),
      identity.getId(),
    );

    const accountRelation = ParentChildRelation.create(
      account.id,
      identity.getId(),
    );

    return new Operation(
      identity,
      timestamps,
      softDelete,
      ownership,
      entryRelation,
      accountRelation,
      amount,
      description,
      account.isSystem,
    );
  }

  static fromPersistence(data: OperationDbRow): Operation {
    const {
      accountId,
      amount,
      createdAt,
      description,
      entryId,
      id,
      isSystem,
      isTombstone,
      updatedAt,
      userId,
    } = data;

    const identity = EntityIdentity.fromPersistence(Id.fromPersistence(id));

    const timestamps = EntityTimestamps.fromPersistence(
      Timestamp.restore(updatedAt),
      Timestamp.restore(createdAt),
    );
    const softDelete = SoftDelete.fromPersistence(isTombstone);

    const ownership = ParentChildRelation.create(
      Id.fromPersistence(userId),
      identity.getId(),
    );

    const entryRelation = ParentChildRelation.create(
      Id.fromPersistence(entryId),
      identity.getId(),
    );

    const accountRelation = ParentChildRelation.create(
      Id.fromPersistence(accountId),
      identity.getId(),
    );

    return new Operation(
      identity,
      timestamps,
      softDelete,
      ownership,
      entryRelation,
      accountRelation,
      Amount.fromPersistence(amount),
      description,
      isSystem,
    );
  }

  // Delegation methods for identity
  getId(): Id {
    return this.identity.getId();
  }

  // Delegation methods for timestamps
  getUpdatedAt(): Timestamp {
    return this.timestamps.getUpdatedAt();
  }

  getCreatedAt(): Timestamp {
    return this.timestamps.getCreatedAt();
  }

  // Delegation methods for ownership
  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  getUserId(): Id {
    return this.ownership.getParentId();
  }

  getAccountId(): Id {
    return this.accountRelation.getParentId();
  }

  belongsToAccount(account: Account): boolean {
    return this.accountRelation.belongsToParent(account.getId());
  }

  belongsToEntry(entry: Entry): boolean {
    return this.entryRelation.belongsToParent(entry.getId());
  }

  toPersistence(): OperationDbInsert {
    return {
      accountId: this.accountRelation.getParentId().valueOf(),
      amount: this.amount.valueOf(),
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      entryId: this.entryRelation.getParentId().valueOf(),
      id: this.id.valueOf(),
      isSystem: this.isSystem,
      isTombstone: this.softDelete.getIsTombstone(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.getUserId().valueOf(),
    };
  }

  get id(): Id {
    return this.identity.getId();
  }

  get entryId(): Id {
    return this.entryRelation.getParentId();
  }
}
