import { describe, it, expect } from 'vitest';

import { Id } from '../../value-objects/Id';
import { EntityIdentity } from '../EntityIdentity';

describe('EntityIdentity', () => {
  it('should create a new EntityIdentity instance', () => {
    const identity = EntityIdentity.create();

    expect(identity).toBeInstanceOf(EntityIdentity);
    expect(identity.getId()).toBeInstanceOf(Id);
  });

  it('should create EntityIdentity with provided ID', () => {
    const id = Id.create();
    const identity = EntityIdentity.create(id);

    expect(identity.getId()).toBe(id);
  });

  it('should be immutable (Object.freeze)', () => {
    const identity = EntityIdentity.create();

    expect(Object.isFrozen(identity)).toBe(true);
  });

  it('should create new instance with different ID using withId', () => {
    const originalId = Id.create();
    const newId = Id.create();

    const original = EntityIdentity.create(originalId);
    const updated = original.withId(newId);

    // Original should remain unchanged
    expect(original.getId()).toBe(originalId);

    // New instance should have the new ID
    expect(updated.getId()).toBe(newId);

    // Should be different objects
    expect(original).not.toBe(updated);
  });

  it('should create different instances with different IDs by default', () => {
    const identity1 = EntityIdentity.create();
    const identity2 = EntityIdentity.create();

    expect(identity1).not.toBe(identity2);
    expect(identity1.getId()).not.toBe(identity2.getId());
    expect(identity1.getId().valueOf()).not.toBe(identity2.getId().valueOf());
  });

  it('withId should work with the same ID value', () => {
    const id = Id.create();
    const identity1 = EntityIdentity.create(id);
    const identity2 = identity1.withId(id);

    // Should be different instances even with same ID
    expect(identity1).not.toBe(identity2);
    expect(identity1.getId()).toBe(identity2.getId());
  });
});
