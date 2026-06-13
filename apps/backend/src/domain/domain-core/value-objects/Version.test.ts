import { InvalidVersionError } from 'src/domain/domain.errors';
import { describe, expect, it } from 'vitest';

import { Version } from './Version';

describe('Version Value Object', () => {
  describe('create method', () => {
    it('should create a non-negative integer version', () => {
      expect(Version.create(0).valueOf()).toBe(0);
      expect(Version.create(42).valueOf()).toBe(42);
    });

    it.each([-1, 1.5, Number.NaN, Infinity, -Infinity])(
      'should reject invalid version %s',
      (value) => {
        expect(() => Version.create(value)).toThrow(InvalidVersionError);
      },
    );
  });

  describe('restore method', () => {
    it('should restore a valid version from persistence', () => {
      expect(Version.restore(3).valueOf()).toBe(3);
    });

    it('should reject an invalid persisted version', () => {
      expect(() => Version.restore(-1)).toThrow(InvalidVersionError);
    });
  });

  describe('immutability', () => {
    it('should freeze created and restored versions', () => {
      expect(Object.isFrozen(Version.create(1))).toBe(true);
      expect(Object.isFrozen(Version.restore(1))).toBe(true);
    });
  });

  describe('comparison', () => {
    it('should compare versions by value', () => {
      expect(Version.create(2).isEqualTo(Version.create(2))).toBe(true);
      expect(Version.create(2).isEqualTo(Version.create(3))).toBe(false);
    });
  });

  describe('increment method', () => {
    it('should return the next version without mutating the current version', () => {
      const current = Version.create(4);
      const next = current.increment();

      expect(current.valueOf()).toBe(4);
      expect(next.valueOf()).toBe(5);
      expect(next).not.toBe(current);
    });
  });

  describe('serialization methods', () => {
    it('should serialize to number and string', () => {
      const version = Version.create(7);

      expect(version.valueOf()).toBe(7);
      expect(version.toString()).toBe('7');
    });
  });
});
