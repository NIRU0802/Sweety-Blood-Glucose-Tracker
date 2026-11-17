import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart as ChartIcon } from 'lucide-react';
import api from '../api';

const shortDate = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// Dark pop-up shown when hovering a point
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-medium">{p.label}</p>
      <p>Average {p.avg} mg/dl</p>
      <p className="text-slate-400">{p.n} reading{p.n > 1 ? 's' : ''}</p>
    </div>
  );
}

export default function TrendChart({ date, refreshKey }) {
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    const from = `${date.slice(0, 8)}01`; // first day of the selected month
    api.get('/readings', { params: { from, to: date, limit: 200 } })
      .then((r) => setReadings(r.data.data))
      .catch(() => setReadings([]));
  }, [date, refreshKey]);

  // Group readings by day and take the daily average. useMemo = only recompute when readings change.
  const points = useMemo(() => {
    const byDay = {};
    readings.forEach((r) => { (byDay[r.date] ||= []).push(r.value); });
    return Object.keys(byDay).sort().map((d) => {
      const v = byDay[d];
      return { label: shortDate(d), avg: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10, n: v.length };
    });
  }, [readings]);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200">
          <ChartIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold leading-tight">Daily average this month</h3>
          <p className="text-xs text-slate-400">Green band = 70–180 mg/dl (illustrative, not medical advice)</p>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No data to chart yet.</p>
      ) : (
        // ResponsiveContainer makes the chart fill its parent's width
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              {/* Gradient fill under the line: strong at the top, fading to transparent */}
              <defs>
                <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <ReferenceArea y1={70} y2={180} fill="#10b981" fillOpacity={0.08} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis
                domain={[40, (max) => Math.max(200, max + 20)]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#avgFill)"
                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}