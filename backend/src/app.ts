import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Populated by the Docker build (frontend's `dist` copied here). Absent in
// local dev, where Vite's own dev server serves the frontend instead.
const publicDir = path.join(__dirname, '..', 'public');

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, autoLogging: !config.isProduction ? { ignore: () => true } : true }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Defense in depth alongside SameSite=Strict cookies: a cross-site form post
  // can't set custom headers, so requiring one on every mutating request blocks
  // that class of CSRF even if a future browser ever loosens SameSite defaults.
  // Login is exempt since there's no session yet for it to forge.
  app.use('/api', (req, res, next) => {
    const mutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
    const exempt = req.path === '/auth/login';
    if (mutating && !exempt && !req.header('X-Requested-With')) {
      res.status(403).json({ error: { code: 'MISSING_CSRF_HEADER', message: 'Request rejected for security reasons.' } });
      return;
    }
    next();
  });

  app.use('/api', apiRouter);
  app.use('/api', notFoundHandler);

  if (existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  }

  app.use(errorHandler);

  return app;
}
