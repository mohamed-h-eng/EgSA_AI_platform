// Sidebar history grouping: Today · Yesterday · Previous 7 days · Previous 30 days · Older.

export type DateGroup = 'Today' | 'Yesterday' | 'Previous 7 days' | 'Previous 30 days' | 'Older';
export const DATE_GROUPS: DateGroup[] = ['Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days', 'Older'];

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function dateGroupOf(ts: number, now = Date.now()): DateGroup {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days <= 7) return 'Previous 7 days';
  if (days <= 30) return 'Previous 30 days';
  return 'Older';
}

/** Groups items by date (newest first within each group), keeping only non-empty groups in order. */
export function groupByDate<T>(items: T[], getTime: (item: T) => number, now = Date.now()): Array<{ group: DateGroup; items: T[] }> {
  const buckets = new Map<DateGroup, T[]>();
  for (const item of [...items].sort((a, b) => getTime(b) - getTime(a))) {
    const group = dateGroupOf(getTime(item), now);
    buckets.set(group, [...(buckets.get(group) || []), item]);
  }
  return DATE_GROUPS.filter((g) => buckets.has(g)).map((group) => ({ group, items: buckets.get(group)! }));
}
