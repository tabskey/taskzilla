import { Request, Response, NextFunction } from 'express';
import { HttpResponse } from '../helpers/HttpResponse';

// erros de domínio conhecidos e seus status HTTP
const domainErrorStatusMap: Record<string, number> = {
  // User
  INVALID_EMAIL:       400,
  INVALID_NAME:        400,
  INVALID_PASSWORD:    400,
  EMAIL_IN_USE:        409,
  USER_NOT_FOUND:      404,
  INVALID_CREDENTIALS: 401,

  // Group
  GROUP_NOT_FOUND:     404,
  NOT_GROUP_MEMBER:    403,
  NOT_GROUP_OWNER:     403,

  // Project
  PROJECT_NOT_FOUND:   404,
  NOT_PROJECT_MEMBER:  403,

  // Task
  TASK_NOT_FOUND:      404,
  NOT_TASK_OWNER:      403,
};

export class AppError extends Error {
  constructor(
    public readonly code:   string,
    public readonly status: number = 400,
  ) {
    super(code);
    this.name = 'AppError';
  }
}

export function globalErrorHandler(
  err:  Error,
  req:  Request,
  res:  Response,
  next: NextFunction
): void {
  // erro de domínio conhecido — AppError lançado explicitamente
  if (err instanceof AppError) {
    res.status(err.status).json({ success: false, error: err.code });
    return;
  }

  // erro de domínio pelo código — ex: throw new Error('TASK_NOT_FOUND')
  if (err.message && domainErrorStatusMap[err.message]) {
    const status = domainErrorStatusMap[err.message]!;
    res.status(status).json({ success: false, error: err.message });
    return;
  }

  // erro inesperado — não expõe detalhes em produção
  console.error('[GlobalErrorHandler]', err);

  HttpResponse.serverError(res);
}