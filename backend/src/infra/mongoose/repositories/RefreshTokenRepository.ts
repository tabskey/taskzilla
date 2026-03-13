import { IRefreshTokenRepository } from '../../../core/application/ports/IRefreshTokenRepository';
import { RefreshToken } from '../../../core/domain/entities/RefreshToken';
import { RefreshTokenModel } from '../models/RefreshTokenModel';
import { UserModel } from '../models/UserModel';

export class RefreshTokenRepository implements IRefreshTokenRepository {

  private async toEntity(doc: any): Promise<RefreshToken> {
    // busca email do usuário pelo ObjectId
    const user = await UserModel.findById(doc.user).select('email');
    return RefreshToken.reconstitute({
      token:     doc.token,
      userEmail: user?.email ?? '',
      expiresAt: doc.expiresAt,
      revoked:   doc.revoked,
    });
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    const user = await UserModel.findOne({ email: refreshToken.userEmail }).select('_id');
    if (!user) throw new Error('USER_NOT_FOUND');

    await RefreshTokenModel.create({
      token:     refreshToken.token,
      user:      user._id,
      expiresAt: refreshToken.expiresAt,
      revoked:   false,
    });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const doc = await RefreshTokenModel.findOne({ token });
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async revokeByToken(token: string): Promise<void> {
    await RefreshTokenModel.updateOne({ token }, { $set: { revoked: true } });
  }

  async revokeAllByUserEmail(userEmail: string): Promise<void> {
    const user = await UserModel.findOne({ email: userEmail }).select('_id');
    if (!user) return;
    await RefreshTokenModel.updateMany({ user: user._id }, { $set: { revoked: true } });
  }
}