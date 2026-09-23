/** Shape of public/data/meta.json, written by public/data/filter-lexington-urban.js. */
export interface DataMeta {
  generatedAt: string;
  latestReceiptDate: string | null;
  recordCount: number;
  elections: { date: string; type: string; records: number }[];
}

// AP style: abbreviate Jan., Feb., Aug., Sept., Oct., Nov., Dec.; spell out March–July.
const AP_MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

/** Formats a `YYYY-MM-DD` calendar date as AP style, e.g. "Sept. 4, 2026". Returns null if unparseable. */
export function formatApDate(isoDate: string | null | undefined, opts: { year?: boolean } = {}): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate ?? '');
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const base = `${AP_MONTHS[month - 1]} ${day}`;
  return opts.year === false ? base : `${base}, ${m[1]}`;
}

/** Converts an ISO timestamp to its `YYYY-MM-DD` calendar date in Lexington (America/New_York). */
export function toLexingtonDate(isoTimestamp: string | null | undefined): string | null {
  if (!isoTimestamp) return null;
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return null;
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Builds the freshness stamp shown in the LFUCG portal header, e.g.
 * "KREF filings through Sept. 4, 2026 · refreshed Sept. 21". Returns null when
 * the meta has nothing usable.
 */
export function formatFreshness(meta: Pick<DataMeta, 'generatedAt' | 'latestReceiptDate'> | null): string | null {
  if (!meta) return null;
  const through = formatApDate(meta.latestReceiptDate);
  const refreshedDate = toLexingtonDate(meta.generatedAt);
  const sameYear = refreshedDate?.slice(0, 4) === meta.latestReceiptDate?.slice(0, 4);
  const refreshed = formatApDate(refreshedDate, { year: !sameYear });
  const parts = [through && `KREF filings through ${through}`, refreshed && `refreshed ${refreshed}`].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}
