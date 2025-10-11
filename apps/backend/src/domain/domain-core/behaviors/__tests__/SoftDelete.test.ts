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

  it('markAsDeleted should return a new instance even for already deleted entity', () => {
    const deleted1 = SoftDelete.create().markAsDeleted();
    const deleted2 = deleted1.markAsDeleted();

    expect(deleted1).not.toBe(deleted2);
    expect(deleted1.isDeleted()).toBe(true);
    expect(deleted2.isDeleted()).toBe(true);
  });
});
