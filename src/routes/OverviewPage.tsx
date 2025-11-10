import { useMemo } from 'react';
import { useContributors } from '../hooks/useContributors';
import type { ContributorRecord } from '../data/types';

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
    return <div className="alert info">Loading contributor data…</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  return (
    <div>
      <section className="card-grid">
        <article className="card">
          <p className="stat-label">Total Volume</p>
          <p className="stat-value">{formatCurrency(summary.totalAmount)}</p>
          <p className="subtitle">Net of credits and refunds</p>
        </article>
        <article className="card">
          <p className="stat-label">Contributions</p>
          <p className="stat-value">{summary.totalContributions.toLocaleString()}</p>
          <p className="subtitle">Individual records in the dataset</p>
        </article>
        <article className="card">
          <p className="stat-label">Contributors</p>
          <p className="stat-value">{summary.uniqueContributors.toLocaleString()}</p>
          <p className="subtitle">Unique individuals or committees</p>
        </article>
        <article className="card">
          <p className="stat-label">Recipients</p>
          <p className="stat-value">{summary.uniqueRecipients.toLocaleString()}</p>
          <p className="subtitle">Campaigns or committees receiving funds</p>
        </article>
      </section>

      <section>
        <div className="flex-between">
          <h2 className="section-title">Top Recipients</h2>
          <span className="badge">Top 5 by total amount</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Office</th>
                <th>Entries</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {topRecipients.map((recipient) => (
                <tr key={recipient.name}>
                  <td>{recipient.name}</td>
                  <td>{recipient.office || '—'}</td>
                  <td>{recipient.count.toLocaleString()}</td>
                  <td>{formatCurrency(recipient.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex-between">
          <h2 className="section-title">Active Locations</h2>
          <span className="badge">Top 5 by number of filings</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>City</th>
                <th>Entries</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {topLocations.map((loc) => (
                <tr key={loc.location}>
                  <td>{loc.location}</td>
                  <td>{loc.count.toLocaleString()}</td>
                  <td>{formatCurrency(loc.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex-between">
          <h2 className="section-title">Most Recent Filings</h2>
          <span className="badge">Latest 6 entries</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contributor</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Receipt Date</th>
              </tr>
            </thead>
            <tbody>
              {recentContributions.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.contributorFullName}</strong>
                    <br />
                    <span className="subtitle">{record.city ? `${record.city}, ${record.state}` : record.location}</span>
                  </td>
                  <td>{record.recipientFullName}</td>
                  <td>{formatCurrency(record.amount)}</td>
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

export default OverviewPage;
