import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify, normalizeEmployerKey } from '../../data/utils';
import type { ContributorRecord } from '../../data/types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableSortLabel from '@mui/material/TableSortLabel';
import Alert from '@mui/material/Alert';
import useTableSort from '../../hooks/useTableSort';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const LfucgEmployerDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error } = useLfucgContributors();
  const sort = useTableSort<'contributor' | 'recipient' | 'amount' | 'date'>('amount');

  const { contributions, employerName, totalAmount, contributors, recipients } = useMemo(() => {
    if (!slug) {
      return {
        contributions: [] as ContributorRecord[],
        employerName: '',
        totalAmount: 0,
        contributors: new Set<string>(),
        recipients: new Set<string>(),
      };
    }

    // First, find the normalized employer key that corresponds to this slug,
    // using the same display-name + slug logic as the overview page.
    const employerKeyBySlug = (() => {
      const employerMap = new Map<string, { key: string; name: string }>();
      data.forEach((record) => {
        const raw = record.employer || 'Unknown employer';
        const key = normalizeEmployerKey(raw) || 'unknown-employer';
        const existing = employerMap.get(key);
        if (!existing) {
          employerMap.set(key, { key, name: raw });
        }
      });
      for (const value of employerMap.values()) {
        if (slugify(value.name || 'Unknown employer') === slug) {
          return value.key;
        }
      }
      return null;
    })();

    if (!employerKeyBySlug) {
      return {
        contributions: [] as ContributorRecord[],
        employerName: '',
        totalAmount: 0,
        contributors: new Set<string>(),
        recipients: new Set<string>(),
      };
    }

    const filtered = data.filter((record) => {
      const raw = record.employer || 'Unknown employer';
      const key = normalizeEmployerKey(raw) || 'unknown-employer';
      return key === employerKeyBySlug;
    });

    if (!filtered.length) {
      return {
        contributions: [] as ContributorRecord[],
        employerName: '',
        totalAmount: 0,
        contributors: new Set<string>(),
        recipients: new Set<string>(),
      };
    }

    const employerName = filtered[0]?.employer || 'Unknown employer';
    const totalAmount = filtered.reduce((sum, record) => sum + record.amount, 0);
    const contributors = new Set(filtered.map((record) => record.contributorFullName).filter(Boolean));
    const recipients = new Set(filtered.map((record) => record.recipientFullName).filter(Boolean));

    return { contributions: filtered, employerName, totalAmount, contributors, recipients };
  }, [data, slug]);

  const sortedContributions = useMemo(() => {
    const rows = [...contributions];
    rows.sort((a, b) => {
      switch (sort.sortField) {
        case 'contributor':
          return sort.sortDirection === 'asc'
            ? a.contributorFullName.localeCompare(b.contributorFullName, undefined, { sensitivity: 'base' })
            : b.contributorFullName.localeCompare(a.contributorFullName, undefined, { sensitivity: 'base' });
        case 'recipient':
          return sort.sortDirection === 'asc'
            ? a.recipientFullName.localeCompare(b.recipientFullName, undefined, { sensitivity: 'base' })
            : b.recipientFullName.localeCompare(a.recipientFullName, undefined, { sensitivity: 'base' });
        case 'date':
          return sort.sortDirection === 'asc'
            ? (Date.parse(a.receiptDate || '') || 0) - (Date.parse(b.receiptDate || '') || 0)
            : (Date.parse(b.receiptDate || '') || 0) - (Date.parse(a.receiptDate || '') || 0);
        case 'amount':
        default:
          return sort.sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });
    return rows;
  }, [contributions, sort.sortDirection, sort.sortField]);

  const isDefaultSort = sort.sortField === 'amount' && sort.sortDirection === 'desc';

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading employer details</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  if (!contributions.length) {
    return (
      <Box>
        <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>No filings found for this employer.</Paper>
        <Box sx={{ mt: 2 }}>
          <Link to="/lfucg"> Back to overview</Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Link to="/lfucg" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="text.secondary">
             Back to overview
          </Typography>
        </Link>
      </Box>

      <Typography variant="h4" sx={{ mb: 0.5 }}>{employerName}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{contributors.size} contributors - {contributions.length} filings</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Total Given</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(totalAmount)}</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Contributors</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{contributors.size.toLocaleString()}</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Recipients</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{recipients.size.toLocaleString()}</Typography>
        </Paper>
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">All Contributions</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`${contributions.length.toLocaleString()} entries`} size="small" />
            <Button size="small" onClick={sort.resetSort} disabled={isDefaultSort}>
              Reset sort
            </Button>
          </Box>
        </Box>
        <TableContainer component={Paper}>
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
                <TableCell>
                  <TableSortLabel
                    active={sort.sortField === 'amount'}
                    direction={sort.sortField === 'amount' ? sort.sortDirection : 'asc'}
                    onClick={() => sort.handleSort('amount')}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sort.sortField === 'date'}
                    direction={sort.sortField === 'date' ? sort.sortDirection : 'asc'}
                    onClick={() => sort.handleSort('date')}
                  >
                    Receipt Date
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedContributions.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Link to={`/lfucg/contributors/${slugify(record.contributorFullName)}`}>{record.contributorFullName}</Link>
                    <Typography variant="body2" color="text.secondary">{record.occupation || 'Occupation N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Link to={`/lfucg/recipients/${slugify(record.recipientFullName)}`}>{record.recipientFullName}</Link>
                  </TableCell>
                  <TableCell>{formatCurrency(record.amount)}</TableCell>
                  <TableCell>{record.receiptDate || ' d'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default LfucgEmployerDetailPage;

