import {
  EntityIdentity,
  EntityTimestamps,
  SoftDelete,
  UserOwnership,
} from '../domain-core';

export class Entry {
  private readonly identity: EntityIdentity;
  private readonly timestamps: EntityTimestamps;
  private readonly softDelete: SoftDelete;
  private readonly ownership: UserOwnership;
  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: UserOwnership,
  ) {
    this.identity = identity;
    this.timestamps = timestamps;
    this.softDelete = softDelete;
    this.ownership = ownership;
  }
}
