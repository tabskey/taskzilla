import { Request, Response, NextFunction } from 'express';

// remove chaves que começam com $ ou contém . — proteção contra NoSQL injection
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue;

    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function sanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}