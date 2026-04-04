import { describe, it, expect } from 'vitest';
import { computeRacesData, computeRaceDetail } from './raceAggregation';
import { mappedRecords } from '../test/fixtures/contributors';
import type { ContributorRecord } from './types';

describe('computeRacesData', () => {
  const races = computeRacesData(mappedRecords);

  it('returns empty array for empty data', () => {
    expect(computeRacesData([])).toEqual([]);
  });

  it('groups records into one row per office', () => {
    const offices = races.map((r) => r.office);
    expect(offices).toContain('MAYOR');
    expect(offices).toContain('COUNCIL MEMBER');
    expect(races).toHaveLength(2);
  });

  it('sorts races by totalRaised descending', () => {
    for (let i = 1; i < races.length; i++) {
      expect(races[i - 1].totalRaised).toBeGreaterThanOrEqual(races[i].totalRaised);
    }
  });

  it('computes totalRaised as sum of amounts for each race', () => {
    const mayor = races.find((r) => r.office === 'MAYOR')!;
    // Records 0 ($100), 2 ($200), 3 ($500), 6 ($0) = $800
    expect(mayor.totalRaised).toBe(800);

    const council = races.find((r) => r.office === 'COUNCIL MEMBER')!;
    // Records 1 ($50), 4 ($25), 5 (-$50) = $25
    expect(council.totalRaised).toBe(25);
  });

  it('counts unique contributors per race by identityKey', () => {
    const mayor = races.find((r) => r.office === 'MAYOR')!;
    // john-smith, alice-brown, protect-lex-pac, charlie-davis = 4
    expect(mayor.contributorCount).toBe(4);

    const council = races.find((r) => r.office === 'COUNCIL MEMBER')!;
    // john-smith, anonymous-4, alice-brown = 3
    expect(council.contributorCount).toBe(3);
  });

  it('lists candidates per race sorted by total descending', () => {
    const mayor = races.find((r) => r.office === 'MAYOR')!;
    expect(mayor.candidates).toHaveLength(1);
    expect(mayor.candidates[0].name).toBe('Jane Doe');
    expect(mayor.candidates[0].total).toBe(800);
    expect(mayor.candidates[0].count).toBe(4);

    const council = races.find((r) => r.office === 'COUNCIL MEMBER')!;
    expect(council.candidates).toHaveLength(1);
    expect(council.candidates[0].name).toBe('Bob Jones');
    expect(council.candidates[0].total).toBe(25);
    expect(council.candidates[0].count).toBe(3);
  });

  it('sets candidateCount to number of distinct candidates', () => {
    const mayor = races.find((r) => r.office === 'MAYOR')!;
    expect(mayor.candidateCount).toBe(1);
  });

  it('sets leadingCandidate to the top-funded candidate', () => {
    const mayor = races.find((r) => r.office === 'MAYOR')!;
    expect(mayor.leadingCandidate).toBe('Jane Doe');
    expect(mayor.leadingCandidateAmount).toBe(800);
  });

  it('generates slug for each race from office name', () => {
    const mayor = races.find((r) => r.office === 'MAYOR')!;
    expect(mayor.slug).toBe('mayor');

    const council = races.find((r) => r.office === 'COUNCIL MEMBER')!;
    expect(council.slug).toBe('council-member');
  });

  it('generates slug for each candidate from their name', () => {
    const mayor = races.find((r) => r.office === 'MAYOR')!;
    expect(mayor.candidates[0].slug).toBe('jane-doe');
  });

  it('uses "Unknown" for records with empty officeSought', () => {
    const recordWithNoOffice: ContributorRecord = {
      ...mappedRecords[0],
      officeSought: '',
    };
    const result = computeRacesData([recordWithNoOffice]);
    expect(result[0].office).toBe('Unknown');
    expect(result[0].slug).toBe('unknown');
  });
});

describe('computeRaceDetail', () => {
  it('returns null for non-existent office slug', () => {
    expect(computeRaceDetail(mappedRecords, 'nonexistent')).toBeNull();
  });

  it('returns null for empty data', () => {
    expect(computeRaceDetail([], 'mayor')).toBeNull();
  });

  it('returns detail for the MAYOR race', () => {
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    expect(detail).not.toBeNull();
    expect(detail.office).toBe('MAYOR');
    expect(detail.slug).toBe('mayor');
    expect(detail.totalRaised).toBe(800);
  });

  it('computes per-candidate breakdown with total, count, avg', () => {
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    expect(detail.candidates).toHaveLength(1);

    const janeDoe = detail.candidates[0];
    expect(janeDoe.name).toBe('Jane Doe');
    expect(janeDoe.total).toBe(800);
    expect(janeDoe.count).toBe(4);
    expect(janeDoe.avg).toBe(200); // 800 / 4
  });

  it('computes per-candidate breakdown for COUNCIL MEMBER', () => {
    const detail = computeRaceDetail(mappedRecords, 'council-member')!;
    expect(detail.candidates).toHaveLength(1);

    const bobJones = detail.candidates[0];
    expect(bobJones.name).toBe('Bob Jones');
    expect(bobJones.total).toBe(25);
    expect(bobJones.count).toBe(3);
    expect(bobJones.avg).toBeCloseTo(25 / 3);
  });

  it('counts unique contributors in race detail', () => {
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    expect(detail.contributorCount).toBe(4);
  });

  it('computes avgPerCandidate', () => {
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    expect(detail.avgPerCandidate).toBe(800); // 800 / 1 candidate
  });

  it('includes top employers for each candidate', () => {
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    const janeDoe = detail.candidates[0];
    // Record 0: FCPS ($100), Record 2: Brown & Associates ($200)
    // Records 3, 6 have no employer
    expect(janeDoe.topEmployers.length).toBeGreaterThanOrEqual(2);

    const employerKeys = janeDoe.topEmployers.map((e) => e.employerKey);
    expect(employerKeys).toContain('Fayette County Public Schools');
    expect(employerKeys).toContain('brown & associates');
  });

  it('sorts top employers by total descending', () => {
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    const employers = detail.candidates[0].topEmployers;
    for (let i = 1; i < employers.length; i++) {
      expect(employers[i - 1].total).toBeGreaterThanOrEqual(employers[i].total);
    }
  });

  it('excludes empty employers from topEmployers', () => {
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    const employers = detail.candidates[0].topEmployers;
    const keys = employers.map((e) => e.employerKey);
    expect(keys).not.toContain('');
  });

  it('returns empty donorOverlap when no contributor gives to multiple candidates in a race', () => {
    // In fixture data, each race has only one candidate, so no overlap is possible
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    expect(detail.donorOverlap.overlapCount).toBe(0);
    expect(detail.donorOverlap.overlapPercentage).toBe(0);
    expect(detail.donorOverlap.overlappingDonors).toEqual([]);
  });
});

describe('computeRaceDetail — donor overlap', () => {
  // Create a race with two candidates where some donors give to both
  const twoCandidate: ContributorRecord[] = [
    {
      ...mappedRecords[0],
      officeSought: 'MAYOR',
      recipientFullName: 'Candidate A',
      identityKey: 'shared-donor',
      contributorFullName: 'Shared Donor',
      amount: 100,
    },
    {
      ...mappedRecords[0],
      officeSought: 'MAYOR',
      recipientFullName: 'Candidate B',
      identityKey: 'shared-donor',
      contributorFullName: 'Shared Donor',
      amount: 200,
    },
    {
      ...mappedRecords[0],
      officeSought: 'MAYOR',
      recipientFullName: 'Candidate A',
      identityKey: 'exclusive-donor',
      contributorFullName: 'Exclusive Donor',
      amount: 50,
    },
  ];

  const detail = computeRaceDetail(twoCandidate, 'mayor')!;

  it('detects donors who gave to multiple candidates', () => {
    expect(detail.donorOverlap.overlapCount).toBe(1);
    expect(detail.donorOverlap.overlappingDonors).toHaveLength(1);
    expect(detail.donorOverlap.overlappingDonors[0].identityKey).toBe('shared-donor');
    expect(detail.donorOverlap.overlappingDonors[0].contributorName).toBe('Shared Donor');
  });

  it('computes overlap percentage', () => {
    // 1 overlapping out of 2 total contributors = 50%
    expect(detail.donorOverlap.overlapPercentage).toBe(50);
  });

  it('includes per-candidate breakdown in overlap record', () => {
    const donor = detail.donorOverlap.overlappingDonors[0];
    expect(donor.candidateCount).toBe(2);
    expect(donor.breakdown).toHaveLength(2);
    // Breakdown sorted by amount descending
    expect(donor.breakdown[0].candidateName).toBe('Candidate B');
    expect(donor.breakdown[0].amount).toBe(200);
    expect(donor.breakdown[1].candidateName).toBe('Candidate A');
    expect(donor.breakdown[1].amount).toBe(100);
  });

  it('sums the overlapping donor total across all candidates', () => {
    expect(detail.donorOverlap.overlappingDonors[0].totalAmount).toBe(300);
  });

  it('excludes donors who only gave to one candidate from overlap', () => {
    const overlapKeys = detail.donorOverlap.overlappingDonors.map((d) => d.identityKey);
    expect(overlapKeys).not.toContain('exclusive-donor');
  });

  it('sorts overlap donors by totalAmount descending', () => {
    const extendedRecords: ContributorRecord[] = [
      ...twoCandidate,
      {
        ...mappedRecords[0],
        officeSought: 'MAYOR',
        recipientFullName: 'Candidate A',
        identityKey: 'big-donor',
        contributorFullName: 'Big Donor',
        amount: 500,
      },
      {
        ...mappedRecords[0],
        officeSought: 'MAYOR',
        recipientFullName: 'Candidate B',
        identityKey: 'big-donor',
        contributorFullName: 'Big Donor',
        amount: 400,
      },
    ];
    const extDetail = computeRaceDetail(extendedRecords, 'mayor')!;
    expect(extDetail.donorOverlap.overlappingDonors).toHaveLength(2);
    expect(extDetail.donorOverlap.overlappingDonors[0].identityKey).toBe('big-donor');
    expect(extDetail.donorOverlap.overlappingDonors[0].totalAmount).toBe(900);
    expect(extDetail.donorOverlap.overlappingDonors[1].identityKey).toBe('shared-donor');
  });

  it('lists multiple candidates per race sorted by total descending', () => {
    expect(detail.candidates).toHaveLength(2);
    expect(detail.candidates[0].name).toBe('Candidate B');
    expect(detail.candidates[0].total).toBe(200);
    expect(detail.candidates[1].name).toBe('Candidate A');
    expect(detail.candidates[1].total).toBe(150);
  });
});

describe('computeRacesData — edge cases', () => {
  it('handles single-candidate race', () => {
    const singleCandidate: ContributorRecord[] = [
      {
        ...mappedRecords[0],
        officeSought: 'SHERIFF',
        recipientFullName: 'Solo Runner',
        amount: 1000,
      },
    ];
    const races = computeRacesData(singleCandidate);
    expect(races).toHaveLength(1);
    expect(races[0].candidates).toHaveLength(1);
    expect(races[0].candidates[0].name).toBe('Solo Runner');
    expect(races[0].totalRaised).toBe(1000);
    expect(races[0].candidateCount).toBe(1);
    expect(races[0].leadingCandidate).toBe('Solo Runner');
  });

  it('handles zero-amount contributions', () => {
    const zeroRecords: ContributorRecord[] = [
      { ...mappedRecords[0], officeSought: 'CLERK', amount: 0 },
      { ...mappedRecords[0], officeSought: 'CLERK', amount: 0 },
    ];
    const races = computeRacesData(zeroRecords);
    expect(races[0].totalRaised).toBe(0);
    expect(races[0].candidates[0].total).toBe(0);
  });

  it('includes refunds (negative amounts) in totals', () => {
    const refundRecords: ContributorRecord[] = [
      { ...mappedRecords[0], officeSought: 'JUDGE', amount: 500 },
      { ...mappedRecords[0], officeSought: 'JUDGE', amount: -200 },
    ];
    const races = computeRacesData(refundRecords);
    expect(races[0].totalRaised).toBe(300);
  });
});

describe('computeRaceDetail — edge cases', () => {
  it('computes avg as total/count for each candidate', () => {
    const detail = computeRaceDetail(mappedRecords, 'mayor')!;
    detail.candidates.forEach((c) => {
      expect(c.avg).toBe(c.total / c.count);
    });
  });

  it('handles race with missing office via "Unknown" slug', () => {
    const noOffice: ContributorRecord[] = [{ ...mappedRecords[0], officeSought: '', amount: 100 }];
    const detail = computeRaceDetail(noOffice, 'unknown')!;
    expect(detail).not.toBeNull();
    expect(detail.office).toBe('Unknown');
  });

  it('limits topEmployers to at most 5 per candidate', () => {
    const manyEmployers: ContributorRecord[] = Array.from({ length: 8 }, (_, i) => ({
      ...mappedRecords[0],
      officeSought: 'ASSESSOR',
      employer: `Company ${i}`,
      amount: (i + 1) * 10,
      identityKey: `donor-${i}`,
    }));
    const detail = computeRaceDetail(manyEmployers, 'assessor')!;
    expect(detail.candidates[0].topEmployers.length).toBeLessThanOrEqual(5);
  });
});
