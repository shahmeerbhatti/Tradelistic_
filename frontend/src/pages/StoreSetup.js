import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkStore, createStore } from '../services/api';
import '../styles/StoreSetup.css';

const StoreSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [nextAction, setNextAction] = useState('dashboard');
  const [formData, setFormData] = useState({
    seller_name: localStorage.getItem('username') || '',
    name: '',
    description: '',
    business_type: 'trader',
    phone: '',
    email: '',
    city: '',
    country: '',
    website: '',
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    document.title = 'Become a Seller - Tradelistic';

    const prepare = async () => {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('user_type');
      if (!token || userType !== 'exporter') {
        navigate('/login');
        return;
      }

      try {
        const response = await checkStore();
        if (response.data.has_store) {
          navigate('/exporter-dashboard', { replace: true });
          return;
        }
      } catch {
        // A new seller can continue setup even if the check is noisy.
      } finally {
        setChecking(false);
      }
    };

    prepare();
    return () => {
      document.title = 'Tradelistic';
    };
  }, [navigate]);

  const updateField = (event) => {
    const { name, value, files, type } = event.target;
    setError('');

    if (type === 'file') {
      const file = files?.[0] || null;
      setFormData((prev) => ({ ...prev, logo: file }));
      setLogoPreview(file ? URL.createObjectURL(file) : '');
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (event, action = nextAction) => {
    event.preventDefault();
    setNextAction(action);
    setLoading(true);
    setError('');

    try {
      if (!formData.seller_name.trim()) {
        throw new Error('Seller name is required.');
      }
      if (!formData.name.trim()) {
        throw new Error('Shop name is required.');
      }

      const payload = new FormData();
      payload.append('seller_name', formData.seller_name.trim());
      payload.append('name', formData.name.trim());
      payload.append(
        'description',
        formData.description.trim() || `${formData.name.trim()} is a verified seller on Tradelistic.`
      );
      payload.append('business_type', formData.business_type || 'trader');

      ['phone', 'email', 'city', 'country', 'website'].forEach((field) => {
        if (formData[field]?.trim()) payload.append(field, formData[field].trim());
      });

      if (formData.logo) payload.append('logo', formData.logo);

      await createStore(payload);
      localStorage.setItem('store_setup_complete', 'true');
      navigate(action === 'add-product' ? '/add-product' : '/exporter-dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Store could not be created.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="seller-setup-shell">
        <div className="seller-setup-loader">
          <i className="fas fa-store"></i>
          <h1>Checking seller workspace</h1>
          <p>Preparing your dashboard access.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="seller-setup-shell">
      <section className="seller-setup-card">
        <aside className="seller-setup-hero">
          <button type="button" onClick={() => navigate('/login')} className="seller-back-btn">
            <i className="fas fa-arrow-left"></i>
            Sign in
          </button>
          <span className="seller-kicker">Become a seller</span>
          <h1>Open your shop in under a minute.</h1>
          <p>Only seller name and shop name are required. Everything else can be completed later from your dashboard.</p>
          <div className="seller-mini-steps">
            <span><i className="fas fa-check"></i> Create shop</span>
            <span><i className="fas fa-wand-magic-sparkles"></i> Add product using AI</span>
            <span><i className="fas fa-bell"></i> Receive buyer offers</span>
          </div>
        </aside>

        <form className="seller-form" onSubmit={(event) => submit(event, nextAction)}>
          <div className="seller-form-head">
            <span className="seller-kicker">Seller profile</span>
            <h2>Basic details</h2>
          </div>

          {error && (
            <div className="seller-error">
              <i className="fas fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <div className="seller-required-grid">
            <label>
              Seller name *
              <input
                name="seller_name"
                value={formData.seller_name}
                onChange={updateField}
                placeholder="Example: Akif Saeed"
                required
              />
            </label>
            <label>
              Shop name *
              <input
                name="name"
                value={formData.name}
                onChange={updateField}
                placeholder="Example: Crescendo Trade House"
                required
              />
            </label>
          </div>

          <details className="seller-optional-panel" open>
            <summary>
              Optional details
              <span>Can skip for now</span>
            </summary>

            <div className="seller-optional-grid">
              <label className="wide">
                Shop description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={updateField}
                  rows="4"
                  placeholder="What do you sell? Which products should buyers expect?"
                />
              </label>

              <label>
                Business type
                <select name="business_type" value={formData.business_type} onChange={updateField}>
                  <option value="trader">Trader</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="distributor">Distributor</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                Email
                <input name="email" type="email" value={formData.email} onChange={updateField} placeholder="shop@email.com" />
              </label>

              <label>
                Phone
                <input name="phone" value={formData.phone} onChange={updateField} placeholder="+92 300 0000000" />
              </label>

              <label>
                City
                <input name="city" value={formData.city} onChange={updateField} placeholder="Lahore" />
              </label>

              <label>
                Country
                <input name="country" value={formData.country} onChange={updateField} placeholder="Pakistan" />
              </label>

              <label>
                Website
                <input name="website" type="url" value={formData.website} onChange={updateField} placeholder="https://example.com" />
              </label>

              <label className="logo-field">
                Store logo
                <span className="logo-picker">
                  {logoPreview ? <img src={logoPreview} alt="" /> : <i className="fas fa-image"></i>}
                  <input type="file" name="logo" accept="image/*" onChange={updateField} />
                </span>
              </label>
            </div>
          </details>

          <div className="seller-form-actions">
            <button type="submit" onClick={() => setNextAction('dashboard')} disabled={loading}>
              {loading && nextAction === 'dashboard' ? 'Creating shop...' : 'Create seller dashboard'}
            </button>
            <button type="button" className="ai-submit" disabled={loading} onClick={(event) => submit(event, 'add-product')}>
              <i className="fas fa-plus"></i>
              {loading && nextAction === 'add-product' ? 'Creating shop...' : 'Create & add product using AI'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default StoreSetup;
