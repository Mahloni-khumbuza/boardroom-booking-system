import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface ApiErrorBody {
  message?: string | string[];
  error?:   string;
  statusCode?: number;
}

export function extractApiError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  if (isFetchBaseQueryError(error)) {
    const body = error.data as ApiErrorBody | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message[0] : body.message;
    }
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 403) return 'You do not have permission to perform this action.';
    if (error.status === 404) return 'The requested resource was not found.';
    if (error.status === 409) return 'A conflict occurred. Please check your input.';
    if (typeof error.status === 'number' && error.status >= 500) return 'A server error occurred. Please try again.';
    return 'A network error occurred.';
  }

  if (isErrorWithMessage(error)) return error.message;

  return 'An unexpected error occurred.';
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string';
}
