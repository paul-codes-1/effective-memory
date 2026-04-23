export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'unknown';

/**
 * Canonical employer aliases. Keys are lowercased, trimmed, whitespace-collapsed.
 * Multiple raw strings can map to the same canonical form.
 */
const EMPLOYER_ALIASES: Record<string, string> = {
  fcps: 'Fayette County Public Schools',
  'fayette county public schools': 'Fayette County Public Schools',
  kbj: 'KBJ',
  lfucg: 'LFUCG',
  upm: 'UPM',
  galls: 'Galls',
  'kentucky for kentucky': 'Kentucky for Kentucky',
  'not employed': 'Not Employed',
  uk: 'University of Kentucky',
  'university of kentucky': 'University of Kentucky',
};

/** Strings that indicate "no real employer" — excluded from employer aggregation. */
const EMPTY_EMPLOYER_KEYS = new Set(['', 'unknown', 'n/a', 'none', 'na', 'retired', 'not employed']);

/**
 * Extract the actual employer from "Self Employed, <employer>" compound strings.
 * Returns the employer portion if present, or 'Self-Employed' if standalone.
 */
const parseSelfEmployed = (base: string): { isSelfEmployed: boolean; extractedEmployer: string } => {
  const selfEmployedPattern = /^self[\s-]*employed(?:\s*,\s*(.+))?$/i;
  const match = base.match(selfEmployedPattern);
  if (!match) return { isSelfEmployed: false, extractedEmployer: '' };
  const extracted = match[1]?.trim() || '';
  return { isSelfEmployed: true, extractedEmployer: extracted };
};

/**
 * Normalize an employer string to a canonical key for grouping.
 * Returns '' for empty/retired/n-a values (excluded from aggregation).
 * Returns a display-ready canonical name for known aliases.
 * Extracts actual employer from "Self Employed, X" compounds.
 */
export const normalizeEmployerKey = (value: string): string => {
  const base = value.toLowerCase().trim().replace(/\s+/g, ' ');

  if (EMPTY_EMPLOYER_KEYS.has(base)) return '';

  // Check for "Self Employed, X" compounds — extract the real employer from original value
  const { isSelfEmployed, extractedEmployer } = parseSelfEmployed(value.trim());
  if (isSelfEmployed) {
    if (!extractedEmployer) return ''; // pure "Self Employed" with no actual employer
    // Normalize the extracted employer
    const normalizedKey = extractedEmployer.toLowerCase().trim().replace(/\s+/g, ' ');
    return EMPLOYER_ALIASES[normalizedKey] || normalizedKey;
  }

  // Check direct alias match
  if (EMPLOYER_ALIASES[base]) return EMPLOYER_ALIASES[base];

  // Return lowercased normalized form
  return base;
};

/**
 * Get a display-friendly employer name from a raw employer value.
 * Applies the same normalization as normalizeEmployerKey but preserves
 * the canonical display form from aliases. Falls back to the raw value.
 */
export const normalizeEmployerDisplay = (value: string): string => {
  const key = normalizeEmployerKey(value);
  return key || value;
};

/**
 * Build a contribution-type-aware identity key for contributors.
 * - Named contributors: slugified full name (allows aggregation across filings)
 * - CANDIDATE contributions (no name): scoped to the recipient (candidate self-funding)
 * - UNITEMIZED contributions: scoped to the recipient (bundle of small-dollar donors)
 * - ANONYMOUS contributions: unique per record
 * - Other missing-name: unique per record
 */
export const buildIdentityKey = (params: {
  hasName: boolean;
  hasOrg: boolean;
  contributorFullName: string;
  contributionType: string;
  recipientFullName: string;
  index: number;
}): string => {
  const { hasName, hasOrg, contributorFullName, contributionType, recipientFullName, index } = params;

  // Named contributors or org-named contributors get a simple slug key
  if (hasName || hasOrg) {
    return slugify(contributorFullName) || `missing-${index}`;
  }

  // Unnamed contributions — scope by type
  switch (contributionType) {
    case 'CANDIDATE':
      return `candidate-self-${slugify(recipientFullName)}`;
    case 'UNITEMIZED':
      return `unitemized-${slugify(recipientFullName)}`;
    case 'ANONYMOUS':
      return `anonymous-${index}`;
    case 'CASH':
      return `cash-unnamed-${index}`;
    default:
      return `unnamed-${index}`;
  }
};

export const normalize = (value?: string | number) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

export const parseAmount = (value?: string | number): number => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildFullName = (first: string, last: string) => [first, last].filter(Boolean).join(' ').trim();
