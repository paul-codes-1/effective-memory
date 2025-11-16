import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContributors } from '../hooks/useContributors';
import { slugify } from '../data/utils';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const RecipientDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error } = useContributors();

  const { contributions, recipientName, totalAmount, contributors, offices } = useMemo(() => {
    if (!slug) {
      return { contributions: [], recipientName: '', totalAmount: 0, contributors: new Set<string>(), offices: new Set<string>() };
    }
    const filtered = data.filter((record) => slugify(record.recipientFullName) === slug);
    const name = filtered[0]?.recipientFullName || slug.replace(/-/g, ' ');
    const total = filtered.reduce((sum, record) => sum + record.amount, 0);
    const contributors = new Set(filtered.map((record) => record.contributorFullName).filter(Boolean));
    const offices = new Set(filtered.map((record) => record.officeSought).filter(Boolean));
    return { contributions: filtered, recipientName: name, totalAmount: total, contributors, offices };
  }, [data, slug]);

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading recipient details…</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  if (!contributions.length) {
    return (
      <Box>
        <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>No filings found for this recipient.</Paper>
        <Box sx={{ mt: 2 }}>
          <Link to="/recipients">← Back to recipients</Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Link to="/recipients" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="text.secondary">← Back to recipients</Typography>
        </Link>
      </Box>

      <Typography variant="h4" sx={{ mb: 0.5 }}>{recipientName}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{contributors.size} contributors · {contributions.length} filings</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Total Raised</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(totalAmount)}</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Contributors</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{contributors.size.toLocaleString()}</Typography>
          <Typography variant="body2" color="text.secondary">{Array.from(contributors).slice(0, 3).join(', ') || '—'}</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">Office</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{offices.size ? Array.from(offices)[0] : '—'}</Typography>
        </Paper>
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">All Contributions</Typography>
          <Chip label={`${contributions.length.toLocaleString()} entries`} size="small" />
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Contributor</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Type / Mode</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Receipt Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contributions.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Link to={`/contributors/${slugify(record.contributorFullName)}`}>{record.contributorFullName}</Link>
                    <Typography variant="body2" color="text.secondary">{record.occupation || 'Occupation N/A'}</Typography>
                  </TableCell>
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
      </Box>
    </Box>
  );
};

export default RecipientDetailPage;
