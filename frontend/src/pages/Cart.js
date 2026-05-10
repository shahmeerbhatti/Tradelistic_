import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkout, getCart, removeFromCart, updateCartItem } from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/30',
    cvc: '123',
    name: localStorage.getItem('username') || '',
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { state: { from: '/cart', message: 'Please sign in to view your cart' } });
      return;
    }

    const loadCart = async () => {
      try {
        const response = await getCart();
        setItems(response.data.cart?.items || []);
      } catch {
        setError('Failed to load cart items');
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0), [items]);

  const changeQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    setUpdating((current) => ({ ...current, [itemId]: true }));
    try {
      await updateCartItem(itemId, quantity);
      setItems((current) => current.map((item) => item.id === itemId ? { ...item, quantity } : item));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch {
      setError('Failed to update item quantity');
    } finally {
      setUpdating((current) => ({ ...current, [itemId]: false }));
    }
  };

  const removeItem = async (itemId) => {
    setUpdating((current) => ({ ...current, [itemId]: true }));
    try {
      await removeFromCart(itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch {
      setError('Failed to remove item');
    } finally {
      setUpdating((current) => ({ ...current, [itemId]: false }));
    }
  };

  const openPayment = () => {
    if (!items.length) return;
    setError('');
    setShowPayment(true);
  };

  const runCheckout = async (event) => {
    event.preventDefault();
    if (!items.length) return;
    setCheckoutLoading(true);
    setError('');
    try {
      const digits = paymentForm.cardNumber.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      const isDemoApproved = digits === '4242424242424242';
      const expiryOk = /^\d{2}\/\d{2}$/.test(paymentForm.expiry);
      const cvcOk = /^\d{3,4}$/.test(paymentForm.cvc);

      if (!isDemoApproved || !expiryOk || !cvcOk) {
        throw new Error('Use Stripe demo card 4242 4242 4242 4242, any future expiry, any CVC.');
      }

      const demoPaymentId = `pi_demo_${Date.now()}_${last4}`;
      const response = await checkout({
        payment_method: 'stripe_demo',
        demo_payment_id: demoPaymentId,
        demo_card_last4: last4,
      });
      setItems([]);
      setShowPayment(false);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      navigate('/successful-sale', {
        state: {
          orders: response.data.sales,
          totalAmount: response.data.total_amount,
          totalOrders: response.data.total_orders,
          fromCheckout: true,
          paymentMethod: 'Stripe Demo',
          demoPaymentId,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-4">
        <div className="rounded-[34px] border border-blue-100 bg-white p-8 text-center shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600" aria-hidden="true"></i>
          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-blue-100">Loading your cart...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 dark:text-white md:px-8 lg:px-14">
      <section className="mx-auto max-w-[1480px]">
        <div className="scroll-reveal rounded-[38px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Cart</span>
              <h1 className="mt-5 text-[clamp(2.6rem,6vw,6.5rem)] font-black leading-none text-slate-950 dark:text-white">Shopping bag</h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-blue-100">{items.length} item{items.length === 1 ? '' : 's'} ready for checkout.</p>
            </div>
            <button type="button" onClick={() => navigate('/products')} className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
              Continue shopping
            </button>
          </div>
        </div>

        {error && <div className="mt-6 rounded-3xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        {!items.length ? (
          <div className="mt-8 rounded-[38px] border border-blue-100 bg-white p-10 text-center shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
            <i className="fas fa-shopping-bag text-6xl text-blue-300" aria-hidden="true"></i>
            <h2 className="mt-5 text-4xl font-black text-slate-950 dark:text-white">Your cart is empty</h2>
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-blue-100">Add products and they will appear in this redesigned checkout view.</p>
            <button type="button" onClick={() => navigate('/products')} className="mt-7 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20">Shop now</button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="grid gap-4">
              {items.map((item) => (
                <article key={item.id} className="scroll-reveal grid gap-4 rounded-[30px] border border-blue-100 bg-white p-4 shadow-xl shadow-blue-950/5 dark:border-white/10 dark:bg-white/8 md:grid-cols-[120px_minmax(0,1fr)_auto_auto_auto] md:items-center">
                  <button type="button" onClick={() => navigate(`/product/${item.product.id}`)} className="grid h-32 w-full place-items-center rounded-3xl bg-blue-50 dark:bg-white/10 md:w-32">
                    {item.product.image || item.product.image_url ? (
                      <img src={item.product.image || item.product.image_url} alt={item.product.name} className="h-full w-full object-contain p-4" />
                    ) : (
                      <i className="fas fa-box text-3xl text-blue-300" aria-hidden="true"></i>
                    )}
                  </button>
                  <div>
                    <button type="button" onClick={() => navigate(`/product/${item.product.id}`)} className="text-left text-xl font-black text-slate-950 dark:text-white">{item.product.name}</button>
                    <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500 dark:text-blue-100">{item.product.description}</p>
                    <div className="mt-3 text-lg font-black text-blue-700 dark:text-blue-200">${Number(item.product.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 dark:border-white/10 dark:bg-white/10">
                    <button type="button" disabled={updating[item.id]} onClick={() => changeQuantity(item.id, item.quantity - 1)} className="h-full w-11 font-black text-blue-700 dark:text-blue-200">-</button>
                    <span className="grid h-full w-12 place-items-center text-sm font-black text-slate-950 dark:text-white">{item.quantity}</span>
                    <button type="button" disabled={updating[item.id]} onClick={() => changeQuantity(item.id, item.quantity + 1)} className="h-full w-11 font-black text-blue-700 dark:text-blue-200">+</button>
                  </div>
                  <div className="text-xl font-black text-blue-700 dark:text-blue-200">${(Number(item.product.price || 0) * item.quantity).toFixed(2)}</div>
                  <button type="button" disabled={updating[item.id]} onClick={() => removeItem(item.id)} className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition hover:bg-red-50 hover:text-red-600 dark:bg-white/10 dark:text-blue-200">
                    <i className={updating[item.id] ? 'fas fa-spinner fa-spin' : 'fas fa-trash'} aria-hidden="true"></i>
                  </button>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-[34px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Order summary</h2>
              <div className="mt-6 grid gap-4 text-sm font-bold text-slate-500 dark:text-blue-100">
                <div className="flex justify-between"><span>Items</span><span>${total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                <div className="h-px bg-blue-100 dark:bg-white/10"></div>
                <div className="flex justify-between text-2xl font-black text-slate-950 dark:text-white"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
              <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-4 dark:border-white/10 dark:bg-white/10">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-blue-700 dark:bg-white/10 dark:text-blue-200">
                    <i className="fab fa-stripe-s" aria-hidden="true"></i>
                  </span>
                  <div>
                    <div className="text-sm font-black text-slate-950 dark:text-white">Stripe demo payment</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-blue-100">No real card charge. Demo only.</div>
                  </div>
                </div>
              </div>
              <button type="button" onClick={openPayment} disabled={checkoutLoading} className="mt-5 h-14 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
                {checkoutLoading ? 'Processing...' : 'Pay with Stripe demo'}
              </button>
            </aside>
          </div>
        )}
      </section>

      {showPayment && (
        <div className="fixed inset-0 z-[90] grid place-items-start overflow-y-auto bg-slate-950/45 px-4 py-5 backdrop-blur-sm sm:place-items-center">
          <form onSubmit={runCheckout} className="w-full max-w-lg rounded-[34px] border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-950/20 dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Stripe demo</span>
                <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Demo payment</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-blue-100">Use test card. No real payment will happen.</p>
              </div>
              <button type="button" onClick={() => setShowPayment(false)} className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <div className="mt-4 rounded-3xl bg-[#635bff] p-4 text-white shadow-xl shadow-blue-950/10 sm:p-5">
              <div className="flex items-center justify-between text-sm font-black">
                <span>Stripe</span>
                <span>DEMO</span>
              </div>
              <div className="mt-6 text-xl font-black tracking-[0.14em] sm:mt-8 sm:text-2xl sm:tracking-[0.18em]">4242 4242 4242 4242</div>
              <div className="mt-5 flex justify-between text-xs font-bold uppercase text-white/75 sm:mt-6">
                <span>{paymentForm.name || 'Cardholder'}</span>
                <span>{paymentForm.expiry}</span>
              </div>
            </div>

            <label className="mt-4 block text-sm font-black text-slate-700 dark:text-blue-100">
              Cardholder name
              <input value={paymentForm.name} onChange={(e) => setPaymentForm((data) => ({ ...data, name: e.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>

            <label className="mt-3 block text-sm font-black text-slate-700 dark:text-blue-100">
              Card number
              <input value={paymentForm.cardNumber} onChange={(e) => setPaymentForm((data) => ({ ...data, cardNumber: e.target.value }))} inputMode="numeric" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                Expiry
                <input value={paymentForm.expiry} onChange={(e) => setPaymentForm((data) => ({ ...data, expiry: e.target.value }))} placeholder="12/30" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                CVC
                <input value={paymentForm.cvc} onChange={(e) => setPaymentForm((data) => ({ ...data, cvc: e.target.value }))} inputMode="numeric" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-50 p-4 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-blue-100">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button type="submit" disabled={checkoutLoading} className="mt-4 h-14 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
              {checkoutLoading ? 'Confirming demo payment...' : 'Confirm demo payment'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
};

export default Cart;
