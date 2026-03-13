export interface RefreshTokenProps {
  token:     string;
  userEmail: string;
  expiresAt: Date;
  revoked?:  boolean;
}

export class RefreshToken {
  private constructor(private readonly props: RefreshTokenProps) {}

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  get token():     string  { return this.props.token; }
  get userEmail(): string  { return this.props.userEmail; }
  get expiresAt(): Date    { return this.props.expiresAt; }
  get revoked():   boolean { return this.props.revoked ?? false; }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }
}