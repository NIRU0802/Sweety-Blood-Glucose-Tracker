import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card" onSubmit={submit}>
        <h1>🍬 Sweety</h1>
        <p className="muted">Blood glucose tracker</p>
        {mode === 'register' && (
          <input name="name" placeholder="Name" value={form.name} onChange={change} />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={change} />
        {error && <div className="error" role="alert">{error}</div>}
        <button disabled={loading}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? "New here? Sign up" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}