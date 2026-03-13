import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../../../core/application/use-cases/LoginUseCase';
import { RefreshTokenUseCase, RevokeTokensUseCase } from '../../../core/application/use-cases/RefreshTokenUseCase';
import { UserErrors } from '../../../core/domain/errors/UserErrors';
import { LoginSchema } from '../schemas/LoginSchema';
import { HttpResponse } from '../helpers/HttpResponse';

export class AuthController {

  constructor(
    private readonly loginUseCase:        LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly revokeTokensUseCase: RevokeTokensUseCase,
  ) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = LoginSchema.safeParse(req.body);

      if (!parsed.success) {
        HttpResponse.validationError(res, parsed.error.issues.map(i => ({
          field:   i.path.join('.'),
          message: i.message,
        })));
        return;
      }

      const result = await this.loginUseCase.execute({
        email:    parsed.data.email,
        password: parsed.data.password,
      });

      if (result.isFailure) {
        if (result.error === UserErrors.INVALID_CREDENTIALS) {
          HttpResponse.unauthorized(res, result.error);
          return;
        }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.ok(res, result.getValue());
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        HttpResponse.badRequest(res, 'REFRESH_TOKEN_MISSING');
        return;
      }

      const result = await this.refreshTokenUseCase.execute(refreshToken);

      if (result.isFailure) {
        HttpResponse.unauthorized(res, result.error!);
        return;
      }

      HttpResponse.ok(res, result.getValue());
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = req.user!.email;
      await this.revokeTokensUseCase.execute(email);
      HttpResponse.ok(res, { message: 'Logout realizado com sucesso' });
    } catch (err) {
      next(err);
    }
  }
}