/** ₦500, ₦1,200 — whole naira, which is how every menu in Nigeria prices food. */
export function naira(value: number): string {
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

/** "25–35 min". */
export function deliveryWindow(minutes: { min: number; max: number } | null): string | null {
  if (minutes === null) return null;
  return minutes.min === minutes.max
    ? `${String(minutes.max)} min`
    : `${String(minutes.min)}–${String(minutes.max)} min`;
}

/**
 * "just now", "25 min ago", "3h ago".
 *
 * Shown beside every price so a cached number never passes itself off as
 * live — every claim shows where it came from, and when.
 */
export function ago(iso: string | null, now = Date.now()): string | null {
  if (iso === null) return null;
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${String(minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${String(hours)}h ago` : `${String(Math.round(hours / 24))}d ago`;
}
