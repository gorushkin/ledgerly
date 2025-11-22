import {
  InvalidPasswordError,
  UserNotFoundError,
} from 'src/application/application.errors';
import { UserResponseDTO } from 'src/application/dto';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';

export class LoginUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(email: string, password: string): Promise<UserResponseDTO> {
    const userWithPassword =
      await this.userRepository.getByEmailWithPassword(email);

    if (!userWithPassword) {
      throw new UserNotFoundError();
    }

    const user = User.fromPersistence(userWithPassword);

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new InvalidPasswordError();
    }

    return user.toResponseDTO();
  }
}
