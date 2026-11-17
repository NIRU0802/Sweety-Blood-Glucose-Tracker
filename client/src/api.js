import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach the JWT (if any) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sweety_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Prefer the API's own message (e.g. "Value must be between 40 and 600 mg/dl.")
export const errorMessage = (err) =>
  err.response?.data?.error || 'Something went wrong. Please try again.';

export const SLOTS = [
  { value: 'MORNING_FASTING', label: 'Morning (fasting)' },
  { value: 'AFTER_BREAKFAST', label: 'After breakfast' },
  { value: 'AFTER_LUNCH', label: 'After lunch' },
  { value: 'AFTER_DINNER', label: 'After dinner' },
];
export const slotLabel = (v) => SLOTS.find((s) => s.value === v)?.label || v;

// Local date as YYYY-MM-DD (en-CA gives ISO-style format)
export const todayLocal = () => new Date().toLocaleDateString('en-CA');

// Color-coded status for a glucose value.
// Ranges are illustrative, NOT medical advice (mentioned in the UI and README Notes).
export function valueStatus(v) {
  if (v < 70) return { label: 'Low', cls: 'bg-red-50 text-red-700 ring-red-200' };
  if (v <= 180) return { label: 'In range', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
  if (v <= 250) return { label: 'High', cls: 'bg-amber-50 text-amber-700 ring-amber-200' };
  return { label: 'Very high', cls: 'bg-red-50 text-red-700 ring-red-200' };
}

export default api;