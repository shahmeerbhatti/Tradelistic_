import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signup } from '../services/api';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') === 'exporter' ? 'exporter' : 'importer';
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    user_type: defaultType,
    city: '',
    state_country: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatSignupError = (data) => {
    if (!data) return 'Failed to create account. Please try again.';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.join('\n');
    if (typeof data === 'object') {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.detail === 'string') return data.detail;
      return Object.entries(data)
        .map(([key, value]) => {
          const message = Array.isArray(value)
            ? value.join(', ')
            : typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
          return `${key}: ${message}`;
        })
        .join('\n');
    }
    return 'Failed to create account. Please try again.';
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'user_type' && value === 'exporter' ? { city: '', state_country: '' } : {}),
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { password2, ...payload } = formData;
      if (payload.user_type !== 'importer') {
        delete payload.city;
        delete payload.state_country;
      }
      await signup(payload);
      navigate(`/login?portal=${payload.user_type}`);
    } catch (err) {
      if (err.response?.data) {
        setError(formatSignupError(err.response.data));
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'h-13 min-h-14 rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950 dark:text-white';

  return (
    <main className="auth-page auth-signup-page grid min-h-[calc(100dvh-88px)] place-items-center px-4 py-10 dark:text-white">
      <div className="auth-shell grid w-full max-w-6xl overflow-hidden rounded-[38px] border border-blue-100 bg-white shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
        <div className="auth-form-panel p-6 md:p-10">
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Create account</span>
          <h1 className="mt-5 text-[clamp(2.3rem,5vw,4.4rem)] font-black leading-none text-slate-950 dark:text-white">Start trading.</h1>
          {error && <div className="mt-5 whitespace-pre-line rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100">Username<input className={inputClass} name="username" value={formData.username} onChange={handleChange} required disabled={loading} /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100">Email<input className={inputClass} type="email" name="email" value={formData.email} onChange={handleChange} required disabled={loading} /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100">Account type<select className={inputClass} name="user_type" value={formData.user_type} onChange={handleChange} disabled={loading}><option value="importer">Importer</option><option value="exporter">Exporter</option></select></label>
            {formData.user_type === 'importer' && <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100">City<input className={inputClass} name="city" value={formData.city} onChange={handleChange} required disabled={loading} /></label>}
            {formData.user_type === 'importer' && <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100 sm:col-span-2">State/Country<input className={inputClass} name="state_country" value={formData.state_country} onChange={handleChange} required disabled={loading} /></label>}
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100">Password<input className={inputClass} type="password" name="password" value={formData.password} onChange={handleChange} required disabled={loading} /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-blue-100">Confirm Password<input className={inputClass} type="password" name="password2" value={formData.password2} onChange={handleChange} required disabled={loading} /></label>
            <button disabled={loading} className="h-14 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60 sm:col-span-2">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-slate-500 dark:text-blue-100">
            Already have an account? <Link to="/login" className="font-black text-blue-700 no-underline dark:text-blue-200">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Signup;
