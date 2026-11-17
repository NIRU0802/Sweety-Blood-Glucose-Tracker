import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, X, Loader2 } from 'lucide-react';
import api, { SLOTS, errorMessage } from '../api';

export default function ReadingForm({ date, editing, onSaved, onCancel }) {
  const [slot, setSlot] = useState(SLOTS[0].value);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // When "Edit" is clicked on a row, fill the form; otherwise reset it
  useEffect(() => {
    setError('');
    if (editing) { setSlot(editing.slot); setValue(String(editing.value)); }
    else { setValue(''); }
  }, [editing]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Empty input is sent as undefined so the SERVER returns "Please enter a glucose value."
    const payload = { date, slot, value: value === '' ? undefined : Number(value) };
    try {
      if (editing) await api.put(`/readings/${editing.id}`, payload);
      else await api.post('/readings', payload);
      toast.success(editing ? 'Reading updated' : 'Reading saved');
      setValue('');
      onSaved();
    } catch (err) {
      setError(errorMessage(err)); // validation message from the API, shown inline
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        {editing ? <Save className="h-5 w-5 text-indigo-600" /> : <Plus className="h-5 w-5 text-indigo-600" />}
        {editing ? 'Edit reading' : 'Add reading'}
        <span className="ml-auto text-xs font-normal text-slate-400">{date}</span>
      </h3>

      <label className="mb-1 block text-xs font-medium text-slate-500">Time slot</label>
      <select value={slot} onChange={(e) => setSlot(e.target.value)} className={field}>
        {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <label className="mb-1 mt-4 block text-xs font-medium text-slate-500">Glucose (mg/dl)</label>
      <input
        type="number"
        placeholder="e.g. 120"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={field}
      />

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? 'Update' : 'Save reading'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
        )}
      </div>
    </form>
  );
}