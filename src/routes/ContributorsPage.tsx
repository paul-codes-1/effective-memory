import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import { useContributors } from '../hooks/useContributors';
import { slugify } from '../data/utils';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

type ViewMode = 'totals' | 'records';
type SortField = 'amount' | 'contributor' | 'recipient';

const ContributorsPage = () => {
  const { data, totals, loading, error } = useContributors();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('totals');
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (viewMode === 'totals' && sortField === 'recipient') {
      setSortField('amount');
    }
  }, [sortField, viewMode]);

  const contributionTypes = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.contributionType))).filter(Boolean).sort();
  }, [data]);

  const contributionModes = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.contributionMode))).filter(Boolean).sort();
  }, [data]);

  const searchValue = search.trim().toLowerCase();

  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const matchesSearch = searchValue
        ? [
            record.contributorFullName,
            record.recipientFullName,
            record.city,
            record.state,
            record.officeSought,
          ]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(searchValue))
        : true;

      const matchesType = typeFilter === 'all' || record.contributionType === typeFilter;
      const matchesMode = modeFilter === 'all' || record.contributionMode === modeFilter;

      return matchesSearch && matchesType && matchesMode;
    });
  }, [data, modeFilter, searchValue, typeFilter]);

  const filteredTotals = useMemo(() => {
    const entries = Object.values(totals);
    if (!searchValue) {
      return entries;
    }
    return entries.filter((entry) => entry.fullName.toLowerCase().includes(searchValue));
  }, [searchValue, totals]);

  const totalDisplayedAmount = useMemo(() => {
    if (viewMode === 'totals') {
      return filteredTotals.reduce((sum, entry) => sum + entry.totalAmount, 0);
    }
    return filteredData.reduce((sum, record) => sum + record.amount, 0);
  }, [filteredData, filteredTotals, viewMode]);

  const sortedRecords = useMemo(() => {
    const records = [...filteredData];
    records.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'contributor':
          comparison = a.contributorFullName.localeCompare(b.contributorFullName, undefined, { sensitivity: 'base' });
          break;
        case 'recipient':
          comparison = a.recipientFullName.localeCompare(b.recipientFullName, undefined, { sensitivity: 'base' });
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return records;
  }, [filteredData, sortDirection, sortField]);

  const sortedTotals = useMemo(() => {
    const entries = [...filteredTotals];
    entries.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'contributor') {
        comparison = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
      } else {
        comparison = a.totalAmount - b.totalAmount;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return entries;
  }, [filteredTotals, sortDirection, sortField]);

  const sortOptions =
    viewMode === 'totals'
      ? [
          { value: 'amount', label: 'Amount' },
          { value: 'contributor', label: 'Contributor' },
        ]
      : [
          { value: 'amount', label: 'Amount' },
          { value: 'contributor', label: 'Contributor' },
          { value: 'recipient', label: 'Recipient' },
        ];

  if (loading) {
    return <div className="alert info">Loading contributor data…</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  return (
    <div>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <h2>Contributors</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', border: '1px solid #cbd5f5', borderRadius: '999px' }}>
            <button
              type="button"
              onClick={() => setViewMode('totals')}
              style={{
                padding: '0.35rem 0.9rem',
                border: 'none',
                background: viewMode === 'totals' ? '#1d4ed8' : 'transparent',
                color: viewMode === 'totals' ? '#fff' : '#1e293b',
                borderRadius: '999px',
                cursor: 'pointer',
              }}
            >
              Totals
            </button>
            <button
              type="button"
              onClick={() => setViewMode('records')}
              style={{
                padding: '0.35rem 0.9rem',
                border: 'none',
                background: viewMode === 'records' ? '#1d4ed8' : 'transparent',
                color: viewMode === 'records' ? '#fff' : '#1e293b',
                borderRadius: '999px',
                cursor: 'pointer',
              }}
            >
              Records
            </button>
          </div>
          <div className="subtitle">
            {viewMode === 'totals'
              ? `Showing ${filteredTotals.length.toLocaleString()} of ${Object.keys(totals).length.toLocaleString()} contributors`
              : `Showing ${filteredData.length.toLocaleString()} of ${data.length.toLocaleString()} records`}{' '}
            · <strong>{formatCurrency(totalDisplayedAmount)}</strong>
          </div>
        </div>
      </div>

      <div className="filter-row">
        <SearchInput
          label="Search"
          placeholder="Contributor, city, office, recipient"
          value={search}
          onChange={setSearch}
        />
        {viewMode === 'records' && (
          <>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Contribution Type</span>
              <select className="select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">All types</option>
                {contributionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type || 'Unspecified'}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Contribution Mode</span>
              <select className="select" value={modeFilter} onChange={(event) => setModeFilter(event.target.value)}>
                <option value="all">All modes</option>
                {contributionModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode || 'Unspecified'}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Sort</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select className="select" value={sortField} onChange={(event) => setSortField(event.target.value as SortField)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="select"
              style={{ cursor: 'pointer', width: 'auto' }}
              onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDirection === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </label>
      </div>

      {viewMode === 'totals' ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contributor</th>
                <th>Total Amount</th>
                <th>Entries</th>
              </tr>
            </thead>
            <tbody>
              {sortedTotals.slice(0, 500).map((entry) => (
                <tr key={entry.key}>
                  <td>
                    <Link to={`/contributors/${entry.key}`}>{entry.fullName}</Link>
                  </td>
                  <td>{formatCurrency(entry.totalAmount)}</td>
                  <td>{entry.contributionCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedTotals.length > 500 && (
            <p className="subtitle" style={{ marginTop: '0.5rem', padding: '0 1rem 1rem' }}>
              Showing the first 500 contributors. Use search to refine further.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Contributor</th>
                  <th>Recipient</th>
                  <th>Office</th>
                  <th>Amount</th>
                  <th>Type / Mode</th>
                  <th>Location</th>
                  <th>Receipt Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.slice(0, 500).map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>
                        <Link to={`/contributors/${slugify(record.contributorFullName)}`}>
                          {record.contributorFullName}
                        </Link>
                      </strong>
                      <br />
                      <span className="subtitle">{record.occupation || 'Occupation N/A'}</span>
                    </td>
                    <td>{record.recipientFullName}</td>
                    <td>{record.officeSought || '—'}</td>
                    <td>{formatCurrency(record.amount)}</td>
                    <td>
                      <span className="badge">{record.contributionType || 'Unspecified'}</span>
                      <br />
                      <span className="subtitle">{record.contributionMode || '—'}</span>
                    </td>
                    <td>{record.city ? `${record.city}, ${record.state}` : record.location || '—'}</td>
                    <td>{record.receiptDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedRecords.length > 500 && (
            <p className="subtitle" style={{ marginTop: '0.5rem' }}>
              Showing the first 500 rows. Refine your filters to narrow the results.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ContributorsPage;
