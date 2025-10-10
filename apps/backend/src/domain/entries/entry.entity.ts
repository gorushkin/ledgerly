import { BaseEntity, Id, IsoDatetimeString } from '../domain-core';
import { Operation } from '../operations/operation.entity';

export class Entry extends BaseEntity {
  private constructor(
    public readonly userId: Id,
    public readonly id: Id,
    public readonly operations: Operation[],
    public readonly createdAt: IsoDatetimeString,
    public updatedAt: IsoDatetimeString,
  ) {
    super(userId, id, updatedAt, createdAt);
  }
}
