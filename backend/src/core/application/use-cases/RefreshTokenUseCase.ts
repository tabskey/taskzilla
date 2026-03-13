import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUserRepository } from '../ports/IUserRepository';
import { IRefreshTokenRepository } from '../ports/IRefreshTokenRepository';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { Result } from '../../shared/Results';
import type { SignOptions } from 'jsonwebtoken';

const JWT_EXPIRES_IN     = (process.env.JWT_EXPIRES_IN     ?? '1h') as SignOptions['expiresIn'];
const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS ?? '30');

interface RefreshTokensResponse {
  accessToken:  string;
  refreshToken: string;
}

// gera par de tokens para um usuário autenticado
export class GenerateTokensUseCase {

  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(email: string, role: string): Promise<Result<RefreshTokensResponse>> {
    const secret = process.env.JWT_SECRET;
    if (!secret) return Result.fail('JWT_SECRET_NOT_DEFINED');

    // gera JWT de acesso (1 hora)
    const accessToken = jwt.sign({ email, role }, secret, { expiresIn: JWT_EXPIRES_IN });

    // gera refresh token aleatório
    const rawToken    = crypto.randomBytes(64).toString('hex');
    const expiresAt   = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    const refreshToken = RefreshToken.create({
      token:     rawToken,
      userEmail: email,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return Result.ok({ accessToken, refreshToken: rawToken });
  }
}

// valida refresh token e gera novo par de tokens
export class RefreshTokenUseCase {

  constructor(
    private readonly userRepository:         IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(token: string): Promise<Result<RefreshTokensResponse>> {
    const secret = process.env.JWT_SECRET;
    if (!secret) return Result.fail('JWT_SECRET_NOT_DEFINED');

    // busca o refresh token no banco
    const refreshToken = await this.refreshTokenRepository.findByToken(token);

    if (!refreshToken)          return Result.fail('REFRESH_TOKEN_NOT_FOUND');
    if (refreshToken.revoked)   return Result.fail('REFRESH_TOKEN_REVOKED');
    if (refreshToken.isExpired()) return Result.fail('REFRESH_TOKEN_EXPIRED');

    // busca o usuário vinculado
    const user = await this.userRepository.findByEmail(refreshToken.userEmail);
    if (!user) return Result.fail('USER_NOT_FOUND');

    // revoga o token atual — rotação de tokens
    await this.refreshTokenRepository.revokeByToken(token);

    // gera novo par
    const newAccessToken  = jwt.sign({ email: user.email, role: user.role }, secret, { expiresIn: JWT_EXPIRES_IN });
    const rawToken        = crypto.randomBytes(64).toString('hex');
    const expiresAt       = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    const newRefreshToken = RefreshToken.create({
      token:     rawToken,
      userEmail: user.email,
      expiresAt,
    });

    await this.refreshTokenRepository.save(newRefreshToken);

    return Result.ok({ accessToken: newAccessToken, refreshToken: rawToken });
  }
}

// revoga todos os tokens do usuário (logout)
export class RevokeTokensUseCase {

  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(userEmail: string): Promise<Result<void>> {
    await this.refreshTokenRepository.revokeAllByUserEmail(userEmail);
    return Result.ok(undefined);
  }
}