import { UserResponseDTO } from 'src/application/dto';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';
import { AuthErrors } from 'src/presentation/errors/auth.errors';

export class LoginUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(email: string, password: string): Promise<UserResponseDTO> {
    const userWithPassword =
      await this.userRepository.getByEmailWithPassword(email);

    if (!userWithPassword) {
      throw new AuthErrors.UserNotFoundError();
    }

    const user = User.fromPersistence(userWithPassword);

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new AuthErrors.InvalidPasswordError();
    }

    return user.toResponseDTO();
  }
}
