import { Response } from 'express';

export const HttpResponse = {

  ok<T>(res: Response, data: T): void {
    res.status(200).json({ success: true, data });
  },

  created<T>(res: Response, data: T): void {
    res.status(201).json({ success: true, data });
  },

  badRequest(res: Response, error: string): void {
    res.status(400).json({ success: false, error });
  },

  unauthorized(res: Response, error: string = 'UNAUTHORIZED'): void {
    res.status(401).json({ success: false, error });
  },

  forbidden(res: Response, error: string = 'FORBIDDEN'): void {
    res.status(403).json({ success: false, error });
  },

  notFound(res: Response, error: string = 'NOT_FOUND'): void {
    res.status(404).json({ success: false, error });
  },

  conflict(res: Response, error: string): void {
    res.status(409).json({ success: false, error });
  },

  validationError(res: Response, errors: { field: string; message: string }[]): void {
    res.status(400).json({ success: false, errors });
  },

  serverError(res: Response, error: string = 'INTERNAL_SERVER_ERROR'): void {
    res.status(500).json({ success: false, error });
  },

};