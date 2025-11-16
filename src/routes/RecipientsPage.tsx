import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import { useContributors } from '../hooks/useContributors';
import { slugify } from '../data/utils';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

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
  sampleCity: string;
}

const RecipientsPage = () => {
  const { data, loading, error } = useContributors();
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [sortField, setSortField] = useState<'amount' | 'recipient'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const offices = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.officeSought))).filter(Boolean).sort();
  }, [data]);

  const aggregates = useMemo<RecipientAggregate[]>(() => {
    const map = new Map<string, RecipientAggregate>();

    data.forEach((record) => {
      const key = record.recipientFullName || 'Unknown recipient';
      const existing = map.get(key) ?? {
        name: key,
        total: 0,
        count: 0,
        office: record.officeSought,
        sampleCity: record.city ? `${record.city}, ${record.state}` : record.location,
      };
      existing.total += record.amount;
      existing.count += 1;
      if (!existing.office && record.officeSought) {
        existing.office = record.officeSought;
      }
      if (!existing.sampleCity) {
        existing.sampleCity = record.city ? `${record.city}, ${record.state}` : record.location;
      }
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
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
      let comparison = 0;
      if (sortField === 'amount') {
        comparison = a.total - b.total;
      } else {
        comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return entries;
  }, [filteredAggregates, sortDirection, sortField]);

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading recipient rollups…</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5">Recipients</Typography>
        <Typography variant="body2" color="text.secondary">{filteredAggregates.length.toLocaleString()} recipients shown</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2, my: 1, alignItems: 'center' }}>
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
          <SearchInput label="Search" placeholder="Recipient name" value={search} onChange={setSearch} />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 3' } }}>
          <FormControl fullWidth size="small">
            <InputLabel>Office</InputLabel>
            <Select value={officeFilter} label="Office" onChange={(e) => setOfficeFilter(e.target.value)}>
              <MenuItem value="all">All offices</MenuItem>
              {offices.map((office) => (
                <MenuItem key={office} value={office}>{office || 'Not listed'}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 3' } }}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort</InputLabel>
            <Select value={sortField} label="Sort" onChange={(e) => setSortField(e.target.value as 'amount' | 'recipient')}>
              <MenuItem value="amount">Amount</MenuItem>
              <MenuItem value="recipient">Recipient</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
          <Button fullWidth size="small" variant="outlined" onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}>
            {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Recipient</TableCell>
              <TableCell>Office</TableCell>
              <TableCell>Entries</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Average</TableCell>
              <TableCell>Sample Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAggregates.slice(0, 200).map((entry) => (
              <TableRow key={entry.name} hover>
                <TableCell>
                  <Link to={`/recipients/${slugify(entry.name)}`}>{entry.name}</Link>
                </TableCell>
                <TableCell>{entry.office || '—'}</TableCell>
                <TableCell>{entry.count.toLocaleString()}</TableCell>
                <TableCell>{formatCurrency(entry.total)}</TableCell>
                <TableCell>{formatCurrency(entry.total / entry.count)}</TableCell>
                <TableCell>{entry.sampleCity || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {sortedAggregates.length > 200 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Showing the first 200 recipients by filter. Add search terms to drill deeper.
        </Typography>
      )}
    </Box>
  );
};

export default RecipientsPage;
