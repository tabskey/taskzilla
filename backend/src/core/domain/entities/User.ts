import { Result } from "../../shared/Results";
import { UserErrors } from "../errors/UserErrors";

export interface UserProps {
  name: string;
  email: string;
  passwordHash: string;
  role?:        'admin' | 'member';
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): Result<User> {

    if (!props.email.includes("@")) {
      return Result.fail(UserErrors.INVALID_EMAIL);
    }

    if (props.name.trim().length < 2) {
      return Result.fail(UserErrors.INVALID_NAME);
    }

    return Result.ok(new User(props));
  }

  get name():         string              { return this.props.name; }
  get email():        string              { return this.props.email; }
  get passwordHash(): string              { return this.props.passwordHash; }
  get role():         'admin' | 'member'  { return this.props.role ?? 'member'; }
}