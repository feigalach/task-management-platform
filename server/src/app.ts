import 'reflect-metadata';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';

export const createApp = () => {
  const app = express();
  app.use(
    morgan(':method :url :status :response-time ms', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    })
  );
  app.use(cors());
  app.use(express.json());
  app.use('/api', routes);
  app.use(errorHandler);
  return app;
}
