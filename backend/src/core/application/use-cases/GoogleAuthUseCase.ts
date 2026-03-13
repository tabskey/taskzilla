import jwt from 'jsonwebtoken';
import { IUserRepository } from '../ports/IUserRepository';
import { User } from '../../domain/entities/User';
import { Result } from '../../shared/Results';

interface GoogleAuthDTO {
  googleId: string;
  email:    string;
  name:     string;
}

interface GoogleAuthResponse {
  token: string;
  user: {
    name:         string;
    email:        string;
    role:         string;
    authProvider: string;
  };
}

export class GoogleAuthUseCase {

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: GoogleAuthDTO): Promise<Result<GoogleAuthResponse>> {
    const secret = process.env.JWT_SECRET;
    if (!secret) return Result.fail('JWT_SECRET_NOT_DEFINED');

    let user = await this.userRepository.findByEmail(dto.email);

    if (user) {
      // conta já existe — vincula o Google se ainda não estiver vinculado
      if (user.authProvider === 'local') {
        await this.userRepository.linkGoogle(dto.email, dto.googleId);
        // recria entidade com authProvider atualizado
        user = await this.userRepository.findByEmail(dto.email);
      }
    } else {
      // conta não existe — cria nova via Google
      const newUserResult = User.create({
        name:         dto.name,
        email:        dto.email,
        googleId:     dto.googleId,
        authProvider: 'google',
      });

      if (newUserResult.isFailure) {
        return Result.fail(newUserResult.error!);
      }

      await this.userRepository.save(newUserResult.getValue());
      user = await this.userRepository.findByEmail(dto.email);
    }

    if (!user) return Result.fail('USER_NOT_FOUND');

    const token = jwt.sign(
      { email: user.email, role: user.role },
      secret,
      { expiresIn: '1d' }
    );

    return Result.ok({
      token,
      user: {
        name:         user.name,
        email:        user.email,
        role:         user.role,
        authProvider: user.authProvider,
      },
    });
  }
}