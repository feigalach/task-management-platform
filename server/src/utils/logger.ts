/**
 * Minimal structured logger. Not a full logging framework (no log
 * rotation, no external transport) - just consistent, timestamped,
 * leveled output so server-side activity can be followed in one place
 * (terminal / `docker logs` / whatever captures stdout in production).
 */

type LogMeta = Record<string, unknown>;

function timestamp(): string {
  return new Date().toISOString();
}

function format(level: string, message: string, meta?: LogMeta): string {
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp()}] [${level}] ${message}${metaStr}`;
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    console.log(format('INFO', message, meta));
  },
  warn(message: string, meta?: LogMeta): void {
    console.warn(format('WARN', message, meta));
  },
  error(message: string, meta?: LogMeta): void {
    console.error(format('ERROR', message, meta));
  },
};
