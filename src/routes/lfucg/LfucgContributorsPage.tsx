import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchInput from '../../components/SearchInput';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify } from '../../data/utils';
import type { ContributorRecord } from '../../data/types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableSortLabel from '@mui/material/TableSortLabel';
import useTableSort from '../../hooks/useTableSort';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

type ViewMode = 'totals' | 'records';
type SortField = 'amount' | 'contributor' | 'recipient' | 'entries';
const TOTALS_SORT_FIELDS: SortField[] = ['amount', 'contributor', 'entries'];
const RECORD_SORT_FIELDS: SortField[] = ['amount', 'contributor', 'recipient'];

const LfucgContributorsPage = () => {
  const { data, totals, loading, error } = useLfucgContributors();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('totals');
  const [fanOutMode, setFanOutMode] = useState(false);
  const sort = useTableSort<SortField>('amount');

  useEffect(() => {
    if (viewMode === 'records' && fanOutMode) {
      setFanOutMode(false);
    }
  }, [fanOutMode, viewMode]);

  useEffect(() => {
    const allowedFields = viewMode === 'totals' ? TOTALS_SORT_FIELDS : RECORD_SORT_FIELDS;
    if (!allowedFields.includes(sort.sortField)) {
      sort.setSortField(allowedFields[0]);
    }
  }, [sort.sortField, viewMode]);

  const contributionTypes = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.contributionType))).filter(Boolean).sort();
  }, [data]);

  const contributionModes = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.contributionMode))).filter(Boolean).sort();
  }, [data]);

  const searchValue = search.trim().toLowerCase();

  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const matchesSearch = searchValue
        ? [
            record.contributorFullName,
            record.recipientFullName,
            record.city,
            record.state,
            record.officeSought,
            record.employer,
          ]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(searchValue))
        : true;

      const matchesType = typeFilter === 'all' || record.contributionType === typeFilter;
      const matchesMode = modeFilter === 'all' || record.contributionMode === modeFilter;

      return matchesSearch && matchesType && matchesMode;
    });
  }, [data, modeFilter, searchValue, typeFilter]);

  const contributorEmployers = useMemo(() => {
    const map = new Map<string, Set<string>>();
    data.forEach((record) => {
      if (!record.contributorFullName) {
        return;
      }
      const key = slugify(record.contributorFullName);
      if (!key) {
        return;
      }
      if (!map.has(key)) {
        map.set(key, new Set());
      }
      if (record.employer) {
        map.get(key)!.add(record.employer.toLowerCase());
      }
    });
    return map;
  }, [data]);

  const filteredTotals = useMemo(() => {
    const entries = Object.values(totals);
    if (!searchValue) {
      return entries;
    }
    return entries.filter((entry) => {
      if (entry.fullName.toLowerCase().includes(searchValue)) {
        return true;
      }
      const employers = contributorEmployers.get(entry.key);
      if (!employers) {
        return false;
      }
      for (const employer of employers) {
        if (employer.includes(searchValue)) {
          return true;
        }
      }
      return false;
    });
  }, [contributorEmployers, searchValue, totals]);

  const totalDisplayedAmount = useMemo(() => {
    if (viewMode === 'totals') {
      return filteredTotals.reduce((sum, entry) => sum + entry.totalAmount, 0);
    }
    return filteredData.reduce((sum, record) => sum + record.amount, 0);
  }, [filteredData, filteredTotals, viewMode]);

  const sortedRecords = useMemo(() => {
    const records = [...filteredData];
    records.sort((a, b) => {
      let comparison = 0;
      switch (sort.sortField) {
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'contributor':
          comparison = a.contributorFullName.localeCompare(b.contributorFullName, undefined, { sensitivity: 'base' });
          break;
        case 'recipient':
          comparison = a.recipientFullName.localeCompare(b.recipientFullName, undefined, { sensitivity: 'base' });
          break;
        default:
          comparison = 0;
      }
      return sort.sortDirection === 'asc' ? comparison : -comparison;
    });
    return records;
  }, [filteredData, sort.sortDirection, sort.sortField]);

  const sortedTotals = useMemo(() => {
    const entries = [...filteredTotals];
    entries.sort((a, b) => {
      let comparison = 0;
      switch (sort.sortField) {
        case 'contributor':
          comparison = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        case 'entries':
          comparison = a.contributionCount - b.contributionCount;
          break;
        case 'amount':
        default:
          comparison = a.totalAmount - b.totalAmount;
      }
      return sort.sortDirection === 'asc' ? comparison : -comparison;
    });
    return entries;
  }, [filteredTotals, sort.sortDirection, sort.sortField]);

  const fanOutData = useMemo(() => {
    if (!fanOutMode || viewMode !== 'totals') {
      return [];
    }
    const contributorKeys = new Set(filteredTotals.map((entry) => entry.key));
    if (!contributorKeys.size) {
      return [];
    }

    const grouped = new Map<
      string,
      {
        dateLabel: string;
        totalAmount: number;
        entries: ContributorRecord[];
      }
    >();

    data.forEach((record) => {
      const key = slugify(record.contributorFullName);
      if (!contributorKeys.has(key)) {
        return;
      }
      const dateLabel = record.receiptDate || 'No receipt date';
      const group =
        grouped.get(dateLabel) ??
        {
          dateLabel,
          totalAmount: 0,
          entries: [],
        };
      group.totalAmount += record.amount;
      group.entries.push(record);
      grouped.set(dateLabel, group);
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const timeA = Date.parse(a.dateLabel) || 0;
      const timeB = Date.parse(b.dateLabel) || 0;
      return timeB - timeA;
    });
  }, [data, fanOutMode, filteredTotals, viewMode]);

  const sortOptions = (viewMode === 'totals' ? TOTALS_SORT_FIELDS : RECORD_SORT_FIELDS).map((value) => ({
    value,
    label:
      value === 'amount'
        ? 'Amount'
        : value === 'contributor'
        ? 'Contributor'
        : value === 'recipient'
        ? 'Recipient'
        : 'Entries',
  }));

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading contributor data…</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5">Contributors</Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
            sx={{ bgcolor: 'background.paper', borderRadius: 99 }}
          >
            <ToggleButton value="totals">Totals</ToggleButton>
            <ToggleButton value="records">Records</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" color="text.secondary">
            {viewMode === 'totals'
              ? `Showing ${filteredTotals.length.toLocaleString()} of ${Object.keys(totals).length.toLocaleString()} contributors`
              : `Showing ${filteredData.length.toLocaleString()} of ${data.length.toLocaleString()} records`}{' '}
            · <strong>{formatCurrency(totalDisplayedAmount)}</strong>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2, my: 1, alignItems: 'center' }}>
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
          <SearchInput label="Search" placeholder="Contributor, city, office, recipient" value={search} onChange={setSearch} />
        </Box>

        {viewMode === 'records' && (
          <>
            <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Contribution Type</InputLabel>
                <Select value={typeFilter} label="Contribution Type" onChange={(e) => setTypeFilter(e.target.value)}>
                  <MenuItem value="all">All types</MenuItem>
                  {contributionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type || 'Unspecified'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Contribution Mode</InputLabel>
                <Select value={modeFilter} label="Contribution Mode" onChange={(e) => setModeFilter(e.target.value)}>
                  <MenuItem value="all">All modes</MenuItem>
                  {contributionModes.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode || 'Unspecified'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </>
        )}

        <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort</InputLabel>
            <Select value={sort.sortField} label="Sort" onChange={(e) => sort.setSortField(e.target.value as SortField)}>
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 1' } }}>
          <Button fullWidth size="small" variant="outlined" onClick={sort.toggleDirection}>
            {sort.sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </Box>

        {viewMode === 'totals' && (
          <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
            <Button fullWidth size="small" variant={fanOutMode ? 'contained' : 'outlined'} onClick={() => setFanOutMode((p) => !p)}>
              {fanOutMode ? 'Hide grouped dates' : 'Show grouped dates'}
            </Button>
          </Box>
        )}
      </Box>

      {viewMode === 'totals' ? (
        <>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sort.sortField === 'contributor'}
                      direction={sort.sortField === 'contributor' ? sort.sortDirection : 'asc'}
                      onClick={() => sort.handleSort('contributor')}
                    >
                      Contributor
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sort.sortField === 'amount'}
                      direction={sort.sortField === 'amount' ? sort.sortDirection : 'asc'}
                      onClick={() => sort.handleSort('amount')}
                    >
                      Total Amount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sort.sortField === 'entries'}
                      direction={sort.sortField === 'entries' ? sort.sortDirection : 'asc'}
                      onClick={() => sort.handleSort('entries')}
                    >
                      Entries
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTotals.slice(0, 500).map((entry) => (
                  <TableRow key={entry.key} hover>
                    <TableCell>
                      <Link to={`/lfucg/contributors/${entry.key}`}>{entry.fullName}</Link>
                    </TableCell>
                    <TableCell>{formatCurrency(entry.totalAmount)}</TableCell>
                    <TableCell>{entry.contributionCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {sortedTotals.length > 500 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing the first 500 contributors. Use search to refine further.
            </Typography>
          )}

          {fanOutMode && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Grouped by Date</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Totals below aggregate every contribution that matches your current filters, grouped by receipt date.
              </Typography>

              {fanOutData.length === 0 && <Typography variant="body2">No contributions match your current filters.</Typography>}

              {fanOutData.slice(0, 50).map((group) => (
                <Paper key={group.dateLabel} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{group.dateLabel}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {group.entries.length.toLocaleString()} entries
                      </Typography>
                    </Box>
                    <Chip label={formatCurrency(group.totalAmount)} />
                  </Box>

                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Contributor</TableCell>
                          <TableCell>Recipient</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Type / Mode</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.entries.map((record) => (
                          <TableRow key={record.id} hover>
                            <TableCell>
                              <Link to={`/lfucg/contributors/${slugify(record.contributorFullName)}`}>{record.contributorFullName}</Link>
                              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={record.occupation || 'Unspecified'} size="small" />
                                <Chip label={record.employer || 'Unspecified'} size="small" />
                              </Box>
                            </TableCell>
                            <TableCell>{record.recipientFullName}</TableCell>
                            <TableCell>{formatCurrency(record.amount)}</TableCell>
                            <TableCell>
                              <Chip label={record.contributionType || 'Unspecified'} size="small" />
                              <Typography variant="body2" color="text.secondary">{record.contributionMode || '—'}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              ))}

              {fanOutData.length > 50 && (
                <Typography variant="body2" color="text.secondary">
                  Showing the first 50 date groups. Refine your search to narrow further.
                </Typography>
              )}
            </Box>
          )}
        </>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sort.sortField === 'contributor'}
                      direction={sort.sortField === 'contributor' ? sort.sortDirection : 'asc'}
                      onClick={() => sort.handleSort('contributor')}
                    >
                      Contributor
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sort.sortField === 'recipient'}
                      direction={sort.sortField === 'recipient' ? sort.sortDirection : 'asc'}
                      onClick={() => sort.handleSort('recipient')}
                    >
                      Recipient
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Office</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sort.sortField === 'amount'}
                      direction={sort.sortField === 'amount' ? sort.sortDirection : 'asc'}
                      onClick={() => sort.handleSort('amount')}
                    >
                      Amount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Type / Mode</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Receipt Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRecords.slice(0, 500).map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>
                        <Link to={`/lfucg/contributors/${slugify(record.contributorFullName)}`}>{record.contributorFullName}</Link>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.occupation || 'Occupation N/A'}
                      </Typography>
                      {(record.isAnonymous || record.isNameMissing) && (
                        <Chip
                          label={record.isAnonymous ? 'Anonymous filing' : 'Name unavailable'}
                          size="small"
                          color="warning"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{record.recipientFullName}</TableCell>
                    <TableCell>{record.officeSought || '—'}</TableCell>
                    <TableCell>{formatCurrency(record.amount)}</TableCell>
                    <TableCell>
                      <Chip label={record.contributionType || 'Unspecified'} size="small" />
                      <Typography variant="body2" color="text.secondary">{record.contributionMode || '—'}</Typography>
                    </TableCell>
                    <TableCell>{record.city ? `${record.city}, ${record.state}` : record.location || '—'}</TableCell>
                    <TableCell>{record.receiptDate || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {sortedRecords.length > 500 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing the first 500 rows. Refine your filters to narrow the results.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default LfucgContributorsPage;

