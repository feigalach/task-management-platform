import { FormEvent, useState } from 'react';
import { StatusFieldRequirement } from '../types';
import { FieldErrors, validateDynamicFields } from '../validation/fieldValidation';

interface Props {
  fields: StatusFieldRequirement[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel: string;
}

/**
 * Renders inputs purely from a StatusFieldRequirement[] descriptor coming
 * from the server (GET /task-types). It has no knowledge of "procurement"
 * or "development" — a brand new task type with new fields renders here
 * automatically with zero client-side changes.
 *
 * Validates locally (via validateDynamicFields) before calling onSubmit, so
 * the user gets an immediate, friendly, per-field message ("יש למלא את
 * השדה...") instead of a round trip to the server for something this basic.
 */
export const DynamicStatusForm = ({ fields, onSubmit, submitLabel }: Props) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = (key: string, value: any) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const setArrayItem = (key: string, index: number, value: string, length: number) => {
    setValues((v) => {
      const arr = Array.isArray(v[key]) ? [...v[key]] : new Array(length).fill('');
      arr[index] = value;
      return { ...v, [key]: arr };
    });
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const fieldErrors = validateDynamicFields(fields, values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.key} className="field">
          <label>
            {field.label}
            {field.type === 'string' && (
              <input type="text" onChange={(e) => setField(field.key, e.target.value)} />
            )}
            {field.type === 'number' && (
              <input type="number" onChange={(e) => setField(field.key, Number(e.target.value))} />
            )}
            {field.type === 'string[]' && (
              <div>
                {Array.from({ length: field.maxItems ?? field.minItems ?? 1 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`${field.label} #${i + 1}`}
                    onChange={(e) =>
                      setArrayItem(field.key, i, e.target.value, field.maxItems ?? field.minItems ?? 1)
                    }
                  />
                ))}
              </div>
            )}
          </label>
          <div className="error-text">{errors[field.key] || ''}</div>
        </div>
      ))}
      {fields.length === 0 && <p>אין נתונים נוספים נדרשים לסטטוס הזה.</p>}
      <button type="submit">{submitLabel}</button>
    </form>
  );
}
