import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify, normalizeEmployerKey } from '../../data/utils';
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
  const employerSort = useTableSort<'employer' | 'entries' | 'amount'>('amount');

  const { summary, topRecipients, topEmployers } = useMemo(() => {
    if (!data.length) {
      return {
        summary: { totalAmount: 0, totalContributions: 0, uniqueContributors: 0, uniqueRecipients: 0 },
        topRecipients: [] as Array<{ name: string; total: number; count: number; office: string }>,
        topEmployers: [] as Array<{ employerKey: string; name: string; total: number; count: number }>,
      };
    }

    const summary = {
      totalAmount: data.reduce((acc: number, record: ContributorRecord) => acc + record.amount, 0),
      totalContributions: data.length,
      uniqueContributors: new Set(data.map((record: ContributorRecord) => record.contributorFullName)).size,
      uniqueRecipients: new Set(data.map((record: ContributorRecord) => record.recipientFullName)).size,
    };

    const recipientMap = new Map<string, { name: string; total: number; count: number; office: string }>();
    const employerMap = new Map<string, { employerKey: string; name: string; total: number; count: number }>();

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

      const employerRaw = record.employer?.trim() || '';
      const employerKey = normalizeEmployerKey(employerRaw);
      if (!employerKey) return; // skip unknown / N/A / empty employers entirely

      const existingEmployer = employerMap.get(employerKey);
      const displayName = existingEmployer?.name || employerRaw;
      const employerEntry = existingEmployer ?? {
        employerKey,
        name: displayName,
        total: 0,
        count: 0,
      };
      employerEntry.total += record.amount;
      employerEntry.count += 1;
      employerMap.set(employerKey, employerEntry);
    });

    const topRecipients = Array.from(recipientMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topEmployers = Array.from(employerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 25); // Top 25 employers by number of filings

    return { summary, topRecipients, topEmployers };
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

  const sortedTopEmployers = useMemo(() => {
    const rows = [...topEmployers];
    rows.sort((a, b) => {
      let comparison = 0;
      switch (employerSort.sortField) {
        case 'employer':
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'entries':
          comparison = a.count - b.count;
          break;
        case 'amount':
        default:
          comparison = a.total - b.total;
      }
      return employerSort.sortDirection === 'asc' ? comparison : -comparison;
    });
    return rows;
  }, [employerSort.sortDirection, employerSort.sortField, topEmployers]);

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
                  <TableCell sx={{ fontWeight: 500 }}>
                    <Link to={`/lfucg/recipients/${slugify(recipient.name)}`}>{recipient.name}</Link>
                  </TableCell>
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Top Employers</Typography>
          <Chip label="Top 25 by number of filings" size="small" color="primary" variant="outlined" />
        </Box>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={employerSort.sortField === 'employer'}
                    direction={employerSort.sortField === 'employer' ? employerSort.sortDirection : 'asc'}
                    onClick={() => employerSort.handleSort('employer')}
                  >
                    Employer
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={employerSort.sortField === 'entries'}
                    direction={employerSort.sortField === 'entries' ? employerSort.sortDirection : 'asc'}
                    onClick={() => employerSort.handleSort('entries')}
                  >
                    Entries
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={employerSort.sortField === 'amount'}
                    direction={employerSort.sortField === 'amount' ? employerSort.sortDirection : 'asc'}
                    onClick={() => employerSort.handleSort('amount')}
                  >
                    Total Amount
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTopEmployers.map((employer) => (
                <TableRow key={employer.employerKey} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    <Link to={`/lfucg/employers/${slugify(employer.name || 'Unknown employer')}`}>{employer.name}</Link>
                  </TableCell>
                  <TableCell>{employer.count.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(employer.total)}</TableCell>
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

