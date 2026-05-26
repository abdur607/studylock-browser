export function includesQuery(values: (string | undefined | null)[], q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return values.some((v) => v != null && v.toLowerCase().includes(lower));
}
