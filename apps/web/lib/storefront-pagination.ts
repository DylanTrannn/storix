export function parsePageParam(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function buildQueryHref(
  pathname: string,
  params: Record<string, string | number | undefined | null>,
  overrides?: Record<string, string | number | undefined | null>,
): string {
  const merged = { ...params, ...overrides };
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'page' || key === 'collectionPage') {
      const page = Number(value);
      if (!Number.isFinite(page) || page <= 1) continue;
      searchParams.set(key, String(page));
      continue;
    }
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
