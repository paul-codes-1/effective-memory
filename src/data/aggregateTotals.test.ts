import { describe, it, expect } from 'vitest';
import { aggregateTotals } from './aggregateTotals';
import { mappedRecords } from '../test/fixtures/contributors';

describe('aggregateTotals', () => {
  const totals = aggregateTotals(mappedRecords);

  it('groups named contributors by identityKey', () => {
    expect(Object.keys(totals)).toContain('john-smith');
    expect(Object.keys(totals)).toContain('alice-brown');
    expect(Object.keys(totals)).toContain('protect-lex-pac');
    expect(Object.keys(totals)).toContain('charlie-davis');
  });

  it('sums amounts correctly for John Smith (2 records: $100 + $50)', () => {
    expect(totals['john-smith'].totalAmount).toBe(150);
    expect(totals['john-smith'].contributionCount).toBe(2);
  });

  it('sums amounts correctly for Alice Brown including refund ($200 + -$50)', () => {
    expect(totals['alice-brown'].totalAmount).toBe(150);
    expect(totals['alice-brown'].contributionCount).toBe(2);
  });

  it('handles single-record contributors', () => {
    expect(totals['protect-lex-pac'].totalAmount).toBe(500);
    expect(totals['protect-lex-pac'].contributionCount).toBe(1);
  });

  it('gives anonymous contributions unique keys (not grouped together)', () => {
    // The anonymous record at index 4 should have key 'anonymous-4'
    expect(totals['anonymous-4']).toBeDefined();
    expect(totals['anonymous-4'].totalAmount).toBe(25);
    expect(totals['anonymous-4'].contributionCount).toBe(1);
  });

  it('handles zero-amount contributions', () => {
    expect(totals['charlie-davis'].totalAmount).toBe(0);
    expect(totals['charlie-davis'].contributionCount).toBe(1);
  });

  it('preserves fullName from first matching record', () => {
    expect(totals['john-smith'].fullName).toBe('John Smith');
  });

  it('picks up occupation from first record that has one', () => {
    expect(totals['john-smith'].occupation).toBe('Engineer');
  });

  it('picks up employer from first record that has one', () => {
    expect(totals['john-smith'].employer).toBe('FCPS');
  });

  it('returns empty map for empty input', () => {
    expect(aggregateTotals([])).toEqual({});
  });

  it('total of all amounts matches sum of individual records', () => {
    const totalFromRecords = mappedRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalFromTotals = Object.values(totals).reduce((sum, t) => sum + t.totalAmount, 0);
    expect(totalFromTotals).toBe(totalFromRecords);
  });
});
