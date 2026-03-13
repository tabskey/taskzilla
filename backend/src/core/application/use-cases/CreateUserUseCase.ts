import bcrypt from 'bcrypt';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../ports/IUserRepository';
import { UserErrors } from '../../domain/errors/UserErrors';
import { Result } from '../../shared/Results';

interface CreateUserDTO {
  name:     string;
  email:    string;
  password: string;
}

interface CreateUserResponse {
  name:  string;
  email: string;
}

export class CreateUserUseCase {

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: CreateUserDTO): Promise<Result<CreateUserResponse>> {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const userOrError = User.create({
      name:  dto.name,
      email: dto.email,
      passwordHash,
    });

    if (userOrError.isFailure) {
      return Result.fail(userOrError.error!);
    }

    const user = userOrError.getValue();

    const existing = await this.userRepository.findByEmail(user.email);
    if (existing) {
      return Result.fail(UserErrors.EMAIL_IN_USE);
    }

    await this.userRepository.save(user);

    return Result.ok({
      name:  user.name,
      email: user.email,
    });
  }
}