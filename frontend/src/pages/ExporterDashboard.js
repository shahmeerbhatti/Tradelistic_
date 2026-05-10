import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkStore, getExporterMetrics, getOffers, respondOffer } from '../services/api';
import ExporterHeader from '../components/ExporterHeader';
import '../styles/ExporterDashboard.css';

const statusLabels = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  countered: 'Countered',
  importer_countered: 'Importer countered',
  importer_accepted: 'Importer accepted',
  importer_rejected: 'Importer rejected',
  paid: 'Paid',
};

const ExporterDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ username: '', storeName: 'Your Store' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [metrics, setMetrics] = useState({
    total_products: 0,
    total_orders: 0,
    total_views: 0,
    recent_views_30_days: 0,
    recent_orders_30_days: 0,
    most_viewed_products: [],
  });
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');
  const [responseModal, setResponseModal] = useState(null);
  const [responseForm, setResponseForm] = useState({ counter_price: '', note: '' });

  const loadOffers = async () => {
    setBusy('offers');
    try {
      const response = await getOffers();
      setOffers(response.data.offers || []);
      setError('');
    } catch (err) {
      setOffers([]);
      setError(err.response?.data?.error || 'Buyer offers could not be loaded.');
    } finally {
      setBusy('');
    }
  };

  useEffect(() => {
    document.title = 'Exporter Dashboard - Tradelistic';

    const initializeDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('user_type');
        const username = localStorage.getItem('username');

        if (!token || userType !== 'exporter') {
          navigate('/login');
          return;
        }

        const storeResponse = await checkStore();
        if (!storeResponse.data.has_store) {
          navigate('/store-setup');
          return;
        }

        setUserInfo({
          username: username || 'Exporter',
          storeName: storeResponse.data.store?.name || 'Your Store',
        });

        const [metricsResponse, offersResponse] = await Promise.allSettled([
          getExporterMetrics(),
          getOffers(),
        ]);

        if (metricsResponse.status === 'fulfilled' && metricsResponse.value.data.success) {
          setMetrics((previous) => ({ ...previous, ...metricsResponse.value.data.metrics }));
        }

        if (offersResponse.status === 'fulfilled') {
          setOffers(offersResponse.value.data.offers || []);
        }

      } catch (err) {
        setError(err.response?.data?.error || 'Dashboard could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
    return () => {
      document.title = 'Tradelistic';
    };
  }, [navigate]);

  const offerStats = useMemo(() => {
    return offers.reduce(
      (acc, offer) => {
        acc.total += 1;
        acc[offer.status] = (acc[offer.status] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, accepted: 0, rejected: 0, countered: 0, importer_countered: 0, paid: 0 }
    );
  }, [offers]);

  const orderedOffers = useMemo(() => {
    const statusWeight = { pending: 0, importer_countered: 1, countered: 2, accepted: 3, importer_accepted: 4, paid: 5, rejected: 6, importer_rejected: 7 };
    return [...offers].sort((a, b) => {
      const statusDifference = (statusWeight[a.status] ?? 9) - (statusWeight[b.status] ?? 9);
      if (statusDifference !== 0) return statusDifference;
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });
  }, [offers]);

  const openDecision = (offer, decision) => {
    setResponseModal({ offer, decision });
    setResponseForm({
      counter_price: decision === 'counter' ? String(offer.counter_price || offer.offered_price || '') : '',
      note: '',
    });
  };

  const closeDecision = () => {
    setResponseModal(null);
    setResponseForm({ counter_price: '', note: '' });
  };

  const submitDecision = async (event) => {
    event.preventDefault();
    if (!responseModal) return;

    const payload = {
      offer_id: responseModal.offer.id,
      decision: responseModal.decision,
      note: responseForm.note.trim(),
    };

    if (responseModal.decision === 'counter') {
      payload.counter_price = responseForm.counter_price;
    }

    setBusy('decision');
    try {
      await respondOffer(payload);
      await loadOffers();
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      closeDecision();
    } catch (err) {
      setError(err.response?.data?.error || 'Offer response failed.');
    } finally {
      setBusy('');
    }
  };

  const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="exporter-shell">
        <div className="exporter-loader">
          <div className="loader-mark">
            <i className="fas fa-store"></i>
          </div>
          <h1>Preparing dashboard</h1>
          <p>Syncing products, buyer offers, and store metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exporter-shell">
      <ExporterHeader showBackButton={false} currentPage="Exporter Dashboard" />

      <main className="exporter-dashboard">
        {error && (
          <div className="dashboard-alert">
            <i className="fas fa-circle-info"></i>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        <section className="dashboard-hero">
          <div className="hero-copy">
            <span className="dashboard-kicker">Exporter workspace</span>
            <h1>{userInfo.storeName}</h1>
            <p>Manage catalog performance, buyer offers, and negotiation responses from one clean control room.</p>
          </div>

          <div className="hero-panel">
            <div>
              <span>Pending offers</span>
              <strong>{offerStats.pending}</strong>
            </div>
            <div>
              <span>30 day orders</span>
              <strong>{metrics.recent_orders_30_days || 0}</strong>
            </div>
            <button type="button" onClick={loadOffers} disabled={busy === 'offers'}>
              <i className={`fas ${busy === 'offers' ? 'fa-spinner fa-spin' : 'fa-rotate'}`}></i>
              Refresh offers
            </button>
          </div>
        </section>

        <section className="metric-grid" aria-label="Exporter metrics">
          <article className="metric-card">
            <i className="fas fa-box-open"></i>
            <span>Total products</span>
            <strong>{metrics.total_products || 0}</strong>
          </article>
          <article className="metric-card">
            <i className="fas fa-bag-shopping"></i>
            <span>Total orders</span>
            <strong>{metrics.total_orders || 0}</strong>
          </article>
          <article className="metric-card">
            <i className="fas fa-eye"></i>
            <span>Total views</span>
            <strong>{metrics.total_views || 0}</strong>
          </article>
          <article className="metric-card">
            <i className="fas fa-chart-line"></i>
            <span>30 day views</span>
            <strong>{metrics.recent_views_30_days || 0}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <div className="quick-panel">
            <div className="panel-heading">
              <span>Quick actions</span>
              <h2>Move faster</h2>
            </div>
            <div className="quick-action-list">
              <button type="button" onClick={() => navigate('/add-product')}>
                <i className="fas fa-wand-magic-sparkles"></i>
                <span>
                  <strong>AI product listing</strong>
                  <small>Add product with image autofill</small>
                </span>
              </button>
              <button type="button" onClick={() => navigate('/analytics')}>
                <i className="fas fa-chart-simple"></i>
                <span>
                  <strong>Analytics</strong>
                  <small>Views, favorites, and sales</small>
                </span>
              </button>
              <button type="button" onClick={() => navigate('/exporter-store')}>
                <i className="fas fa-layer-group"></i>
                <span>
                  <strong>Inventory</strong>
                  <small>Edit, delete, and manage products</small>
                </span>
              </button>
            </div>
          </div>

          <div className="products-panel">
            <div className="panel-heading">
              <span>Top products</span>
              <h2>Most viewed</h2>
            </div>
            {metrics.most_viewed_products?.length ? (
              <div className="top-product-list">
                {metrics.most_viewed_products.map((item, index) => (
                  <button type="button" key={item.id} onClick={() => navigate(`/product/${item.id}`)}>
                    <span>{index + 1}</span>
                    <strong>{item.name}</strong>
                    <small>{item.view_count || 0} views</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="soft-empty">
                <i className="fas fa-chart-area"></i>
                <p>Views will appear after importers open your products.</p>
              </div>
            )}
          </div>
        </section>

        <section className="buyer-offers-panel">
          <div className="offers-title-row">
            <div className="panel-heading">
              <span>Negotiation center</span>
              <h2>Buyer Offers</h2>
            </div>
            <div className="offer-stat-pills">
              <span>{offerStats.total} total</span>
              <span>{offerStats.pending} pending</span>
              <span>{offerStats.countered} countered</span>
            </div>
          </div>

          {orderedOffers.length === 0 ? (
            <div className="offers-empty-state">
              <i className="fas fa-inbox"></i>
              <h3>No buyer offers yet</h3>
              <p>When an importer sends a price offer, this dashboard and your notification bell update automatically.</p>
            </div>
          ) : (
            <div className="offer-table">
              {orderedOffers.map((offer) => (
                <article key={offer.id} className={`offer-row is-${offer.status}`}>
                  <button type="button" className="offer-product-cell" onClick={() => navigate(`/product/${offer.product}`)}>
                    <span className="offer-thumb">
                      {offer.product_image_url ? <img src={offer.product_image_url} alt="" /> : <i className="fas fa-box"></i>}
                    </span>
                    <span>
                      <small className="status-pill">{statusLabels[offer.status] || offer.status}</small>
                      <strong>{offer.product_name}</strong>
                      <em>Importer: {offer.importer_username} | Qty {offer.quantity}</em>
                    </span>
                  </button>

                  <div className="offer-price-cell">
                    <span>Buyer offer</span>
                    <strong>{formatMoney(offer.offered_price)}</strong>
                  </div>

                  <div className="offer-price-cell">
                    <span>{offer.counter_price ? 'Your counter' : 'Total value'}</span>
                    <strong>{formatMoney(offer.counter_price || offer.total_value)}</strong>
                  </div>

                  <div className="offer-note-cell">
                    {offer.note && <p><strong>Buyer:</strong> {offer.note}</p>}
                    {offer.exporter_note && <p><strong>You:</strong> {offer.exporter_note}</p>}
                    {offer.importer_response_note && <p><strong>Importer reply:</strong> {offer.importer_response_note}</p>}
                    {offer.importer_requirements && <p><strong>Requirements:</strong> {offer.importer_requirements}</p>}
                    {!offer.note && !offer.exporter_note && !offer.importer_response_note && !offer.importer_requirements && <p>No notes attached.</p>}
                  </div>

                  <div className="offer-action-cell">
                    {['pending', 'importer_countered'].includes(offer.status) ? (
                      <>
                        <button type="button" className="accept" onClick={() => openDecision(offer, 'accept')}>Accept</button>
                        <button type="button" className="counter" onClick={() => openDecision(offer, 'counter')}>Counter</button>
                        <button type="button" className="reject" onClick={() => openDecision(offer, 'reject')}>Reject</button>
                      </>
                    ) : (
                      <span className="locked-status">Response sent</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {responseModal && (
        <div className="offer-modal-backdrop">
          <form className="offer-response-modal" onSubmit={submitDecision}>
            <button type="button" className="modal-close" onClick={closeDecision}>
              <i className="fas fa-times"></i>
            </button>
            <span className="dashboard-kicker">{statusLabels[responseModal.decision] || 'Counter'} offer</span>
            <h2>{responseModal.offer.product_name}</h2>
            <p>
              Reply to {responseModal.offer.importer_username}. They offered {formatMoney(responseModal.offer.offered_price)}
              {' '}for {responseModal.offer.quantity} unit(s).
            </p>

            {responseModal.decision === 'counter' && (
              <label>
                Counter unit price
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={responseForm.counter_price}
                  onChange={(event) => setResponseForm((prev) => ({ ...prev, counter_price: event.target.value }))}
                  required
                />
              </label>
            )}

            <label>
              Short note for importer
              <textarea
                rows="4"
                value={responseForm.note}
                onChange={(event) => setResponseForm((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Example: Bulk pricing approved. Delivery timeline can be discussed."
              />
            </label>

            <button type="submit" className={`submit-decision ${responseModal.decision}`} disabled={busy === 'decision'}>
              {busy === 'decision' ? 'Sending response...' : 'Send response'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default ExporterDashboard;
