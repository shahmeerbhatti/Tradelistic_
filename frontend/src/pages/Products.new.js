import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllProducts } from '../services/api';
import '../styles/Products.css';

const PRICE_MIN = 0;
const PRICE_MAX = 2000;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || PRICE_MAX);
  const filterRef = useRef(null);

  const applyFilters = React.useCallback(() => {
    let filtered = [...products];

    // Apply price filter
    filtered = filtered.filter(product => {
      const price = parseFloat(product.price) || 0;
      return price >= parseFloat(minPrice) && price <= parseFloat(maxPrice);
    });

    setFilteredProducts(filtered);
    updateSearchParams();
  }, [products, minPrice, maxPrice, setSearchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllProducts();
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (err) {
      setError('Could not load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Effect for handling clicks outside filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect for initial product fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Effect for applying filters
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const updateSearchParams = () => {
    const params = {};
    if (minPrice !== PRICE_MIN) params.min_price = minPrice;
    if (maxPrice !== PRICE_MAX) params.max_price = maxPrice;
    setSearchParams(params);
  };

  const handlePriceInputChange = (type, value) => {
    const numValue = Number(value);
    if (type === 'min') {
      setMinPrice(Math.min(numValue, maxPrice));
    } else {
      setMaxPrice(Math.max(numValue, minPrice));
    }
  };

  const handleReset = () => {
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="products-container">
          <div className="products-header">
            <div className="results-count skeleton-count"></div>
          </div>
          <div className="products-grid">
            {Array(8).fill(null).map((_, index) => (
              <div key={`skeleton-${index}`} className="product-card skeleton">
                <div className="product-image skeleton-image"></div>
                <div className="product-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-price"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="products-error">{error}</div>;

  return (
    <div className="products-page">
      <div className="products-container">
        <div className="products-header">
          <div className="results-count">
            <span>{filteredProducts.length} out of {products.length} results</span>
          </div>
          <div className="filter-wrapper">
            <button className="filter-button" onClick={() => setShowFilter(!showFilter)}>
              <i className="fas fa-filter"></i>
              Filter
            </button>
            
            {showFilter && (
              <div className="filter-dropdown" ref={filterRef}>
                <div className="filter-section">
                  <h4>Price Range</h4>
                  <div className="price-inputs">
                    <div className="price-input-group">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => handlePriceInputChange('min', e.target.value)}
                        min={PRICE_MIN}
                        max={maxPrice}
                        placeholder="Min"
                      />
                      <span className="price-label">Min</span>
                    </div>
                    <div className="price-input-group">
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => handlePriceInputChange('max', e.target.value)}
                        min={minPrice}
                        max={PRICE_MAX}
                        placeholder="Max"
                      />
                      <span className="price-label">Max</span>
                    </div>
                  </div>
                  <div className="price-slider">
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      value={minPrice}
                      onChange={(e) => handlePriceInputChange('min', e.target.value)}
                      className="slider min-slider"
                    />
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      value={maxPrice}
                      onChange={(e) => handlePriceInputChange('max', e.target.value)}
                      className="slider max-slider"
                    />
                  </div>
                  <button className="reset-btn" onClick={handleReset}>
                    <i className="fas fa-redo-alt"></i> Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <p>No products match your filters</p>
            <button className="reset-btn" onClick={handleReset}>
              <i className="fas fa-redo-alt"></i> Reset Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} loading="lazy" />
                  ) : (
                    <div className="no-image">
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                </div>
                <div className="product-content">
                  <h3 className="product-title">{product.name}</h3>
                  <div className="product-price">${parseFloat(product.price).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
