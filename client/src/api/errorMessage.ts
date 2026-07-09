/**
 * Extracts a human-readable message from an API error response.
 *
 * The server returns either:
 *   { error: "some message" }
 * or, for validation failures:
 *   { error: "Validation failed", details: ["type: field required", ...] }
 *
 * This combines both into a single string so every component that shows
 * error state gets the specific field-level reason, not just the generic
 * "Validation failed" headline.
 */
export const getApiErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (!data) return fallback;

  if (Array.isArray(data.details) && data.details.length > 0) {
    return `${data.error}: ${data.details.join('; ')}`;
  }

  return data.error || fallback;
}
