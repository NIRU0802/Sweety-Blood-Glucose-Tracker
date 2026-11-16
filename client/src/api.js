import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sweety_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

export default api;