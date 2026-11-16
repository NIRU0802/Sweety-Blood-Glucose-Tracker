import { useEffect, useState } from 'react';
import api, { errorMessage, slotLabel } from '../api';

const TITLES = { daily: 'Daily', 'month-to-date': 'Month-to-date', monthly: 'Previous month' };

function ReportCard({ type, date, refreshKey }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api.get(`/reports/${type}`, { params: { date } })
      .then((r) => setReport(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [type, date, refreshKey]);

  return (
    <div className="card">
      <h3>{TITLES[type]}</h3>
      {error && <div className="error">{error}</div>}
      {report && (
        <>
          <p className="muted">
            {report.range.from === report.range.to ? report.range.from : `${report.range.from} → ${report.range.to}`}
          </p>
          {report.count === 0 ? (
            <p className="empty">No readings for this period yet. 🌱</p>
          ) : (
            <>
              <div className="stats">
                <div><b>{report.highest}</b><span>Highest</span></div>
                <div><b>{report.lowest}</b><span>Lowest</span></div>
                <div><b>{report.average}</b><span>Average</span></div>
                <div><b>{report.count}</b><span>Readings</span></div>
              </div>
              {report.readings && (
                <ul className="slot-list">
                  {report.readings.map((r) => (
                    <li key={r.id}><span>{slotLabel(r.slot)}</span><b>{r.value} mg/dl</b></li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function Reports({ date, refreshKey }) {
  return (
    <div className="reports">
      {Object.keys(TITLES).map((t) => (
        <ReportCard key={t} type={t} date={date} refreshKey={refreshKey} />
      ))}
    </div>
  );
}