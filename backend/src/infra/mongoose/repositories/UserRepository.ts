import { User } from '../../../core/domain/entities/User';
import { IUserRepository } from '../../../core/application/ports/IUserRepository';
import { UserModel } from '../models/UserModel';

export class UserRepository implements IUserRepository {

   private toEntity(doc: any): User {
    return User.reconstitute({
    name:         doc.name,
    email:        doc.email,
    passwordHash: doc.passwordHash,
    googleId:     doc.googleId,
    authProvider: doc.authProvider ?? 'local',
    role:         doc.role,
    });
  }
 
  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email });
    if (!doc) return null;
    return this.toEntity(doc);
  }
 
  async findManyByEmail(emails: string[]): Promise<User[]> {
    const docs = await UserModel.find({ email: { $in: emails } });
    return docs.map(doc => this.toEntity(doc));
  }
 
  async save(user: User): Promise<void> {
  await UserModel.create({
    name:         user.name,
    email:        user.email,
    passwordHash: user.passwordHash,
    googleId:     user.googleId,
    authProvider: user.authProvider,
  });
}

async saveMany(users: User[]): Promise<void> {
  await UserModel.insertMany(
    users.map(user => ({
      name:         user.name,
      email:        user.email,
      passwordHash: user.passwordHash,
      googleId:     user.googleId,
      authProvider: user.authProvider,
    })),
    { ordered: false }
  );
}
  async linkGoogle(email: string, googleId: string): Promise<void> {
  await UserModel.updateOne(
    { email },
    { $set: { googleId, authProvider: 'both' } }
  );
}
}
 