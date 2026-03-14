import { IGroupRequestRepository, GroupRequest } from '../../../core/application/ports/IGroupRequestRepository';
import { GroupRequestModel } from '../models/GroupRequestModel';
import { UserModel } from '../models/UserModel';

export class GroupRequestRepository implements IGroupRequestRepository {

  private toEntity(doc: any): GroupRequest {
    return {
      id:        doc._id.toString(),
      groupId:   doc.group.toString(),
      userId:    doc.user.toString(),
      status:    doc.status,
      createdAt: doc.createdAt,
    };
  }

  async save(groupId: string, userId: string): Promise<void> {
    const user = await UserModel.findOne({ email: userId }).select('_id');
    if (!user) throw new Error('USER_NOT_FOUND');

    await GroupRequestModel.create({ group: groupId, user: user._id });
  }

  async findById(id: string): Promise<GroupRequest | null> {
    const doc = await GroupRequestModel.findById(id);
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findByGroupAndUser(groupId: string, userId: string): Promise<GroupRequest | null> {
    const user = await UserModel.findOne({ email: userId }).select('_id');
    if (!user) return null;

    const doc = await GroupRequestModel.findOne({ group: groupId, user: user._id });
    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findPendingByGroup(groupId: string): Promise<GroupRequest[]> {
    const docs = await GroupRequestModel.find({ group: groupId, status: 'pending' });
    return docs.map(doc => this.toEntity(doc));
  }

  async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await GroupRequestModel.updateOne({ _id: id }, { $set: { status } });
  }
}