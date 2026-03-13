import { IUserRepository } from '../ports/IUserRepository';
import { UserErrors } from '../../domain/errors/UserErrors';
import { Result } from '../../shared/Results';

interface GetMeResponse {
  name:  string;
  email: string;
  role:  string;
}

export class GetMeUseCase {

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(email: string): Promise<Result<GetMeResponse>> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return Result.fail(UserErrors.USER_NOT_FOUND);
    }

    return Result.ok({
      name:  user.name,
      email: user.email,
      role:  user.role,
    });
  }
}