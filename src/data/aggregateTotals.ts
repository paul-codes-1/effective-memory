import type { ContributorRecord, ContributorTotalsMap } from './types';

/** Builds a totals map from an array of mapped contributor records, keyed by identityKey. */
export const aggregateTotals = (records: ContributorRecord[]): ContributorTotalsMap => {
  const totalsMap: ContributorTotalsMap = {};
  records.forEach((record) => {
    const key = record.identityKey;
    if (!totalsMap[key]) {
      totalsMap[key] = {
        key,
        fullName: record.contributorFullName,
        totalAmount: 0,
        contributionCount: 0,
        occupation: record.occupation,
        employer: record.employer,
      };
    }
    const entry = totalsMap[key];
    entry.totalAmount += record.amount;
    entry.contributionCount += 1;
    if (!entry.occupation && record.occupation) {
      entry.occupation = record.occupation;
    }
    if (!entry.employer && record.employer) {
      entry.employer = record.employer;
    }
  });
  return totalsMap;
};
