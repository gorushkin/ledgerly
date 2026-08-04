import {
  CommodityPrecisionNumber,
  CommoditySymbolString,
} from '@ledgerly/shared/types';

import {
  CommodityCode,
  EntityIdentity,
  EntityTimestamps,
  Id,
  Name,
  ParentChildRelation,
  SoftDelete,
  Timestamp,
  TransitionResult,
} from '../domain-core';
import { DeletedEntityOperationError } from '../domain.errors';
import { User } from '../users/user.entity';

import { parseCommodityPrecision, parseCommoditySymbol } from './helpers';
import type {
  CommoditySnapshot,
  CommodityUpdateProps,
  CreateCommodityProps,
} from './types';

export class Commodity {
  static readonly entityType = 'commodity';
  private constructor(
    private readonly identity: EntityIdentity,
    private timestamps: EntityTimestamps,
    private softDelete: SoftDelete,
    private readonly ownership: ParentChildRelation,
    private code: CommodityCode,
    public symbol: CommoditySymbolString | null,
    public name: Name,
    private precision: CommodityPrecisionNumber,
    private isClosed: boolean,
  ) {}

  static readonly DEFAULT_PRECISION = 2;
  static readonly DEFAULT_SYMBOL = null;

  static create(user: User, props: CreateCommodityProps): Commodity {
    const identity = EntityIdentity.create();
    const softDelete = SoftDelete.create();
    const timestamps = EntityTimestamps.create();

    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const parsedCommoditySymbol = parseCommoditySymbol(
      props.symbol ?? Commodity.DEFAULT_SYMBOL,
    );
    const parsedCommodityPrecision = parseCommodityPrecision(
      props.precision ?? Commodity.DEFAULT_PRECISION,
    );

    return new Commodity(
      identity,
      timestamps,
      softDelete,
      ownership,
      CommodityCode.create(props.code),
      parsedCommoditySymbol,
      Name.create(props.name),
      parsedCommodityPrecision, // use the provided precision value
      false,
    );
  }

  static restore(data: CommoditySnapshot): Commodity {
    const {
      code,
      createdAt,
      id,
      isClosed,
      isTombstone,
      precision,
      symbol,
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

    const commodityCode = CommodityCode.restore(code);
    const commodityName = Name.restore(data.name);

    const parsedCommoditySymbol = parseCommoditySymbol(symbol);
    const parsedCommodityPrecision = parseCommodityPrecision(precision);

    return new Commodity(
      identity,
      timestamps,
      softDelete,
      ownership,
      commodityCode,
      parsedCommoditySymbol,
      commodityName,
      parsedCommodityPrecision,
      isClosed,
    );
  }

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

  delete(): TransitionResult {
    if (this.isDeleted()) {
      return 'unchanged';
    }

    this.softDelete = this.softDelete.markAsDeleted(
      new DeletedEntityOperationError(Commodity.entityType, 'delete'),
    );

    this.touch();
    return 'changed';
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private validateUpdateIsAllowed(): void {
    this.softDelete.validateUpdateIsAllowed(
      DeletedEntityOperationError.forUpdate(Commodity.entityType),
    );
  }

  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  getUserId(): Id {
    return this.ownership.getParentId();
  }

  toSnapshot(): CommoditySnapshot {
    return {
      code: this.code.valueOf(),
      createdAt: this.getCreatedAt().valueOf(),
      id: this.getId().valueOf(),
      isClosed: this.isClosed,
      isTombstone: this.softDelete.getIsTombstone(),
      name: this.name.valueOf(),
      precision: this.precision,
      symbol: this.symbol,
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.getUserId().valueOf(),
    };
  }

  update(data: CommodityUpdateProps): void {
    this.validateUpdateIsAllowed();

    let isUpdated = false;

    if (data.code !== undefined) {
      this.code = CommodityCode.create(data.code);
      isUpdated = true;
    }

    if (data.symbol !== undefined) {
      this.symbol = parseCommoditySymbol(data.symbol);
      isUpdated = true;
    }

    if (data.name !== undefined) {
      this.name = Name.create(data.name);
      isUpdated = true;
    }

    if (isUpdated) {
      this.touch();
    }
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
