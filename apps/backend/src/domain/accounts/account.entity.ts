import { Commodity } from '../commodities';
import {
  Amount,
  Id,
  Timestamp,
  Name,
  ParentChildRelation,
  EntityIdentity,
  EntityTimestamps,
  SoftDelete,
} from '../domain-core';
import { DeletedEntityOperationError } from '../domain.errors';
import { User } from '../users/user.entity';

import { AccountType } from './account-type.enum';
import {
  AccountSnapshot,
  AccountUpdateProps,
  CreateAccountProps,
} from './types';

export class Account {
  static readonly entityType = 'account';

  private constructor(
    private readonly identity: EntityIdentity,
    private timestamps: EntityTimestamps,
    private softDelete: SoftDelete,
    private readonly ownership: ParentChildRelation,
    private readonly commodityRelation: ParentChildRelation,
    public name: Name,
    public description: string,
    private initialBalance: Amount,
    private currentClearedBalanceLocal: Amount,
    private type: AccountType,
    public isSystem: boolean,
  ) {}

  static create(user: User, dto: CreateAccountProps): Account {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();

    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const commodityRelation = ParentChildRelation.create(
      dto.commodityId,
      identity.getId(),
    );

    const isSystem = dto.type.isSystemType();

    return new Account(
      identity,
      timestamps,
      softDelete,
      ownership,
      commodityRelation,
      dto.name,
      dto.description,
      dto.initialBalance,
      Amount.create('0'),
      dto.type,
      isSystem,
    );
  }

  static restore(data: AccountSnapshot): Account {
    const {
      commodityId,
      createdAt,
      currentClearedBalanceLocal,
      description,
      id,
      initialBalance,
      isSystem,
      isTombstone,
      name,
      type,
      updatedAt,
      userId,
    } = data;

    const identity = EntityIdentity.restore(Id.restore(id));

    const timestamps = EntityTimestamps.restore(
      Timestamp.restore(updatedAt),
      Timestamp.restore(createdAt),
    );

    const softDelete = SoftDelete.restore(isTombstone);

    const ownership = ParentChildRelation.create(
      Id.restore(userId),
      identity.getId(),
    );

    const commodityRelation = ParentChildRelation.create(
      Id.restore(commodityId),
      identity.getId(),
    );

    return new Account(
      identity,
      timestamps,
      softDelete,
      ownership,
      commodityRelation,
      Name.restore(name),
      description,
      Amount.restore(initialBalance),
      Amount.restore(currentClearedBalanceLocal),
      AccountType.restore(type),
      isSystem,
    );
  }

  // Delegation methods for identity
  // TODO: remove
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

  private touch(now?: Timestamp): void {
    this.timestamps = this.timestamps.touch(now);
  }

  // Delegation methods for soft delete
  markAsDeleted(): void {
    this.softDelete = this.softDelete.markAsDeleted(
      DeletedEntityOperationError.forDelete(Account.entityType),
    );
    this.touch();
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private validateUpdateIsAllowed(): void {
    this.softDelete.validateUpdateIsAllowed();
  }

  // Delegation methods for ownership
  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  toSnapshot(): AccountSnapshot {
    return {
      commodityId: this.commodityRelation.getParentId().valueOf(),
      createdAt: this.getCreatedAt().valueOf(),
      currentClearedBalanceLocal: this.currentClearedBalanceLocal.valueOf(),
      description: this.description,
      id: this.getId().valueOf(),
      initialBalance: this.initialBalance.valueOf(),
      isSystem: this.isSystem,
      isTombstone: this.softDelete.getIsTombstone(),
      name: this.name.valueOf(),
      type: this.type.valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.ownership.getParentId().valueOf(),
    };
  }

  getType(): AccountType {
    return this.type;
  }

  update(data: AccountUpdateProps): void {
    this.validateUpdateIsAllowed();

    const name = data.name ? Name.create(data.name) : this.name;

    this.description = data.description ?? this.description;
    this.type = data.type ? AccountType.create(data.type) : this.type;
    this.name = name;

    this.touch();
  }

  isCommoditySame(commodity: Commodity): boolean {
    return this.commodityRelation.getParentId().equals(commodity.getId());
  }
}
