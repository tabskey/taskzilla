import { Request, Response, NextFunction } from 'express';

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
    if (Array.isArray(req.body)) {
      req.body = req.body.map(item =>
        typeof item === 'object' && item !== null ? sanitizeObject(item) : item
      );
    } else {
      req.body = sanitizeObject(req.body);
    }
  }
  next();
}