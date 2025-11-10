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

interface RecipientAggregate {
  name: string;
  total: number;
  count: number;
  office: string;
  sampleCity: string;
}

const RecipientsPage = () => {
  const { data, loading, error } = useContributors();
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('all');

  const offices = useMemo(() => {
    return Array.from(new Set(data.map((record) => record.officeSought))).filter(Boolean).sort();
  }, [data]);

  const aggregates = useMemo<RecipientAggregate[]>(() => {
    const map = new Map<string, RecipientAggregate>();

    data.forEach((record) => {
      const key = record.recipientFullName || 'Unknown recipient';
      const existing = map.get(key) ?? {
        name: key,
        total: 0,
        count: 0,
        office: record.officeSought,
        sampleCity: record.city ? `${record.city}, ${record.state}` : record.location,
      };
      existing.total += record.amount;
      existing.count += 1;
      if (!existing.office && record.officeSought) {
        existing.office = record.officeSought;
      }
      if (!existing.sampleCity) {
        existing.sampleCity = record.city ? `${record.city}, ${record.state}` : record.location;
      }
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [data]);

  const filteredAggregates = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return aggregates.filter((entry) => {
      const matchesSearch = searchValue ? entry.name.toLowerCase().includes(searchValue) : true;
      const matchesOffice = officeFilter === 'all' || entry.office === officeFilter;
      return matchesSearch && matchesOffice;
    });
  }, [aggregates, officeFilter, search]);

  if (loading) {
    return <div className="alert info">Loading recipient rollups…</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  return (
    <div>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Recipients</h2>
        <div className="subtitle">
          {filteredAggregates.length.toLocaleString()} recipients shown
        </div>
      </div>

      <div className="filter-row">
        <SearchInput label="Search" placeholder="Recipient name" value={search} onChange={setSearch} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Office</span>
          <select className="select" value={officeFilter} onChange={(event) => setOfficeFilter(event.target.value)}>
            <option value="all">All offices</option>
            {offices.map((office) => (
              <option key={office} value={office}>
                {office || 'Not listed'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Office</th>
              <th>Entries</th>
              <th>Total Amount</th>
              <th>Average</th>
              <th>Sample Location</th>
            </tr>
          </thead>
          <tbody>
            {filteredAggregates.slice(0, 200).map((entry) => (
              <tr key={entry.name}>
                <td>
                  <Link to={`/recipients/${slugify(entry.name)}`}>{entry.name}</Link>
                </td>
                <td>{entry.office || '—'}</td>
                <td>{entry.count.toLocaleString()}</td>
                <td>{formatCurrency(entry.total)}</td>
                <td>{formatCurrency(entry.total / entry.count)}</td>
                <td>{entry.sampleCity || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredAggregates.length > 200 && (
        <p className="subtitle" style={{ marginTop: '0.5rem' }}>
          Showing the first 200 recipients by filter. Add search terms to drill deeper.
        </p>
      )}
    </div>
  );
};

export default RecipientsPage;
