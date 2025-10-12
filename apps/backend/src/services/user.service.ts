import {
  UsersUpdateDTO,
  UserChangePasswordDTO,
  UUID,
} from '@ledgerly/shared/types';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { UserRepository } from 'src/infrastructure/db/UsersRepository';
import { AuthErrors } from 'src/presentation/errors/auth.errors';

export class UserService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly passwordManager: PasswordManager,
  ) {}

  getById(id: UUID) {
    return this.validateUser(id);
  }

  validateUser(_id: UUID): Promise<UsersUpdateDTO> {
    // const existingUser = await this.usersRepository.getUserById(id);

    // if (!existingUser) {
    //   throw new AuthErrors.UserNotFoundError();
    // }

    // return existingUser;
    throw new Error('Not implemented');
  }

  async update(id: UUID, profileData: UsersUpdateDTO) {
    await this.validateUser(id);

    if (profileData?.email) {
      const existingUser = await this.usersRepository.getByEmail(
        profileData.email,
      );

      if (existingUser && existingUser.id !== id) {
        throw new AuthErrors.EmailAlreadyExistsError();
      }
    }

    return this.usersRepository.updateUserProfile(id, profileData);
  }

  changePassword(_id: UUID, _passwordData: UserChangePasswordDTO) {
    // const userWithPassword =
    //   await this.usersRepository.getUserByIdWithPassword(id);

    // if (!userWithPassword) {
    //   throw new AuthErrors.UserNotFoundError();
    // }

    // const isCurrentPasswordValid = await this.passwordManager.compare(
    //   passwordData.currentPassword,
    //   userWithPassword.hashedPassword,
    // );

    // if (!isCurrentPasswordValid) {
    //   throw new AuthErrors.InvalidPasswordError();
    // }

    // const hashedNewPassword = await this.passwordManager.hash(
    //   passwordData.newPassword,
    // );

    // await this.usersRepository.updateUserPassword(id, hashedNewPassword);

    throw new Error('Not implemented');
  }

  async delete(id: UUID) {
    await this.validateUser(id);

    return this.usersRepository.delete(id);
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
