import { describe, it, expect } from 'vitest';
import {
  filterRecords,
  buildContributorEmployerMap,
  filterTotals,
  sortRecords,
  sortTotals,
} from './filterContributors';
import { aggregateTotals } from './aggregateTotals';
import { mappedRecords } from '../test/fixtures/contributors';

describe('filterRecords', () => {
  it('returns all records when no filters applied', () => {
    const result = filterRecords(mappedRecords, { searchValue: '', typeFilter: 'all', modeFilter: 'all' });
    expect(result).toHaveLength(mappedRecords.length);
  });

  it('filters by contributor name (case insensitive)', () => {
    const result = filterRecords(mappedRecords, { searchValue: 'john', typeFilter: 'all', modeFilter: 'all' });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.contributorFullName === 'John Smith')).toBe(true);
  });

  it('filters by employer', () => {
    const result = filterRecords(mappedRecords, { searchValue: 'fcps', typeFilter: 'all', modeFilter: 'all' });
    expect(result).toHaveLength(1);
    expect(result[0].employer).toBe('FCPS');
  });

  it('filters by occupation', () => {
    const result = filterRecords(mappedRecords, { searchValue: 'lawyer', typeFilter: 'all', modeFilter: 'all' });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.occupation === 'Lawyer')).toBe(true);
  });

  it('filters by contribution type', () => {
    const result = filterRecords(mappedRecords, { searchValue: '', typeFilter: 'REFUND', modeFilter: 'all' });
    expect(result).toHaveLength(1);
    expect(result[0].contributionType).toBe('REFUND');
  });

  it('filters by contribution mode', () => {
    const result = filterRecords(mappedRecords, { searchValue: '', typeFilter: 'all', modeFilter: 'CHECK' });
    expect(result.every((r) => r.contributionMode === 'CHECK')).toBe(true);
  });

  it('combines all filters', () => {
    const result = filterRecords(mappedRecords, { searchValue: 'alice', typeFilter: 'MONETARY', modeFilter: 'CHECK' });
    expect(result).toHaveLength(1);
    expect(result[0].contributorFullName).toBe('Alice Brown');
    expect(result[0].amount).toBe(200);
  });

  it('returns empty when no matches', () => {
    const result = filterRecords(mappedRecords, { searchValue: 'nonexistent', typeFilter: 'all', modeFilter: 'all' });
    expect(result).toHaveLength(0);
  });
});

describe('buildContributorEmployerMap', () => {
  const map = buildContributorEmployerMap(mappedRecords);

  it('maps identity keys to employer sets', () => {
    expect(map.has('john-smith')).toBe(true);
    const employers = map.get('john-smith')!;
    expect(employers.has('fcps')).toBe(true);
    expect(employers.has('fayette county public schools')).toBe(true);
  });

  it('does not include empty employers', () => {
    const anonymous = map.get('anonymous');
    expect(anonymous === undefined || anonymous.size === 0).toBe(true);
  });
});

describe('filterTotals', () => {
  const totalsMap = aggregateTotals(mappedRecords);
  const totals = Object.values(totalsMap);
  const employerMap = buildContributorEmployerMap(mappedRecords);

  it('returns all totals when search is empty', () => {
    const result = filterTotals(totals, '', employerMap);
    expect(result).toHaveLength(totals.length);
  });

  it('filters by contributor name', () => {
    const result = filterTotals(totals, 'alice', employerMap);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Alice Brown');
  });

  it('filters by cross-referenced employer name', () => {
    const result = filterTotals(totals, 'fcps', employerMap);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('John Smith');
  });

  it('returns empty when no matches', () => {
    const result = filterTotals(totals, 'zzzzz', employerMap);
    expect(result).toHaveLength(0);
  });
});

describe('sortRecords', () => {
  it('sorts by amount descending', () => {
    const sorted = sortRecords(mappedRecords, 'amount', 'desc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].amount).toBeGreaterThanOrEqual(sorted[i].amount);
    }
  });

  it('sorts by amount ascending', () => {
    const sorted = sortRecords(mappedRecords, 'amount', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].amount).toBeLessThanOrEqual(sorted[i].amount);
    }
  });

  it('sorts by contributor name ascending', () => {
    const sorted = sortRecords(mappedRecords, 'contributor', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].contributorFullName.localeCompare(sorted[i].contributorFullName)).toBeLessThanOrEqual(0);
    }
  });

  it('sorts by recipient name descending', () => {
    const sorted = sortRecords(mappedRecords, 'recipient', 'desc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].recipientFullName.localeCompare(sorted[i].recipientFullName)).toBeGreaterThanOrEqual(0);
    }
  });

  it('does not mutate the original array', () => {
    const original = [...mappedRecords];
    sortRecords(mappedRecords, 'amount', 'desc');
    expect(mappedRecords).toEqual(original);
  });
});

describe('sortTotals', () => {
  const totalsMap = aggregateTotals(mappedRecords);
  const totals = Object.values(totalsMap);

  it('sorts by totalAmount descending', () => {
    const sorted = sortTotals(totals, 'amount', 'desc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].totalAmount).toBeGreaterThanOrEqual(sorted[i].totalAmount);
    }
  });

  it('sorts by contributionCount ascending', () => {
    const sorted = sortTotals(totals, 'entries', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].contributionCount).toBeLessThanOrEqual(sorted[i].contributionCount);
    }
  });

  it('sorts by contributor name ascending', () => {
    const sorted = sortTotals(totals, 'contributor', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].fullName.localeCompare(sorted[i].fullName)).toBeLessThanOrEqual(0);
    }
  });
});
