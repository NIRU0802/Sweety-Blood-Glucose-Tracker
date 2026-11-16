import { useEffect, useState } from 'react';
import api, { SLOTS, errorMessage } from '../api';

export default function ReadingForm({ date, editing, onSaved, onCancel }) {
  const [slot, setSlot] = useState(SLOTS[0].value);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (editing) { setSlot(editing.slot); setValue(String(editing.value)); }
    else { setValue(''); }
  }, [editing]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { date, slot, value: value === '' ? undefined : Number(value) };
    try {
      if (editing) await api.put(`/readings/${editing.id}`, payload);
      else await api.post('/readings', payload);
      setValue('');
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h3>{editing ? 'Edit reading' : 'Add reading'} · {date}</h3>
      <select value={slot} onChange={(e) => setSlot(e.target.value)}>
        {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <input
        type="number"
        placeholder="Glucose (mg/dl)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {error && <div className="error" role="alert">{error}</div>}
      <div className="row">
        <button>{editing ? 'Update' : 'Save reading'}</button>
        {editing && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}