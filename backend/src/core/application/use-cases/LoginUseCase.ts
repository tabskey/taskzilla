import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { IUserRepository } from '../ports/IUserRepository';
import { UserErrors } from '../../domain/errors/UserErrors';
import { Result } from '../../shared/Results';

interface LoginDTO {
  email:    string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    name:  string;
    email: string;
    role:  string;
  };
}

export class LoginUseCase {

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: LoginDTO): Promise<Result<LoginResponse>> {
    // 1. busca o usuário pelo email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      return Result.fail(UserErrors.INVALID_CREDENTIALS);
    }

    // 2. valida a senha
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      return Result.fail(UserErrors.INVALID_CREDENTIALS);
    }

    // 3. gera o JWT
    const secret = process.env.JWT_SECRET!;
    const token  = jwt.sign(
      { email: user.email, role: user.role },
      secret,
      { expiresIn: '1d' }
    );

    return Result.ok({
      token,
      user: {
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  }
}