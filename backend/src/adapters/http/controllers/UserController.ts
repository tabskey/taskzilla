import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../../core/application/use-cases/CreateUserUseCase';
import { UserErrors } from '../../../core/domain/errors/UserErrors';
import { CreateUserSchema } from '../schemas/CreateUserSchema';
import { HttpResponse } from '../helpers/HttpResponse';

export class UserController {

  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async createUser(req: Request, res: Response): Promise<void> {

    const parsed = CreateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      HttpResponse.validationError(res, parsed.error.issues.map(i => ({
        field:   i.path.join('.'),
        message: i.message,
      })));
      return;
    }

    const dto = {
      name:     parsed.data.name,
      email:    parsed.data.email,
      password: parsed.data.password,
    };

    // 3. executa o use case
    const result = await this.createUserUseCase.execute(dto);

    if (result.isFailure) {
      const conflictErrors = [UserErrors.EMAIL_IN_USE];

      if (conflictErrors.includes(result.error as any)) {
        HttpResponse.conflict(res, result.error!);
        return;
      }

      HttpResponse.badRequest(res, result.error!);
      return;
    }

    HttpResponse.created(res, result.getValue());
  }
}