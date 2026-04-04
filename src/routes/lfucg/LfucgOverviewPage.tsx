import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify } from '../../data/utils';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import useTableSort from '../../hooks/useTableSort';
import ResponsiveTable, { ColumnDef } from '../../components/ResponsiveTable';
import { computeOverviewData, type RecipientRow, type EmployerRow } from '../../data/overviewAggregation';

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

  const { summary, topRecipients, topEmployers } = useMemo(() => computeOverviewData(data), [data]);

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

  const recipientColumns: ColumnDef<RecipientRow>[] = [
    {
      key: 'recipient',
      label: 'Recipient',
      sortField: 'recipient',
      primary: true,
      render: (row) => <Link to={`/recipients/${slugify(row.name)}`}>{row.name}</Link>,
    },
    { key: 'office', label: 'Office', hideOnMobile: true, render: (row) => row.office || '—' },
    {
      key: 'entries',
      label: 'Entries',
      sortField: 'entries',
      hideOnMobile: true,
      render: (row) => row.count.toLocaleString(),
    },
    {
      key: 'amount',
      label: 'Total Amount',
      sortField: 'amount',
      highlight: true,
      render: (row) => formatCurrency(row.total),
    },
  ];

  const employerColumns: ColumnDef<EmployerRow>[] = [
    {
      key: 'employer',
      label: 'Employer',
      sortField: 'employer',
      primary: true,
      render: (row) => <Link to={`/employers/${slugify(row.employerKey)}`}>{row.name}</Link>,
    },
    { key: 'entries', label: 'Entries', sortField: 'entries', render: (row) => row.count.toLocaleString() },
    {
      key: 'amount',
      label: 'Total Amount',
      sortField: 'amount',
      highlight: true,
      render: (row) => formatCurrency(row.total),
    },
  ];

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading 2026 LFUCG Primary data...</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4,1fr)' },
          gap: { xs: 1, md: 2 },
          mb: 3,
        }}
      >
        <Paper sx={{ p: { xs: 1.5, md: 2.5 } }} elevation={0}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 600, fontSize: { xs: '0.6rem', md: '0.75rem' } }}
          >
            Total Volume
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'primary.main', my: 0.5, fontSize: { xs: '1.25rem', md: '2.125rem' } }}
          >
            {formatCurrency(summary.totalAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Net of credits and refunds
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, md: 2.5 } }} elevation={0}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 600, fontSize: { xs: '0.6rem', md: '0.75rem' } }}
          >
            Contributions
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'primary.main', my: 0.5, fontSize: { xs: '1.25rem', md: '2.125rem' } }}
          >
            {summary.totalContributions.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Individual records in the dataset
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, md: 2.5 } }} elevation={0}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 600, fontSize: { xs: '0.6rem', md: '0.75rem' } }}
          >
            Contributors
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'primary.main', my: 0.5, fontSize: { xs: '1.25rem', md: '2.125rem' } }}
          >
            {summary.uniqueContributors.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Unique individuals or committees
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, md: 2.5 } }} elevation={0}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 600, fontSize: { xs: '0.6rem', md: '0.75rem' } }}
          >
            Recipients
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'primary.main', my: 0.5, fontSize: { xs: '1.25rem', md: '2.125rem' } }}
          >
            {summary.uniqueRecipients.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Campaigns or committees receiving funds
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Top Recipients
          </Typography>
          <Chip label="Top 5 by total amount" size="small" color="primary" variant="outlined" />
        </Box>
        <ResponsiveTable
          columns={recipientColumns}
          rows={sortedTopRecipients}
          getRowKey={(row) => row.name}
          sortField={recipientSort.sortField}
          sortDirection={recipientSort.sortDirection}
          onSort={recipientSort.handleSort}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Top Employers
          </Typography>
          <Chip label="Top 25 by number of filings" size="small" color="primary" variant="outlined" />
        </Box>
        <ResponsiveTable
          columns={employerColumns}
          rows={sortedTopEmployers}
          getRowKey={(row) => row.employerKey}
          sortField={employerSort.sortField}
          sortDirection={employerSort.sortDirection}
          onSort={employerSort.handleSort}
        />
      </Box>
    </Box>
  );
};

export default LfucgOverviewPage;
