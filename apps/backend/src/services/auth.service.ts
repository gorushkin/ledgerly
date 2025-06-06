import { RegisterDto, UsersResponseDTO } from '@ledgerly/shared/types';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import {
  InvalidPasswordError,
  UserExistsError,
  UserNotFoundError,
} from 'src/presentation/errors/auth.errors';

import { comparePasswords, hashPassword } from '../utils/password.utils';

export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}
  async validateUser(
    email: string,
    password: string,
  ): Promise<UsersResponseDTO> {
    const userWithPassword =
      await this.usersRepository.findByEmailWithPassword(email);

    if (!userWithPassword) {
      throw new UserNotFoundError();
    }

    const isPasswordValid = await comparePasswords(
      password,
      userWithPassword.password,
    );

    if (!isPasswordValid) {
      throw new InvalidPasswordError();
    }

    const { password: _, ...userWithoutPassword } = userWithPassword;
    return userWithoutPassword;
  }

  async registerUser(data: RegisterDto): Promise<UsersResponseDTO> {
    const existingUser = await this.usersRepository.findByEmail(data.email);

    if (existingUser) {
      throw new UserExistsError();
    }
    const hashedPassword = await hashPassword(data.password);

    const user = await this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });

    return user;
  }
}
