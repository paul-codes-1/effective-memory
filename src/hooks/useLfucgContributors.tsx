import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ContributorRecord, ContributorTotalsMap, ContributorsState, RawContributorRecord } from '../data/types';
import { mapLfucgRecord } from '../data/mapLfucgRecord';
import { aggregateTotals } from '../data/aggregateTotals';

const LfucgContributorsContext = createContext<ContributorsState | undefined>(undefined);

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

        const mapped = rawData.map(mapLfucgRecord);
        const totalsMap = aggregateTotals(mapped);

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
