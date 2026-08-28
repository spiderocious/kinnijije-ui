/**
 * Dates from the API can be null.
 *
 * A record written before a field existed, or imported rather than created,
 * has no timestamp — the server now sends `null` for those instead of taking
 * the whole list down with it. `new Date(null)` gives the epoch and
 * `new Date(undefined)` gives "Invalid Date", so both need catching here.
 */
const MISSING = '—';

export function formatDate(value: string | null | undefined): string {
  if (value === null || value === undefined) return MISSING;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? MISSING : date.toLocaleDateString();
}

export function formatDateTime(value: string | null | undefined): string {
  if (value === null || value === undefined) return MISSING;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? MISSING : date.toLocaleString();
}
