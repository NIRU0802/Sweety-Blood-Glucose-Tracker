import { useState } from 'react';
import toast from 'react-hot-toast';
// Icons are plain React components, so you size and color them with Tailwind classes
import {
  Droplet, Mail, Lock, User, Eye, EyeOff, Loader2,
  TrendingUp, ShieldCheck, CalendarDays,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';

// Small reusable input with an icon on the left.
// Keeping this separate avoids repeating the same long class list 4 times.
function Field({ icon: Icon, children }) {
  return (
    <div className="relative">
      {/* absolute = placed on top of the input, pointer-events-none = clicks pass through to the input */}
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      {children}
    </div>
  );
}

// Shared look for every input (pl-10 leaves room for the icon)
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none ' +
  'transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  // One handler for all inputs: uses the input's "name" attribute as the key
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
  };

  // Convenience for reviewers: fills in the seeded demo account
  const fillDemo = () => {
    setMode('login');
    setForm({ name: '', email: 'demo@sweety.test', password: 'Demo@123' });
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
    } catch (err) {
      setError(errorMessage(err)); // message comes from the API, e.g. "Invalid email or password."
    } finally {
      setLoading(false); // always re-enable the button, success or fail
    }
  };

  return (
    // Two columns on large screens (lg:), a single column on mobile
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT: brand panel, hidden on small screens */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-rose-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Decorative blurred circles for depth */}
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-rose-300/20 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 backdrop-blur">
            <Droplet className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Sweety</span>
        </div>

        <div className="relative space-y-8">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Understand your glucose,<br />one reading at a time.
          </h2>

          {/* Mini preview card: static decoration (illustrative, not real data) */}
          <div className="max-w-sm rounded-2xl bg-white/15 p-5 shadow-2xl ring-1 ring-white/25 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/70">Today · Daily average</p>
            <p className="mt-1 text-4xl font-bold">
              128 <span className="text-base font-normal text-white/70">mg/dl</span>
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-400/90 px-2 py-0.5 font-medium text-emerald-950">In range</span>
              <span className="text-white/70">4 readings logged</span>
            </div>
          </div>

          <ul className="space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-3"><CalendarDays className="h-5 w-5" /> Daily, month-to-date and monthly reports</li>
            <li className="flex items-center gap-3"><TrendingUp className="h-5 w-5" /> Trend chart of your month</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Private: you only see your own data</li>
          </ul>
        </div>

        <p className="relative text-xs text-white/60">Illustrative ranges only, not medical advice.</p>
      </div>

      {/* RIGHT: the form */}
      <div className="grid place-items-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Logo shown only on mobile, where the brand panel is hidden */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500">
              <Droplet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Sweety</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mb-6 mt-1 text-slate-500">
            {isLogin ? 'Log in to track your readings.' : 'Start tracking in under a minute.'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {/* Name field only appears when signing up */}
            {!isLogin && (
              <Field icon={User}>
                <input name="name" placeholder="Full name" value={form.name} onChange={change} className={inputClass} />
              </Field>
            )}

            <Field icon={Mail}>
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} className={inputClass} />
            </Field>

            <Field icon={Lock}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'} // toggles between dots and visible text
                placeholder="Password"
                value={form.password}
                onChange={change}
                className={inputClass + ' pr-11'}
              />
              {/* type="button" so clicking it doesn't submit the form */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </Field>

            {/* Error box, shown only when there is an error. role="alert" helps screen readers */}
            {error && (
              <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60"
            >
              {/* Spinner while waiting for the server */}
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <button type="button" onClick={switchMode} className="font-semibold text-indigo-600 hover:underline">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>

          <button type="button" onClick={fillDemo} className="mt-3 w-full text-center text-sm text-slate-500 hover:text-indigo-600">
            Just looking? <span className="font-medium underline">Use the demo account</span>
          </button>
        </div>
      </div>
    </div>
  );
}