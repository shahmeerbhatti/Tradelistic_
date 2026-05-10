import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOffers, payOffer, respondImporterOffer } from '../services/api';

const statusCopy = {
  pending: 'Waiting exporter',
  accepted: 'Exporter accepted',
  rejected: 'Exporter rejected',
  countered: 'Exporter countered',
  importer_countered: 'You countered',
  importer_accepted: 'Accepted by you',
  importer_rejected: 'Rejected by you',
  paid: 'Paid',
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const ImporterOffers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedOfferId = searchParams.get('offer');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [counterModal, setCounterModal] = useState(null);
  const [paymentOffer, setPaymentOffer] = useState(null);
  const [counterForm, setCounterForm] = useState({ counter_price: '', note: '' });
  const [paymentForm, setPaymentForm] = useState({
    requirements: '',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/30',
    cvc: '123',
    name: localStorage.getItem('username') || '',
  });

  const loadOffers = async () => {
    setError('');
    try {
      const response = await getOffers();
      setOffers(response.data.offers || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Offers could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login?portal=importer', { state: { from: '/offers', message: 'Please sign in to manage offers' } });
      return;
    }
    loadOffers();
  }, [navigate]);

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      if (String(a.id) === focusedOfferId) return -1;
      if (String(b.id) === focusedOfferId) return 1;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  }, [offers, focusedOfferId]);

  const actionable = (offer) => ['accepted', 'countered'].includes(offer.status);
  const priceForOffer = (offer) => Number(offer.counter_price || offer.offered_price || 0);
  const totalForOffer = (offer) => priceForOffer(offer) * Number(offer.quantity || 1);

  const openCounter = (offer) => {
    setCounterModal(offer);
    setCounterForm({ counter_price: String(offer.counter_price || offer.offered_price || ''), note: '' });
  };

  const submitCounter = async (event) => {
    event.preventDefault();
    if (!counterModal) return;
    setBusy(`counter-${counterModal.id}`);
    setError('');
    try {
      await respondImporterOffer({
        offer_id: counterModal.id,
        decision: 'counter',
        counter_price: counterForm.counter_price,
        note: counterForm.note,
      });
      setCounterModal(null);
      await loadOffers();
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch (err) {
      setError(err.response?.data?.error || 'Counter offer failed.');
    } finally {
      setBusy('');
    }
  };

  const rejectOffer = async (offer) => {
    setBusy(`reject-${offer.id}`);
    setError('');
    try {
      await respondImporterOffer({ offer_id: offer.id, decision: 'reject', note: 'Importer rejected the offer.' });
      await loadOffers();
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch (err) {
      setError(err.response?.data?.error || 'Offer could not be rejected.');
    } finally {
      setBusy('');
    }
  };

  const openPayment = (offer) => {
    setPaymentOffer(offer);
    setPaymentForm((current) => ({
      ...current,
      requirements: offer.importer_requirements || '',
    }));
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!paymentOffer) return;
    setBusy(`pay-${paymentOffer.id}`);
    setError('');
    try {
      const digits = paymentForm.cardNumber.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      const expiryOk = /^\d{2}\/\d{2}$/.test(paymentForm.expiry);
      const cvcOk = /^\d{3,4}$/.test(paymentForm.cvc);
      if (digits !== '4242424242424242' || !expiryOk || !cvcOk) {
        throw new Error('Use Stripe demo card 4242 4242 4242 4242, expiry 12/30 and CVC 123.');
      }

      await respondImporterOffer({
        offer_id: paymentOffer.id,
        decision: 'accept',
        requirements: paymentForm.requirements,
        note: 'Accepted and moved to demo payment.',
      });

      const demoPaymentId = `pi_demo_offer_${Date.now()}_${last4}`;
      const response = await payOffer({
        offer_id: paymentOffer.id,
        requirements: paymentForm.requirements,
        payment_method: 'stripe_demo',
        demo_payment_id: demoPaymentId,
        demo_card_last4: last4,
      });

      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      navigate('/successful-sale', {
        state: {
          orders: [response.data.sale],
          totalAmount: response.data.total_amount,
          totalOrders: 1,
          fromCheckout: true,
          paymentMethod: 'Stripe Demo',
          demoPaymentId,
          saleData: {
            sale_id: response.data.sale_id,
            sales_id: response.data.sales_id,
            order_id: response.data.order_id,
          },
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Payment failed.');
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-4">
        <div className="rounded-[34px] border border-blue-100 bg-white p-8 text-center shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600" aria-hidden="true"></i>
          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-blue-100">Loading your offers...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 dark:text-white md:px-8 lg:px-14">
      <section className="mx-auto max-w-[1480px]">
        <div className="rounded-[38px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Importer offer center</span>
              <h1 className="mt-5 text-[clamp(2.4rem,6vw,5.5rem)] font-black leading-none text-slate-950 dark:text-white">Negotiations</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500 dark:text-blue-100">Accept exporter counters, send your own counter, add specific requirements and move straight to Stripe demo payment.</p>
            </div>
            <button type="button" onClick={loadOffers} className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
              <i className="fas fa-rotate mr-2" aria-hidden="true"></i>
              Refresh
            </button>
          </div>
        </div>

        {error && <div className="mt-6 rounded-3xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        {!sortedOffers.length ? (
          <div className="mt-8 rounded-[38px] border border-blue-100 bg-white p-10 text-center shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
            <i className="fas fa-handshake text-6xl text-blue-300" aria-hidden="true"></i>
            <h2 className="mt-5 text-4xl font-black text-slate-950 dark:text-white">No offers yet</h2>
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-blue-100">Send an offer from any product page and it will appear here.</p>
            <button type="button" onClick={() => navigate('/products')} className="mt-7 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20">Browse products</button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5">
            {sortedOffers.map((offer) => (
              <article key={offer.id} className={`grid gap-5 rounded-[34px] border bg-white p-5 shadow-xl shadow-blue-950/5 dark:bg-white/8 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center ${String(offer.id) === focusedOfferId ? 'border-blue-400 ring-4 ring-blue-100 dark:ring-white/10' : 'border-blue-100 dark:border-white/10'}`}>
                <button type="button" onClick={() => navigate(`/product/${offer.product}`)} className="grid h-32 w-full place-items-center overflow-hidden rounded-3xl bg-blue-50 dark:bg-white/10 md:w-32">
                  {offer.product_image_url ? <img src={offer.product_image_url} alt="" className="h-full w-full object-contain p-3" /> : <i className="fas fa-box text-4xl text-blue-300" aria-hidden="true"></i>}
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">{statusCopy[offer.status] || offer.status}</span>
                    <span className="text-xs font-bold text-slate-400">Offer #{offer.id}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{offer.product_name}</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-blue-100">Exporter: {offer.exporter_username} | Quantity: {offer.quantity}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-blue-50 p-4 dark:bg-white/10">
                      <span className="text-xs font-black uppercase text-slate-400">Your offer</span>
                      <strong className="mt-1 block text-xl text-slate-950 dark:text-white">{formatMoney(offer.offered_price)}</strong>
                    </div>
                    <div className="rounded-3xl bg-blue-50 p-4 dark:bg-white/10">
                      <span className="text-xs font-black uppercase text-slate-400">Exporter price</span>
                      <strong className="mt-1 block text-xl text-slate-950 dark:text-white">{offer.counter_price ? formatMoney(offer.counter_price) : '-'}</strong>
                    </div>
                    <div className="rounded-3xl bg-blue-50 p-4 dark:bg-white/10">
                      <span className="text-xs font-black uppercase text-slate-400">Payable total</span>
                      <strong className="mt-1 block text-xl text-blue-700 dark:text-blue-200">{formatMoney(totalForOffer(offer))}</strong>
                    </div>
                  </div>
                  {(offer.note || offer.exporter_note || offer.importer_response_note) && (
                    <div className="mt-4 rounded-3xl border border-blue-100 bg-white p-4 text-sm font-semibold leading-6 text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-blue-100">
                      {offer.note && <p><strong> You:</strong> {offer.note}</p>}
                      {offer.exporter_note && <p><strong> Exporter:</strong> {offer.exporter_note}</p>}
                      {offer.importer_response_note && <p><strong> Your reply:</strong> {offer.importer_response_note}</p>}
                    </div>
                  )}
                </div>

                <div className="grid gap-2 md:min-w-44">
                  {actionable(offer) ? (
                    <>
                      <button type="button" onClick={() => openPayment(offer)} disabled={busy === `pay-${offer.id}`} className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
                        Accept & pay
                      </button>
                      <button type="button" onClick={() => openCounter(offer)} className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
                        Counter back
                      </button>
                      <button type="button" onClick={() => rejectOffer(offer)} disabled={busy === `reject-${offer.id}`} className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-black text-red-700 transition hover:-translate-y-1 disabled:opacity-60">
                        Reject
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => navigate(`/product/${offer.product}`)} className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-200">View product</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {counterModal && (
        <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-slate-950/45 px-4 py-5 backdrop-blur-sm">
          <form onSubmit={submitCounter} className="w-full max-w-lg rounded-[34px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/20 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Counter offer</span>
                <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{counterModal.product_name}</h2>
              </div>
              <button type="button" onClick={() => setCounterModal(null)} className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
            <label className="mt-5 block text-sm font-black text-slate-700 dark:text-blue-100">
              Your new unit price
              <input value={counterForm.counter_price} onChange={(e) => setCounterForm((data) => ({ ...data, counter_price: e.target.value }))} type="number" min="1" step="0.01" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>
            <label className="mt-4 block text-sm font-black text-slate-700 dark:text-blue-100">
              Short note
              <textarea value={counterForm.note} onChange={(e) => setCounterForm((data) => ({ ...data, note: e.target.value }))} rows="3" className="mt-2 w-full rounded-2xl border border-blue-100 bg-blue-50 p-4 font-semibold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Example: I can confirm today at this rate."></textarea>
            </label>
            <button type="submit" disabled={busy === `counter-${counterModal.id}`} className="mt-5 h-14 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 disabled:opacity-60">
              {busy === `counter-${counterModal.id}` ? 'Sending...' : 'Send counter'}
            </button>
          </form>
        </div>
      )}

      {paymentOffer && (
        <div className="fixed inset-0 z-[90] grid place-items-start overflow-y-auto bg-slate-950/45 px-4 py-5 backdrop-blur-sm sm:place-items-center">
          <form onSubmit={submitPayment} className="w-full max-w-2xl rounded-[34px] border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-950/20 dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Accepted offer</span>
                <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Requirements & payment</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-blue-100">{paymentOffer.product_name} | Qty {paymentOffer.quantity}</p>
              </div>
              <button type="button" onClick={() => setPaymentOffer(null)} className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <label className="mt-5 block text-sm font-black text-slate-700 dark:text-blue-100">
              Specific requirements for exporter
              <textarea value={paymentForm.requirements} onChange={(e) => setPaymentForm((data) => ({ ...data, requirements: e.target.value }))} rows="4" className="mt-2 w-full rounded-2xl border border-blue-100 bg-blue-50 p-4 font-semibold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Packaging, delivery timeline, color/size, documentation, or any custom instruction..."></textarea>
            </label>

            <div className="mt-5 rounded-3xl bg-[#00C853] p-4 text-white shadow-xl shadow-blue-950/10 sm:p-5">
              <div className="flex items-center justify-between text-sm font-black"><span>Stripe</span><span>DEMO</span></div>
              <div className="mt-6 text-xl font-black tracking-[0.12em] sm:text-2xl">4242 4242 4242 4242</div>
              <div className="mt-5 flex justify-between text-xs font-bold uppercase text-white/75">
                <span>{paymentForm.name || 'Cardholder'}</span>
                <span>{paymentForm.expiry}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                Cardholder name
                <input value={paymentForm.name} onChange={(e) => setPaymentForm((data) => ({ ...data, name: e.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                Card number
                <input value={paymentForm.cardNumber} onChange={(e) => setPaymentForm((data) => ({ ...data, cardNumber: e.target.value }))} inputMode="numeric" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                Expiry
                <input value={paymentForm.expiry} onChange={(e) => setPaymentForm((data) => ({ ...data, expiry: e.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                CVC
                <input value={paymentForm.cvc} onChange={(e) => setPaymentForm((data) => ({ ...data, cvc: e.target.value }))} inputMode="numeric" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-50 p-4 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-blue-100">
              <span>Total negotiated payment</span>
              <span>{formatMoney(totalForOffer(paymentOffer))}</span>
            </div>
            <button type="submit" disabled={busy === `pay-${paymentOffer.id}`} className="mt-4 h-14 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
              {busy === `pay-${paymentOffer.id}` ? 'Confirming payment...' : 'Confirm demo payment'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
};

export default ImporterOffers;
