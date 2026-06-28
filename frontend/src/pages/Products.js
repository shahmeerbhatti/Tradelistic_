import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllProducts } from '../services/api';
import { CATEGORY_OPTIONS } from '../utils/categoryConstants';

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');

  const query = searchParams.get('name') || '';
  const category = searchParams.get('category') || '';
  const activeCategory = CATEGORY_OPTIONS.find((item) => item.value === category);
  const title = query ? `Search: ${query}` : activeCategory?.label || 'All Products';

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (query) params.name = query;
        if (category) params.category = category;
        if (searchParams.get('subcategory')) params.subcategory = searchParams.get('subcategory');
        if (searchParams.get('min_price')) params.min_price = searchParams.get('min_price');
        if (searchParams.get('max_price')) params.max_price = searchParams.get('max_price');
        const response = await getAllProducts(params);
        setProducts(response.data.results || response.data || []);
      } catch {
        setError('Products could not be loaded right now.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [query, category, searchParams]);

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) params.set('min_price', minPrice); else params.delete('min_price');
    if (maxPrice) params.set('max_price', maxPrice); else params.delete('max_price');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  const ProductCard = ({ product }) => (
    <button
      type="button"
      onClick={() => navigate(`/product/${product.id}`)}
      className="product-card-shell group scroll-reveal overflow-hidden rounded-[28px] border border-blue-100 bg-white text-left shadow-[0_18px_50px_rgba(49,91,210,0.09)] transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-[0_26px_70px_rgba(49,91,210,0.16)] dark:border-white/10 dark:bg-white/8"
    >
      <div className="product-card-image-frame grid h-52 place-items-center bg-blue-50 dark:bg-white/10">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="product-card-fit-image h-full w-full object-contain p-6 drop-shadow-xl transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <i className="fas fa-box-open text-4xl text-blue-300" aria-hidden="true"></i>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.68rem] font-bold uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">{product.category || 'Product'}</span>
          <i className="fas fa-arrow-right text-blue-500 opacity-0 transition group-hover:opacity-100" aria-hidden="true"></i>
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-black leading-snug text-slate-950 dark:text-white">{product.name}</h3>
        <div className="mt-2 text-xl font-black text-blue-700 dark:text-blue-200">${Number(product.price || 0).toFixed(2)}</div>
      </div>
    </button>
  );

  return (
    <main className="w-full px-4 py-8 dark:text-white md:px-8 lg:px-14">
      <section className="mx-auto max-w-[1480px]">
        <div className="scroll-reveal overflow-hidden rounded-[24px] border border-blue-100 bg-white p-3 shadow-xl shadow-blue-950/5 dark:border-white/10 dark:bg-white/8 lg:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="pt-1">
              <h1 className="text-[clamp(1.8rem,3.2vw,3.25rem)] font-black leading-none text-slate-950 dark:text-white">{title}</h1>
              <p className="mt-1 max-w-2xl text-sm font-semibold leading-5 text-slate-500 dark:text-blue-100">
                {products.length} product{products.length === 1 ? '' : 's'} available
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                <button type="button" onClick={() => setSearchParams({})} className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${!category ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200'}`}>All</button>
                {CATEGORY_OPTIONS.map((item) => (
                  <button key={item.value} type="button" onClick={() => setSearchParams({ category: item.value })} className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${category === item.value ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200'}`}>
                    <i className={`${item.icon} mr-2`} aria-hidden="true"></i>
                    {item.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setShowFilters((value) => !value)} className="h-10 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 dark:border-white/10 dark:bg-white/8 dark:text-blue-200">
                <i className="fas fa-sliders mr-2" aria-hidden="true"></i>
                Filters
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-3 rounded-[22px] border border-blue-100 bg-white p-4 shadow-lg shadow-blue-950/5 dark:border-white/10 dark:bg-white/8 sm:grid-cols-[1fr_1fr_auto_auto]">
            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" min="0" placeholder="Min price" className="h-12 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" min="0" placeholder="Max price" className="h-12 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
            <button type="button" onClick={applyPrice} className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white">Apply</button>
            <button type="button" onClick={clearFilters} className="h-12 rounded-2xl bg-white px-5 text-sm font-black text-blue-700 dark:bg-slate-950 dark:text-blue-200">Reset</button>
          </div>
        )}

        {loading && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[320px] animate-pulse rounded-[28px] border border-blue-100 bg-white p-4 dark:border-white/10 dark:bg-white/8">
                <div className="h-48 rounded-3xl bg-blue-50 dark:bg-white/10"></div>
                <div className="mt-5 h-5 w-2/3 rounded-full bg-blue-50 dark:bg-white/10"></div>
                <div className="mt-3 h-5 w-1/2 rounded-full bg-blue-50 dark:bg-white/10"></div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="mt-8 rounded-3xl border border-blue-100 bg-white p-6 text-sm font-bold text-blue-700 dark:border-white/10 dark:bg-white/8 dark:text-blue-200">{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className="mt-8 rounded-[34px] border border-blue-100 bg-white p-10 text-center shadow-xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
            <i className="fas fa-search text-5xl text-blue-300" aria-hidden="true"></i>
            <h2 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">No products found</h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-blue-100">Try another category, keyword, or price range.</p>
            <button type="button" onClick={clearFilters} className="mt-6 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white">Clear filters</button>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </main>
  );
};

export default Products;
