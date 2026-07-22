import type { NextFunction, Request, Response } from 'express';
import { verifySession } from '../lib/jwt.js';
import { ApiError } from '../lib/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: 'ADMIN' | 'EMPLOYEE' };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) return next(ApiError.unauthorized());

  try {
    const payload = verifySession(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Session expired, please sign in again'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') return next(ApiError.forbidden('Admins only'));
  next();
}
