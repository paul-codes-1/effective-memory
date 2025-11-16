import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContributors } from '../hooks/useContributors';
import { slugify } from '../data/utils';
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

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const ContributorDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error } = useContributors();

  const { contributions, contributorName, totalAmount, offices, recipients } = useMemo(() => {
    if (!slug) {
      return { contributions: [], contributorName: '', totalAmount: 0, offices: new Set<string>(), recipients: new Set<string>() };
    }
    const filtered = data.filter((record) => slugify(record.contributorFullName) === slug);
    const name = filtered[0]?.contributorFullName || slug.replace(/-/g, ' ');
    const total = filtered.reduce((sum, record) => sum + record.amount, 0);
    const offices = new Set(filtered.map((record) => record.officeSought).filter(Boolean));
    const recipients = new Set(filtered.map((record) => record.recipientFullName).filter(Boolean));
    return { contributions: filtered, contributorName: name, totalAmount: total, offices, recipients };
  }, [data, slug]);

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
        <Link to="/contributors" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="text.secondary">← Back to contributors</Typography>
        </Link>
      </Box>

      <Typography variant="h4" sx={{ mb: 0.5 }}>{contributorName}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{recipients.size} recipients · {contributions.length} filings</Typography>

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
                <TableCell>Recipient</TableCell>
                <TableCell>Office</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Type / Mode</TableCell>
                <TableCell>Receipt Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contributions.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Link to={`/recipients/${slugify(record.recipientFullName)}`}>{record.recipientFullName}</Link>
                  </TableCell>
                  <TableCell>{record.officeSought || '—'}</TableCell>
                  <TableCell>{formatCurrency(record.amount)}</TableCell>
                  <TableCell>
                    <Chip label={record.contributionType || 'Unspecified'} size="small" />
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

export default ContributorDetailPage;
