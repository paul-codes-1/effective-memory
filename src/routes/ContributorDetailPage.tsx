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
    return <div className="alert info">Loading contributor details…</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  if (!contributions.length) {
    return (
      <div>
        <p className="alert error">No contributions found for this contributor.</p>
        <Link to="/contributors">← Back to contributors</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/contributors" className="subtitle">
        ← Back to contributors
      </Link>
      <h2 style={{ marginBottom: '0.4rem' }}>{contributorName}</h2>
      <p className="subtitle">{recipients.size} recipients · {contributions.length} filings</p>

      <div className="card-grid">
        <article className="card">
          <p className="stat-label">Total Contributed</p>
          <p className="stat-value">{formatCurrency(totalAmount)}</p>
        </article>
        <article className="card">
          <p className="stat-label">Recipients</p>
          <p className="stat-value">{recipients.size}</p>
          <p className="subtitle">{Array.from(recipients).slice(0, 3).join(', ') || '—'}</p>
        </article>
        <article className="card">
          <p className="stat-label">Offices</p>
          <p className="stat-value">{offices.size || '—'}</p>
          <p className="subtitle">{Array.from(offices).slice(0, 3).join(', ') || 'No office listed'}</p>
        </article>
      </div>

      <section>
        <div className="flex-between">
          <h3 className="section-title">Contribution History</h3>
          <span className="badge">{contributions.length.toLocaleString()} entries</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Office</th>
                <th>Amount</th>
                <th>Type / Mode</th>
                <th>Receipt Date</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((record) => (
                <tr key={record.id}>
                  <td>
                    <Link to={`/recipients/${slugify(record.recipientFullName)}`}>{record.recipientFullName}</Link>
                  </td>
                  <td>{record.officeSought || '—'}</td>
                  <td>{formatCurrency(record.amount)}</td>
                  <td>
                    <span className="badge">{record.contributionType || 'Unspecified'}</span>
                    <br />
                    <span className="subtitle">{record.contributionMode || '—'}</span>
                  </td>
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

export default ContributorDetailPage;
