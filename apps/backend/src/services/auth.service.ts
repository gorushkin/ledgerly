import { RegisterDto, UsersResponseDTO } from '@ledgerly/shared/types';
import bcrypt from 'bcryptjs';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import {
  InvalidPasswordError,
  UserExistsError,
  UserNotFoundError,
} from 'src/presentation/errors/auth.errors';

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

    const isPasswordValid = await bcrypt.compare(
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
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });

    return user;
  }
}
