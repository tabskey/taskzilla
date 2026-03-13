import { Request, Response, NextFunction } from 'express';
import { CreateUserUseCase } from '../../../core/application/use-cases/CreateUserUseCase';
import { GetMeUseCase } from '../../../core/application/use-cases/GetmeUseCase';
import { BulkCreateUserUseCase } from '../../../core/application/use-cases/BulkCreateUserUseCase';
import { UserErrors } from '../../../core/domain/errors/UserErrors';
import { CreateUserSchema } from '../schemas/CreateUserSchema';
import { BulkCreateUserSchema } from '../schemas/BulkCreateUserSchema';
import { HttpResponse } from '../helpers/HttpResponse';

export class UserController {

  constructor(
    private readonly createUserUseCase:     CreateUserUseCase,
    private readonly getMeUseCase:          GetMeUseCase,
    private readonly bulkCreateUserUseCase: BulkCreateUserUseCase,
  ) {}

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = CreateUserSchema.safeParse(req.body);

      if (!parsed.success) {
        HttpResponse.validationError(res, parsed.error.issues.map(i => ({
          field:   i.path.join('.'),
          message: i.message,
        })));
        return;
      }

      const result = await this.createUserUseCase.execute({
        name:     parsed.data.name,
        email:    parsed.data.email,
        password: parsed.data.password,
      });

      if (result.isFailure) {
        if (result.error === UserErrors.EMAIL_IN_USE) {
          HttpResponse.conflict(res, result.error);
          return;
        }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.created(res, result.getValue());
    } catch (err) {
      next(err);
    }
  }

  async bulkCreateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = BulkCreateUserSchema.safeParse(req.body);

      if (!parsed.success) {
        HttpResponse.validationError(res, parsed.error.issues.map(i => ({
          field:   i.path.join('.'),
          message: i.message,
        })));
        return;
      }

      const result = await this.bulkCreateUserUseCase.execute(parsed.data);

      if (result.isFailure) {
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.created(res, result.getValue());
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email  = req.user!.email;
      const result = await this.getMeUseCase.execute(email);

      if (result.isFailure) {
        HttpResponse.notFound(res, result.error!);
        return;
      }

      HttpResponse.ok(res, result.getValue());
    } catch (err) {
      next(err);
    }
  }
}