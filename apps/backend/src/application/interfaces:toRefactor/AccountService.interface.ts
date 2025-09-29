import { UUID } from '@ledgerly/shared/types';

export type AccountService = {
  getById(userId: UUID, accountId: UUID): Promise<Account | null>;
  getAllByUserId(userId: UUID): Promise<Account[]>;
  exists(userId: UUID, accountId: UUID): Promise<boolean>;
};

export type Account = {
  id: UUID;
  userId: UUID;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  currency: string;
  balance: number;
  description?: string;
};
