import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Droplet, LogOut, Calendar, Pencil, Trash2, Sunrise, Coffee, Utensils, Moon, Inbox } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api, { errorMessage, slotLabel, todayLocal, valueStatus } from '../api';
import ReadingForm from '../components/ReadingForm';
import Reports from '../components/Reports';
import TrendChart from '../components/TrendChart';

// One icon per slot, looked up by the slot's enum value
const SLOT_ICONS = {
  MORNING_FASTING: Sunrise,
  AFTER_BREAKFAST: Coffee,
  AFTER_LUNCH: Utensils,
  AFTER_DINNER: Moon,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [date, setDate] = useState(todayLocal());
  const [readings, setReadings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // bump to reload list, chart and reports

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/readings', { params: { date, limit: 10 } });
      setReadings(data.data);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }, [date]);

  useEffect(() => { load(); setEditing(null); }, [load, refreshKey]);

  const changed = () => { setEditing(null); setRefreshKey((k) => k + 1); };

  const remove = async (id) => {
    if (!window.confirm('Delete this reading?')) return;
    try {
      await api.delete(`/readings/${id}`);
      toast.success('Reading deleted');
      changed();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Sticky top bar with frosted-glass effect */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500">
              <Droplet className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Sweety</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">Hi, {user.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Date picker. max=today blocks future dates in the browser; the server also checks. */}
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <label className="text-sm font-medium text-slate-600">Date</label>
          <input
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ReadingForm date={date} editing={editing} onSaved={changed} onCancel={() => setEditing(null)} />

          {/* Readings list */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-4 font-semibold">Readings on {date}</h3>

            {readings.length === 0 ? (
              <div className="grid place-items-center gap-2 py-10 text-slate-400">
                <Inbox className="h-10 w-10" />
                <p className="text-sm">Nothing logged for this day.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {readings.map((r) => {
                  const Icon = SLOT_ICONS[r.slot];
                  const status = valueStatus(r.value);
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{slotLabel(r.slot)}</p>
                        <p className="text-lg font-bold leading-tight">
                          {r.value} <span className="text-xs font-normal text-slate-400">mg/dl</span>
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${status.cls}`}>
                        {status.label}
                      </span>
                      <button onClick={() => setEditing(r)} aria-label="Edit" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(r.id)} aria-label="Delete" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 text-xs text-slate-400">
              Colors are illustrative ranges, not medical advice.
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold">Insights</h2>
        <TrendChart date={date} refreshKey={refreshKey} />
        <Reports date={date} refreshKey={refreshKey} />
      </main>
    </div>
  );
}