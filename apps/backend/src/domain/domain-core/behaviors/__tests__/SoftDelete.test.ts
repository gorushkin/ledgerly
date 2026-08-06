import { describe, it, expect } from 'vitest';

import { SoftDelete } from '../SoftDelete';

describe('SoftDelete', () => {
  it('should create a new SoftDelete instance', () => {
    const softDelete = SoftDelete.create();

    expect(softDelete).toBeInstanceOf(SoftDelete);
    expect(softDelete.isDeleted()).toBe(false);
  });

  it('should be immutable when marked as deleted', () => {
    const original = SoftDelete.create();
    const deleted = original.markAsDeleted();

    // The original instance should remain unchanged
    expect(original.isDeleted()).toBe(false);

    // The new instance should be marked as deleted
    expect(deleted.isDeleted()).toBe(true);

    // These should be different objects
    expect(original).not.toBe(deleted);
  });

  it('should be frozen (Object.freeze)', () => {
    const softDelete = SoftDelete.create();

    expect(Object.isFrozen(softDelete)).toBe(true);
  });

  it('should work correctly with getIsTombstone', () => {
    const active = SoftDelete.create();
    const deleted = active.markAsDeleted();

    expect(active.getIsTombstone()).toBe(false);
    expect(deleted.getIsTombstone()).toBe(true);
  });

  it('should validate update allowance', () => {
    const active = SoftDelete.create();
    const deleted = active.markAsDeleted();

    // Active entity should allow updates
    expect(() => active.validateUpdateIsAllowed()).not.toThrow();

    // Deleted entity should forbid updates
    expect(() => deleted.validateUpdateIsAllowed()).toThrow(
      'Cannot update a deleted entity',
    );
  });

  it('should throw the provided error when update is forbidden', () => {
    const deleted = SoftDelete.create().markAsDeleted();
    const error = new Error('Custom update error');

    expect(() => deleted.validateUpdateIsAllowed(error)).toThrow(error);
  });

  it('markAsDeleted should reject an already deleted entity', () => {
    const deleted = SoftDelete.create().markAsDeleted();

    expect(() => deleted.markAsDeleted()).toThrow(
      SoftDelete.defaultDeleteError(),
    );
  });

  it('markAsDeleted should throw the provided error when deletion is forbidden', () => {
    const deleted = SoftDelete.create().markAsDeleted();
    const error = new Error('Custom delete error');

    expect(() => deleted.markAsDeleted(error)).toThrow(error);
  });
});
