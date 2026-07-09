import { BaseTaskTypeHandler } from './BaseTaskTypeHandler';
import { StatusDefinition } from './types';

/**
 * Procurement lifecycle:
 * 1 Created           -> no data
 * 2 Offers received    -> exactly 2 price-quote strings
 * 3 Purchase completed  -> a receipt string   (final status)
 */
export class ProcurementHandler extends BaseTaskTypeHandler {
  readonly type = 'procurement';

  protected statuses: StatusDefinition[] = [
    { number: 1, name: 'Created', requiredFields: [] },
    {
      number: 2,
      name: 'Supplier offers received',
      requiredFields: [{ key: 'quotes', label: 'Price Quotes', type: 'string[]', minItems: 2, maxItems: 2 }],
    },
    {
      number: 3,
      name: 'Purchase completed',
      requiredFields: [{ key: 'receipt', label: 'Receipt', type: 'string' }],
    },
  ];
}
