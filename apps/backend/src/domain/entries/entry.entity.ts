import {
  EntityIdentity,
  EntityTimestamps,
  Id,
  SoftDelete,
  ParentChildRelation,
} from '../domain-core';

export class Entry {
  private readonly identity: EntityIdentity;
  private readonly timestamps: EntityTimestamps;
  private readonly softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;
  private readonly transactionRelation: ParentChildRelation;

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: ParentChildRelation,
    transactionRelation: ParentChildRelation,
  ) {
    this.identity = identity;
    this.timestamps = timestamps;
    this.softDelete = softDelete;
    this.ownership = ownership;
    this.transactionRelation = transactionRelation;
  }

  getId(): Id {
    return this.identity.getId();
  }

  belongsToTransaction(transactionId: Id): boolean {
    return this.transactionRelation.belongsToParent(transactionId);
  }

  getTransactionId(): Id {
    return this.transactionRelation.getParentId();
  }
}
