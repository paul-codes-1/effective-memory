import { useMemo } from 'react';
import { useContributors } from '../hooks/useContributors';
import type { ContributorRecord } from '../data/types';
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

const OverviewPage = () => {
  const { data, loading, error } = useContributors();

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
      totalAmount: data.reduce((acc, record) => acc + record.amount, 0),
      totalContributions: data.length,
      uniqueContributors: new Set(data.map((record) => record.contributorFullName)).size,
      uniqueRecipients: new Set(data.map((record) => record.recipientFullName)).size,
    };

    const recipientMap = new Map<string, { name: string; total: number; count: number; office: string }>();
    const locationMap = new Map<string, { location: string; total: number; count: number }>();

    data.forEach((record) => {
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

  if (loading) {
    return (
      <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
        Loading contributor data…
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2 }} elevation={1}>
          <Typography variant="overline" color="text.secondary">
            Total Volume
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {formatCurrency(summary.totalAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Net of credits and refunds
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }} elevation={1}>
          <Typography variant="overline" color="text.secondary">
            Contributions
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {summary.totalContributions.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Individual records in the dataset
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }} elevation={1}>
          <Typography variant="overline" color="text.secondary">
            Contributors
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {summary.uniqueContributors.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unique individuals or committees
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }} elevation={1}>
          <Typography variant="overline" color="text.secondary">
            Recipients
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {summary.uniqueRecipients.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Campaigns or committees receiving funds
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Top Recipients</Typography>
          <Chip label="Top 5 by total amount" size="small" />
        </Box>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Recipient</TableCell>
                <TableCell>Office</TableCell>
                <TableCell>Entries</TableCell>
                <TableCell>Total Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topRecipients.map((recipient) => (
                <TableRow key={recipient.name}>
                  <TableCell>{recipient.name}</TableCell>
                  <TableCell>{recipient.office || '—'}</TableCell>
                  <TableCell>{recipient.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(recipient.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Active Locations</Typography>
          <Chip label="Top 5 by number of filings" size="small" />
        </Box>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>City</TableCell>
                <TableCell>Entries</TableCell>
                <TableCell>Total Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topLocations.map((loc) => (
                <TableRow key={loc.location}>
                  <TableCell>{loc.location}</TableCell>
                  <TableCell>{loc.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(loc.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Most Recent Filings</Typography>
          <Chip label="Latest 6 entries" size="small" />
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Contributor</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Receipt Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentContributions.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Typography component="div" sx={{ fontWeight: 700 }}>
                      {record.contributorFullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {record.city ? `${record.city}, ${record.state}` : record.location}
                    </Typography>
                  </TableCell>
                  <TableCell>{record.recipientFullName}</TableCell>
                  <TableCell>{formatCurrency(record.amount)}</TableCell>
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

export default OverviewPage;
