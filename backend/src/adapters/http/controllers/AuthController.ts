import { Request, Response } from 'express';
import { LoginUseCase } from '../../../core/application/use-cases/LoginUseCase';
import { UserErrors } from '../../../core/domain/errors/UserErrors';
import { LoginSchema } from '../schemas/LoginSchema';
import { HttpResponse } from '../helpers/HttpResponse';

export class AuthController {

  constructor(private readonly loginUseCase: LoginUseCase) {}

  async login(req: Request, res: Response): Promise<void> {
    const parsed = LoginSchema.safeParse(req.body);

    if (!parsed.success) {
      HttpResponse.validationError(res, parsed.error.issues.map(i => ({
        field:   i.path.join('.'),
        message: i.message,
      })));
      return;
    }

    const dto = {
      email:    parsed.data.email,
      password: parsed.data.password,
    };

    // 3. executa o use case
    const result = await this.loginUseCase.execute(dto);

    if (result.isFailure) {
      if (result.error === UserErrors.INVALID_CREDENTIALS) {
        HttpResponse.unauthorized(res, result.error);
        return;
      }

      HttpResponse.badRequest(res, result.error!);
      return;
    }

    HttpResponse.ok(res, result.getValue());
  }
}