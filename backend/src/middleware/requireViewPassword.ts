import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';

// Everyone, including plain viewers, needs this one shared password before
// they can see any task data at all — this is checked here on the API
// itself (not just hidden behind a popup in the browser), so someone can't
// bypass it by calling the API directly. Separate from the admin password,
// which only gates editing once you're already past this.
export function requireViewPassword(req: Request, res: Response, next: NextFunction) {
  const provided = req.header('X-View-Password');
  if (provided !== config.viewPassword) {
    res.status(403).json({ error: { code: 'VIEW_PASSWORD_REQUIRED', message: 'Password required to view this.' } });
    return;
  }
  next();
}
