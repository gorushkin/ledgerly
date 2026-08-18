import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';

export type UserProfileSnapshot = {
  email: string;
  id: UUID;
  name: string;
};

export type UserSnapshot = {
  createdAt: IsoDatetimeString;
  email: string;
  id: UUID;
  name: string;
  password: string;
  updatedAt: IsoDatetimeString;
};
