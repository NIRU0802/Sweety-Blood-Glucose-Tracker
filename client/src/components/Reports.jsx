import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Activity, Hash, CalendarDays, CalendarRange, CalendarClock, Leaf } from 'lucide-react';
import api, { errorMessage, slotLabel, valueStatus } from '../api';

// "2026-11-16" -> "16 Nov 2026". Adding T00:00:00 makes the browser read it as LOCAL time,
// which avoids the classic "one day off" timezone bug.
const fmt = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const rangeText = (r) => (r.from === r.to ? fmt(r.from) : `${fmt(r.from)} – ${fmt(r.to)}`);

// The 4 stat tiles. Full class strings (not built from pieces) so Tailwind can detect them.
const STATS = [
  { key: 'highest', label: 'Highest', icon: ArrowUp, tone: 'bg-rose-50 text-rose-600' },
  { key: 'lowest', label: 'Lowest', icon: ArrowDown, tone: 'bg-sky-50 text-sky-600' },
  { key: 'average', label: 'Average', icon: Activity, tone: 'bg-indigo-50 text-indigo-600' },
  { key: 'count', label: 'Readings', icon: Hash, tone: 'bg-emerald-50 text-emerald-600' },
];

// Shown while the report is loading (the pulsing grey blocks)
function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-1/3 rounded bg-slate-100" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100" />)}
      </div>
    </div>
  );
}

function ReportCard({ type, title, icon: Icon, date, refreshKey, className = '' }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api.get(`/reports/${type}`, { params: { date } })
      .then((r) => setReport(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [type, date, refreshKey]); // refetch when the date changes or a reading is added/edited/deleted

  return (
    <section className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold leading-tight">{title}</h3>
          {report && <p className="text-xs text-slate-400">{rangeText(report.range)}</p>}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!report && !error && <Skeleton />}

      {report && report.count === 0 && (
        // Friendly empty state (required by the assignment)
        <div className="grid place-items-center gap-2 rounded-2xl bg-slate-50 py-8 text-center text-slate-400">
          <Leaf className="h-9 w-9" />
          <p className="text-sm font-medium text-slate-500">No readings for this period yet</p>
          <p className="text-xs">Add a reading and it will show up here.</p>
        </div>
      )}

      {report && report.count > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map(({ key, label, icon: StatIcon, tone }) => (
              <div key={key} className="rounded-2xl bg-slate-50 p-3">
                <div className={`mb-2 grid h-7 w-7 place-items-center rounded-lg ${tone}`}>
                  <StatIcon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{report[key]}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Only the daily report includes the readings list */}
          {report.readings && (
            <ul className="mt-4 divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-100">
              {report.readings.map((r) => {
                const s = valueStatus(r.value);
                return (
                  <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-600">{slotLabel(r.slot)}</span>
                    <span className="flex items-center gap-3">
                      <b>{r.value} <span className="text-xs font-normal text-slate-400">mg/dl</span></b>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${s.cls}`}>{s.label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export default function Reports({ date, refreshKey }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Daily spans the full width because it also lists the readings */}
      <ReportCard type="daily" title="Daily report" icon={CalendarDays} date={date} refreshKey={refreshKey} className="lg:col-span-2" />
      <ReportCard type="month-to-date" title="Month to date" icon={CalendarRange} date={date} refreshKey={refreshKey} />
      <ReportCard type="monthly" title="Previous month" icon={CalendarClock} date={date} refreshKey={refreshKey} />
    </div>
  );
}