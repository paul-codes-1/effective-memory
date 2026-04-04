import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify, normalizeEmployerKey } from '../../data/utils';
import type { ContributorRecord } from '../../data/types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import useTableSort from '../../hooks/useTableSort';
import ResponsiveTable, { ColumnDef } from '../../components/ResponsiveTable';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const LfucgEmployerDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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
        if (slugify(value.key) === slug) {
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

  const columns: ColumnDef<ContributorRecord>[] = [
    {
      key: 'contributor',
      label: 'Contributor',
      sortField: 'contributor',
      primary: true,
      render: (record) => (
        <>
          <Link to={`/contributors/${slugify(record.contributorFullName)}`}>{record.contributorFullName}</Link>
          <Typography variant="body2" color="text.secondary">
            {record.occupation || 'Occupation N/A'}
          </Typography>
        </>
      ),
    },
    {
      key: 'recipient',
      label: 'Recipient',
      sortField: 'recipient',
      render: (record) => (
        <Link to={`/recipients/${slugify(record.recipientFullName)}`}>{record.recipientFullName}</Link>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortField: 'amount',
      highlight: true,
      render: (record) => formatCurrency(record.amount),
    },
    { key: 'date', label: 'Receipt Date', sortField: 'date', render: (record) => record.receiptDate || '—' },
  ];

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
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(-1);
            }}
          >
            Go back
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          onClick={() => navigate(-1)}
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        >
          &larr; Back
        </Typography>
      </Box>

      <Typography variant="h4" sx={{ mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
        {employerName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {contributors.size} contributors - {contributions.length} filings
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3,1fr)' },
          gap: { xs: 1, md: 2 },
          mb: 2,
        }}
      >
        <Paper sx={{ p: { xs: 1.5, md: 2 } }}>
          <Typography variant="overline" color="text.secondary">
            Total Given
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {formatCurrency(totalAmount)}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, md: 2 } }}>
          <Typography variant="overline" color="text.secondary">
            Contributors
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {contributors.size.toLocaleString()}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, md: 2 }, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
          <Typography variant="overline" color="text.secondary">
            Recipients
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {recipients.size.toLocaleString()}
          </Typography>
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
        <ResponsiveTable
          columns={columns}
          rows={sortedContributions}
          getRowKey={(record) => record.id}
          sortField={sort.sortField}
          sortDirection={sort.sortDirection}
          onSort={sort.handleSort}
        />
      </Box>
    </Box>
  );
};

export default LfucgEmployerDetailPage;
