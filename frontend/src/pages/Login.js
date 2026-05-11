import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { checkStore, login } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const portal = searchParams.get('portal');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = location.state?.from || '/';
  const loginMessage = location.state?.message;

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData);
      if (!response.data.access) {
        setError('Invalid server response');
        return;
      }

      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_type', response.data.user_type);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('is_superadmin', response.data.is_superadmin || 'false');

      if (response.data.is_superadmin) {
        navigate('/super-admin');
        return;
      }

      if (portal && response.data.user_type && portal !== response.data.user_type) {
        setError(`This is the ${portal} portal. You logged in as ${response.data.user_type}. Open the correct portal tab.`);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('username');
        localStorage.removeItem('is_superadmin');
        return;
      }

      if (response.data.user_type === 'exporter') {
        try {
          const storeResponse = await checkStore();
          navigate(storeResponse.data.has_store ? '/exporter-dashboard' : '/store-setup');
        } catch {
          navigate('/store-setup');
        }
        return;
      }

      navigate(from !== '/login' ? from : '/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-login-page grid min-h-[calc(100dvh-88px)] place-items-center px-4 py-10 dark:text-white">
      <section className="auth-shell grid w-full max-w-6xl overflow-hidden rounded-[38px] border border-blue-100 bg-white shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="auth-form-panel p-6 md:p-10">
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">{portal ? `${portal} portal` : 'Sign in'}</span>
          <h1 className="mt-5 text-[clamp(2.4rem,5vw,4.8rem)] font-black leading-none text-slate-950 dark:text-white">Welcome back.</h1>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-500 dark:text-blue-100">Sign in to browse deals, manage offers, checkout orders, or run your seller workspace.</p>

          {loginMessage && <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700 dark:bg-white/10 dark:text-blue-200">{loginMessage}</div>}
          {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100">
              Username
              <input name="username" value={formData.username} onChange={handleChange} disabled={loading} required className="h-14 rounded-2xl border border-blue-100 bg-blue-50 px-4 text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder="Enter username" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100">
              Password
              <input type="password" name="password" value={formData.password} onChange={handleChange} disabled={loading} required className="h-14 rounded-2xl border border-blue-100 bg-blue-50 px-4 text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder="Enter password" />
            </label>
            <button disabled={loading} className="h-14 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-slate-500 dark:text-blue-100">
            Do not have an account? <Link to={`/signup${portal ? `?type=${portal}` : ''}`} className="font-black text-blue-700 no-underline dark:text-blue-200">Create one</Link>
          </p>
        </div>

        <div className="auth-visual-panel relative min-h-[360px] bg-blue-600 p-8 text-white md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.24),transparent_24rem)]"></div>
          <div className="relative flex h-full flex-col justify-between">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15 text-2xl">
              <i className="fas fa-layer-group" aria-hidden="true"></i>
            </div>
            <div>
              <h2 className="text-[clamp(2rem,5vw,5rem)] font-black leading-none">Retail-ready trade starts here.</h2>
              <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-blue-100">A modern buying and selling experience with clean cards, fast search, demo payments and seller tools.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
