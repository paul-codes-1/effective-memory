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

const ContributorsContext = createContext<ContributorsState | undefined>(undefined);

const normalize = (value?: string) => (value ?? '').trim();

const parseAmount = (value?: string): number => {
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
  const contributorFullName =
    buildFullName(contributorFirstName, contributorLastName) ||
    normalize(raw['From Organization Name']) ||
    'Unknown contributor';
  const recipientFullName = buildFullName(recipientFirstName, recipientLastName) || normalize(raw['To Organization']) || 'Unknown recipient';

  return {
    id: `${index}-${contributorFullName}-${recipientFullName}-${normalize(raw['Receipt Date'])}`,
    toOrganization: normalize(raw['To Organization']),
    fromOrganizationName: normalize(raw['From Organization Name']),
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
    contributionType: normalize(raw['Contribution Type']),
    contributionMode: normalize(raw['Contribution Mode']),
    occupation: normalize(raw.Occupation),
    otherOccupation: normalize(raw['Other Occupation']),
    employer: normalize(raw.Employer),
    receiptDate: normalize(raw['Receipt Date']),
  };
};

export const ContributorsProvider = ({ children }: PropsWithChildren) => {
  const [data, setData] = useState<ContributorRecord[]>([]);
  const [totals, setTotals] = useState<ContributorTotalsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [recordsResponse, totalsResponse] = await Promise.all([
          fetch('/data/contributors.json'),
          fetch('/data/contributor_totals.json'),
        ]);
        if (!recordsResponse.ok) {
          throw new Error('Failed to load contributors data');
        }
        if (!totalsResponse.ok) {
          throw new Error('Failed to load contributor totals');
        }
        const rawData: RawContributorRecord[] = await recordsResponse.json();
        const rawTotals: Record<
          string,
          { fullName: string; totalAmount: number; contributionCount: number }
        > = await totalsResponse.json();
        if (!isMounted) return;
        const mapped = rawData.map(mapRecord);
        const normalizedTotals = Object.entries(rawTotals).reduce<ContributorTotalsMap>((acc, [key, value]) => {
          acc[key] = { key, ...value };
          return acc;
        }, {});
        setData(mapped);
        setTotals(normalizedTotals);
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

  return <ContributorsContext.Provider value={value}>{children}</ContributorsContext.Provider>;
};

export const useContributors = () => {
  const context = useContext(ContributorsContext);
  if (!context) {
    throw new Error('useContributors must be used within ContributorsProvider');
  }
  return context;
};
