import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import '../styles/SuperAdminLogin.css';
import tradelisticLogo from '../Tradelistic Logo.png';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Admin Access - Tradelistic';
    if (localStorage.getItem('token') && localStorage.getItem('is_superadmin') === 'true') {
      navigate('/super-admin', { replace: true });
    }
    return () => {
      document.title = 'Tradelistic';
    };
  }, [navigate]);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('username');
    localStorage.removeItem('is_superadmin');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(credentials);
      if (!response.data.is_superadmin) {
        clearSession();
        setError('This access point is only for SuperAdmin accounts.');
        return;
      }
      navigate('/super-admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Admin login failed. Check username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-shell">
        <div className="admin-login-brand">
          <span className="admin-login-logo">
            <img src={tradelisticLogo} alt="Tradelistic" />
          </span>
          <div>
            <h1>Tradelistic Control</h1>
            <p>Separate SuperAdmin access for platform operations.</p>
          </div>
        </div>

        <form className="admin-login-card" onSubmit={handleSubmit}>
          <span className="admin-login-kicker">Secure admin portal</span>
          <h2>Sign in to SuperAdmin</h2>
          <p>Use this panel for users, stores, products and transactions.</p>

          {error && (
            <div className="admin-login-error">
              <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
              {error}
            </div>
          )}

          <label>
            Username
            <input
              value={credentials.username}
              onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-arrow-right-to-bracket'}`} aria-hidden="true"></i>
            {loading ? 'Checking access...' : 'Open admin dashboard'}
          </button>

          <button type="button" className="admin-login-secondary" onClick={() => navigate('/')}>
            Back to marketplace
          </button>
        </form>
      </section>
    </main>
  );
};

export default SuperAdminLogin;
