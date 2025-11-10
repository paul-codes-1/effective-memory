import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContributors } from '../hooks/useContributors';
import { slugify } from '../data/utils';

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
    return <div className="alert info">Loading recipient details…</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  if (!contributions.length) {
    return (
      <div>
        <p className="alert error">No filings found for this recipient.</p>
        <Link to="/recipients">← Back to recipients</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/recipients" className="subtitle">
        ← Back to recipients
      </Link>
      <h2 style={{ marginBottom: '0.4rem' }}>{recipientName}</h2>
      <p className="subtitle">{contributors.size} contributors · {contributions.length} filings</p>

      <div className="card-grid">
        <article className="card">
          <p className="stat-label">Total Raised</p>
          <p className="stat-value">{formatCurrency(totalAmount)}</p>
        </article>
        <article className="card">
          <p className="stat-label">Contributors</p>
          <p className="stat-value">{contributors.size.toLocaleString()}</p>
          <p className="subtitle">{Array.from(contributors).slice(0, 3).join(', ') || '—'}</p>
        </article>
        <article className="card">
          <p className="stat-label">Office</p>
          <p className="stat-value">{offices.size ? Array.from(offices)[0] : '—'}</p>
        </article>
      </div>

      <section>
        <div className="flex-between">
          <h3 className="section-title">All Contributions</h3>
          <span className="badge">{contributions.length.toLocaleString()} entries</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contributor</th>
                <th>Amount</th>
                <th>Type / Mode</th>
                <th>Location</th>
                <th>Receipt Date</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((record) => (
                <tr key={record.id}>
                  <td>
                    <Link to={`/contributors/${slugify(record.contributorFullName)}`}>{record.contributorFullName}</Link>
                    <br />
                    <span className="subtitle">{record.occupation || 'Occupation N/A'}</span>
                  </td>
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
      </section>
    </div>
  );
};

export default RecipientDetailPage;
