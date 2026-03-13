import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../../adapters/http/middlewares/auth';

const makeMockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeMockNext = (): NextFunction => jest.fn();

describe('authenticate middleware', () => {

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  it('deve chamar next() com token válido', () => {
    const token = jwt.sign(
      { email: 'alice@taskflow.io', role: 'member' },
      'test_secret',
      { expiresIn: '1d' }
    );

    const req  = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res  = makeMockResponse();
    const next = makeMockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user?.email).toBe('alice@taskflow.io');
    expect(req.user?.role).toBe('member');
  });

  it('deve retornar 401 sem header Authorization', () => {
    const req  = { headers: {} } as Request;
    const res  = makeMockResponse();
    const next = makeMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'TOKEN_MISSING' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 com token inválido', () => {
    const req  = { headers: { authorization: 'Bearer token_invalido' } } as Request;
    const res  = makeMockResponse();
    const next = makeMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'TOKEN_INVALID' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 com token expirado', () => {
    const token = jwt.sign(
      { email: 'alice@taskflow.io', role: 'member' },
      'test_secret',
      { expiresIn: '0s' }
    );

    const req  = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res  = makeMockResponse();
    const next = makeMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 sem Bearer no header', () => {
    const req  = { headers: { authorization: 'token_sem_bearer' } } as Request;
    const res  = makeMockResponse();
    const next = makeMockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

});