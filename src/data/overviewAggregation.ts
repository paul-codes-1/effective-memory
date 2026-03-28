import type { ContributorRecord } from './types';
import { normalizeEmployerKey } from './utils';

export interface OverviewSummary {
  totalAmount: number;
  totalContributions: number;
  uniqueContributors: number;
  uniqueRecipients: number;
}

export interface RecipientRow {
  name: string;
  total: number;
  count: number;
  office: string;
}

export interface EmployerRow {
  employerKey: string;
  name: string;
  total: number;
  count: number;
}

export interface OverviewData {
  summary: OverviewSummary;
  topRecipients: RecipientRow[];
  topEmployers: EmployerRow[];
}

const EMPTY: OverviewData = {
  summary: { totalAmount: 0, totalContributions: 0, uniqueContributors: 0, uniqueRecipients: 0 },
  topRecipients: [],
  topEmployers: [],
};

/** Computes overview KPIs, top recipients, and top employers from contribution records. */
export const computeOverviewData = (data: ContributorRecord[]): OverviewData => {
  if (!data.length) return EMPTY;

  const summary: OverviewSummary = {
    totalAmount: data.reduce((acc, record) => acc + record.amount, 0),
    totalContributions: data.length,
    uniqueContributors: new Set(data.map((record) => record.identityKey)).size,
    uniqueRecipients: new Set(data.map((record) => record.recipientFullName)).size,
  };

  const recipientMap = new Map<string, RecipientRow>();
  const employerMap = new Map<string, EmployerRow>();

  data.forEach((record) => {
    const recipientKey = record.recipientFullName || 'Unknown recipient';
    const recipientEntry = recipientMap.get(recipientKey) ?? {
      name: recipientKey,
      total: 0,
      count: 0,
      office: record.officeSought,
    };
    recipientEntry.total += record.amount;
    recipientEntry.count += 1;
    if (!recipientEntry.office && record.officeSought) {
      recipientEntry.office = record.officeSought;
    }
    recipientMap.set(recipientKey, recipientEntry);

    const employerRaw = record.employer?.trim() || '';
    const employerKey = normalizeEmployerKey(employerRaw);
    if (!employerKey) return;

    const existingEmployer = employerMap.get(employerKey);
    const displayName = existingEmployer?.name || employerRaw;
    const employerEntry = existingEmployer ?? {
      employerKey,
      name: displayName,
      total: 0,
      count: 0,
    };
    employerEntry.total += record.amount;
    employerEntry.count += 1;
    employerMap.set(employerKey, employerEntry);
  });

  const topRecipients = Array.from(recipientMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topEmployers = Array.from(employerMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  return { summary, topRecipients, topEmployers };
};
