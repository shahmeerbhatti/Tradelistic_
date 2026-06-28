import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllProducts, getRecommendations } from '../services/api';

const categories = [
  { value: 'electronics', label: 'Electronics', icon: 'fas fa-microchip', copy: 'Laptops, phones, audio and smart devices' },
  { value: 'fashion', label: 'Fashion', icon: 'fas fa-shirt', copy: 'Apparel, accessories and daily essentials' },
  { value: 'home', label: 'Home', icon: 'fas fa-couch', copy: 'Furniture, decor and household upgrades' },
  { value: 'books', label: 'Books', icon: 'fas fa-book-open', copy: 'Study, business and lifestyle reading' },
];

const demoDeals = [
  { title: 'Importer essentials', value: 'Up to 25% off', icon: 'fas fa-tags' },
  { title: 'Verified sellers', value: 'Trusted stores', icon: 'fas fa-shield-halved' },
  { title: 'Demo checkout', value: 'Stripe-ready', icon: 'fas fa-credit-card' },
];

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate(`/product/${product.id}`)} className="target-product-card group">
      <div className="target-product-media">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <i className="fas fa-box-open" aria-hidden="true"></i>
        )}
      </div>
      <div className="target-product-body">
        <span>{product.category || 'Marketplace'}</span>
        <h3>{product.name}</h3>
        <strong>${Number(product.price || 0).toFixed(2)}</strong>
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
    let active = true;
    const previewTimer = window.setTimeout(() => {
      if (!active) return;
      setError('Live product data is still loading. Showing the retail shell for preview.');
      setLoading(false);
    }, 1600);

    const load = async () => {
      try {
        const response = await getAllProducts();
        if (!active) return;
        setProducts(response.data.results || response.data || []);
        setError('');
        if (isImporter) {
          const recs = await getRecommendations();
          if (!active) return;
          setRecommendations(recs.data.recommendations || []);
        }
      } catch {
        if (!active) return;
        setError('Live product data is not connected right now. Showing the retail shell for preview.');
      } finally {
        if (!active) return;
        window.clearTimeout(previewTimer);
        setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
      window.clearTimeout(previewTimer);
    };
  }, [isImporter]);

  const featured = useMemo(() => products.slice(0, 8), [products]);
  const heroProduct = featured[0];
  const visibleProducts = featured.length ? featured : [];

  const slideRecommendations = (direction) => {
    const track = recommendationTrackRef.current;
    if (!track) return;
    const card = track.querySelector('.recommendation-slide');
    const cardWidth = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <main className="target-loader-page">
        <section className="target-loader-card">
          <span className="target-loader-logo">T</span>
          <div>
            <span>TRADELISTIC</span>
            <h1>Preparing the marketplace</h1>
            <p>Loading retail sections, seller tools and checkout surfaces.</p>
          </div>
          <div className="target-loader-bar"><span /></div>
        </section>
      </main>
    );
  }

  return (
    <main className="target-home">
      <section className="target-hero">
        <div className="target-hero-copy">
          <h1>Hot marketplace deals up to 15% off</h1>
          <p>
            Browse the newest products, compare trusted sellers, manage offers and checkout from a polished ecommerce storefront.
          </p>
          <div className="target-hero-actions">
            <Link to="/products">Shop all products</Link>
            {!isAuthenticated && <Link to="/signup">Create account</Link>}
          </div>
          {!isAuthenticated && (
            <div className="target-portal-row">
              <button type="button" onClick={() => navigate('/login?portal=importer')}>
                <i className="fas fa-bag-shopping" aria-hidden="true"></i>
                <span>
                  <strong>Importer portal</strong>
                  <small>Cart, offers and demo payment</small>
                </span>
              </button>
              <button type="button" onClick={() => navigate('/login?portal=exporter')}>
                <i className="fas fa-store" aria-hidden="true"></i>
                <span>
                  <strong>Exporter portal</strong>
                  <small>Store, products and analytics</small>
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="target-hero-deal">
          <div className="target-deal-badge">Weekly spotlight</div>
          <div className="target-deal-product">
            {heroProduct?.image_url ? (
              <img src={heroProduct.image_url} alt={heroProduct.name} />
            ) : (
              <i className="fas fa-bag-shopping" aria-hidden="true"></i>
            )}
          </div>
          <div className="target-deal-copy">
            <span>{heroProduct?.category || 'Our first ecommerce showcase'}</span>
            <h2>{heroProduct?.name || 'Premium storefront experience'}</h2>
            <strong>{heroProduct ? `$${Number(heroProduct.price || 0).toFixed(2)}` : 'Live catalog preview'}</strong>
          </div>
        </div>
      </section>

      <div className="target-slider-dots" aria-hidden="true">
        <span className="active"></span>
        <span></span>
        <span></span>
      </div>

      <section className="target-category-strip" aria-label="Shop by department">
        {categories.map((category) => (
          <button key={category.value} type="button" onClick={() => navigate(`/products?category=${category.value}`)}>
            <i className={category.icon} aria-hidden="true"></i>
            <span>
              <strong>{category.label}</strong>
              <small>{category.copy}</small>
            </span>
          </button>
        ))}
      </section>

      <section className="target-deal-strip" aria-label="Marketplace benefits">
        {demoDeals.map((deal) => (
          <article key={deal.title}>
            <i className={deal.icon} aria-hidden="true"></i>
            <span>{deal.title}</span>
            <strong>{deal.value}</strong>
          </article>
        ))}
      </section>

      {error && <div className="target-alert">{error}</div>}

      <section className="target-section">
        <div className="target-section-head">
          <div>
            <span>Featured</span>
            <h2>Top picks for your marketplace</h2>
          </div>
          <button type="button" onClick={() => navigate('/products')}>View all</button>
        </div>
        {visibleProducts.length ? (
          <div className="target-product-grid">
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="target-empty-retail">
            <i className="fas fa-boxes-stacked" aria-hidden="true"></i>
            <h3>Connect product data to fill this shelf</h3>
            <p>The storefront layout is ready. Once the backend is running, products will populate this retail grid automatically.</p>
            <button type="button" onClick={() => navigate('/products')}>Open product page</button>
          </div>
        )}
      </section>

      {isImporter && recommendations.length > 0 && (
        <section className="target-section">
          <div className="target-section-head">
            <div>
              <span>Recommended</span>
              <h2>Picked for your imports</h2>
            </div>
          </div>
          <div className="recommendation-carousel-shell">
            <div className="recommendation-carousel-actions recommendation-carousel-actions-left">
              <button type="button" onClick={() => slideRecommendations(-1)} aria-label="Previous recommendations">
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
              </button>
            </div>
            <div className="recommendation-carousel-actions recommendation-carousel-actions-right">
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

      <section className="target-membership">
        <div>
          <span>Tradelistic Circle</span>
          <h2>One platform for buying, selling and negotiating.</h2>
          <p>Keep product discovery, offer management, seller dashboards and demo checkout in one clean retail-grade interface.</p>
        </div>
        <Link to="/products">Start shopping</Link>
      </section>
    </main>
  );
};

export default Home;
