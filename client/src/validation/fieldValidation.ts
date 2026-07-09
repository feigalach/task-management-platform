import { z } from 'zod';
import { StatusFieldRequirement } from '../types';

const buildFieldsSchema = (fields: StatusFieldRequirement[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.type === 'string') {
      shape[field.key] = z.any().refine((v) => typeof v === 'string' && v.trim().length > 0, {
        message: `"${field.label}" is required`,
      });
    } else if (field.type === 'number') {
      shape[field.key] = z.any().refine((v) => typeof v === 'number' && !Number.isNaN(v), {
        message: `"${field.label}" is required`,
      });
    } else if (field.type === 'string[]') {
      const min = field.minItems ?? 1;
      const max = field.maxItems;

      shape[field.key] = z.any().superRefine((v, ctx) => {
        const arr = Array.isArray(v) ? v : [];
        const filled = arr.filter((item) => typeof item === 'string' && item.trim().length > 0);

        if (filled.length < min) {
          ctx.addIssue({ code: 'custom', message: `Please fill in all ${min} value(s) for "${field.label}"` });
          return;
        }
        if (max !== undefined && arr.length > max) {
          ctx.addIssue({ code: 'custom', message: `"${field.label}" allows at most ${max} value(s)` });
        }
      });
    }
  }

  return z.object(shape);
}

export type FieldErrors = Record<string, string>;

/**
 * Validates `values` against `fields` and returns a map of
 * { fieldKey: friendlyErrorMessage } for anything that failed - empty
 * object means valid. Meant to run BEFORE calling the API, so the user
 * never sees a raw server-shaped error for something this simple.
 */
export const validateDynamicFields = (fields: StatusFieldRequirement[], values: Record<string, any>): FieldErrors => {
  const schema = buildFieldsSchema(fields);
  const result = schema.safeParse(values);
  if (result.success) return {};

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    if (!(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export const requiredMessage = (value: string, label: string): string | null => {
  return value.trim().length === 0 ? `Please select a ${label}` : null;
}
