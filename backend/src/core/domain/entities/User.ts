import { Result } from "../../shared/Results";
import { UserErrors } from "../errors/UserErrors";

export interface UserProps {
  name: string;
  email: string;
  passwordHash?: string;
  role?:        'admin' | 'member';
  authProvider:  'local' | 'google' | 'both'
  googleId?:     string
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

        if (props.authProvider === 'local' || !props.authProvider) {
      if (!props.passwordHash) {
        return Result.fail(UserErrors.INVALID_PASSWORD);
      }
    }

    return Result.ok(new User(props));
  }
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get name():         string                       { return this.props.name; }
  get email():        string                       { return this.props.email; }
  get passwordHash(): string | undefined           { return this.props.passwordHash; }
  get googleId():     string | undefined           { return this.props.googleId; }
  get authProvider(): 'local' | 'google' | 'both' { return this.props.authProvider ?? 'local'; }
  get role():         'admin' | 'member'           { return this.props.role ?? 'member'; }
}