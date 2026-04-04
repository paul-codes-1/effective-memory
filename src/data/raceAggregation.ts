import type { ContributorRecord } from './types';
import { slugify, normalizeEmployerKey } from './utils';

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
/* ------------------------------------------------------------------ */

export interface CandidateSummary {
  name: string;
  slug: string;
  total: number;
  count: number;
}

export interface RaceRow {
  office: string;
  slug: string;
  candidates: CandidateSummary[];
  candidateCount: number;
  totalRaised: number;
  contributorCount: number;
  leadingCandidate: string;
  leadingCandidateAmount: number;
}

export interface EmployerStat {
  employerKey: string;
  name: string;
  total: number;
  count: number;
}

export interface CandidateBreakdown {
  name: string;
  slug: string;
  total: number;
  count: number;
  avg: number;
  topEmployers: EmployerStat[];
}

export interface DonorOverlapRecord {
  identityKey: string;
  contributorName: string;
  candidateCount: number;
  totalAmount: number;
  breakdown: { candidateName: string; amount: number }[];
}

export interface DonorOverlapData {
  overlapCount: number;
  overlapPercentage: number;
  overlappingDonors: DonorOverlapRecord[];
}

export interface RaceDetail {
  office: string;
  slug: string;
  candidates: CandidateBreakdown[];
  donorOverlap: DonorOverlapData;
  totalRaised: number;
  contributorCount: number;
  avgPerCandidate: number;
}

/* ------------------------------------------------------------------ */
/*  computeRacesData                                                  */
/* ------------------------------------------------------------------ */

/** Computes a summary row for each office (race) in the dataset. */
export const computeRacesData = (data: ContributorRecord[]): RaceRow[] => {
  if (!data.length) return [];

  const officeMap = new Map<string, ContributorRecord[]>();

  data.forEach((record) => {
    const office = record.officeSought || 'Unknown';
    const bucket = officeMap.get(office);
    if (bucket) {
      bucket.push(record);
    } else {
      officeMap.set(office, [record]);
    }
  });

  const rows: RaceRow[] = [];

  officeMap.forEach((records, office) => {
    const candidateMap = new Map<string, CandidateSummary>();

    records.forEach((r) => {
      const name = r.recipientFullName || 'Unknown recipient';
      const entry = candidateMap.get(name);
      if (entry) {
        entry.total += r.amount;
        entry.count += 1;
      } else {
        candidateMap.set(name, {
          name,
          slug: slugify(name),
          total: r.amount,
          count: 1,
        });
      }
    });

    const candidates = Array.from(candidateMap.values()).sort((a, b) => b.total - a.total);
    const leader = candidates[0];

    rows.push({
      office,
      slug: slugify(office),
      candidates,
      candidateCount: candidates.length,
      totalRaised: records.reduce((sum, r) => sum + r.amount, 0),
      contributorCount: new Set(records.map((r) => r.identityKey)).size,
      leadingCandidate: leader?.name ?? '',
      leadingCandidateAmount: leader?.total ?? 0,
    });
  });

  return rows.sort((a, b) => b.totalRaised - a.totalRaised);
};

/* ------------------------------------------------------------------ */
/*  computeRaceDetail                                                 */
/* ------------------------------------------------------------------ */

/** Computes detailed per-candidate breakdowns and donor overlap for a single race (office). */
export const computeRaceDetail = (data: ContributorRecord[], officeSlug: string): RaceDetail | null => {
  const raceRecords = data.filter((r) => slugify(r.officeSought || 'Unknown') === officeSlug);
  if (!raceRecords.length) return null;

  const office = raceRecords[0].officeSought || 'Unknown';

  // Group records by candidate (recipient)
  const candidateRecordsMap = new Map<string, ContributorRecord[]>();
  raceRecords.forEach((r) => {
    const name = r.recipientFullName || 'Unknown recipient';
    const bucket = candidateRecordsMap.get(name);
    if (bucket) {
      bucket.push(r);
    } else {
      candidateRecordsMap.set(name, [r]);
    }
  });

  // Build candidate breakdowns
  const candidates: CandidateBreakdown[] = [];

  candidateRecordsMap.forEach((records, name) => {
    const total = records.reduce((sum, r) => sum + r.amount, 0);
    const count = records.length;

    // Top employers for this candidate
    const employerMap = new Map<string, EmployerStat>();
    records.forEach((r) => {
      const raw = r.employer?.trim() || '';
      const key = normalizeEmployerKey(raw);
      if (!key) return;

      const existing = employerMap.get(key);
      if (existing) {
        existing.total += r.amount;
        existing.count += 1;
      } else {
        employerMap.set(key, {
          employerKey: key,
          name: raw,
          total: r.amount,
          count: 1,
        });
      }
    });

    const topEmployers = Array.from(employerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    candidates.push({
      name,
      slug: slugify(name),
      total,
      count,
      avg: count > 0 ? total / count : 0,
      topEmployers,
    });
  });

  candidates.sort((a, b) => b.total - a.total);

  // Donor overlap: find contributors who gave to multiple candidates in this race
  const donorCandidateMap = new Map<string, { name: string; perCandidate: Map<string, number>; totalAmount: number }>();

  raceRecords.forEach((r) => {
    const key = r.identityKey;
    const recipient = r.recipientFullName || 'Unknown recipient';
    const existing = donorCandidateMap.get(key);
    if (existing) {
      existing.perCandidate.set(recipient, (existing.perCandidate.get(recipient) || 0) + r.amount);
      existing.totalAmount += r.amount;
    } else {
      donorCandidateMap.set(key, {
        name: r.contributorFullName || 'Unknown',
        perCandidate: new Map([[recipient, r.amount]]),
        totalAmount: r.amount,
      });
    }
  });

  const overlappingDonors: DonorOverlapRecord[] = [];
  donorCandidateMap.forEach((entry, identityKey) => {
    if (entry.perCandidate.size > 1) {
      const breakdown = Array.from(entry.perCandidate.entries())
        .map(([candidateName, amount]) => ({ candidateName, amount }))
        .sort((a, b) => b.amount - a.amount);

      overlappingDonors.push({
        identityKey,
        contributorName: entry.name,
        candidateCount: entry.perCandidate.size,
        totalAmount: entry.totalAmount,
        breakdown,
      });
    }
  });

  overlappingDonors.sort((a, b) => b.totalAmount - a.totalAmount);

  const totalContributors = new Set(raceRecords.map((r) => r.identityKey)).size;
  const totalRaised = raceRecords.reduce((sum, r) => sum + r.amount, 0);

  const donorOverlap: DonorOverlapData = {
    overlapCount: overlappingDonors.length,
    overlapPercentage: totalContributors > 0 ? (overlappingDonors.length / totalContributors) * 100 : 0,
    overlappingDonors,
  };

  return {
    office,
    slug: officeSlug,
    candidates,
    donorOverlap,
    totalRaised,
    contributorCount: totalContributors,
    avgPerCandidate: candidates.length > 0 ? totalRaised / candidates.length : 0,
  };
};
