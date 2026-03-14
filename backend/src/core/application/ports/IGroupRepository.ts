import { Group } from '../../domain/entities/Group';

export interface IGroupRepository {
  save(group: Group):                                    Promise<string>; // retorna o id gerado
  findById(id: string):                                  Promise<Group | null>;
  findByMember(userId: string):                          Promise<Group[]>;
  findPublic():                                          Promise<Group[]>;
  update(group: Group):                                  Promise<void>;
  delete(id: string):                                    Promise<void>;
  addMember(groupId: string, userId: string, role: 'owner' | 'admin' | 'member'): Promise<void>;
  removeMember(groupId: string, userId: string):         Promise<void>;
  updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member'):    Promise<void>;
}