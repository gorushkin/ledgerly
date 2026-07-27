import { isDeepStrictEqual } from 'node:util';

import { expect } from 'vitest';

type CommonKey<T extends object, U extends object> = Extract<keyof T, keyof U>;

type CompareEntityArraysOptions<
  TExpected extends object,
  TActual extends object,
> = {
  exclude?: CommonKey<TExpected, TActual>[];
  fields?: CommonKey<TExpected, TActual>[];
};

const omitKeys = <T extends object>(
  obj: T,
  keysToOmit: (keyof T)[],
): Partial<T> => {
  const result: Partial<T> = { ...obj };
  keysToOmit.forEach((key) => {
    delete result[key];
  });
  return result;
};

const pickKeys = <T extends object, TKey extends keyof T>(
  obj: T,
  keys: TKey[],
): Pick<T, TKey> => {
  const result = {} as Pick<T, TKey>;

  keys.forEach((key) => {
    result[key] = obj[key];
  });

  return result;
};

const getCommonKeys = <TExpected extends object, TActual extends object>(
  expected: TExpected,
  actual: TActual,
): CommonKey<TExpected, TActual>[] => {
  return (Object.keys(expected) as CommonKey<TExpected, TActual>[]).filter(
    (key) => key in actual,
  );
};

const getComparableKeys = <TExpected extends object, TActual extends object>(
  expected: TExpected,
  actual: TActual,
  options: CompareEntityArraysOptions<TExpected, TActual>,
): CommonKey<TExpected, TActual>[] => {
  const keys = options.fields ?? getCommonKeys(expected, actual);
  const excludedKeys = new Set<CommonKey<TExpected, TActual>>(
    options.exclude ?? [],
  );

  return keys.filter((key) => !excludedKeys.has(key));
};

export const compareEntities = <T extends object>(
  before: T,
  after: T,
  keysToIgnore: (keyof T)[] = [],
) => {
  const beforeFiltered = omitKeys(before, keysToIgnore);
  const afterFiltered = omitKeys(after, keysToIgnore);

  expect(beforeFiltered).toEqual(afterFiltered);
};

export const compareCommonEntities = <T extends object, U extends object>(
  before: T,
  after: U,
  keysToIgnore: (keyof T & keyof U)[] = [],
) => {
  const commonKeys = (Object.keys(before) as (keyof T & keyof U)[]).filter(
    (key) => key in after && !keysToIgnore.includes(key),
  );

  commonKeys.forEach((key) => {
    expect(before[key]).toEqual(after[key as keyof U]);
  });
};

export const compareEntityArrays = <
  TExpected extends object,
  TActual extends object,
>(
  expectedItems: TExpected[],
  actualItems: TActual[],
  options: CompareEntityArraysOptions<TExpected, TActual> = {},
) => {
  expect(actualItems).toHaveLength(expectedItems.length);

  const matchedActualIndexes = new Set<number>();

  expectedItems.forEach((expectedItem) => {
    const matchedIndex = actualItems.findIndex((actualItem, actualIndex) => {
      if (matchedActualIndexes.has(actualIndex)) {
        return false;
      }

      const comparableKeys = getComparableKeys(
        expectedItem,
        actualItem,
        options,
      );

      if (comparableKeys.length === 0) {
        return false;
      }

      return isDeepStrictEqual(
        pickKeys(expectedItem, comparableKeys),
        pickKeys(actualItem, comparableKeys),
      );
    });

    expect(matchedIndex).not.toBe(-1);
    matchedActualIndexes.add(matchedIndex);
  });
};

export const getEntityDiff = <T extends object>(
  before: T,
  after: T,
  keysToIgnore: (keyof T)[] = [],
): Partial<T> => {
  const beforeFiltered = omitKeys(before, keysToIgnore);
  const afterFiltered = omitKeys(after, keysToIgnore);

  const diff: Partial<T> = {};
  (Object.keys(beforeFiltered) as (keyof T)[]).forEach((key) => {
    if (beforeFiltered[key] !== afterFiltered[key]) {
      diff[key] = afterFiltered[key];
    }
  });

  return diff;
};
