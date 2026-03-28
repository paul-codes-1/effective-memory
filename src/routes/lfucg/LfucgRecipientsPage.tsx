import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchInput from '../../components/SearchInput';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify } from '../../data/utils';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import ResponsiveTable, { ColumnDef } from '../../components/ResponsiveTable';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

interface RecipientAggregate {
  name: string;
  total: number;
  count: number;
  office: string;
  topEmployer: string;
  topEmployerAmount: number;
}

const LfucgRecipientsPage = () => {
  const { data, loading, error } = useLfucgContributors();
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [sortField, setSortField] = useState<'amount' | 'recipient' | 'contributors'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'amount' | 'recipient' | 'contributors') => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDir) => (currentDir === 'asc' ? 'desc' : 'asc'));
        return currentField;
      }
      setSortDirection('desc');
      return field;
    });
  };

  const offices = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.officeSought)))
      .filter(Boolean)
      .sort();
  }, [data]);

  const aggregates = useMemo<RecipientAggregate[]>(() => {
    type AggregateWithMeta = RecipientAggregate & {
      employerCounts: Record<string, number>;
      employerAmounts: Record<string, number>;
    };
    const map = new Map<string, AggregateWithMeta>();

    data.forEach((record) => {
      const key = record.recipientFullName || 'Unknown recipient';
      const existing = map.get(key) ?? {
        name: key,
        total: 0,
        count: 0,
        office: record.officeSought,
        topEmployer: '',
        topEmployerAmount: 0,
        employerCounts: {},
        employerAmounts: {},
      };
      existing.total += record.amount;
      existing.count += 1;
      if (!existing.office && record.officeSought) {
        existing.office = record.officeSought;
      }

      const employer = record.employer?.trim();
      if (employer && employer.toLowerCase() !== 'retired') {
        existing.employerCounts[employer] = (existing.employerCounts[employer] ?? 0) + 1;
        existing.employerAmounts[employer] = (existing.employerAmounts[employer] ?? 0) + record.amount;
        const currentTopEmployerAmount = existing.topEmployer
          ? (existing.employerAmounts[existing.topEmployer] ?? 0)
          : 0;
        if (existing.employerAmounts[employer] > currentTopEmployerAmount) {
          existing.topEmployer = employer;
          existing.topEmployerAmount = existing.employerAmounts[employer];
        }
      }
      map.set(key, existing);
    });

    return Array.from(map.values())
      .map(({ employerCounts: _ec, employerAmounts: _ea, ...rest }) => rest)
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const filteredAggregates = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return aggregates.filter((entry) => {
      const matchesSearch = searchValue ? entry.name.toLowerCase().includes(searchValue) : true;
      const matchesOffice = officeFilter === 'all' || entry.office === officeFilter;
      return matchesSearch && matchesOffice;
    });
  }, [aggregates, officeFilter, search]);

  const sortedAggregates = useMemo(() => {
    const entries = [...filteredAggregates];
    entries.sort((a, b) => {
      let comparison: number;
      switch (sortField) {
        case 'recipient':
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'contributors':
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

  const columns: ColumnDef<RecipientAggregate>[] = [
    {
      key: 'recipient',
      label: 'Recipient',
      sortField: 'recipient',
      primary: true,
      render: (entry) => <Link to={`/recipients/${slugify(entry.name)}`}>{entry.name}</Link>,
    },
    { key: 'office', label: 'Office', hideOnMobile: true, render: (entry) => entry.office || '—' },
    { key: 'entries', label: 'Entries', sortField: 'contributors', render: (entry) => entry.count.toLocaleString() },
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
    {
      key: 'topEmployer',
      label: 'Top Employer',
      hideOnMobile: true,
      render: (entry) =>
        entry.topEmployer ? `${entry.topEmployer} (${formatCurrency(entry.topEmployerAmount)})` : '—',
    },
  ];

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading recipient rollups...</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5">Recipients</Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredAggregates.length.toLocaleString()} recipients shown
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(12, 1fr)' },
          gap: { xs: 1, md: 2 },
          my: 1,
          alignItems: 'center',
        }}
      >
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
          <SearchInput label="Search" placeholder="Recipient name" value={search} onChange={setSearch} />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 3' } }}>
          <FormControl fullWidth size="small">
            <InputLabel>Office</InputLabel>
            <Select value={officeFilter} label="Office" onChange={(e) => setOfficeFilter(e.target.value)}>
              <MenuItem value="all">All offices</MenuItem>
              {offices.map((office) => (
                <MenuItem key={office} value={office}>
                  {office || 'Not listed'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 3' } }}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortField}
              label="Sort"
              onChange={(e) => setSortField(e.target.value as 'amount' | 'recipient' | 'contributors')}
            >
              <MenuItem value="amount">Total amount</MenuItem>
              <MenuItem value="recipient">Recipient name</MenuItem>
              <MenuItem value="contributors">Number of contributions</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </Box>
      </Box>

      <ResponsiveTable
        columns={columns}
        rows={sortedAggregates.slice(0, 200)}
        getRowKey={(entry) => entry.name}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        sx={{ mt: 1 }}
      />

      {sortedAggregates.length > 200 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Showing the first 200 recipients by filter. Add search terms to drill deeper.
        </Typography>
      )}
    </Box>
  );
};

export default LfucgRecipientsPage;
