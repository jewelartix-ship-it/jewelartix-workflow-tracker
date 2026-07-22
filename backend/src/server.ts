import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`API listening on port ${config.port} (${config.nodeEnv})`);
});
