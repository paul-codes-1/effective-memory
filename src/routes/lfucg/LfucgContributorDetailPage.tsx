import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { slugify } from '../../data/utils';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableSortLabel from '@mui/material/TableSortLabel';
import useTableSort from '../../hooks/useTableSort';

const KREF_BASE_URL = 'https://secure.kentucky.gov/kref/publicsearch/AllContributors';
const buildKrefLink = (params: { firstName?: string; lastName?: string; orgName?: string }) => {
  const searchParams = new URLSearchParams({
    PageIndex: '0',
    FirstName: params.firstName || '',
    LastName: params.lastName || '',
    FromOrganizationName: params.orgName || '',
    ElectionDate: '5/19/2026',
    ElectionType: 'PRIMARY',
    OfficeSought: '',
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
    ContributionSearchType: 'All',
    PageSize: '10',
    ReportId: '',
  });
  return `${KREF_BASE_URL}?${searchParams.toString()}`;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const LfucgContributorDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error } = useLfucgContributors();
  const sort = useTableSort<'recipient' | 'office' | 'amount' | 'date'>('amount');

  const { contributions, contributorName, totalAmount, offices, recipients, attributionNote, krefLink, employers, occupations } = useMemo(() => {
    if (!slug) {
      return {
        contributions: [],
        contributorName: '',
        totalAmount: 0,
        offices: new Set<string>(),
        recipients: new Set<string>(),
        attributionNote: null,
        krefLink: buildKrefLink({}),
        employers: new Set<string>(),
        occupations: new Set<string>(),
      };
    }
    const filtered = data.filter((record) => slugify(record.contributorFullName) === slug);
    const primary = filtered[0];
    const name = primary?.contributorFullName || slug.replace(/-/g, ' ');
    const total = filtered.reduce((sum, record) => sum + record.amount, 0);
    const offices = new Set(filtered.map((record) => record.officeSought).filter(Boolean));
    const recipients = new Set(filtered.map((record) => record.recipientFullName).filter(Boolean));
    const attributionNote = primary?.attributionNote ?? null;
    const employers = new Set(filtered.map((record) => record.employer).filter(Boolean));
    const occupations = new Set(filtered.map((record) => record.occupation).filter(Boolean));
    const krefLink = buildKrefLink({
      firstName: primary?.contributorFirstName,
      lastName: primary?.contributorLastName,
      orgName: primary?.fromOrganizationName,
    });
    return { contributions: filtered, contributorName: name, totalAmount: total, offices, recipients, attributionNote, krefLink, employers, occupations };
  }, [data, slug]);

  const sortedContributions = useMemo(() => {
    const entries = [...contributions];
    entries.sort((a, b) => {
      switch (sort.sortField) {
        case 'recipient':
          return sort.sortDirection === 'asc'
            ? a.recipientFullName.localeCompare(b.recipientFullName, undefined, { sensitivity: 'base' })
            : b.recipientFullName.localeCompare(a.recipientFullName, undefined, { sensitivity: 'base' });
        case 'office':
          return sort.sortDirection === 'asc'
            ? (a.officeSought || '').localeCompare(b.officeSought || '', undefined, { sensitivity: 'base' })
            : (b.officeSought || '').localeCompare(a.officeSought || '', undefined, { sensitivity: 'base' });
        case 'date':
          return sort.sortDirection === 'asc'
            ? (Date.parse(a.receiptDate || '') || 0) - (Date.parse(b.receiptDate || '') || 0)
            : (Date.parse(b.receiptDate || '') || 0) - (Date.parse(a.receiptDate || '') || 0);
        case 'amount':
        default:
          return sort.sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });
    return entries;
  }, [contributions, sort.sortDirection, sort.sortField]);

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading contributor details…</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  if (!contributions.length) {
    return (
      <Box>
        <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>No contributions found for this contributor.</Paper>
        <Box sx={{ mt: 2 }}>
          <Link to="/contributors">← Back to contributors</Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Link to="/lfucg/contributors" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="text.secondary">← Back to contributors</Typography>
        </Link>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>{contributorName}</Typography>
        <Button variant="outlined" size="small" component="a" href={krefLink} target="_blank" rel="noreferrer">
          Open KREF search
        </Button>
      </Box>
      {(occupations.size > 0 || employers.size > 0) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {Array.from(occupations).map((occupation) => (
            <Chip key={`occ-${occupation}`} label={occupation} size="small" />
          ))}
          {Array.from(employers).map((employer) => (
            <Chip key={`emp-${employer}`} label={employer} size="small" color="primary" variant="outlined" />
          ))}
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{recipients.size} recipients · {contributions.length} filings</Typography>
      {(sortedContributions[0]?.isAnonymous || sortedContributions[0]?.isNameMissing) && (
        <Chip
          label={sortedContributions[0].isAnonymous ? 'Anonymous filing' : 'Name unavailable'}
          size="small"
          color="warning"
          sx={{ mb: 1 }}
        />
      )}
      {attributionNote && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {attributionNote}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Total Contributed</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(totalAmount)}</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Recipients</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{recipients.size}</Typography>
          <Typography variant="body2" color="text.secondary">{Array.from(recipients).slice(0, 3).join(', ') || '—'}</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Offices</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{offices.size || '—'}</Typography>
          <Typography variant="body2" color="text.secondary">{Array.from(offices).slice(0, 3).join(', ') || 'No office listed'}</Typography>
        </Paper>
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Contribution History</Typography>
          <Chip label={`${contributions.length.toLocaleString()} entries`} size="small" />
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
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
                    active={sort.sortField === 'office'}
                    direction={sort.sortField === 'office' ? sort.sortDirection : 'asc'}
                    onClick={() => sort.handleSort('office')}
                  >
                    Office
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
                <TableCell>Type / Mode</TableCell>
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
                    <Link to={`/lfucg/recipients/${slugify(record.recipientFullName)}`}>{record.recipientFullName}</Link>
                    {(record.isAnonymous || record.isNameMissing) && (
                      <Chip
                        label={record.isAnonymous ? 'Anonymous filing' : 'Name unavailable'}
                        size="small"
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                    {record.contributionType === 'CANDIDATE' && (
                      <Chip label="Candidate contribution" size="small" color="info" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>{record.officeSought || '—'}</TableCell>
                  <TableCell>{formatCurrency(record.amount)}</TableCell>
                  <TableCell>
                    <Chip label={record.contributionType || 'Unspecified'} size="small" />
                    {record.contributionType === 'CANDIDATE' && (
                      <Chip label="Candidate" size="small" color="info" sx={{ ml: 1 }} />
                    )}
                    <Typography variant="body2" color="text.secondary">{record.contributionMode || '—'}</Typography>
                  </TableCell>
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

export default LfucgContributorDetailPage;
