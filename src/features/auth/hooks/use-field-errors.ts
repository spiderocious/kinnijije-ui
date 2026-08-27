import type { ApiError } from '@shared/services/api-client';

/**
 * Pulls one field's error out of the envelope.
 *
 * The backend returns ALL invalid fields (its stated policy), each as an array
 * of messages. Only the first is shown per field — more than one message under
 * a single input is noise.
 */
export function fieldError(error: ApiError | null, field: string): string | undefined {
  if (error === null || error.fieldErrors === undefined) return undefined;
  return error.fieldErrors[field]?.[0];
}
