import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addToCart, addToFavorites, createSale, getAllProducts, getProductById, makeOffer, removeFromFavorites } from '../services/api';
import ProductReviews from '../components/ProductReviews';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [busy, setBusy] = useState('');
  const [showOffer, setShowOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/30',
    cvc: '123',
    name: localStorage.getItem('username') || '',
  });

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getProductById(id);
        const item = response.data;
        setProduct(item);
        setOfferPrice(item.price || '');
        setIsFavorite(Boolean(item.is_favorited));
        const relatedResponse = await getAllProducts({ category: item.category });
        const relatedData = relatedResponse.data.results || relatedResponse.data || [];
        setRelated(relatedData.filter((entry) => entry.id !== Number(id)).slice(0, 4));
      } catch {
        setError('Product details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const images = useMemo(() => product?.all_image_urls || (product?.image_url ? [product.image_url] : []), [product]);
  const price = Number(product?.price || 0);
  const canMakeOffer = localStorage.getItem('user_type') === 'importer';

  const requireLogin = (message) => {
    if (localStorage.getItem('token')) return false;
    navigate('/login', { state: { from: `/product/${id}`, message } });
    return true;
  };

  const handleCart = async () => {
    if (requireLogin('Please sign in to add items to cart')) return;
    setBusy('cart');
    try {
      await addToCart(id, quantity);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add to cart');
    } finally {
      setBusy('');
    }
  };

  const openPayment = () => {
    if (requireLogin('Please sign in to place an order')) return;
    setShowPayment(true);
  };

  const handleOrder = async (event) => {
    event.preventDefault();
    setBusy('order');
    try {
      const digits = paymentForm.cardNumber.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      const expiryOk = /^\d{2}\/\d{2}$/.test(paymentForm.expiry);
      const cvcOk = /^\d{3,4}$/.test(paymentForm.cvc);

      if (digits !== '4242424242424242' || !expiryOk || !cvcOk) {
        throw new Error('Use Stripe demo card 4242 4242 4242 4242, expiry 12/30, CVC 123.');
      }

      const demoPaymentId = `pi_demo_${Date.now()}_${last4}`;
      const response = await createSale({
        product_id: product.id,
        quantity,
        payment_method: 'stripe_demo',
        demo_payment_id: demoPaymentId,
        demo_card_last4: last4,
        shipping_address: { line1: 'Customer Address', city: 'City', state: 'State', country: 'Country', postal_code: '12345' },
      });
      setShowPayment(false);
      navigate('/successful-sale', {
        state: {
          product,
          store: product.store_info,
          quantity,
          paymentMethod: 'Stripe Demo',
          demoPaymentId,
          saleData: {
            sale_id: response.data.sale_id,
            sales_id: response.data.sales_id,
            order_id: response.data.order_id,
            created: true,
          },
        },
      });
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to process your order. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const toggleFavorite = async () => {
    if (requireLogin('Please sign in to save products')) return;
    setBusy('favorite');
    try {
      if (isFavorite) {
        await removeFromFavorites(id);
        setIsFavorite(false);
      } else {
        await addToFavorites(id);
        setIsFavorite(true);
      }
    } catch {
      alert('Failed to update favorites');
    } finally {
      setBusy('');
    }
  };

  const submitOffer = async (event) => {
    event.preventDefault();
    if (requireLogin('Please sign in to send an offer')) return;
    setBusy('offer');
    setOfferMessage('');
    try {
      await makeOffer(product.id, {
        quantity,
        offered_price: offerPrice,
        note: offerNote,
      });
      setOfferMessage(`Offer sent to ${product.store_info?.name || product.owner || 'exporter'}.`);
      setOfferNote('');
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      setTimeout(() => setShowOffer(false), 900);
    } catch (err) {
      setOfferMessage(err.response?.data?.error || 'Failed to send offer.');
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-4">
        <div className="rounded-[34px] border border-blue-100 bg-white p-8 text-center shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8 dark:text-white">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600" aria-hidden="true"></i>
          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-blue-100">Loading product details...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-4">
        <div className="rounded-[34px] border border-blue-100 bg-white p-8 text-center shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
          <i className="fas fa-triangle-exclamation text-4xl text-blue-400" aria-hidden="true"></i>
          <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">Product unavailable</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-blue-100">{error || 'This product was not found.'}</p>
          <button type="button" onClick={() => navigate('/products')} className="mt-6 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white">Back to products</button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 dark:text-white md:px-8 lg:px-14">
      <section className="mx-auto max-w-[1480px]">
        <button type="button" onClick={() => navigate('/products')} className="mb-5 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/8 dark:text-white">
          <i className="fas fa-arrow-left mr-2" aria-hidden="true"></i>
          Back to products
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.75fr)]">
          <div className="scroll-reveal rounded-[38px] border border-blue-100 bg-white p-4 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
            <div className="grid min-h-[520px] place-items-center rounded-[30px] bg-blue-50 dark:bg-white/10">
              {images.length ? (
                <img src={images[selectedImage]} alt={product.name} className="max-h-[480px] w-full object-contain p-8 drop-shadow-2xl" />
              ) : (
                <i className="fas fa-box-open text-7xl text-blue-300" aria-hidden="true"></i>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button key={image} type="button" onClick={() => setSelectedImage(index)} className={`grid h-24 w-24 shrink-0 place-items-center rounded-3xl border bg-blue-50 p-2 transition dark:bg-white/10 ${selectedImage === index ? 'border-blue-500' : 'border-blue-100 dark:border-white/10'}`}>
                    <img src={image} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="scroll-reveal rounded-[38px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8 lg:p-8">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">{product.category || 'Product'}</span>
            <h1 className="mt-5 text-[clamp(2.4rem,5vw,5.5rem)] font-black leading-[0.95] text-slate-950 dark:text-white">{product.name}</h1>
            <div className="mt-6 text-5xl font-black text-blue-700 dark:text-blue-200">${price.toFixed(2)}</div>

            {product.store_info && (
              <button type="button" onClick={() => navigate(`/store/${product.store_info.id}`)} className="mt-6 flex w-full items-center justify-between rounded-3xl border border-blue-100 bg-blue-50 p-4 text-left dark:border-white/10 dark:bg-white/10">
                <span>
                  <span className="block text-xs font-bold uppercase text-slate-400 dark:text-blue-100">Sold by</span>
                  <span className="block text-lg font-black text-slate-950 dark:text-white">{product.store_info.name}</span>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-blue-100">{product.store_info.business_type}</span>
                </span>
                <i className="fas fa-arrow-up-right-from-square text-blue-600 dark:text-blue-200" aria-hidden="true"></i>
              </button>
            )}

            <p className="mt-6 text-sm font-medium leading-7 text-slate-500 dark:text-blue-100">{product.description || 'No description available for this product.'}</p>

            <div className="mt-7 flex items-center gap-3">
              <span className="text-sm font-black text-slate-700 dark:text-blue-100">Quantity</span>
              <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 dark:border-white/10 dark:bg-white/10">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-full w-12 text-lg font-black text-blue-700 dark:text-blue-200">-</button>
                <input value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="h-full w-16 bg-transparent text-center text-sm font-black text-slate-950 outline-none dark:text-white" type="number" min="1" />
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="h-full w-12 text-lg font-black text-blue-700 dark:text-blue-200">+</button>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleCart} disabled={busy === 'cart'} className="h-14 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
                {busy === 'cart' ? 'Adding...' : 'Add to cart'}
              </button>
              <button type="button" onClick={openPayment} disabled={busy === 'order'} className="h-14 rounded-2xl bg-slate-950 text-sm font-black text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {busy === 'order' ? 'Processing...' : 'Pay with Stripe demo'}
              </button>
              {canMakeOffer && (
                <button type="button" onClick={() => setShowOffer(true)} className="h-14 rounded-2xl border border-blue-200 bg-white text-sm font-black text-blue-700 transition hover:-translate-y-1 hover:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-blue-200 sm:col-span-2">
                  <i className="fas fa-handshake mr-2" aria-hidden="true"></i>
                  Make price offer
                </button>
              )}
              <button type="button" onClick={toggleFavorite} disabled={busy === 'favorite'} className="h-14 rounded-2xl border border-blue-100 bg-blue-50 text-sm font-black text-blue-700 transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/10 dark:text-blue-200 sm:col-span-2">
                <i className={`${isFavorite ? 'fas' : 'far'} fa-heart mr-2`} aria-hidden="true"></i>
                {isFavorite ? 'Saved' : 'Save to favorites'}
              </button>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-[clamp(2rem,4vw,4.5rem)] font-black leading-none text-slate-950 dark:text-white">Related products</h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {related.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate(`/product/${item.id}`)} className="product-card-shell group overflow-hidden rounded-[28px] border border-blue-100 bg-white text-left shadow-xl shadow-blue-950/5 transition hover:-translate-y-2 dark:border-white/10 dark:bg-white/8">
                  <div className="product-card-image-frame grid h-52 place-items-center bg-blue-50 dark:bg-white/10">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="product-card-fit-image h-full w-full object-contain p-8 drop-shadow-xl transition duration-500 group-hover:scale-[1.03]" loading="lazy" /> : <i className="fas fa-box-open text-4xl text-blue-300" aria-hidden="true"></i>}
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-base font-black text-slate-950 dark:text-white">{item.name}</h3>
                    <div className="mt-3 text-xl font-black text-blue-700 dark:text-blue-200">${Number(item.price || 0).toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-[34px] border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/5 dark:border-white/10 dark:bg-white/8">
          <ProductReviews productId={product.id} />
        </section>
      </section>

      {showOffer && (
        <div className="fixed inset-0 z-[80] grid place-items-start overflow-y-auto bg-slate-950/45 px-4 py-5 backdrop-blur-sm sm:place-items-center">
          <form onSubmit={submitOffer} className="w-full max-w-lg rounded-[34px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/20 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Price offer</span>
                <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Send exporter an offer</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-blue-100">{product.name}</p>
                <p className="mt-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 dark:bg-white/10 dark:text-blue-200">
                  Exporter: {product.store_info?.name || product.owner || 'Product seller'}
                  {product.store_info?.owner_username ? ` (${product.store_info.owner_username})` : ''}
                </p>
              </div>
              <button type="button" onClick={() => setShowOffer(false)} className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                Quantity
                <input value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} type="number" min="1" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                Your unit price
                <input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} type="number" min="1" step="0.01" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
            </div>

            <label className="mt-4 block text-sm font-black text-slate-700 dark:text-blue-100">
              Short note
              <textarea value={offerNote} onChange={(e) => setOfferNote(e.target.value)} rows="3" placeholder="Example: Need bulk quantity, can you match this rate?" className="mt-2 w-full rounded-2xl border border-blue-100 bg-blue-50 p-4 font-semibold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white"></textarea>
            </label>

            {offerMessage && <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-black text-blue-700 dark:bg-white/10 dark:text-blue-200">{offerMessage}</div>}

            <button type="submit" disabled={busy === 'offer'} className="mt-5 h-14 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
              {busy === 'offer' ? 'Sending offer...' : 'Send offer'}
            </button>
          </form>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-[90] grid place-items-start overflow-y-auto bg-slate-950/45 px-4 py-5 backdrop-blur-sm sm:place-items-center">
          <form onSubmit={handleOrder} className="w-full max-w-lg rounded-[34px] border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-950/20 dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Stripe demo</span>
                <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Demo payment</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-blue-100">No real card charge. Demo only.</p>
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
                <input value={paymentForm.expiry} onChange={(e) => setPaymentForm((data) => ({ ...data, expiry: e.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                CVC
                <input value={paymentForm.cvc} onChange={(e) => setPaymentForm((data) => ({ ...data, cvc: e.target.value }))} inputMode="numeric" className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-50 p-4 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-blue-100">
              <span>Total</span>
              <span>${(price * quantity).toFixed(2)}</span>
            </div>

            <button type="submit" disabled={busy === 'order'} className="mt-4 h-14 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
              {busy === 'order' ? 'Confirming demo payment...' : 'Confirm demo payment'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
};

export default ProductDetail;
