import { CreateUserRequestDTO, UserResponseDTO } from 'src/application/dto';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { UserDbInsert } from 'src/db/schema';
import { Email, Name, Password } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';
import { AuthErrors } from 'src/presentation/errors/auth.errors';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

  async execute(request: CreateUserRequestDTO): Promise<UserResponseDTO> {
    const { email, name, password } = request;

    const existingUser = await this.userRepository.getByEmail(email);

    if (existingUser) {
      throw new AuthErrors.UserExistsError();
    }

    const nameVO = Name.create(name);
    const emailVO = Email.create(email);
    const passwordVO = await Password.create(password);

    const createUser = () => User.create(nameVO, emailVO, passwordVO);

    const user = await this.saveWithIdRetry<
      UserDbInsert,
      User,
      UserResponseDTO
    >(this.userRepository.create.bind(this.userRepository), createUser);

    return user.toResponseDTO();
  }
}
