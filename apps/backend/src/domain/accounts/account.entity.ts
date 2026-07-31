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

type TransitionResult = 'changed' | 'unchanged';

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
    private isClosed: boolean,
    public isSystem: boolean,
  ) {}

  static create(user: User, props: CreateAccountProps): Account {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();

    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const commodityRelation = ParentChildRelation.create(
      props.commodityId,
      identity.getId(),
    );

    const isSystem = props.type.isSystemType();

    return new Account(
      identity,
      timestamps,
      softDelete,
      ownership,
      commodityRelation,
      props.name,
      props.description,
      props.initialBalance,
      Amount.create('0'),
      props.type,
      false,
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
      isClosed,
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
      isClosed,
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
  delete(): TransitionResult {
    if (this.isDeleted()) {
      return 'unchanged';
    }

    this.softDelete = this.softDelete.markAsDeleted(
      DeletedEntityOperationError.forDelete(Account.entityType),
    );

    this.touch();
    return 'changed';
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private validateUpdateIsAllowed(): void {
    this.softDelete.validateUpdateIsAllowed(
      DeletedEntityOperationError.forUpdate(Account.entityType),
    );
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
      isClosed: this.isClosed,
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

  close(): TransitionResult {
    this.validateUpdateIsAllowed();

    if (this.isClosed) {
      return 'unchanged';
    }

    this.isClosed = true;
    this.touch();
    return 'changed';
  }

  open(): TransitionResult {
    this.validateUpdateIsAllowed();

    if (!this.isClosed) {
      return 'unchanged';
    }

    this.isClosed = false;
    this.touch();
    return 'changed';
  }

  get closed(): boolean {
    return this.isClosed;
  }
}
