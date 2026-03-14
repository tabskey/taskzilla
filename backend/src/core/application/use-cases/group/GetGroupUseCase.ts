import { IGroupRepository } from '../../ports/IGroupRepository';
import { GroupErrors } from '../../../domain/errors/GroupErrors';
import { Result } from '../../../shared/Results';

interface GroupResponse {
  id:          string;
  name:        string;
  description: string;
  isPublic:    boolean;
  members:     { userId: string; role: string; joinedAt: Date }[];
}

export class GetGroupUseCase {

  constructor(private readonly groupRepository: IGroupRepository) {}

  async execute(groupId: string, requesterEmail: string): Promise<Result<GroupResponse>> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) return Result.fail(GroupErrors.GROUP_NOT_FOUND);

    // grupo privado — só membros podem ver
    if (!group.isPublic && !group.isMember(requesterEmail)) {
      return Result.fail(GroupErrors.NOT_MEMBER);
    }

    return Result.ok({
      id:          group.id!,
      name:        group.name,
      description: group.description,
      isPublic:    group.isPublic,
      members:     group.members,
    });
  }
}

export class ListMyGroupsUseCase {

  constructor(private readonly groupRepository: IGroupRepository) {}

  async execute(userEmail: string): Promise<Result<GroupResponse[]>> {
    const groups = await this.groupRepository.findByMember(userEmail);

    return Result.ok(
      groups.map(group => ({
        id:          group.id!,
        name:        group.name,
        description: group.description,
        isPublic:    group.isPublic,
        members:     group.members,
      }))
    );
  }
}