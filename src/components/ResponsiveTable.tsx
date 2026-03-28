import { ReactNode } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import type { SortDirection } from '../hooks/useTableSort';

export interface ColumnDef<T> {
  /** Unique key for this column */
  key: string;
  /** Column header label */
  label: string;
  /**
   * Render function for the cell content.
   * For secondary columns on mobile, returning a plain string or null is preferred
   * since the mobile card view prefixes the content with the column label.
   * Returning JSX will work but will always be shown (empty-content filtering only
   * works for string/null returns).
   */
  render: (row: T) => ReactNode;
  /** Sort field identifier — if provided, column header becomes sortable */
  sortField?: string;
  /** Hide this column on mobile card view (still shown in table) */
  hideOnMobile?: boolean;
  /** If true, this column's content is used as the card title on mobile */
  primary?: boolean;
  /** If true, this column's content is shown prominently on the card */
  highlight?: boolean;
}

interface ResponsiveTableProps<T, F extends string = string> {
  columns: ColumnDef<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  sortField?: F;
  sortDirection?: SortDirection;
  onSort?: (field: F) => void;
  elevation?: number;
  sx?: Record<string, unknown>;
}

function ResponsiveTable<T, F extends string = string>({
  columns,
  rows,
  getRowKey,
  sortField,
  sortDirection,
  onSort,
  elevation = 0,
  sx,
}: ResponsiveTableProps<T, F>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    const primaryCol = columns.find((c) => c.primary);
    const highlightCol = columns.find((c) => c.highlight);
    const secondaryCols = columns.filter((c) => !c.primary && !c.highlight && !c.hideOnMobile);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, ...sx }}>
        {rows.map((row) => (
          <Paper key={getRowKey(row)} sx={{ p: 1.5 }} elevation={elevation}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
              {primaryCol && (
                <Box sx={{ fontWeight: 600, fontSize: '0.875rem', flex: 1, minWidth: 0 }}>{primaryCol.render(row)}</Box>
              )}
              {highlightCol && (
                <Box sx={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', color: 'primary.main' }}>
                  {highlightCol.render(row)}
                </Box>
              )}
            </Box>
            {secondaryCols.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {secondaryCols.map((col) => {
                  const content = col.render(row);
                  if (content === null || (typeof content === 'string' && (!content || content === '—'))) return null;
                  return (
                    <Typography key={col.key} variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {col.label}: {content}
                    </Typography>
                  );
                })}
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={elevation} sx={sx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                {col.sortField && onSort ? (
                  <TableSortLabel
                    active={sortField === col.sortField}
                    direction={sortField === col.sortField ? sortDirection : 'asc'}
                    onClick={() => onSort(col.sortField as F)}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowKey(row)} hover>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ResponsiveTable;
