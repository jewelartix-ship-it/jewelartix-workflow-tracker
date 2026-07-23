import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { tasksRouter } from './tasks.routes.js';
import { usersRouter } from './users.routes.js';
import { auditRouter } from './audit.routes.js';
import { setupRouter } from './setup.routes.js';
import { requireViewPassword } from '../middleware/requireViewPassword.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
// The view password gates everything below — auth (where the password is
// itself submitted) and setup (its own token-based check) stay open.
apiRouter.use('/tasks', requireViewPassword, tasksRouter);
apiRouter.use('/users', requireViewPassword, usersRouter);
apiRouter.use('/audit', requireViewPassword, auditRouter);
apiRouter.use(setupRouter);
