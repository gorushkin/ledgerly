import { UserAlreadyExistsError } from 'src/application/application.errors';
import { CreateUserRequestDTO, UserResponseDTO } from 'src/application/dto';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { UserMapper } from 'src/application/mappers';
import { Email, Name, Password } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(request: CreateUserRequestDTO): Promise<UserResponseDTO> {
    const { email, name, password } = request;

    const existingUser = await this.userRepository.getByEmail(email);

    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const nameVO = Name.create(name);
    const emailVO = Email.create(email);
    const passwordVO = await Password.create(password);

    const user = User.create(nameVO, emailVO, passwordVO);

    await this.userRepository.create(user);

    return UserMapper.toResponseDTO(user);
  }
}
