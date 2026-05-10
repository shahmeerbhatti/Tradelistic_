import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsDetails } from '../services/api';
import ExporterHeader from '../components/ExporterHeader';
import '../styles/Analytics.css';

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('views'); // views, favorites, sales
  const [analytics, setAnalytics] = useState({
    views: [],
    favorites: [],
    sales: [],
    reviews: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Analytics - Tradelistic';
    
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('user_type');
        
        if (!token || userType !== 'exporter') {
          navigate('/login');
          return;
        }

        const response = await getAnalyticsDetails();
        if (response.data.success) {
          setAnalytics(response.data.analytics);
        } else {
          setError('Failed to load analytics data');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      document.title = 'Tradelistic';
    };
  }, [navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <ExporterHeader />
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <ExporterHeader />
        <div className="analytics-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={() => navigate('/exporter-dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <ExporterHeader />
      
      <div className="analytics-container">
        <div className="analytics-header">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate('/exporter-dashboard')}>
              <i className="fas fa-arrow-left"></i>
              Back to Dashboard
            </button>
            <h1>Product Analytics</h1>
            <p>Track your product views, favorites, and sales</p>
          </div>
          
          <div className="summary-cards">
            <div className="summary-card views-card">
              <div className="card-icon">
                <i className="fas fa-eye"></i>
              </div>
              <div className="card-info">
                <h3>{analytics.views.length}</h3>
                <p>Total Views</p>
              </div>
            </div>
            
            <div className="summary-card favorites-card">
              <div className="card-icon">
                <i className="fas fa-heart"></i>
              </div>
              <div className="card-info">
                <h3>{analytics.favorites.length}</h3>
                <p>Total Favorites</p>
              </div>
            </div>
            
            <div className="summary-card sales-card">
              <div className="card-icon">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <div className="card-info">
                <h3>{analytics.sales.length}</h3>
                <p>Total Sales</p>
              </div>
            </div>

            <div className="summary-card reviews-card">
              <div className="card-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="card-info">
                <h3>{analytics.reviews.length}</h3>
                <p>Total Reviews</p>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-tabs">
          <button 
            className={`tab-btn ${activeTab === 'views' ? 'active' : ''}`}
            onClick={() => setActiveTab('views')}
          >
            <i className="fas fa-eye"></i>
            Product Views
            <span className="tab-count">{analytics.views.length}</span>
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <i className="fas fa-heart"></i>
            Favorites
            <span className="tab-count">{analytics.favorites.length}</span>
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <i className="fas fa-shopping-cart"></i>
            Sales
            <span className="tab-count">{analytics.sales.length}</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <i className="fas fa-star"></i>
            Reviews
            <span className="tab-count">{analytics.reviews.length}</span>
          </button>
        </div>

        <div className="analytics-content">
          {activeTab === 'views' && (
            <div className="analytics-section">
              <h2>
                <i className="fas fa-eye"></i>
                Product Views
              </h2>
              {analytics.views.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-eye-slash"></i>
                  <p>No views yet</p>
                </div>
              ) : (
                <div className="analytics-list">
                  {analytics.views.map((view) => (
                    <div key={view.id} className="analytics-item view-item">
                      <div className="item-icon">
                        <i className="fas fa-eye"></i>
                      </div>
                      <div className="item-content">
                        <div className="item-main">
                          <span className="item-date">{formatDate(view.viewed_at)}</span>
                          <span className="item-separator">-</span>
                          <span className="item-user">User <strong>{view.user}</strong></span>
                          <span className="item-separator">viewed</span>
                          <span 
                            className="item-product"
                            onClick={() => handleProductClick(view.product_id)}
                          >
                            {view.product_name}
                          </span>
                        </div>
                        <div className="item-meta">
                          <span className="meta-label">IP:</span>
                          <span className="meta-value">{view.ip_address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="analytics-section">
              <h2>
                <i className="fas fa-heart"></i>
                Product Favorites
              </h2>
              {analytics.favorites.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-heart-broken"></i>
                  <p>No favorites yet</p>
                </div>
              ) : (
                <div className="analytics-list">
                  {analytics.favorites.map((favorite) => (
                    <div key={favorite.id} className="analytics-item favorite-item">
                      <div className="item-icon">
                        <i className="fas fa-heart"></i>
                      </div>
                      <div className="item-content">
                        <div className="item-main">
                          <span className="item-date">{formatDate(favorite.created_at)}</span>
                          <span className="item-separator">-</span>
                          <span className="item-user">User <strong>{favorite.user}</strong></span>
                          <span className="item-separator">favorited</span>
                          <span 
                            className="item-product"
                            onClick={() => handleProductClick(favorite.product_id)}
                          >
                            {favorite.product_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="analytics-section">
              <h2>
                <i className="fas fa-shopping-cart"></i>
                Product Sales
              </h2>
              {analytics.sales.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-shopping-basket"></i>
                  <p>No sales yet</p>
                </div>
              ) : (
                <div className="analytics-list">
                  {analytics.sales.map((sale) => (
                    <div key={sale.id} className="analytics-item sale-item">
                      <div className="item-icon">
                        <i className="fas fa-shopping-cart"></i>
                      </div>
                      <div className="item-content">
                        <div className="item-main">
                          <span className="item-date">{formatDate(sale.created_at)}</span>
                          <span className="item-separator">-</span>
                          <span className="item-user">
                            <strong>{sale.customer_name}</strong> ({sale.customer})
                          </span>
                          <span className="item-separator">purchased</span>
                          <span 
                            className="item-product"
                            onClick={() => handleProductClick(sale.product_id)}
                          >
                            {sale.product_name}
                          </span>
                        </div>
                        <div className="item-meta">
                          <span className="meta-item">
                            <span className="meta-label">Order ID:</span>
                            <span className="meta-value">{sale.sales_id}</span>
                          </span>
                          <span className="meta-item">
                            <span className="meta-label">Quantity:</span>
                            <span className="meta-value">{sale.quantity}</span>
                          </span>
                          <span className="meta-item">
                            <span className="meta-label">Amount:</span>
                            <span className="meta-value amount">${sale.final_total}</span>
                          </span>
                          <span className={`status-badge ${sale.order_status}`}>
                            {sale.order_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="analytics-section">
              <h2>
                <i className="fas fa-star"></i>
                Product Reviews
              </h2>
              {analytics.reviews.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-star-half-alt"></i>
                  <p>No reviews yet</p>
                </div>
              ) : (
                <div className="analytics-list">
                  {analytics.reviews.map((review) => (
                    <div key={review.id} className="analytics-item review-item">
                      <div className="item-icon">
                        <i className="fas fa-star"></i>
                      </div>
                      <div className="item-content">
                        <div className="item-main">
                          <span className="item-date">{formatDate(review.created_at)}</span>
                          <span className="item-separator">-</span>
                          <span className="item-user">User <strong>{review.user}</strong></span>
                          <span className="item-separator">rated</span>
                          <span
                            className="item-product"
                            onClick={() => handleProductClick(review.product_id)}
                          >
                            {review.product_name}
                          </span>
                        </div>
                        <div className="item-meta">
                          <span className="meta-item">
                            <span className="meta-label">Stars:</span>
                            <span className="meta-value amount">{review.rating}/5</span>
                          </span>
                          {review.verified_purchase && (
                            <span className="status-badge delivered">Verified purchase</span>
                          )}
                          {review.title && (
                            <span className="meta-item">
                              <span className="meta-label">Title:</span>
                              <span className="meta-value">{review.title}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
