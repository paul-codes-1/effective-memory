import { useMemo } from 'react';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import type { ContributorRecord } from '../../data/types';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableSortLabel from '@mui/material/TableSortLabel';
import useTableSort from '../../hooks/useTableSort';

const parseDateValue = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
};

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const LfucgOverviewPage = () => {
  const { data, loading, error } = useLfucgContributors();
  const recipientSort = useTableSort<'recipient' | 'entries' | 'amount'>('amount');
  const locationSort = useTableSort<'city' | 'entries' | 'amount'>('entries');
  const recentSort = useTableSort<'contributor' | 'recipient' | 'amount' | 'date'>('date');

  const { summary, topRecipients, topLocations, recentContributions } = useMemo(() => {
    if (!data.length) {
      return {
        summary: { totalAmount: 0, totalContributions: 0, uniqueContributors: 0, uniqueRecipients: 0 },
        topRecipients: [] as Array<{ name: string; total: number; count: number; office: string }>,
        topLocations: [] as Array<{ location: string; total: number; count: number }>,
        recentContributions: [] as ContributorRecord[],
      };
    }

    const summary = {
      totalAmount: data.reduce((acc: number, record: ContributorRecord) => acc + record.amount, 0),
      totalContributions: data.length,
      uniqueContributors: new Set(data.map((record: ContributorRecord) => record.contributorFullName)).size,
      uniqueRecipients: new Set(data.map((record: ContributorRecord) => record.recipientFullName)).size,
    };

    const recipientMap = new Map<string, { name: string; total: number; count: number; office: string }>();
    const locationMap = new Map<string, { location: string; total: number; count: number }>();

    data.forEach((record: ContributorRecord) => {
      const recipientKey = record.recipientFullName || 'Unknown recipient';
      const recipientEntry = recipientMap.get(recipientKey) ?? {
        name: recipientKey,
        total: 0,
        count: 0,
        office: record.officeSought,
      };
      recipientEntry.total += record.amount;
      recipientEntry.count += 1;
      if (!recipientEntry.office && record.officeSought) {
        recipientEntry.office = record.officeSought;
      }
      recipientMap.set(recipientKey, recipientEntry);

      const locKey = record.city && record.state ? `${record.city}, ${record.state}` : record.location || 'Unknown location';
      const locEntry = locationMap.get(locKey) ?? { location: locKey, total: 0, count: 0 };
      locEntry.total += record.amount;
      locEntry.count += 1;
      locationMap.set(locKey, locEntry);
    });

    const topRecipients = Array.from(recipientMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topLocations = Array.from(locationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentContributions = [...data]
      .filter((record) => record.receiptDate)
      .sort((a, b) => {
        const dateA = parseDateValue(a.receiptDate)?.getTime() ?? 0;
        const dateB = parseDateValue(b.receiptDate)?.getTime() ?? 0;
        return dateB - dateA;
      })
      .slice(0, 6);

    return { summary, topRecipients, topLocations, recentContributions };
  }, [data]);

  const sortedTopRecipients = useMemo(() => {
    const rows = [...topRecipients];
    rows.sort((a, b) => {
      let comparison = 0;
      switch (recipientSort.sortField) {
        case 'recipient':
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'entries':
          comparison = a.count - b.count;
          break;
        case 'amount':
        default:
          comparison = a.total - b.total;
      }
      return recipientSort.sortDirection === 'asc' ? comparison : -comparison;
    });
    return rows;
  }, [recipientSort.sortDirection, recipientSort.sortField, topRecipients]);

  const sortedTopLocations = useMemo(() => {
    const rows = [...topLocations];
    rows.sort((a, b) => {
      let comparison = 0;
      switch (locationSort.sortField) {
        case 'city':
          comparison = a.location.localeCompare(b.location, undefined, { sensitivity: 'base' });
          break;
        case 'entries':
          comparison = a.count - b.count;
          break;
        case 'amount':
        default:
          comparison = a.total - b.total;
      }
      return locationSort.sortDirection === 'asc' ? comparison : -comparison;
    });
    return rows;
  }, [locationSort.sortDirection, locationSort.sortField, topLocations]);

  const sortedRecentContributions = useMemo(() => {
    const rows = [...recentContributions];
    rows.sort((a, b) => {
      let comparison = 0;
      switch (recentSort.sortField) {
        case 'contributor':
          comparison = a.contributorFullName.localeCompare(b.contributorFullName, undefined, { sensitivity: 'base' });
          break;
        case 'recipient':
          comparison = a.recipientFullName.localeCompare(b.recipientFullName, undefined, { sensitivity: 'base' });
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'date':
        default: {
          const timeA = parseDateValue(a.receiptDate || '')?.getTime() ?? 0;
          const timeB = parseDateValue(b.receiptDate || '')?.getTime() ?? 0;
          comparison = timeA - timeB;
          break;
        }
      }
      return recentSort.sortDirection === 'asc' ? comparison : -comparison;
    });
    return rows;
  }, [recentContributions, recentSort.sortDirection, recentSort.sortField]);

  if (loading) {
    return (
      <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
        Loading 2026 LFUCG Primary data…
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>
        {error}
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2.5 }} elevation={0}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
            Total Volume
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', my: 0.5 }}>
            {formatCurrency(summary.totalAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Net of credits and refunds
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5 }} elevation={0}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
            Contributions
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', my: 0.5 }}>
            {summary.totalContributions.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Individual records in the dataset
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5 }} elevation={0}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
            Contributors
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', my: 0.5 }}>
            {summary.uniqueContributors.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unique individuals or committees
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5 }} elevation={0}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
            Recipients
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', my: 0.5 }}>
            {summary.uniqueRecipients.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Campaigns or committees receiving funds
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Top Recipients</Typography>
          <Chip label="Top 5 by total amount" size="small" color="primary" variant="outlined" />
        </Box>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={recipientSort.sortField === 'recipient'}
                    direction={recipientSort.sortField === 'recipient' ? recipientSort.sortDirection : 'asc'}
                    onClick={() => recipientSort.handleSort('recipient')}
                  >
                    Recipient
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Office</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={recipientSort.sortField === 'entries'}
                    direction={recipientSort.sortField === 'entries' ? recipientSort.sortDirection : 'asc'}
                    onClick={() => recipientSort.handleSort('entries')}
                  >
                    Entries
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={recipientSort.sortField === 'amount'}
                    direction={recipientSort.sortField === 'amount' ? recipientSort.sortDirection : 'asc'}
                    onClick={() => recipientSort.handleSort('amount')}
                  >
                    Total Amount
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTopRecipients.map((recipient) => (
                <TableRow key={recipient.name} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{recipient.name}</TableCell>
                  <TableCell>{recipient.office || '—'}</TableCell>
                  <TableCell>{recipient.count.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(recipient.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Active Locations</Typography>
          <Chip label="Top 5 by number of filings" size="small" color="primary" variant="outlined" />
        </Box>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={locationSort.sortField === 'city'}
                    direction={locationSort.sortField === 'city' ? locationSort.sortDirection : 'asc'}
                    onClick={() => locationSort.handleSort('city')}
                  >
                    City
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={locationSort.sortField === 'entries'}
                    direction={locationSort.sortField === 'entries' ? locationSort.sortDirection : 'asc'}
                    onClick={() => locationSort.handleSort('entries')}
                  >
                    Entries
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={locationSort.sortField === 'amount'}
                    direction={locationSort.sortField === 'amount' ? locationSort.sortDirection : 'asc'}
                    onClick={() => locationSort.handleSort('amount')}
                  >
                    Total Amount
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTopLocations.map((loc) => (
                <TableRow key={loc.location} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{loc.location}</TableCell>
                  <TableCell>{loc.count.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(loc.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Most Recent Filings</Typography>
          <Chip label="Latest 6 entries" size="small" color="primary" variant="outlined" />
        </Box>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={recentSort.sortField === 'contributor'}
                    direction={recentSort.sortField === 'contributor' ? recentSort.sortDirection : 'asc'}
                    onClick={() => recentSort.handleSort('contributor')}
                  >
                    Contributor
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={recentSort.sortField === 'recipient'}
                    direction={recentSort.sortField === 'recipient' ? recentSort.sortDirection : 'asc'}
                    onClick={() => recentSort.handleSort('recipient')}
                  >
                    Recipient
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={recentSort.sortField === 'amount'}
                    direction={recentSort.sortField === 'amount' ? recentSort.sortDirection : 'asc'}
                    onClick={() => recentSort.handleSort('amount')}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={recentSort.sortField === 'date'}
                    direction={recentSort.sortField === 'date' ? recentSort.sortDirection : 'asc'}
                    onClick={() => recentSort.handleSort('date')}
                  >
                    Receipt Date
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRecentContributions.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Typography component="div" sx={{ fontWeight: 600 }}>
                      {record.contributorFullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {record.city ? `${record.city}, ${record.state}` : record.location}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{record.recipientFullName}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(record.amount)}</TableCell>
                  <TableCell>{record.receiptDate || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default LfucgOverviewPage;

