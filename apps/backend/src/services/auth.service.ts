import { RegisterDto, UsersResponseDTO } from '@ledgerly/shared/types';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { AuthErrors } from 'src/presentation/errors/auth.errors';

export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordManager: PasswordManager,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UsersResponseDTO> {
    const userWithPassword =
      await this.usersRepository.getUserByEmailWithPassword(email);

    if (!userWithPassword) {
      throw new AuthErrors.UserNotFoundError();
    }

    const isPasswordValid = await this.passwordManager.compare(
      password,
      userWithPassword.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new AuthErrors.InvalidPasswordError();
    }
    const { hashedPassword: _, ...userWithoutPassword } = userWithPassword;
    return userWithoutPassword;
  }

  async registerUser(data: RegisterDto): Promise<UsersResponseDTO> {
    const existingUser = await this.usersRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AuthErrors.UserExistsError();
    }

    const hashedPassword = await this.passwordManager.hash(data.password);

    const user = await this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });

    return user;
  }
}
