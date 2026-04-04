import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify } from '../../data/utils';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import useTableSort from '../../hooks/useTableSort';
import EmployerChip from '../../components/EmployerChip';
import ResponsiveTable, { ColumnDef } from '../../components/ResponsiveTable';
import type { ContributorRecord } from '../../data/types';

const KREF_CANDIDATE_URL = 'https://secure.kentucky.gov/kref/publicsearch/ToCandidateSearch';
const buildKrefLink = (params: { firstName?: string; lastName?: string }) => {
  const searchParams = new URLSearchParams({
    PageIndex: '0',
    ReportingFinancialStatementId: '',
    CandidateFirstName: params.firstName?.toLowerCase() || '',
    CandidateLastName: params.lastName?.toLowerCase() || '',
    ElectionDate: '5/19/2026',
    ElectionType: '',
    FirstName: '',
    LastName: '',
    FromOrganizationName: '',
    City: '',
    State: '',
    Zip: '',
    Employer: '',
    Occupation: '',
    OtherOccupation: '',
    MinAmount: '',
    MaxAmount: '',
    MinimalDate: '',
    MaximalDate: '',
    ContributionMode: '',
    ContributionSearchType: 'Candidate',
    PageSize: '10',
    ReportId: '',
  });
  return `${KREF_CANDIDATE_URL}?${searchParams.toString()}`;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const LfucgRecipientDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useLfucgContributors();
  const sort = useTableSort<'contributor' | 'amount' | 'location' | 'date'>('amount');

  const { contributions, recipientName, totalAmount, contributors, offices, krefLink } = useMemo(() => {
    if (!slug) {
      return {
        contributions: [] as ContributorRecord[],
        recipientName: '',
        totalAmount: 0,
        contributors: new Set<string>(),
        offices: new Set<string>(),
        krefLink: buildKrefLink({}),
      };
    }
    const filtered = data.filter((record) => slugify(record.recipientFullName) === slug);
    const name = filtered[0]?.recipientFullName || slug.replace(/-/g, ' ');
    const primary = filtered[0];
    const total = filtered.reduce((sum, record) => sum + record.amount, 0);
    const contributors = new Set(filtered.map((record) => record.contributorFullName).filter(Boolean));
    const offices = new Set(filtered.map((record) => record.officeSought).filter(Boolean));
    const firstName = primary?.recipientFirstName || name.split(' ').slice(0, -1).join(' ');
    const lastName = primary?.recipientLastName || name.split(' ').slice(-1).join(' ');
    const krefLink = buildKrefLink({ firstName, lastName });
    return { contributions: filtered, recipientName: name, totalAmount: total, contributors, offices, krefLink };
  }, [data, slug]);

  const sortedContributions = useMemo(() => {
    const rows = [...contributions];
    rows.sort((a, b) => {
      switch (sort.sortField) {
        case 'contributor':
          return sort.sortDirection === 'asc'
            ? a.contributorFullName.localeCompare(b.contributorFullName, undefined, { sensitivity: 'base' })
            : b.contributorFullName.localeCompare(a.contributorFullName, undefined, { sensitivity: 'base' });
        case 'location':
          return sort.sortDirection === 'asc'
            ? (a.city ? `${a.city}, ${a.state}` : a.location || '').localeCompare(
                b.city ? `${b.city}, ${b.state}` : b.location || '',
                undefined,
                { sensitivity: 'base' },
              )
            : (b.city ? `${b.city}, ${b.state}` : b.location || '').localeCompare(
                a.city ? `${a.city}, ${a.state}` : a.location || '',
                undefined,
                { sensitivity: 'base' },
              );
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
          {record.employer && (
            <EmployerChip employer={record.employer} size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
          )}
          {(record.isAnonymous || record.isNameMissing) && (
            <Chip
              label={record.isAnonymous ? 'Anonymous filing' : 'Name unavailable'}
              size="small"
              color="warning"
              sx={{ mt: 0.5 }}
            />
          )}
          {record.contributionType === 'CANDIDATE' && (
            <Chip label="Candidate contribution" size="small" color="info" sx={{ mt: 0.5 }} />
          )}
        </>
      ),
    },
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
      sortField: 'location',
      hideOnMobile: true,
      render: (record) => (record.city ? `${record.city}, ${record.state}` : record.location || '—'),
    },
    { key: 'date', label: 'Receipt Date', sortField: 'date', render: (record) => record.receiptDate || '—' },
  ];

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading recipient details...</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  if (!contributions.length) {
    return (
      <Box>
        <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>No filings found for this recipient.</Paper>
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
        <Button variant="outlined" size="small" component="a" href={krefLink} target="_blank" rel="noreferrer">
          Open KREF search
        </Button>
      </Box>

      <Typography variant="h4" sx={{ mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
        {recipientName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {contributors.size} contributors · {contributions.length} filings
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
            Total Raised
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
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {Array.from(contributors).slice(0, 3).join(', ') || '—'}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, md: 2 }, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
          <Typography variant="overline" color="text.secondary">
            Office
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {offices.size ? Array.from(offices)[0] : '—'}
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

export default LfucgRecipientDetailPage;
