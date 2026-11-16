import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api, { errorMessage, slotLabel, todayLocal } from '../api';
import ReadingForm from '../components/ReadingForm';
import Reports from '../components/Reports';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [date, setDate] = useState(todayLocal());
  const [readings, setReadings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/readings', { params: { date, limit: 10 } });
      setReadings(data.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [date]);

  useEffect(() => { load(); setEditing(null); }, [load, refreshKey]);

  const changed = () => { setEditing(null); setRefreshKey((k) => k + 1); };

  const remove = async (id) => {
    if (!window.confirm('Delete this reading?')) return;
    try { await api.delete(`/readings/${id}`); changed(); }
    catch (e) { setError(errorMessage(e)); }
  };

  return (
    <div className="container">
      <header>
        <h1>🍬 Sweety</h1>
        <div className="row">
          <span className="muted">Hi, {user.name}</span>
          <button className="secondary" onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="card row">
        <label>Date&nbsp;
          <input type="date" value={date} max={todayLocal()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="grid">
        <ReadingForm date={date} editing={editing} onSaved={changed} onCancel={() => setEditing(null)} />
        <div className="card">
          <h3>Readings on {date}</h3>
          {readings.length === 0 ? (
            <p className="empty">Nothing logged for this day.</p>
          ) : (
            <ul className="slot-list">
              {readings.map((r) => (
                <li key={r.id}>
                  <span>{slotLabel(r.slot)}</span>
                  <b>{r.value} mg/dl</b>
                  <span className="row">
                    <button className="small" onClick={() => setEditing(r)}>Edit</button>
                    <button className="small danger" onClick={() => remove(r.id)}>Delete</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2>Reports</h2>
      <Reports date={date} refreshKey={refreshKey} />
    </div>
  );
}