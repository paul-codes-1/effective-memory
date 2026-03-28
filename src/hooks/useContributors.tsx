import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ContributorRecord, ContributorTotalsMap, ContributorsState, RawContributorRecord } from '../data/types';
import { mapRecord } from '../data/mapRecord';

const ContributorsContext = createContext<ContributorsState | undefined>(undefined);

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
        const rawTotals: Record<string, { fullName: string; totalAmount: number; contributionCount: number }> =
          await totalsResponse.json();
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
