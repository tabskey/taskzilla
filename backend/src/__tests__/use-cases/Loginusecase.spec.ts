import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../adapters/http/controllers/AuthController';
import { LoginUseCase } from '../../core/application/use-cases/LoginUseCase';
import { RefreshTokenUseCase, RevokeTokensUseCase } from '../../core/application/use-cases/RefreshTokenUseCase';
import { UserErrors } from '../../core/domain/errors/UserErrors';
import { Result } from '../../core/shared/Results';

const makeMockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeMockRequest = (body = {}, user = {}): Partial<Request> => ({ body, user: user as any });
const makeMockNext    = (): NextFunction => jest.fn();

const makeLoginUseCaseMock        = (): jest.Mocked<LoginUseCase>        => ({ execute: jest.fn() } as any);
const makeRefreshTokenUseCaseMock = (): jest.Mocked<RefreshTokenUseCase> => ({ execute: jest.fn() } as any);
const makeRevokeTokensUseCaseMock = (): jest.Mocked<RevokeTokensUseCase> => ({ execute: jest.fn() } as any);

describe('AuthController', () => {

  describe('login()', () => {

    it('deve retornar 200 com accessToken e refreshToken em credenciais válidas', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();

      loginUseCase.execute.mockResolvedValue(
        Result.ok({
          accessToken:  'access_jwt',
          refreshToken: 'refresh_token',
          user:         { name: 'Alice Costa', email: 'alice@taskflow.io', role: 'member' },
        })
      );

      const controller = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);
      const req        = makeMockRequest({ email: 'alice@taskflow.io', password: '123456' });
      const res        = makeMockResponse();
      const next       = makeMockNext();

      await controller.login(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 com email inválido — falha no Zod', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();
      const controller          = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);

      const req  = makeMockRequest({ email: 'email-invalido', password: '123456' });
      const res  = makeMockResponse();
      const next = makeMockNext();

      await controller.login(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(loginUseCase.execute).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 com senha vazia — falha no Zod', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();
      const controller          = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);

      const req  = makeMockRequest({ email: 'alice@taskflow.io', password: '' });
      const res  = makeMockResponse();
      const next = makeMockNext();

      await controller.login(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(loginUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve retornar 401 com credenciais inválidas', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();

      loginUseCase.execute.mockResolvedValue(Result.fail(UserErrors.INVALID_CREDENTIALS));

      const controller = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);
      const req        = makeMockRequest({ email: 'alice@taskflow.io', password: 'senha_errada' });
      const res        = makeMockResponse();
      const next       = makeMockNext();

      await controller.login(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: UserErrors.INVALID_CREDENTIALS })
      );
    });

    it('deve chamar next com erro em caso de exceção inesperada', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();
      const error               = new Error('Erro inesperado');

      loginUseCase.execute.mockRejectedValue(error);

      const controller = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);
      const req        = makeMockRequest({ email: 'alice@taskflow.io', password: '123456' });
      const res        = makeMockResponse();
      const next       = makeMockNext();

      await controller.login(req as Request, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

  });

  describe('refresh()', () => {

    it('deve retornar 200 com novo par de tokens', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();

      refreshTokenUseCase.execute.mockResolvedValue(
        Result.ok({ accessToken: 'new_access', refreshToken: 'new_refresh' })
      );

      const controller = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);
      const req        = makeMockRequest({ refreshToken: 'valid_refresh_token' });
      const res        = makeMockResponse();
      const next       = makeMockNext();

      await controller.refresh(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('deve retornar 400 sem refreshToken no body', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();
      const controller          = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);

      const req  = makeMockRequest({});
      const res  = makeMockResponse();
      const next = makeMockNext();

      await controller.refresh(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(refreshTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve retornar 401 com token inválido', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();

      refreshTokenUseCase.execute.mockResolvedValue(Result.fail('REFRESH_TOKEN_REVOKED'));

      const controller = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);
      const req        = makeMockRequest({ refreshToken: 'revoked_token' });
      const res        = makeMockResponse();
      const next       = makeMockNext();

      await controller.refresh(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

  });

  describe('logout()', () => {

    it('deve retornar 200 e revogar todos os tokens', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();

      revokeTokensUseCase.execute.mockResolvedValue(Result.ok(undefined));

      const controller = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);
      const req        = makeMockRequest({}, { email: 'alice@taskflow.io', role: 'member' });
      const res        = makeMockResponse();
      const next       = makeMockNext();

      await controller.logout(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(revokeTokensUseCase.execute).toHaveBeenCalledWith('alice@taskflow.io');
    });

    it('deve chamar next com erro em caso de exceção inesperada', async () => {
      const loginUseCase        = makeLoginUseCaseMock();
      const refreshTokenUseCase = makeRefreshTokenUseCaseMock();
      const revokeTokensUseCase = makeRevokeTokensUseCaseMock();
      const error               = new Error('Erro inesperado');

      revokeTokensUseCase.execute.mockRejectedValue(error);

      const controller = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);
      const req        = makeMockRequest({}, { email: 'alice@taskflow.io' });
      const res        = makeMockResponse();
      const next       = makeMockNext();

      await controller.logout(req as Request, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

  });

});