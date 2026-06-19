import { describe, expect, it } from 'vitest';

import { Amount } from './Amount';

describe('Amount Value Object', () => {
  describe('create method', () => {
    it.each(['100', '-100', '0'])(
      'should create a valid integer minor-unit amount %s',
      (value) => {
        expect(Amount.create(value).valueOf()).toBe(value);
      },
    );

    it.each([
      ['NaN number', Number.NaN],
      ['positive infinity number', Infinity],
      ['negative infinity number', -Infinity],
      ['undefined', undefined],
      ['null', null],
      ['NaN string', 'NaN'],
      ['positive infinity string', 'Infinity'],
      ['empty string', ''],
      ['decimal string', '12.3'],
    ])('should reject invalid amount: %s', (_caseName, value) => {
      expect(() => Amount.create(value as string)).toThrow();
    });
  });

  describe('fromPersistence method', () => {
    it.each(['100', '-100', '0'])(
      'should restore a valid integer minor-unit amount %s',
      (value) => {
        expect(Amount.fromPersistence(value).valueOf()).toBe(value);
      },
    );

    it.each([
      ['NaN number', Number.NaN],
      ['positive infinity number', Infinity],
      ['negative infinity number', -Infinity],
      ['undefined', undefined],
      ['null', null],
      ['NaN string', 'NaN'],
      ['positive infinity string', 'Infinity'],
      ['empty string', ''],
      ['decimal string', '12.3'],
    ])('should reject invalid persisted amount: %s', (_caseName, value) => {
      expect(() => Amount.fromPersistence(value as string)).toThrow();
    });
  });

  describe('arithmetic', () => {
    it('should add amounts without mutating the source amounts', () => {
      const first = Amount.create('100');
      const second = Amount.create('50');
      const result = first.add(second);

      expect(result.valueOf()).toBe('150');
      expect(first.valueOf()).toBe('100');
      expect(second.valueOf()).toBe('50');
    });

    it('should subtract amounts without mutating the source amounts', () => {
      const first = Amount.create('100');
      const second = Amount.create('50');
      const result = first.subtract(second);

      expect(result.valueOf()).toBe('50');
      expect(first.valueOf()).toBe('100');
      expect(second.valueOf()).toBe('50');
    });

    it('should negate an amount without mutating the source amount', () => {
      const amount = Amount.create('100');
      const result = amount.negate();

      expect(result.valueOf()).toBe('-100');
      expect(amount.valueOf()).toBe('100');
    });
  });

  describe('comparison', () => {
    it('should compare amounts by value', () => {
      expect(Amount.create('100').equals(Amount.create('100'))).toBe(true);
      expect(Amount.create('100').equals(Amount.create('-100'))).toBe(false);
    });
  });

  describe('sign helpers', () => {
    it('should identify zero, positive, and negative amounts', () => {
      const zero = Amount.create('0');
      const positive = Amount.create('100');
      const negative = Amount.create('-100');

      expect(zero.isZero()).toBe(true);
      expect(zero.isPositive()).toBe(false);
      expect(zero.isNegative()).toBe(false);

      expect(positive.isZero()).toBe(false);
      expect(positive.isPositive()).toBe(true);
      expect(positive.isNegative()).toBe(false);

      expect(negative.isZero()).toBe(false);
      expect(negative.isPositive()).toBe(false);
      expect(negative.isNegative()).toBe(true);
    });
  });

  describe('serialization methods', () => {
    it('should serialize to a money string', () => {
      const amount = Amount.create('100');

      expect(amount.valueOf()).toBe('100');
      expect(amount.toPersistence()).toBe('100');
    });
  });
});
