import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface SessionPayload {
  userId: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, config.jwtSecret) as SessionPayload;
}
