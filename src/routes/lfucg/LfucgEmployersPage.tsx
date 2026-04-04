import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchInput from '../../components/SearchInput';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify, normalizeEmployerKey } from '../../data/utils';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ResponsiveTable, { ColumnDef } from '../../components/ResponsiveTable';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

interface EmployerAggregate {
  employerKey: string;
  name: string;
  total: number;
  count: number;
  contributorCount: number;
  recipientCount: number;
}

const LfucgEmployersPage = () => {
  const { data, loading, error } = useLfucgContributors();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'amount' | 'employer' | 'entries'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'amount' | 'employer' | 'entries') => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDir) => (currentDir === 'asc' ? 'desc' : 'asc'));
        return currentField;
      }
      setSortDirection('desc');
      return field;
    });
  };

  const aggregates = useMemo<EmployerAggregate[]>(() => {
    const map = new Map<string, EmployerAggregate & { contributors: Set<string>; recipients: Set<string> }>();

    data.forEach((record) => {
      const raw = record.employer?.trim() || '';
      const key = normalizeEmployerKey(raw);
      if (!key) return;

      const existing = map.get(key) ?? {
        employerKey: key,
        name: raw,
        total: 0,
        count: 0,
        contributorCount: 0,
        recipientCount: 0,
        contributors: new Set<string>(),
        recipients: new Set<string>(),
      };
      existing.total += record.amount;
      existing.count += 1;
      if (record.contributorFullName) existing.contributors.add(record.contributorFullName);
      if (record.recipientFullName) existing.recipients.add(record.recipientFullName);
      map.set(key, existing);
    });

    return Array.from(map.values()).map(({ contributors, recipients, ...rest }) => ({
      ...rest,
      contributorCount: contributors.size,
      recipientCount: recipients.size,
    }));
  }, [data]);

  const filteredAggregates = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return aggregates;
    return aggregates.filter((entry) => entry.name.toLowerCase().includes(searchValue));
  }, [aggregates, search]);

  const sortedAggregates = useMemo(() => {
    const entries = [...filteredAggregates];
    entries.sort((a, b) => {
      let comparison: number;
      switch (sortField) {
        case 'employer':
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'entries':
          comparison = a.count - b.count;
          break;
        case 'amount':
        default:
          comparison = a.total - b.total;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return entries;
  }, [filteredAggregates, sortDirection, sortField]);

  const columns: ColumnDef<EmployerAggregate>[] = [
    {
      key: 'employer',
      label: 'Employer',
      sortField: 'employer',
      primary: true,
      render: (entry) => <Link to={`/employers/${slugify(entry.employerKey)}`}>{entry.name}</Link>,
    },
    {
      key: 'entries',
      label: 'Entries',
      sortField: 'entries',
      render: (entry) => entry.count.toLocaleString(),
    },
    {
      key: 'contributors',
      label: 'Contributors',
      hideOnMobile: true,
      render: (entry) => entry.contributorCount.toLocaleString(),
    },
    {
      key: 'recipients',
      label: 'Recipients',
      hideOnMobile: true,
      render: (entry) => entry.recipientCount.toLocaleString(),
    },
    {
      key: 'amount',
      label: 'Total Amount',
      sortField: 'amount',
      highlight: true,
      render: (entry) => formatCurrency(entry.total),
    },
    {
      key: 'average',
      label: 'Average',
      hideOnMobile: true,
      render: (entry) => formatCurrency(entry.total / entry.count),
    },
  ];

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading employer data...</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5">Employers</Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredAggregates.length.toLocaleString()} employers shown
        </Typography>
      </Box>

      <Box sx={{ my: 1, maxWidth: { xs: '100%', md: '33%' } }}>
        <SearchInput label="Search" placeholder="Employer name" value={search} onChange={setSearch} />
      </Box>

      <ResponsiveTable
        columns={columns}
        rows={sortedAggregates.slice(0, 200)}
        getRowKey={(entry) => entry.employerKey}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        sx={{ mt: 1 }}
      />

      {sortedAggregates.length > 200 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Showing the first 200 employers by filter. Add search terms to drill deeper.
        </Typography>
      )}
    </Box>
  );
};

export default LfucgEmployersPage;
