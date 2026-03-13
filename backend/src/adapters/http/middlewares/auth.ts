import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpResponse } from '../helpers/HttpResponse';

export interface JwtPayload {
  email: string;
  role:  'admin' | 'member';
}

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    HttpResponse.unauthorized(res, 'TOKEN_MISSING');
    return;
  }

  const parts  = authHeader.split(' ');
  const token  = parts[1];
  const secret = process.env.JWT_SECRET;

  if (!token) {
    HttpResponse.unauthorized(res, 'TOKEN_MISSING');
    return;
  }

  if (!secret) {
    HttpResponse.serverError(res, 'JWT_SECRET_NOT_DEFINED');
    return;
  }

  try {
    const payload = jwt.verify(token, secret);

    if (typeof payload === 'string' || !('email' in payload)) {
      HttpResponse.unauthorized(res, 'TOKEN_INVALID');
      return;
    }

    req.user = { email: payload.email, role: payload.role };
    next();
  } catch {
    HttpResponse.unauthorized(res, 'TOKEN_INVALID');
  }
}