import { RegisterDto, UsersResponseDTO } from '@ledgerly/shared/types';
import bcrypt from 'bcryptjs';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UsersResponseDTO> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    return user;
  }

  async registerUser(data: RegisterDto): Promise<UsersResponseDTO> {
    const existingUser = await this.usersRepository.findByEmail(data.email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });

    return user;
  }
}
