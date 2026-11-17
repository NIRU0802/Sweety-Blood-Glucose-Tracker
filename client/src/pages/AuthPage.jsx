import { useState } from 'react';
import toast from 'react-hot-toast';
// Icons are plain React components, so you size and color them with Tailwind classes
import { Droplet, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    // min-h-screen + grid + place-items-center = card centered on the whole screen
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 shadow-lg shadow-indigo-200">
            <Droplet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sweety</h1>
          <p className="mt-1 text-slate-500">Track your blood glucose, simply.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/60">
          <h2 className="text-lg font-semibold">{isLogin ? 'Log in to your account' : 'Create your account'}</h2>

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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {/* Spinner while waiting for the server */}
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLogin ? 'Log in' : 'Create account'}
          </button>

          <p className="text-center text-sm text-slate-500">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <button type="button" onClick={switchMode} className="font-semibold text-indigo-600 hover:underline">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </form>

        <button type="button" onClick={fillDemo} className="mt-4 w-full text-center text-sm text-slate-500 hover:text-indigo-600">
          Just looking? <span className="font-medium underline">Use the demo account</span>
        </button>
      </div>
    </div>
  );
}