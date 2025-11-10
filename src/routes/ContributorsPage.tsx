import { useMemo, useState } from 'react';
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

const ContributorsPage = () => {
  const { data, loading, error } = useContributors();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  const contributionTypes = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.contributionType))).filter(Boolean).sort();
  }, [data]);

  const contributionModes = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.contributionMode))).filter(Boolean).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

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
  }, [data, search, typeFilter, modeFilter]);

  const totalDisplayedAmount = useMemo(
    () => filteredData.reduce((sum, record) => sum + record.amount, 0),
    [filteredData],
  );

  if (loading) {
    return <div className="alert info">Loading contributor data…</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  return (
    <div>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Contributors</h2>
        <div className="subtitle">
          Showing {filteredData.length.toLocaleString()} of {data.length.toLocaleString()} records ·{' '}
          <strong>{formatCurrency(totalDisplayedAmount)}</strong>
        </div>
      </div>

      <div className="filter-row">
        <SearchInput
          label="Search"
          placeholder="Contributor, city, office, recipient"
          value={search}
          onChange={setSearch}
        />
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
      </div>

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
            {filteredData.slice(0, 500).map((record) => (
              <tr key={record.id}>
                <td>
                  <strong>
                    <Link to={`/contributors/${slugify(record.contributorFullName)}`}>{record.contributorFullName}</Link>
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
      {filteredData.length > 500 && (
        <p className="subtitle" style={{ marginTop: '0.5rem' }}>
          Showing the first 500 rows. Refine your filters to narrow the results.
        </p>
      )}
    </div>
  );
};

export default ContributorsPage;
