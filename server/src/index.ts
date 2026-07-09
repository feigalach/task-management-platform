import * as dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { AppDataSource } from './config/data-source';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    logger.info('Database connected');
    const app = createApp();
    app.listen(PORT, () => logger.info(`Server running`, { port: PORT }));
  })
  .catch((err) => {
    logger.error('Error during Data Source initialization', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
