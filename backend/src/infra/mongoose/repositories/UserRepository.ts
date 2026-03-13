import { User } from '../../../core/domain/entities/User';
import { IUserRepository } from '../../../core/application/ports/IUserRepository';
import { UserModel } from '../models/UserModel';

export class UserRepository implements IUserRepository {

   private toEntity(doc: any): User {
    return User.create({
      name:         doc.name,
      email:        doc.email,
      passwordHash: doc.passwordHash,
      role:         doc.role,
    }).getValue();
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
    });
  }
 
  async saveMany(users: User[]): Promise<void> {
    await UserModel.insertMany(
      users.map(user => ({
        name:         user.name,
        email:        user.email,
        passwordHash: user.passwordHash,
      })),
      { ordered: false }
    );
  }
}
 