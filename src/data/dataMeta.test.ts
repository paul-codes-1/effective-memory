import { describe, it, expect } from 'vitest';
import { formatApDate, toLexingtonDate, formatFreshness } from './dataMeta';

describe('formatApDate', () => {
  it('abbreviates AP months', () => {
    expect(formatApDate('2026-09-04')).toBe('Sept. 4, 2026');
    expect(formatApDate('2026-01-15')).toBe('Jan. 15, 2026');
    expect(formatApDate('2026-11-03')).toBe('Nov. 3, 2026');
  });

  it('spells out March through July', () => {
    expect(formatApDate('2026-05-19')).toBe('May 19, 2026');
    expect(formatApDate('2026-07-01')).toBe('July 1, 2026');
  });

  it('can omit the year', () => {
    expect(formatApDate('2026-09-21', { year: false })).toBe('Sept. 21');
  });

  it('returns null for missing or malformed input', () => {
    expect(formatApDate(null)).toBeNull();
    expect(formatApDate('')).toBeNull();
    expect(formatApDate('9/4/2026')).toBeNull();
    expect(formatApDate('2026-13-01')).toBeNull();
  });
});

describe('toLexingtonDate', () => {
  it('converts UTC timestamps to the Eastern calendar date', () => {
    expect(toLexingtonDate('2026-09-21T15:50:01.493Z')).toBe('2026-09-21');
    // 02:00 UTC is still the previous evening in Lexington.
    expect(toLexingtonDate('2026-09-22T02:00:00Z')).toBe('2026-09-21');
  });

  it('returns null for bad input', () => {
    expect(toLexingtonDate(undefined)).toBeNull();
    expect(toLexingtonDate('not a date')).toBeNull();
  });
});

describe('formatFreshness', () => {
  it('builds the full stamp, dropping the refreshed year when it matches', () => {
    expect(formatFreshness({ generatedAt: '2026-09-21T15:50:01.493Z', latestReceiptDate: '2026-09-04' })).toBe(
      'KREF filings through Sept. 4, 2026 · refreshed Sept. 21',
    );
  });

  it('keeps the refreshed year when it differs', () => {
    expect(formatFreshness({ generatedAt: '2027-01-05T15:00:00Z', latestReceiptDate: '2026-12-20' })).toBe(
      'KREF filings through Dec. 20, 2026 · refreshed Jan. 5, 2027',
    );
  });

  it('degrades gracefully', () => {
    expect(formatFreshness(null)).toBeNull();
    expect(formatFreshness({ generatedAt: '2026-09-21T15:50:01Z', latestReceiptDate: null })).toBe(
      'refreshed Sept. 21, 2026',
    );
    expect(formatFreshness({ generatedAt: '', latestReceiptDate: null })).toBeNull();
  });
});
