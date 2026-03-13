import { Request, Response, NextFunction } from 'express';
import { UserController } from '../../../adapters/http/controllers/UserController';
import { CreateUserUseCase } from '../../../core/application/use-cases/CreateUserUseCase';
import { GetMeUseCase } from '../../../core/application/use-cases/GetmeUseCase';
import { BulkCreateUserUseCase } from '../../../core/application/use-cases/BulkCreateUserUseCase';
import { UserErrors } from '../../../core/domain/errors/UserErrors';
import { Result } from '../../../core/shared/Results';

// factory de mocks do Request e Response do Express
const makeMockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const makeBulkCreateUserUseCaseMock = (): jest.Mocked<BulkCreateUserUseCase> =>
  ({ execute: jest.fn() } as any);

const makeMockRequest = (body = {}, user = {}): Partial<Request> => ({
  body,
  user: user as any,
});

// mocks dos use cases
const makeCreateUserUseCaseMock = (): jest.Mocked<CreateUserUseCase> =>
  ({ execute: jest.fn() } as any);

const makeGetMeUseCaseMock = (): jest.Mocked<GetMeUseCase> =>
  ({ execute: jest.fn() } as any);

describe('UserController', () => {

  describe('createUser()', () => {

    it('deve retornar 201 com dados válidos', async () => {
      const createUseCase = makeCreateUserUseCaseMock();
      const getMeUseCase  = makeGetMeUseCaseMock();
      const bulkUseCase = makeBulkCreateUserUseCaseMock();
      const next = jest.fn() as NextFunction;

      createUseCase.execute.mockResolvedValue(
        Result.ok({ name: 'Alice Costa', email: 'alice@taskflow.io' })
      );

      const controller = new UserController(createUseCase, getMeUseCase, bulkUseCase);
      const req        = makeMockRequest({ name: 'Alice Costa', email: 'alice@taskflow.io', password: '123456' });
      const res        = makeMockResponse();

      await controller.createUser(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('deve retornar 400 com email inválido — falha no Zod', async () => {
      const createUseCase = makeCreateUserUseCaseMock();
      const getMeUseCase  = makeGetMeUseCaseMock();
      const bulkUseCase = makeBulkCreateUserUseCaseMock();
      const next = jest.fn() as NextFunction;
      const controller    = new UserController(createUseCase, getMeUseCase, bulkUseCase);

      const req = makeMockRequest({ name: 'Alice Costa', email: 'email-invalido', password: '123456' });
      const res = makeMockResponse();

      await controller.createUser(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
      expect(createUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve retornar 400 com senha menor que 6 caracteres — falha no Zod', async () => {
      const createUseCase = makeCreateUserUseCaseMock();
      const getMeUseCase  = makeGetMeUseCaseMock();
      const bulkUseCase = makeBulkCreateUserUseCaseMock();
      const next = jest.fn() as NextFunction;
      const controller    = new UserController(createUseCase, getMeUseCase, bulkUseCase);

      const req = makeMockRequest({ name: 'Alice Costa', email: 'alice@taskflow.io', password: '123' });
      const res = makeMockResponse();

      await controller.createUser(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(createUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve retornar 409 quando email já está em uso', async () => {
        const bulkUseCase = makeBulkCreateUserUseCaseMock();
      const createUseCase = makeCreateUserUseCaseMock();
      const getMeUseCase  = makeGetMeUseCaseMock();
      const next = jest.fn() as NextFunction;

      createUseCase.execute.mockResolvedValue(
        Result.fail(UserErrors.EMAIL_IN_USE)
      );

      const controller = new UserController(createUseCase, getMeUseCase, bulkUseCase);
      const req        = makeMockRequest({ name: 'Alice Costa', email: 'alice@taskflow.io', password: '123456' });
      const res        = makeMockResponse();

      await controller.createUser(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: UserErrors.EMAIL_IN_USE })
      );
    });

    it('deve retornar 400 quando use case retorna erro de domínio', async () => {
      const createUseCase = makeCreateUserUseCaseMock();
      const getMeUseCase  = makeGetMeUseCaseMock();
      const next = jest.fn() as NextFunction;

      createUseCase.execute.mockResolvedValue(
        Result.fail(UserErrors.INVALID_NAME)
      );

      const bulkUseCase = makeBulkCreateUserUseCaseMock();
      const controller = new UserController(createUseCase, getMeUseCase, bulkUseCase);
      const req        = makeMockRequest({ name: 'A', email: 'alice@taskflow.io', password: '123456' });
      const res        = makeMockResponse();

      await controller.createUser(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

  });

  describe('getMe()', () => {

    it('deve retornar 200 com dados do usuário logado', async () => {
      const createUseCase = makeCreateUserUseCaseMock();
      const bulkUseCase = makeBulkCreateUserUseCaseMock();
      const getMeUseCase  = makeGetMeUseCaseMock();
      const next = jest.fn() as NextFunction;

      getMeUseCase.execute.mockResolvedValue(
        Result.ok({ name: 'Alice Costa', email: 'alice@taskflow.io', role: 'member' })
      );

      const controller = new UserController(createUseCase, getMeUseCase, bulkUseCase);
      const req        = makeMockRequest({}, { email: 'alice@taskflow.io', role: 'member' });
      const res        = makeMockResponse();

      await controller.getMe(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('deve retornar 404 quando usuário não encontrado', async () => {
      const createUseCase = makeCreateUserUseCaseMock();
      const getMeUseCase  = makeGetMeUseCaseMock();
      const bulkUseCase = makeBulkCreateUserUseCaseMock();
      const next = jest.fn() as NextFunction;

      getMeUseCase.execute.mockResolvedValue(
        Result.fail(UserErrors.USER_NOT_FOUND)
      );

      const controller = new UserController(createUseCase, getMeUseCase, bulkUseCase);
      const req        = makeMockRequest({}, { email: 'naoexiste@taskflow.io' });
      const res        = makeMockResponse();

      await controller.getMe(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

  });

});