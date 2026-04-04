import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchInput from '../../components/SearchInput';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { computeRacesData, type RaceRow } from '../../data/raceAggregation';
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

const LfucgRacesPage = () => {
  const { data, loading, error } = useLfucgContributors();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'office' | 'amount' | 'candidates'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'office' | 'amount' | 'candidates') => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDir) => (currentDir === 'asc' ? 'desc' : 'asc'));
        return currentField;
      }
      setSortDirection('desc');
      return field;
    });
  };

  const races = useMemo(() => computeRacesData(data), [data]);

  const filteredRaces = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return races;
    return races.filter(
      (race) =>
        race.office.toLowerCase().includes(searchValue) ||
        race.leadingCandidate.toLowerCase().includes(searchValue) ||
        race.candidates.some((c) => c.name.toLowerCase().includes(searchValue)),
    );
  }, [races, search]);

  const sortedRaces = useMemo(() => {
    const entries = [...filteredRaces];
    entries.sort((a, b) => {
      let comparison: number;
      switch (sortField) {
        case 'office':
          comparison = a.office.localeCompare(b.office, undefined, { sensitivity: 'base' });
          break;
        case 'candidates':
          comparison = a.candidateCount - b.candidateCount;
          break;
        case 'amount':
        default:
          comparison = a.totalRaised - b.totalRaised;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return entries;
  }, [filteredRaces, sortDirection, sortField]);

  const columns: ColumnDef<RaceRow>[] = [
    {
      key: 'office',
      label: 'Office',
      sortField: 'office',
      primary: true,
      render: (race) => <Link to={`/races/${race.slug}`}>{race.office}</Link>,
    },
    {
      key: 'candidates',
      label: 'Candidates',
      sortField: 'candidates',
      render: (race) => race.candidateCount.toLocaleString(),
    },
    {
      key: 'amount',
      label: 'Total Raised',
      sortField: 'amount',
      highlight: true,
      render: (race) => formatCurrency(race.totalRaised),
    },
    {
      key: 'topCandidate',
      label: 'Top Candidate',
      hideOnMobile: true,
      render: (race) =>
        race.leadingCandidate ? `${race.leadingCandidate} (${formatCurrency(race.leadingCandidateAmount)})` : '\u2014',
    },
    {
      key: 'contributors',
      label: 'Contributors',
      hideOnMobile: true,
      render: (race) => race.contributorCount.toLocaleString(),
    },
  ];

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading race data...</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5">Races</Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredRaces.length.toLocaleString()} races shown
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
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 5' } }}>
          <SearchInput label="Search" placeholder="Office or candidate name" value={search} onChange={setSearch} />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 4' } }}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortField}
              label="Sort"
              onChange={(e) => setSortField(e.target.value as 'amount' | 'office' | 'candidates')}
            >
              <MenuItem value="amount">Total raised</MenuItem>
              <MenuItem value="office">Office name</MenuItem>
              <MenuItem value="candidates">Number of candidates</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 3' } }}>
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
        rows={sortedRaces}
        getRowKey={(race) => race.slug}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        sx={{ mt: 1 }}
      />
    </Box>
  );
};

export default LfucgRacesPage;
