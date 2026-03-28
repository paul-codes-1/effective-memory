import type { ContributorRecord, ContributorTotal } from './types';
import type { SortDirection } from '../hooks/useTableSort';

export interface RecordFilters {
  searchValue: string;
  typeFilter: string;
  modeFilter: string;
}

/** Filter contribution records by search term, contribution type, and contribution mode. */
export const filterRecords = (data: ContributorRecord[], filters: RecordFilters): ContributorRecord[] => {
  const { searchValue, typeFilter, modeFilter } = filters;
  return data.filter((record) => {
    const matchesSearch = searchValue
      ? [record.contributorFullName, record.employer, record.occupation]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(searchValue))
      : true;
    const matchesType = typeFilter === 'all' || record.contributionType === typeFilter;
    const matchesMode = modeFilter === 'all' || record.contributionMode === modeFilter;
    return matchesSearch && matchesType && matchesMode;
  });
};

/** Build a map of identityKey -> Set of lowercase employer names for search cross-referencing. */
export const buildContributorEmployerMap = (data: ContributorRecord[]): Map<string, Set<string>> => {
  const map = new Map<string, Set<string>>();
  data.forEach((record) => {
    if (!record.identityKey) return;
    const key = record.identityKey;
    if (!map.has(key)) map.set(key, new Set());
    if (record.employer) map.get(key)!.add(record.employer.toLowerCase());
  });
  return map;
};

/** Filter contributor totals by search term, cross-referencing employer names. */
export const filterTotals = (
  totals: ContributorTotal[],
  searchValue: string,
  employerMap: Map<string, Set<string>>,
): ContributorTotal[] => {
  if (!searchValue) return totals;
  return totals.filter((entry) => {
    if (entry.fullName.toLowerCase().includes(searchValue)) return true;
    const employers = employerMap.get(entry.key);
    if (!employers) return false;
    for (const employer of employers) {
      if (employer.includes(searchValue)) return true;
    }
    return false;
  });
};

type RecordSortField = 'amount' | 'contributor' | 'recipient';

/** Sort contribution records by the given field and direction. */
export const sortRecords = (
  records: ContributorRecord[],
  field: RecordSortField,
  direction: SortDirection,
): ContributorRecord[] => {
  const sorted = [...records];
  sorted.sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'contributor':
        comparison = a.contributorFullName.localeCompare(b.contributorFullName, undefined, { sensitivity: 'base' });
        break;
      case 'recipient':
        comparison = a.recipientFullName.localeCompare(b.recipientFullName, undefined, { sensitivity: 'base' });
        break;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
  return sorted;
};

type TotalsSortField = 'amount' | 'contributor' | 'entries';

/** Sort contributor totals by the given field and direction. */
export const sortTotals = (
  entries: ContributorTotal[],
  field: TotalsSortField,
  direction: SortDirection,
): ContributorTotal[] => {
  const sorted = [...entries];
  sorted.sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'contributor':
        comparison = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
        break;
      case 'entries':
        comparison = a.contributionCount - b.contributionCount;
        break;
      case 'amount':
      default:
        comparison = a.totalAmount - b.totalAmount;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
  return sorted;
};
