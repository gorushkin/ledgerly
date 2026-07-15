import { CommodityPrecisionNumber } from '@ledgerly/shared/types';

import {
  CommodityCode,
  EntityIdentity,
  EntityTimestamps,
  Id,
  Name,
  ParentChildRelation,
  SoftDelete,
  Timestamp,
} from '../domain-core';
import { DeletedEntityOperationError } from '../domain.errors';
import { User } from '../users/user.entity';

import { parseCommodityPrecision, parseCommoditySymbol } from './helpers';
import type { CommoditySnapshot, CommodityUpdateProps } from './types';

export class Commodity {
  static readonly entityType = 'commodity';
  private constructor(
    private readonly identity: EntityIdentity,
    private timestamps: EntityTimestamps,
    private softDelete: SoftDelete,
    private readonly ownership: ParentChildRelation,
    private code: CommodityCode,
    public symbol: string | null,
    public name: Name,
    private precision: CommodityPrecisionNumber,
  ) {}

  static create(
    user: User,
    name: Name,
    code: CommodityCode,
    precision = 2,
    symbol: string | null = null,
  ): Commodity {
    const identity = EntityIdentity.create();
    const softDelete = SoftDelete.create();
    const timestamps = EntityTimestamps.create();

    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const parsedCommoditySymbol = parseCommoditySymbol(symbol);
    const parsedCommodityPrecision = parseCommodityPrecision(precision);

    return new Commodity(
      identity,
      timestamps,
      softDelete,
      ownership,
      code,
      parsedCommoditySymbol,
      name,
      parsedCommodityPrecision, // use the provided precision value
    );
  }

  static restore(data: CommoditySnapshot): Commodity {
    const {
      code,
      createdAt,
      id,
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

  markAsDeleted(): void {
    this.softDelete = this.softDelete.markAsDeleted(
      new DeletedEntityOperationError(Commodity.entityType, 'delete'),
    );
    this.touch();
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
}
