/**
 * Reads a search value that may have been JSON-encoded on the way in.
 *
 * Routes without a `validateSearch` get TanStack's default serialiser, which
 * writes strings with quotes — `?step="2"`. `useSearch` usually parses those
 * back, but a link built by hand or arriving from an email has not been through
 * that round trip, so a value can show up either way.
 *
 * This accepts both and returns the plain string.
 */
export function searchValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}
