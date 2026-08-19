import { UserResponseDTO } from '@ledgerly/shared/types';
import {
  InvalidCredentialsError,
  UserNotFoundError,
} from 'src/application/application.errors';
import type { UserRepositoryInterface } from 'src/application/interfaces';
import { UserMapper } from 'src/application/mappers';

export class LoginUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(email: string, password: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.getByEmailWithPassword(email);

    if (!user) {
      throw new UserNotFoundError();
    }

    const isPasswordValid = await user.verifyPassword(password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    return UserMapper.toResponseDTOFromSnapshot(user.toSnapshot());
  }
}
