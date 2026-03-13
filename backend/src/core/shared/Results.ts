export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: string;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: string, value?: T) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error     = error;
    this._value    = value;
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Called getValue() on a failed Result. Error: ${this.error}`);
    }
    return this._value as T;
  }

  public static ok<T>(value: T): Result<T> {
    return new Result<T>(true, undefined, value);
  }

  public static fail<T>(error: string): Result<T> {
    return new Result<T>(false, error);
  }
}