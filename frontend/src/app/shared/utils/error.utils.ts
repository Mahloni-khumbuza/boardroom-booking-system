/**
 * Extracts a human-readable error message from an Angular HTTP error response.
 * Handles:
 *  - NestJS validation arrays  { error: { message: string[] } }
 *  - NestJS single messages    { error: { message: string } }
 *  - Generic JS errors         { message: string }
 *  - Fallback                  provided fallback string
 */
export function extractErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const e = err as { error?: { message?: string | string[] }; message?: string } | null;
  const nested = e?.error?.message;
  if (Array.isArray(nested)) return nested.join(', ');
  if (typeof nested === 'string' && nested.trim()) return nested.trim();
  if (typeof e?.message === 'string' && e.message.trim()) return e.message.trim();
  return fallback;
}
