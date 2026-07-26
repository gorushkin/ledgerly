import { describe, expect, it } from 'vitest';

import { compareEntityArrays } from './entityComparer';

describe('compareEntityArrays', () => {
  it('compares arrays by common fields and ignores actual extra fields', () => {
    const expected = [
      { code: 'USD', name: 'US Dollar' },
      { code: 'EUR', name: 'Euro' },
    ];

    const actual = [
      { code: 'EUR', id: 'eur-id', name: 'Euro' },
      { code: 'USD', id: 'usd-id', name: 'US Dollar' },
    ];

    compareEntityArrays(expected, actual);
  });

  it('compares only specified fields', () => {
    const expected = [
      { code: 'USD', name: 'Expected name' },
      { code: 'EUR', name: 'Expected name' },
    ];

    const actual = [
      { code: 'EUR', name: 'Actual name' },
      { code: 'USD', name: 'Actual name' },
    ];

    compareEntityArrays(expected, actual, { fields: ['code'] });
  });

  it('excludes selected fields from comparison', () => {
    const expected = [
      { code: 'USD', name: 'US Dollar', updatedAt: 'before' },
      { code: 'EUR', name: 'Euro', updatedAt: 'before' },
    ];

    const actual = [
      { code: 'EUR', name: 'Euro', updatedAt: 'after' },
      { code: 'USD', name: 'US Dollar', updatedAt: 'after' },
    ];

    compareEntityArrays(expected, actual, { exclude: ['updatedAt'] });
  });

  it('compares different object types by shared fields', () => {
    type ExpectedCommodity = {
      code: string;
      name: string;
    };

    type ActualCommodity = {
      code: string;
      id: string;
      name: string;
      userId: string;
    };

    const expected: ExpectedCommodity[] = [{ code: 'USD', name: 'US Dollar' }];
    const actual: ActualCommodity[] = [
      {
        code: 'USD',
        id: 'commodity-id',
        name: 'US Dollar',
        userId: 'user-id',
      },
    ];

    compareEntityArrays(expected, actual);
  });

  it('does not reuse the same actual item for multiple expected items', () => {
    const expected = [
      { code: 'USD', name: 'US Dollar' },
      { code: 'USD', name: 'US Dollar' },
    ];

    const actual = [
      { code: 'USD', name: 'US Dollar' },
      { code: 'EUR', name: 'Euro' },
    ];

    expect(() => compareEntityArrays(expected, actual)).toThrow();
  });
});
