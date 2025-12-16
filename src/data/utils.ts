export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'unknown';

export const normalizeEmployerKey = (value: string) => {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  if (!base || base === 'unknown' || base === 'n/a') return '';

  // Treat common FCPS variants as the same employer
  if (
    base === 'fayette county public schools' ||
    base === 'fcps'
  ) {
    return 'fayette county public schools';
  }

  return base;
};
