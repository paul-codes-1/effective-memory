import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchInput from '../../components/SearchInput';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify } from '../../data/utils';
import type { ContributorRecord } from '../../data/types';
import {
  filterRecords,
  buildContributorEmployerMap,
  filterTotals,
  sortRecords,
  sortTotals,
} from '../../data/filterContributors';
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
import useTableSort from '../../hooks/useTableSort';
import ResponsiveTable, { ColumnDef } from '../../components/ResponsiveTable';
import type { ContributorTotal } from '../../data/types';

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
  const { sortField, sortDirection, setSortField, handleSort, toggleDirection } = useTableSort<SortField>('amount');

  useEffect(() => {
    if (viewMode === 'records' && fanOutMode) {
      setFanOutMode(false);
    }
  }, [fanOutMode, viewMode]);

  useEffect(() => {
    const allowedFields = viewMode === 'totals' ? TOTALS_SORT_FIELDS : RECORD_SORT_FIELDS;
    if (!allowedFields.includes(sortField)) {
      setSortField(allowedFields[0]);
    }
  }, [sortField, viewMode, setSortField]);

  const contributionTypes = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.contributionType)))
      .filter(Boolean)
      .sort();
  }, [data]);

  const contributionModes = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.contributionMode)))
      .filter(Boolean)
      .sort();
  }, [data]);

  const searchValue = search.trim().toLowerCase();

  const filteredData = useMemo(
    () => filterRecords(data, { searchValue, typeFilter, modeFilter }),
    [data, modeFilter, searchValue, typeFilter],
  );

  const contributorEmployers = useMemo(() => buildContributorEmployerMap(data), [data]);

  const filteredTotals = useMemo(
    () => filterTotals(Object.values(totals), searchValue, contributorEmployers),
    [contributorEmployers, searchValue, totals],
  );

  const totalDisplayedAmount = useMemo(() => {
    if (viewMode === 'totals') return filteredTotals.reduce((sum, entry) => sum + entry.totalAmount, 0);
    return filteredData.reduce((sum, record) => sum + record.amount, 0);
  }, [filteredData, filteredTotals, viewMode]);

  const sortedRecords = useMemo(
    () => sortRecords(filteredData, sortField as 'amount' | 'contributor' | 'recipient', sortDirection),
    [filteredData, sortDirection, sortField],
  );

  const sortedTotals = useMemo(
    () => sortTotals(filteredTotals, sortField as 'amount' | 'contributor' | 'entries', sortDirection),
    [filteredTotals, sortDirection, sortField],
  );

  const fanOutData = useMemo(() => {
    if (!fanOutMode || viewMode !== 'totals') return [];
    const contributorKeys = new Set(filteredTotals.map((entry) => entry.key));
    if (!contributorKeys.size) return [];

    const grouped = new Map<string, { dateLabel: string; totalAmount: number; entries: ContributorRecord[] }>();
    data.forEach((record) => {
      const key = record.identityKey;
      if (!contributorKeys.has(key)) return;
      const dateLabel = record.receiptDate || 'No receipt date';
      const group = grouped.get(dateLabel) ?? { dateLabel, totalAmount: 0, entries: [] };
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

  const totalsColumns: ColumnDef<ContributorTotal>[] = [
    {
      key: 'contributor',
      label: 'Contributor',
      sortField: 'contributor',
      primary: true,
      render: (entry) => (
        <>
          <Link to={`/contributors/${entry.key}`}>{entry.fullName}</Link>
          {(entry.occupation || entry.employer) && (
            <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {entry.occupation && <Chip label={entry.occupation} size="small" />}
              {entry.employer && <Chip label={entry.employer} size="small" />}
            </Box>
          )}
        </>
      ),
    },
    {
      key: 'amount',
      label: 'Total Amount',
      sortField: 'amount',
      highlight: true,
      render: (entry) => formatCurrency(entry.totalAmount),
    },
    {
      key: 'entries',
      label: 'Entries',
      sortField: 'entries',
      render: (entry) => entry.contributionCount.toLocaleString(),
    },
  ];

  const recordsColumns: ColumnDef<ContributorRecord>[] = [
    {
      key: 'contributor',
      label: 'Contributor',
      sortField: 'contributor',
      primary: true,
      render: (record) => (
        <>
          <Typography sx={{ fontWeight: 700 }}>
            <Link to={`/contributors/${slugify(record.contributorFullName)}`}>{record.contributorFullName}</Link>
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
        </>
      ),
    },
    {
      key: 'recipient',
      label: 'Recipient',
      sortField: 'recipient',
      render: (record) => record.recipientFullName,
    },
    { key: 'office', label: 'Office', hideOnMobile: true, render: (record) => record.officeSought || '—' },
    {
      key: 'amount',
      label: 'Amount',
      sortField: 'amount',
      highlight: true,
      render: (record) => formatCurrency(record.amount),
    },
    {
      key: 'type',
      label: 'Type / Mode',
      hideOnMobile: true,
      render: (record) => (
        <>
          <Chip label={record.contributionType || 'Unspecified'} size="small" />
          <Typography variant="body2" color="text.secondary">
            {record.contributionMode || '—'}
          </Typography>
        </>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      hideOnMobile: true,
      render: (record) => (record.city ? `${record.city}, ${record.state}` : record.location || '—'),
    },
    { key: 'date', label: 'Receipt Date', render: (record) => record.receiptDate || '—' },
  ];

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading contributor data...</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5">Contributors</Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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

          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {viewMode === 'totals'
              ? `${filteredTotals.length.toLocaleString()} of ${Object.keys(totals).length.toLocaleString()} contributors`
              : `${filteredData.length.toLocaleString()} of ${data.length.toLocaleString()} records`}{' '}
            · <strong>{formatCurrency(totalDisplayedAmount)}</strong>
          </Typography>
        </Box>
      </Box>

      {/* Mobile count summary */}
      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
        {viewMode === 'totals'
          ? `${filteredTotals.length.toLocaleString()} contributors`
          : `${filteredData.length.toLocaleString()} records`}{' '}
        · <strong>{formatCurrency(totalDisplayedAmount)}</strong>
      </Typography>

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
          <SearchInput label="Search" placeholder="Name, employer, or occupation" value={search} onChange={setSearch} />
        </Box>

        {viewMode === 'records' && (
          <>
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                  <MenuItem value="all">All types</MenuItem>
                  {contributionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type || 'Unspecified'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Mode</InputLabel>
                <Select value={modeFilter} label="Mode" onChange={(e) => setModeFilter(e.target.value)}>
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

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort</InputLabel>
            <Select value={sortField} label="Sort" onChange={(e) => setSortField(e.target.value as SortField)}>
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 1' } }}>
          <Button fullWidth size="small" variant="outlined" onClick={toggleDirection}>
            {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </Box>

        {viewMode === 'totals' && (
          <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
            <Button
              fullWidth
              size="small"
              variant={fanOutMode ? 'contained' : 'outlined'}
              onClick={() => setFanOutMode((p) => !p)}
            >
              {fanOutMode ? 'Hide grouped dates' : 'Show grouped dates'}
            </Button>
          </Box>
        )}
      </Box>

      {viewMode === 'totals' ? (
        <>
          <ResponsiveTable
            columns={totalsColumns}
            rows={sortedTotals.slice(0, 500)}
            getRowKey={(entry) => entry.key}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            sx={{ mt: 1 }}
          />

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

              {fanOutData.length === 0 && (
                <Typography variant="body2">No contributions match your current filters.</Typography>
              )}

              {fanOutData.slice(0, 50).map((group) => (
                <Paper key={group.dateLabel} sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
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
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Recipient</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type / Mode</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.entries.map((record) => (
                          <TableRow key={record.id} hover>
                            <TableCell>
                              <Link to={`/contributors/${slugify(record.contributorFullName)}`}>
                                {record.contributorFullName}
                              </Link>
                              {(record.occupation || record.employer) && (
                                <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {record.occupation && <Chip label={record.occupation} size="small" />}
                                  {record.employer && <Chip label={record.employer} size="small" />}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              {record.recipientFullName}
                            </TableCell>
                            <TableCell>{formatCurrency(record.amount)}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Chip label={record.contributionType || 'Unspecified'} size="small" />
                              <Typography variant="body2" color="text.secondary">
                                {record.contributionMode || '—'}
                              </Typography>
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
          <ResponsiveTable
            columns={recordsColumns}
            rows={sortedRecords.slice(0, 500)}
            getRowKey={(record) => record.id}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            sx={{ mt: 1 }}
          />

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
