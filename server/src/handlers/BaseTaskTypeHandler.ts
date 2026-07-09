import { AppError } from '../errors/AppError';
import { ITaskTypeHandler, StatusDefinition } from './types';

/**
 * Houses ALL the behavior that is common to every task type, so concrete
 * handlers (ProcurementHandler, DevelopmentHandler, ...) only ever declare
 * DATA (their list of statuses + required fields per status) and never
 * repeat conditional logic.
 *
 * To support a brand new task type in the future, you create one new class
 * that extends this base and register it in HandlerFactory. Nothing else
 * in the codebase (TaskService, controllers, routes) needs to change.
 */
export abstract class BaseTaskTypeHandler implements ITaskTypeHandler {
  abstract readonly type: string;
  protected abstract statuses: StatusDefinition[];

  getStatuses(): StatusDefinition[] {
    return this.statuses;
  }

  getStatusDefinition(statusNumber: number): StatusDefinition | undefined {
    return this.statuses.find((s) => s.number === statusNumber);
  }

  isValidStatusNumber(statusNumber: number): boolean {
    return this.statuses.some((s) => s.number === statusNumber);
  }

  getFinalStatusNumber(): number {
    return Math.max(...this.statuses.map((s) => s.number));
  }

  getInitialStatusNumber(): number {
    return Math.min(...this.statuses.map((s) => s.number));
  }

  validateCustomFields(statusNumber: number, data: Record<string, any>): void {
    const statusDefinition = this.getStatusDefinition(statusNumber);
    if (!statusDefinition) {
      throw new AppError(400, `Invalid status ${statusNumber} for task type "${this.type}"`);
    }

    for (const field of statusDefinition.requiredFields) {
      const value = data ? data[field.key] : undefined;

      if (field.type === 'string') {
        if (typeof value !== 'string' || value.trim().length === 0) {
          throw new AppError(
            400,
            `Field "${field.label}" (${field.key}) is required and must be a non-empty string`
          );
        }
      } else if (field.type === 'number') {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new AppError(400, `Field "${field.label}" (${field.key}) is required and must be a number`);
        }
      } else if (field.type === 'string[]') {
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || v.trim().length === 0)) {
          throw new AppError(400, `Field "${field.label}" (${field.key}) must be an array of non-empty strings`);
        }
        if (field.minItems !== undefined && value.length < field.minItems) {
          throw new AppError(400, `Field "${field.label}" requires at least ${field.minItems} item(s)`);
        }
        if (field.maxItems !== undefined && value.length > field.maxItems) {
          throw new AppError(400, `Field "${field.label}" allows at most ${field.maxItems} item(s)`);
        }
      }
    }
  }
}
