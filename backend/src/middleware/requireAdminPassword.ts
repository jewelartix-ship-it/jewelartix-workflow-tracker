import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';

// Two access levels, no user accounts: anyone with the link can view
// everything; editing (creating, updating, deleting tasks) requires the one
// shared admin password, sent as a plain header once the person has unlocked
// it in the browser (see AuthContext / api.ts on the frontend).
export function requireAdminPassword(req: Request, res: Response, next: NextFunction) {
  const provided = req.header('X-Admin-Password');
  if (provided !== config.adminPassword) {
    res.status(403).json({ error: { code: 'ADMIN_REQUIRED', message: 'Admin password required for this action.' } });
    return;
  }
  next();
}
