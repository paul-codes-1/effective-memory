export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'unknown';

const EMPLOYER_ALIASES: Record<string, string> = {
  fcps: 'fayette county public schools',
};

export const normalizeEmployerKey = (value: string) => {
  const base = value.toLowerCase().trim().replace(/\s+/g, ' ');

  if (!base || base === 'unknown' || base === 'n/a') return '';

  return EMPLOYER_ALIASES[base] || base;
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
