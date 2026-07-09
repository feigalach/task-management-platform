import { AppError } from '../errors/AppError';
import { DevelopmentHandler } from './DevelopmentHandler';
import { ProcurementHandler } from './ProcurementHandler';
import { ITaskTypeHandler } from './types';

/**
 * Central registry of task-type handlers (Strategy Pattern).
 *
 * TO ADD A NEW TASK TYPE (e.g. "marketing") IN THE FUTURE:
 *   1. Create MarketingHandler extends BaseTaskTypeHandler with its own
 *      `statuses` array.
 *   2. Add one line below: ['marketing', new MarketingHandler()]
 *
 * No other file (TaskService, controllers, routes, migrations) needs to
 * change.
 */
export class HandlerFactory {
  private static handlers: Map<string, ITaskTypeHandler> = new Map<string, ITaskTypeHandler>([
    ['procurement', new ProcurementHandler()],
    ['development', new DevelopmentHandler()],
  ]);

  static get(type: string): ITaskTypeHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      throw new AppError(400, `Unknown task type: "${type}"`);
    }
    return handler;
  }

  static getAll(): ITaskTypeHandler[] {
    return Array.from(this.handlers.values());
  }

  static getTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
