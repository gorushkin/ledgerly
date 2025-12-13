import { expect } from 'vitest';

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

export const compareEntities = <T extends object>(
  before: T,
  after: T,
  keysToIgnore: (keyof T)[] = [],
) => {
  const beforeFiltered = omitKeys(before, keysToIgnore);
  const afterFiltered = omitKeys(after, keysToIgnore);

  expect(beforeFiltered).toEqual(afterFiltered);
};
