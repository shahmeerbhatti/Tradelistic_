import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPublicStore } from '../services/api';
import '../styles/CompactPublicStore.css';

const titleCase = (value) => {
  if (!value) return 'Store';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const PublicStore = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getPublicStore(storeId);
        setStoreData(response.data.store);
        setProducts(response.data.products || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Store not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [storeId]);

  const categories = useMemo(() => {
    return ['all', ...new Set(products.map((product) => product.category).filter(Boolean))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !term ||
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const categoryCounts = useMemo(() => {
    return products.reduce((acc, product) => {
      acc.all += 1;
      if (product.category) acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, { all: 0 });
  }, [products]);

  const storeLocation = [storeData?.city, storeData?.country].filter(Boolean).join(', ');

  const productImage = (product) => {
    if (product.image_url) return product.image_url;
    if (product.all_image_urls?.length) return product.all_image_urls[0];
    if (product.image?.startsWith('http')) return product.image;
    if (product.image) return `http://127.0.0.1:8000${product.image}`;
    return '';
  };

  const contactStore = () => {
    if (storeData?.email) {
      window.location.href = `mailto:${storeData.email}`;
    }
  };

  if (loading) {
    return (
      <div className="store-page-shell">
        <div className="store-page-loader">
          <div className="store-loader-icon">
            <i className="fas fa-store"></i>
          </div>
          <h1>Opening store</h1>
          <p>Loading seller catalog and product collection.</p>
        </div>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="store-page-shell">
        <div className="store-error-card">
          <i className="fas fa-circle-exclamation"></i>
          <h1>Store unavailable</h1>
          <p>{error}</p>
          <button type="button" onClick={() => navigate('/products')}>Back to products</button>
        </div>
      </div>
    );
  }

  return (
    <main className="store-page-shell">
      <section className="store-hero-card">
        <div className="store-logo-tile">
          {storeData.logo_url ? (
            <img src={storeData.logo_url} alt={storeData.name} />
          ) : (
            <i className="fas fa-store"></i>
          )}
        </div>

        <div className="store-hero-copy">
          <span className="store-eyebrow">Verified exporter</span>
          <h1>{storeData.name}</h1>
          <p>{storeData.description || 'Curated trade catalog from a registered exporter on Tradelistic.'}</p>
          <div className="store-meta-row">
            <span><i className="fas fa-box"></i>{products.length} items</span>
            {storeData.established_year && <span><i className="fas fa-calendar"></i>Since {storeData.established_year}</span>}
            <span><i className="fas fa-handshake"></i>{titleCase(storeData.business_type)}</span>
            {storeLocation && <span><i className="fas fa-location-dot"></i>{storeLocation}</span>}
          </div>
        </div>

        <div className="store-hero-actions">
          <button type="button" onClick={contactStore} disabled={!storeData.email}>
            <i className="fas fa-message"></i>
            Contact seller
          </button>
          <span>Seller: {storeData.seller_name || storeData.owner}</span>
        </div>
      </section>

      <section className="store-catalog-layout">
        <aside className="store-filter-panel">
          <div>
            <span className="store-eyebrow">Catalog</span>
            <h2>{filteredProducts.length} items</h2>
          </div>

          <label className="store-search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={`Search ${products.length} products`}
            />
          </label>

          <div className="store-category-list">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => setSelectedCategory(category)}
              >
                <span>{category === 'all' ? 'All products' : titleCase(category)}</span>
                <strong>{categoryCounts[category] || 0}</strong>
              </button>
            ))}
          </div>
        </aside>

        <section className="store-products-panel">
          <div className="store-products-head">
            <div>
              <span className="store-eyebrow">Seller collection</span>
              <h2>{selectedCategory === 'all' ? 'All products' : titleCase(selectedCategory)}</h2>
            </div>
            <button type="button" onClick={() => navigate('/products')}>
              Browse marketplace
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          {filteredProducts.length ? (
            <div className="store-product-grid">
              {filteredProducts.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  className="store-product-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <span className="store-product-image">
                    {productImage(product) ? (
                      <img src={productImage(product)} alt={product.name} />
                    ) : (
                      <i className="fas fa-box-open"></i>
                    )}
                  </span>
                  <span className="store-product-copy">
                    <small>{titleCase(product.category)}</small>
                    <strong>{product.name}</strong>
                    <em>${Number(product.price || 0).toFixed(2)}</em>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="store-empty-state">
              <i className="fas fa-search"></i>
              <h3>No products found</h3>
              <p>Try another category or search term.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default PublicStore;
