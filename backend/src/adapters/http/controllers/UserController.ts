import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../../core/application/use-cases/CreateUserUseCase';
import { UserErrors } from '../../../core/domain/errors/UserErrors';

export class UserController {

  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async createUser(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;

    const result = await this.createUserUseCase.execute({ name, email, password });

    if (result.isFailure) {
      const statusMap: Record<string, number> = {
        [UserErrors.INVALID_NAME]:     400,
        [UserErrors.INVALID_EMAIL]:    400,
        [UserErrors.INVALID_PASSWORD]: 400,
        [UserErrors.EMAIL_IN_USE]:     409,
      };

      res.status(statusMap[result.error!] ?? 400).json({ error: result.error });
      return;
    }

    res.status(201).json(result.getValue());
  }
}