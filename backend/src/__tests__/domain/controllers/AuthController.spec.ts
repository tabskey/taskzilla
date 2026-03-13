import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../adapters/http/controllers/AuthController';
import { LoginUseCase } from '../../../core/application/use-cases/LoginUseCase';
import { UserErrors } from '../../../core/domain/errors/UserErrors';
import { Result } from '../../../core/shared/Results';

const makeMockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeMockRequest = (body = {}): Partial<Request> => ({ body });

const makeLoginUseCaseMock = (): jest.Mocked<LoginUseCase> =>
  ({ execute: jest.fn() } as any);

describe('AuthController', () => {

  describe('login()', () => {

    it('deve retornar 200 com token em credenciais válidas', async () => {
      const useCase = makeLoginUseCaseMock();
      const next = jest.fn() as NextFunction;

      useCase.execute.mockResolvedValue(
        Result.ok({
          token: 'jwt_token',
          user:  { name: 'Alice Costa', email: 'alice@taskflow.io', role: 'member' },
        })
      );

      const controller = new AuthController(useCase);
      const req        = makeMockRequest({ email: 'alice@taskflow.io', password: '123456' });
      const res        = makeMockResponse();

      await controller.login(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('deve retornar 400 com email inválido — falha no Zod', async () => {
      const useCase    = makeLoginUseCaseMock();
      const controller = new AuthController(useCase);
      const req        = makeMockRequest({ email: 'email-invalido', password: '123456' });
      const res        = makeMockResponse();
      const next = jest.fn() as NextFunction;

      await controller.login(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it('deve retornar 400 com senha vazia — falha no Zod', async () => {
      const useCase    = makeLoginUseCaseMock();
      const controller = new AuthController(useCase);
      const req        = makeMockRequest({ email: 'alice@taskflow.io', password: '' });
      const res        = makeMockResponse();
      const next = jest.fn() as NextFunction;

      await controller.login(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it('deve retornar 401 com credenciais inválidas', async () => {
      const useCase = makeLoginUseCaseMock();
      const next = jest.fn() as NextFunction;

      useCase.execute.mockResolvedValue(
        Result.fail(UserErrors.INVALID_CREDENTIALS)
      );

      const controller = new AuthController(useCase);
      const req        = makeMockRequest({ email: 'alice@taskflow.io', password: 'senha_errada' });
      const res        = makeMockResponse();

      await controller.login(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: UserErrors.INVALID_CREDENTIALS })
      );
    });

  });

});