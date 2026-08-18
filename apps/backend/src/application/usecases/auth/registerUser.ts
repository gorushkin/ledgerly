import { UserCreateDTO, UserResponseDTO } from '@ledgerly/shared/types';
import type { UserRepositoryInterface } from 'src/application/interfaces';
import { mapRepositoryAlreadyExists } from 'src/application/shared/repositoryConflictMapper';
import { userRepositoryAlreadyExistsMappings } from 'src/application/shared/userRepositoryConflictMappings';
import { Email, Name, Password } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(request: UserCreateDTO): Promise<UserResponseDTO> {
    const { email, name, password } = request;

    const nameVO = Name.create(name);
    const emailVO = Email.create(email);
    const passwordVO = await Password.create(password);

    const user = User.create(nameVO, emailVO, passwordVO);

    return mapRepositoryAlreadyExists(
      () => this.userRepository.create(user),
      userRepositoryAlreadyExistsMappings,
    );
  }
}
