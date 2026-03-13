import { User } from '../../domain/entities/User';

export interface IUserRepository {
  findByEmail(email: string):        Promise<User | null>;
  findManyByEmail(emails: string[]): Promise<User[]>;
  save(user: User):                  Promise<void>;
  saveMany(users: User[]):           Promise<void>;
}