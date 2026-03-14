import { Result } from '../../shared/Results';
import { GroupErrors } from '../errors/GroupErrors';

export interface GroupMember {
  userId:   string;
  role:     'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface GroupProps {
  id?:         string;
  name:        string;
  description?: string;
  isPublic:    boolean;
  members:     GroupMember[];
}

export class Group {
  private constructor(private readonly props: GroupProps) {}

  static create(props: GroupProps): Result<Group> {
    if (props.name.trim().length < 2) {
      return Result.fail(GroupErrors.INVALID_NAME);
    }

    if (props.members.length === 0) {
      return Result.fail(GroupErrors.NO_OWNER);
    }

    return Result.ok(new Group(props));
  }

  static reconstitute(props: GroupProps): Group {
    return new Group(props);
  }

  get id():          string | undefined { return this.props.id; }
  get name():        string             { return this.props.name; }
  get description(): string             { return this.props.description ?? ''; }
  get isPublic():    boolean            { return this.props.isPublic; }
  get members():     GroupMember[]      { return this.props.members; }

  getMember(userId: string): GroupMember | undefined {
    return this.props.members.find(m => m.userId === userId);
  }

  isOwner(userId: string): boolean {
    return this.getMember(userId)?.role === 'owner';
  }

  isAdmin(userId: string): boolean {
    const role = this.getMember(userId)?.role;
    return role === 'owner' || role === 'admin';
  }

  isMember(userId: string): boolean {
    return !!this.getMember(userId);
  }
}