import { UsersUpdate, PasswordChange, UUID } from '@ledgerly/shared/types';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import {
  UserNotFoundError,
  InvalidPasswordError,
  EmailAlreadyExistsError,
} from 'src/presentation/errors/auth.errors';

export class UserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordManager: PasswordManager,
  ) {}

  getById(id: UUID) {
    return this.validateUser(id);
  }

  async validateUser(id: UUID): Promise<UsersUpdate> {
    const existingUser = await this.usersRepository.getUserById(id);

    if (!existingUser) {
      throw new UserNotFoundError();
    }

    return existingUser;
  }

  async update(id: UUID, profileData: UsersUpdate) {
    await this.validateUser(id);

    if (profileData?.email) {
      const existingUser = await this.usersRepository.findByEmail(
        profileData.email,
      );

      if (existingUser && existingUser.id !== id) {
        throw new EmailAlreadyExistsError();
      }
    }

    return this.usersRepository.updateUserProfile(id, profileData);
  }

  async changePassword(id: UUID, passwordData: PasswordChange) {
    const userWithPassword =
      await this.usersRepository.getUserByIdWithPassword(id);

    if (!userWithPassword) {
      throw new UserNotFoundError();
    }

    const isCurrentPasswordValid = await this.passwordManager.compare(
      passwordData.currentPassword,
      userWithPassword.hashedPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidPasswordError();
    }

    const hashedNewPassword = await this.passwordManager.hash(
      passwordData.newPassword,
    );

    await this.usersRepository.updateUserPassword(id, hashedNewPassword);
  }

  async delete(id: UUID) {
    await this.validateUser(id);

    return this.usersRepository.deleteUser(id);
  }

  canDeleteUser(_userId: UUID): null {
    // TODO: add checking

    /*
    const reason = await userService.canDeleteUser(id);
    if (reason) {
      reply.code(400).send({ error: 'Cannot delete user', reason });
      return;
    }
    */

    return null;
  }
}
