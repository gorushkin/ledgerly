// TODO: check all User and User types import/export and make sure they are consistent and correct. For example, we should not export User from domain/users/index.ts if it is already exported from domain/index.ts. We should also make sure that the types are consistent and correct across the application.
export { User } from './user.entity';
export type { UserProfileSnapshot, UserSnapshot } from './types';
