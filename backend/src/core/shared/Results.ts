export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error?: string;
  private _value?: T;

  private constructor(isSuccess: boolean, error?: string, value?: T) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;
  }

  public get value(): T {
    if (!this.isSuccess) {
      throw new Error("Cannot get value of a failed result");
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