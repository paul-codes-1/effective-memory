import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLfucgContributors } from '../../hooks/useLfucgContributors';
import { computeRaceDetail, type CandidateBreakdown, type DonorOverlapRecord } from '../../data/raceAggregation';
import { slugify } from '../../data/utils';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import useTableSort from '../../hooks/useTableSort';
import EmployerChip from '../../components/EmployerChip';
import ResponsiveTable, { ColumnDef } from '../../components/ResponsiveTable';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const LfucgRaceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useLfucgContributors();
  const overlapSort = useTableSort<'contributor' | 'amount' | 'candidates'>('amount');

  const raceDetail = useMemo(() => {
    if (!slug) return null;
    return computeRaceDetail(data, slug);
  }, [data, slug]);

  const maxCandidateTotal = useMemo(() => {
    if (!raceDetail) return 0;
    return Math.max(...raceDetail.candidates.map((c) => c.total), 1);
  }, [raceDetail]);

  const sortedOverlap = useMemo(() => {
    if (!raceDetail) return [];
    const rows = [...raceDetail.donorOverlap.overlappingDonors];
    rows.sort((a, b) => {
      switch (overlapSort.sortField) {
        case 'contributor':
          return overlapSort.sortDirection === 'asc'
            ? a.contributorName.localeCompare(b.contributorName, undefined, { sensitivity: 'base' })
            : b.contributorName.localeCompare(a.contributorName, undefined, { sensitivity: 'base' });
        case 'candidates':
          return overlapSort.sortDirection === 'asc'
            ? a.candidateCount - b.candidateCount
            : b.candidateCount - a.candidateCount;
        case 'amount':
        default:
          return overlapSort.sortDirection === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
      }
    });
    return rows;
  }, [raceDetail, overlapSort.sortField, overlapSort.sortDirection]);

  const overlapColumns: ColumnDef<DonorOverlapRecord>[] = [
    {
      key: 'contributor',
      label: 'Contributor',
      sortField: 'contributor',
      primary: true,
      render: (record) => <Link to={`/contributors/${slugify(record.contributorName)}`}>{record.contributorName}</Link>,
    },
    {
      key: 'amount',
      label: 'Total Given',
      sortField: 'amount',
      highlight: true,
      render: (record) => formatCurrency(record.totalAmount),
    },
    {
      key: 'candidates',
      label: 'Candidates',
      sortField: 'candidates',
      render: (record) => record.candidateCount.toLocaleString(),
    },
    {
      key: 'breakdown',
      label: 'Breakdown',
      hideOnMobile: true,
      render: (record) => record.breakdown.map((b) => `${b.candidateName}: ${formatCurrency(b.amount)}`).join(', '),
    },
  ];

  if (loading) {
    return <Paper sx={{ p: 2, bgcolor: 'info.light' }}>Loading race details...</Paper>;
  }

  if (error) {
    return <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>{error}</Paper>;
  }

  if (!raceDetail) {
    return (
      <Box>
        <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>No race found for this office.</Paper>
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
        <Button component={Link} to="/races" variant="outlined" size="small">
          All Races
        </Button>
      </Box>

      <Typography variant="h4" sx={{ mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
        {raceDetail.office}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {raceDetail.candidates.length} candidates &middot; {raceDetail.contributorCount} contributors
      </Typography>

      {/* Summary stat cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1, md: 2 },
          mb: 3,
        }}
      >
        <Paper sx={{ p: { xs: 1.5, md: 2 } }}>
          <Typography variant="overline" color="text.secondary">
            Total Raised
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {formatCurrency(raceDetail.totalRaised)}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, md: 2 } }}>
          <Typography variant="overline" color="text.secondary">
            Contributors
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {raceDetail.contributorCount.toLocaleString()}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, md: 2 }, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
          <Typography variant="overline" color="text.secondary">
            Avg per Candidate
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {formatCurrency(raceDetail.avgPerCandidate)}
          </Typography>
        </Paper>
      </Box>

      {/* Candidate comparison cards */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Candidates
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: { xs: 1.5, md: 2 },
          mb: 3,
        }}
      >
        {raceDetail.candidates.map((candidate) => (
          <CandidateCard
            key={candidate.slug}
            candidate={candidate}
            maxTotal={maxCandidateTotal}
            totalRaised={raceDetail.totalRaised}
          />
        ))}
      </Box>

      {/* Donor overlap section */}
      {raceDetail.donorOverlap.overlapCount > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Shared Contributors</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={`${raceDetail.donorOverlap.overlapCount} donors (${raceDetail.donorOverlap.overlapPercentage.toFixed(1)}%)`}
                size="small"
              />
              <Button
                size="small"
                onClick={overlapSort.resetSort}
                disabled={overlapSort.sortField === 'amount' && overlapSort.sortDirection === 'desc'}
              >
                Reset sort
              </Button>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Contributors who gave to multiple candidates in this race
          </Typography>
          <ResponsiveTable
            columns={overlapColumns}
            rows={sortedOverlap.slice(0, 100)}
            getRowKey={(record) => record.identityKey}
            sortField={overlapSort.sortField}
            sortDirection={overlapSort.sortDirection}
            onSort={overlapSort.handleSort}
          />
          {sortedOverlap.length > 100 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing the first 100 shared contributors.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

/* ------------------------------------------------------------------ */
/*  CandidateCard sub-component                                       */
/* ------------------------------------------------------------------ */

interface CandidateCardProps {
  candidate: CandidateBreakdown;
  maxTotal: number;
  totalRaised: number;
}

const CandidateCard = ({ candidate, maxTotal, totalRaised }: CandidateCardProps) => {
  const pct = totalRaised > 0 ? (candidate.total / totalRaised) * 100 : 0;
  const barValue = maxTotal > 0 ? (candidate.total / maxTotal) * 100 : 0;

  return (
    <Paper sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          <Link to={`/recipients/${candidate.slug}`}>{candidate.name}</Link>
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
          {formatCurrency(candidate.total)}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={barValue}
        sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: 'grey.200' }}
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {candidate.count} contributions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Avg: {formatCurrency(candidate.avg)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pct.toFixed(1)}% of race total
        </Typography>
      </Box>

      {candidate.topEmployers.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {candidate.topEmployers.slice(0, 3).map((emp) => (
            <EmployerChip key={emp.employerKey} employer={emp.name} size="small" variant="outlined" color="primary" />
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default LfucgRaceDetailPage;
