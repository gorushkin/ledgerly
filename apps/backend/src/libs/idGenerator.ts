import { UUID } from '@ledgerly/shared/types';

export const generateId = (): UUID => {
  return crypto.randomUUID() as UUID;
};
