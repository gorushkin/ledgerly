import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';

export type UserProfileSnapshot = {
  email: string;
  id: UUID;
  name: string;
};

export type UserPrivateSnapshot = {
  createdAt: IsoDatetimeString;
  email: string;
  id: UUID;
  name: string;
  password: string;
  updatedAt: IsoDatetimeString;
};

export type UserSnapshot = UserPrivateSnapshot;
