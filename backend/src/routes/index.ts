import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { tasksRouter } from './tasks.routes.js';
import { usersRouter } from './users.routes.js';
import { auditRouter } from './audit.routes.js';
import { setupRouter } from './setup.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use(setupRouter);
