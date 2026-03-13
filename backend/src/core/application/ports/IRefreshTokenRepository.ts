import { RefreshToken } from '../../domain/entities/RefreshToken';

export interface IRefreshTokenRepository {
  save(refreshToken: RefreshToken):        Promise<void>;
  findByToken(token: string):              Promise<RefreshToken | null>;
  revokeByToken(token: string):            Promise<void>;
  revokeAllByUserEmail(userEmail: string): Promise<void>;
}