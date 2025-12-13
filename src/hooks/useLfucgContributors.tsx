import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  ContributorRecord,
  ContributorTotalsMap,
  ContributorsState,
  RawContributorRecord,
} from '../data/types';
import { slugify } from '../data/utils';

const LfucgContributorsContext = createContext<ContributorsState | undefined>(undefined);

const normalize = (value?: string | number) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const parseAmount = (value?: string | number): number => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildFullName = (first: string, last: string) => [first, last].filter(Boolean).join(' ').trim();

const mapRecord = (raw: RawContributorRecord, index: number): ContributorRecord => {
  const contributorFirstName = normalize(raw['Contributor First Name']);
  const contributorLastName = normalize(raw['Contributor Last Name']);
  const recipientFirstName = normalize(raw['Recipient First Name']);
  const recipientLastName = normalize(raw['Recipient Last Name']);
  const orgName = normalize(raw['From Organization Name']);
  const contributionType = normalize(raw['Contribution Type']);
  const contributorFullName =
    buildFullName(contributorFirstName, contributorLastName) ||
    orgName ||
    (contributionType === 'ANONYMOUS' ? 'Anonymous' : 'Name unavailable');
  const recipientFullName = buildFullName(recipientFirstName, recipientLastName) || normalize(raw['To Organization']) || 'Unknown recipient';

  const identityKey = slugify(contributorFullName) || `missing-${index}`;
  const isAnonymous = contributionType === 'ANONYMOUS';
  const isNameMissing = !buildFullName(contributorFirstName, contributorLastName) && !orgName;
  const attributionNote = isAnonymous
    ? 'Filed as anonymous per campaign finance report.'
    : isNameMissing
    ? 'Original filing did not include a contributor name.'
    : null;

  return {
    id: `${index}-${contributorFullName}-${recipientFullName}-${normalize(raw['Receipt Date'])}`,
    toOrganization: normalize(raw['To Organization']),
    fromOrganizationName: orgName,
    contributorFirstName,
    contributorLastName,
    contributorFullName,
    recipientFirstName,
    recipientLastName,
    recipientFullName,
    officeSought: normalize(raw['Office Sought']),
    location: normalize(raw.Location),
    electionDate: normalize(raw['Election Date']),
    electionType: normalize(raw['Election Type']),
    exemptionStatus: normalize(raw['Exemption Status']),
    address1: normalize(raw['Address 1']),
    address2: normalize(raw['Address 2']),
    city: normalize(raw.City),
    state: normalize(raw.State),
    zip: normalize(raw.Zip),
    amount: parseAmount(raw.Amount),
    contributionType,
    contributionMode: normalize(raw['Contribution Mode']),
    occupation: normalize(raw.Occupation),
    otherOccupation: normalize(raw['Other Occupation']),
    employer: normalize(raw.Employer),
    receiptDate: normalize(raw['Receipt Date']),
    identityKey,
    isAnonymous,
    isNameMissing,
    attributionNote,
  };
};

export const LfucgContributorsProvider = ({ children }: PropsWithChildren) => {
  const [data, setData] = useState<ContributorRecord[]>([]);
  const [totals, setTotals] = useState<ContributorTotalsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const recordsResponse = await fetch('/data/2026-lfucg-primary-contributions.json');
        if (!recordsResponse.ok) {
          throw new Error('Failed to load LFUCG 2026 Primary data');
        }
        const rawData: RawContributorRecord[] = await recordsResponse.json();
        if (!isMounted) return;

        const mapped = rawData.map(mapRecord);

        // Calculate totals from the data
        const totalsMap: ContributorTotalsMap = {};
        mapped.forEach((record) => {
          const key = record.identityKey;
          if (!totalsMap[key]) {
            totalsMap[key] = {
              key,
              fullName: record.contributorFullName,
              totalAmount: 0,
              contributionCount: 0,
            };
          }
          totalsMap[key].totalAmount += record.amount;
          totalsMap[key].contributionCount += 1;
        });

        setData(mapped);
        setTotals(totalsMap);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<ContributorsState>(
    () => ({
      data,
      totals,
      loading,
      error,
    }),
    [data, totals, loading, error],
  );

  return <LfucgContributorsContext.Provider value={value}>{children}</LfucgContributorsContext.Provider>;
};

export const useLfucgContributors = () => {
  const context = useContext(LfucgContributorsContext);
  if (!context) {
    throw new Error('useLfucgContributors must be used within LfucgContributorsProvider');
  }
  return context;
};
