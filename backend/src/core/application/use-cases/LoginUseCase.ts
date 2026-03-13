import bcrypt from 'bcrypt';
import { IUserRepository } from '../ports/IUserRepository';
import { IRefreshTokenRepository } from '../ports/IRefreshTokenRepository';
import { UserErrors } from '../../domain/errors/UserErrors';
import { Result } from '../../shared/Results';
import { GenerateTokensUseCase } from './RefreshTokenUseCase';

interface LoginDTO {
  email:    string;
  password: string;
}

interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  user: {
    name:  string;
    email: string;
    role:  string;
  };
}

export class LoginUseCase {

  constructor(
    private readonly userRepository:         IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(dto: LoginDTO): Promise<Result<LoginResponse>> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) return Result.fail(UserErrors.INVALID_CREDENTIALS);

    if (!user.passwordHash) return Result.fail(UserErrors.INVALID_CREDENTIALS);

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch)  return Result.fail(UserErrors.INVALID_CREDENTIALS);

    const generateTokens = new GenerateTokensUseCase(this.refreshTokenRepository);
    const tokensResult   = await generateTokens.execute(user.email, user.role);

    if (tokensResult.isFailure) return Result.fail(tokensResult.error!);

    return Result.ok({
      accessToken:  tokensResult.getValue().accessToken,
      refreshToken: tokensResult.getValue().refreshToken,
      user: {
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  }
}