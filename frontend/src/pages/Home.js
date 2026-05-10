import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllProducts, getRecommendations } from '../services/api';

const categories = [
  { value: 'electronics', label: 'Electronics', icon: 'fas fa-microchip', copy: 'Smart devices, audio, computing and daily tech.' },
  { value: 'fashion', label: 'Fashion', icon: 'fas fa-shirt', copy: 'Clean apparel, accessories and lifestyle finds.' },
  { value: 'home', label: 'Home & Living', icon: 'fas fa-couch', copy: 'Comfort products and practical home upgrades.' },
];

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/product/${product.id}`)}
      className="product-card-shell group scroll-reveal overflow-hidden rounded-[28px] border border-blue-100 bg-white text-left shadow-[0_18px_50px_rgba(49,91,210,0.10)] transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-[0_24px_70px_rgba(49,91,210,0.16)] dark:border-white/10 dark:bg-white/8"
    >
      <div className="product-card-image-frame grid h-48 place-items-center bg-blue-50 dark:bg-white/10">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="product-card-fit-image h-full w-full object-contain p-8 drop-shadow-2xl transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <i className="fas fa-box-open text-5xl text-blue-300" aria-hidden="true"></i>
        )}
      </div>
      <div className="p-5">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">{product.category || 'Product'}</span>
        <h3 className="mt-4 truncate text-lg font-black text-slate-950 dark:text-white">{product.name}</h3>
        <div className="mt-4 text-2xl font-black text-blue-700 dark:text-blue-200">${Number(product.price || 0).toFixed(2)}</div>
      </div>
    </button>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const recommendationTrackRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAuthenticated = Boolean(localStorage.getItem('token'));
  const userType = localStorage.getItem('user_type');
  const isImporter = isAuthenticated && userType !== 'exporter';

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getAllProducts();
        setProducts(response.data.results || response.data || []);
        if (isImporter) {
          const recs = await getRecommendations();
          setRecommendations(recs.data.recommendations || []);
        }
      } catch {
        setError('Products are taking longer than expected to load.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isImporter]);

  const featured = useMemo(() => products.slice(0, 4), [products]);
  const slideRecommendations = (direction) => {
    const track = recommendationTrackRef.current;
    if (!track) return;
    const card = track.querySelector('.recommendation-slide');
    const cardWidth = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-4">
        <div className="w-full max-w-3xl rounded-[36px] border border-blue-100 bg-white p-8 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
          <div className="mb-8 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-3xl bg-blue-600 text-white">
              <i className="fas fa-layer-group animate-pulse" aria-hidden="true"></i>
            </span>
            <div>
              <div className="text-sm font-bold uppercase text-blue-700 dark:text-blue-200">TRADELISTIC</div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-white">Building your storefront</h1>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-blue-50 dark:bg-white/10">
            <span className="block h-full w-1/2 animate-[fresh-loader_1.2s_ease-in-out_infinite] rounded-full bg-blue-600"></span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 dark:text-white md:px-8 lg:px-14">
      <section className="mx-auto grid min-h-[calc(100dvh-120px)] max-w-[1480px] items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="scroll-reveal">
          <span className="inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold uppercase text-blue-700 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-blue-200">Verified blue-market experience</span>
          <h1 className="mt-6 max-w-3xl text-[clamp(3.3rem,8vw,8.2rem)] font-black leading-[0.9] text-slate-950 dark:text-white">
            Trade smarter with a cleaner store.
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-blue-100">
            A fresh product discovery experience for importers and exporters, rebuilt around clarity, fast search, calm blue surfaces and confident buying actions.
          </p>
          {!isAuthenticated && (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => navigate('/login?portal=importer')} className="group rounded-[28px] border border-blue-100 bg-white p-5 text-left shadow-xl shadow-blue-950/5 transition hover:-translate-y-1 hover:border-blue-300 dark:border-white/10 dark:bg-white/8">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-700 dark:bg-white/10 dark:text-blue-200"><i className="fas fa-bag-shopping"></i></span>
                <strong className="mt-4 block text-2xl font-black text-slate-950 dark:text-white">Continue as Importer</strong>
                <small className="mt-2 block text-sm font-semibold leading-6 text-slate-500 dark:text-blue-100">Login to browse, cart, pay demo and send offers.</small>
              </button>
              <button type="button" onClick={() => navigate('/login?portal=exporter')} className="group rounded-[28px] border border-blue-100 bg-white p-5 text-left shadow-xl shadow-blue-950/5 transition hover:-translate-y-1 hover:border-blue-300 dark:border-white/10 dark:bg-white/8">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-xl text-white dark:bg-white dark:text-slate-950"><i className="fas fa-store"></i></span>
                <strong className="mt-4 block text-2xl font-black text-slate-950 dark:text-white">Continue as Exporter</strong>
                <small className="mt-2 block text-sm font-semibold leading-6 text-slate-500 dark:text-blue-100">Login to manage store, AI listings and buyer offers.</small>
              </button>
            </div>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white no-underline shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700 hover:text-white">Browse Products</Link>
            {!isAuthenticated && <Link to="/signup" className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-slate-950 no-underline transition hover:-translate-y-1 hover:text-blue-700 dark:border-white/10 dark:bg-white/8 dark:text-white">Create Account</Link>}
          </div>
          {!isAuthenticated && (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-xl shadow-blue-950/5 dark:border-white/10 dark:bg-white/8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200"><i className="fas fa-bag-shopping"></i></span>
                <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Importer portal</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-blue-100">Browse products, cart, demo checkout and send offers.</p>
                <div className="mt-4 flex gap-2">
                  <a href="/login?portal=importer" target="_blank" rel="noreferrer" className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-center text-xs font-black text-white no-underline">Login</a>
                  <a href="/signup?type=importer" target="_blank" rel="noreferrer" className="flex-1 rounded-2xl bg-blue-50 px-4 py-3 text-center text-xs font-black text-blue-700 no-underline dark:bg-white/10 dark:text-blue-200">Sign up</a>
                </div>
              </div>
              <div className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-xl shadow-blue-950/5 dark:border-white/10 dark:bg-white/8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950"><i className="fas fa-store"></i></span>
                <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Exporter portal</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-blue-100">Manage store, AI products, offers and seller dashboard.</p>
                <div className="mt-4 flex gap-2">
                  <a href="/login?portal=exporter" target="_blank" rel="noreferrer" className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white no-underline dark:bg-white dark:text-slate-950">Login</a>
                  <a href="/signup?type=exporter" target="_blank" rel="noreferrer" className="flex-1 rounded-2xl bg-blue-50 px-4 py-3 text-center text-xs font-black text-blue-700 no-underline dark:bg-white/10 dark:text-blue-200">Sign up</a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="scroll-reveal rounded-[38px] border border-blue-100 bg-white p-4 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
          <div className="grid min-h-[560px] grid-rows-[1fr_auto] overflow-hidden rounded-[30px] bg-blue-50 dark:bg-white/10">
            <div className="grid place-items-center p-8">
              {featured[0]?.image_url ? (
                <img src={featured[0].image_url} alt={featured[0].name} className="max-h-[360px] w-full object-contain drop-shadow-2xl" />
              ) : (
                <i className="fas fa-box-open text-8xl text-blue-300" aria-hidden="true"></i>
              )}
            </div>
            <div className="grid gap-3 bg-white/80 p-4 backdrop-blur dark:bg-slate-950/40">
              {categories.map((category) => (
                <button key={category.value} type="button" onClick={() => navigate(`/products?category=${category.value}`)} className="flex items-center justify-between rounded-3xl border border-blue-100 bg-white p-4 text-left transition hover:-translate-y-1 hover:border-blue-300 dark:border-white/10 dark:bg-white/8">
                  <span className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200">
                      <i className={category.icon} aria-hidden="true"></i>
                    </span>
                    <span>
                      <span className="block font-black text-slate-950 dark:text-white">{category.label}</span>
                      <span className="block text-xs font-semibold text-slate-500 dark:text-blue-100">{category.copy}</span>
                    </span>
                  </span>
                  <i className="fas fa-arrow-right text-blue-600 dark:text-blue-200" aria-hidden="true"></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && <div className="mx-auto mb-8 max-w-[1480px] rounded-3xl border border-blue-100 bg-white p-4 text-sm font-bold text-blue-700 dark:border-white/10 dark:bg-white/8 dark:text-blue-200">{error}</div>}

      <section className="mx-auto max-w-[1480px] py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-sm font-bold uppercase text-blue-700 dark:text-blue-200">Featured</span>
            <h2 className="text-[clamp(2rem,4vw,4.8rem)] font-black leading-none text-slate-950 dark:text-white">Fresh arrivals</h2>
          </div>
          <button type="button" onClick={() => navigate('/products')} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20">See all products</button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featured.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {isImporter && recommendations.length > 0 && (
        <section className="mx-auto max-w-[1480px] py-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-sm font-bold uppercase text-blue-700 dark:text-blue-200">Smart recommendations</span>
              <h2 className="text-[clamp(2rem,4vw,4.8rem)] font-black leading-none text-slate-950 dark:text-white">Picked for your imports</h2>
            </div>
          </div>
          <div className="recommendation-carousel-shell">
            <div className="recommendation-carousel-actions recommendation-carousel-actions-left" aria-label="Previous recommendation control">
              <button type="button" onClick={() => slideRecommendations(-1)} aria-label="Previous recommendations">
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
              </button>
            </div>
            <div className="recommendation-carousel-actions recommendation-carousel-actions-right" aria-label="Next recommendation control">
              <button type="button" onClick={() => slideRecommendations(1)} aria-label="Next recommendations">
                <i className="fas fa-arrow-right" aria-hidden="true"></i>
              </button>
            </div>
            <div className="recommendation-carousel-track" ref={recommendationTrackRef}>
              {recommendations.slice(0, 12).map((product) => (
                <div className="recommendation-slide" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto my-12 max-w-[1480px] rounded-[38px] border border-blue-100 bg-blue-600 p-8 text-white shadow-2xl shadow-blue-600/20 dark:border-white/10 lg:p-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-[clamp(2rem,4vw,4.6rem)] font-black leading-none">Ready for a cleaner trading flow?</h2>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-blue-100">Search, compare, save, cart and checkout from one calm blue interface.</p>
          </div>
          <Link to="/products" className="fresh-inverse-cta rounded-2xl bg-white px-7 py-4 text-center text-sm font-black text-blue-700 no-underline transition hover:-translate-y-1 hover:text-blue-800">Start shopping</Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
