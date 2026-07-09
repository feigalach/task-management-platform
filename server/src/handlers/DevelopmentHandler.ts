import { BaseTaskTypeHandler } from './BaseTaskTypeHandler';
import { StatusDefinition } from './types';

/**
 * Development lifecycle:
 * 1 Created                -> no data
 * 2 Specification completed -> specification text
 * 3 Development completed   -> branch name
 * 4 Distribution completed  -> version number   (final status)
 */
export class DevelopmentHandler extends BaseTaskTypeHandler {
  readonly type = 'development';

  protected statuses: StatusDefinition[] = [
    { number: 1, name: 'Created', requiredFields: [] },
    {
      number: 2,
      name: 'Specification completed',
      requiredFields: [{ key: 'specification', label: 'Specification', type: 'string' }],
    },
    {
      number: 3,
      name: 'Development completed',
      requiredFields: [{ key: 'branch', label: 'Branch Name', type: 'string' }],
    },
    {
      number: 4,
      name: 'Distribution completed',
      requiredFields: [{ key: 'version', label: 'Version Number', type: 'string' }],
    },
  ];
}
