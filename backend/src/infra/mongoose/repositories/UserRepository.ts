import { User } from '../../../core/domain/entities/User';
import { IUserRepository } from '../../../core/application/ports/IUserRepository';
import { UserModel } from '../models/UserModel';

export class MongoUserRepository implements IUserRepository {

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email });
    if (!doc) return null;

    return User.create({
      name:         doc.name,
      email:        doc.email,
      passwordHash: doc.passwordHash,
    }).getValue();
  }

  async save(user: User): Promise<void> {
    await UserModel.create({
      name:         user.name,
      email:        user.email,
      passwordHash: user.passwordHash,
    });
  }
}