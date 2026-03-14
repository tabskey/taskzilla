export interface GroupRequest {
  id:        string;
  groupId:   string;
  userId:    string;
  status:    'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface IGroupRequestRepository {
  save(groupId: string, userId: string):                          Promise<void>;
  findById(id: string):                                           Promise<GroupRequest | null>;
  findByGroupAndUser(groupId: string, userId: string):            Promise<GroupRequest | null>;
  findPendingByGroup(groupId: string):                            Promise<GroupRequest[]>;
  updateStatus(id: string, status: 'approved' | 'rejected'):      Promise<void>;
}