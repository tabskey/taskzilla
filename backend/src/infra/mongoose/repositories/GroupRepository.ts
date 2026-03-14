import { IGroupRepository } from '../../../core/application/ports/IGroupRepository';
import { Group } from '../../../core/domain/entities/Group';
import { GroupErrors } from '../../../core/domain/errors/GroupErrors';
import { GroupModel } from '../models/GroupModel';
import { UserModel } from '../models/UserModel';

export class GroupRepository implements IGroupRepository {

  private async toEntity(doc: any): Promise<Group> {
    const members = await Promise.all(
      doc.members.map(async (m: any) => {
        const user = await UserModel.findById(m.user).select('email');
        return {
          userId:   user?.email ?? m.user.toString(),
          role:     m.role,
          joinedAt: m.joinedAt,
        };
      })
    );

    return Group.reconstitute({
      id:          doc._id.toString(),
      name:        doc.name,
      description: doc.description,
      isPublic:    doc.isPublic,
      members,
    });
  }

  async save(group: Group): Promise<string> {
  const owner = group.members[0];
  if (!owner) throw new Error(GroupErrors.NO_OWNER);
 
  const ownerUser = await UserModel.findOne({ email: owner.userId }).select('_id');
  if (!ownerUser) throw new Error('USER_NOT_FOUND');

  const doc = await GroupModel.create({
    name:        group.name,
    description: group.description,
    isPublic:    group.isPublic,
    members:     [{ user: ownerUser._id, role: 'owner', joinedAt: new Date() }],
  });

  return doc._id.toString();
}

  async findById(id: string): Promise<Group | null> {
    const doc = await GroupModel.findById(id);
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findByMember(userId: string): Promise<Group[]> {
    const user = await UserModel.findOne({ email: userId }).select('_id');
    if (!user) return [];

    const docs = await GroupModel.find({ 'members.user': user._id });
    return Promise.all(docs.map(doc => this.toEntity(doc)));
  }

  async findPublic(): Promise<Group[]> {
    const docs = await GroupModel.find({ isPublic: true });
    return Promise.all(docs.map(doc => this.toEntity(doc)));
  }

  async update(group: Group): Promise<void> {
    await GroupModel.updateOne(
      { _id: group.id },
      { $set: { name: group.name, description: group.description, isPublic: group.isPublic } }
    );
  }

  async delete(id: string): Promise<void> {
    await GroupModel.deleteOne({ _id: id });
  }

  async addMember(groupId: string, userId: string, role: 'owner' | 'admin' | 'member'): Promise<void> {
    const user = await UserModel.findOne({ email: userId }).select('_id');
    if (!user) throw new Error('USER_NOT_FOUND');

    await GroupModel.updateOne(
      { _id: groupId },
      { $push: { members: { user: user._id, role, joinedAt: new Date() } } }
    );
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const user = await UserModel.findOne({ email: userId }).select('_id');
    if (!user) return;

    await GroupModel.updateOne(
      { _id: groupId },
      { $pull: { members: { user: user._id } } }
    );
  }

  async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    const user = await UserModel.findOne({ email: userId }).select('_id');
    if (!user) return;

    await GroupModel.updateOne(
      { _id: groupId, 'members.user': user._id },
      { $set: { 'members.$.role': role } }
    );
  }
}