import { describe, it, expect } from 'vitest';
import { computeOverviewData } from './overviewAggregation';
import { mappedRecords } from '../test/fixtures/contributors';

describe('computeOverviewData', () => {
  const result = computeOverviewData(mappedRecords);

  it('returns zero summary for empty data', () => {
    const empty = computeOverviewData([]);
    expect(empty.summary.totalAmount).toBe(0);
    expect(empty.summary.totalContributions).toBe(0);
    expect(empty.summary.uniqueContributors).toBe(0);
    expect(empty.summary.uniqueRecipients).toBe(0);
    expect(empty.topRecipients).toHaveLength(0);
    expect(empty.topEmployers).toHaveLength(0);
  });

  it('computes totalAmount as sum of all record amounts', () => {
    const expected = mappedRecords.reduce((sum, r) => sum + r.amount, 0);
    expect(result.summary.totalAmount).toBe(expected);
  });

  it('counts totalContributions as number of records', () => {
    expect(result.summary.totalContributions).toBe(mappedRecords.length);
  });

  it('counts uniqueContributors by identityKey', () => {
    const uniqueKeys = new Set(mappedRecords.map((r) => r.identityKey));
    expect(result.summary.uniqueContributors).toBe(uniqueKeys.size);
  });

  it('counts uniqueRecipients by recipientFullName', () => {
    const uniqueRecipients = new Set(mappedRecords.map((r) => r.recipientFullName));
    expect(result.summary.uniqueRecipients).toBe(uniqueRecipients.size);
  });

  it('returns top recipients sorted by total amount descending', () => {
    expect(result.topRecipients.length).toBeGreaterThan(0);
    for (let i = 1; i < result.topRecipients.length; i++) {
      expect(result.topRecipients[i - 1].total).toBeGreaterThanOrEqual(result.topRecipients[i].total);
    }
  });

  it('Jane Doe is the top recipient (receives $100 + $200 + $500 + $0 = $800)', () => {
    expect(result.topRecipients[0].name).toBe('Jane Doe');
    expect(result.topRecipients[0].total).toBe(800);
    expect(result.topRecipients[0].count).toBe(4);
    expect(result.topRecipients[0].office).toBe('MAYOR');
  });

  it('Bob Jones is the second recipient ($50 + $25 + -$50 = $25)', () => {
    expect(result.topRecipients[1].name).toBe('Bob Jones');
    expect(result.topRecipients[1].total).toBe(25);
    expect(result.topRecipients[1].count).toBe(3);
  });

  it('topRecipients does not exceed 5 entries', () => {
    expect(result.topRecipients.length).toBeLessThanOrEqual(5);
  });

  it('excludes empty employers from topEmployers', () => {
    const names = result.topEmployers.map((e) => e.name);
    expect(names).not.toContain('');
  });

  it('merges FCPS employer variants under one key', () => {
    // Records 0 and 1 both have FCPS/Fayette County Public Schools
    const fcps = result.topEmployers.find((e) => e.employerKey === 'fayette county public schools');
    expect(fcps).toBeDefined();
    expect(fcps!.count).toBe(2);
    expect(fcps!.total).toBe(150); // $100 + $50
  });
});
