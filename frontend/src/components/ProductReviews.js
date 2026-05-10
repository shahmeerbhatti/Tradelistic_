import React, { useState, useEffect } from 'react';
import { checkProductReviewEligibility, createReview, getProductReviews } from '../services/api';
import '../styles/ProductReviews.css';

const ProductReviews = ({ productId }) => {
  const [reviewsData, setReviewsData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const reviewsPerPage = 5;

  useEffect(() => {
    if (productId) {
      loadReviews(currentPage);
    }
  }, [productId, currentPage]);

  const loadReviews = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProductReviews(productId, page, reviewsPerPage);
      setReviewsData(response.data);
      await loadEligibility();
    } catch (error) {
      console.error('Error loading reviews:', error);
      setError('Failed to load reviews. Please try again later.');
      // Set empty data to show "no reviews" state
      setReviewsData({
        reviews: [],
        totalReviews: 0,
        totalPages: 0,
        currentPage: page,
        averageRating: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEligibility = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const response = await checkProductReviewEligibility(productId);
      setEligibility(response.data);
    } catch (error) {
      setEligibility(null);
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!eligibility?.eligible) return;
    setSubmitting(true);
    setSubmitMessage('');
    try {
      await createReview({
        product_id: productId,
        sale_id: eligibility.sale_id,
        sales_id: eligibility.sales_id,
        rating: form.rating,
        title: form.title,
        comment: form.comment
      });
      setSubmitMessage('Review added. Recommendation engine aur exporter analytics ab is rating ko use karenge.');
      setForm({ rating: 5, title: '', comment: '' });
      setEligibility((current) => ({ ...current, eligible: false, already_reviewed: true, reason: 'You have already reviewed this product' }));
      setCurrentPage(1);
      await loadReviews(1);
    } catch (error) {
      const message = error.response?.data?.error || 'Review submit nahi ho saka. Please try again.';
      setSubmitMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Smooth scroll to reviews section
    document.querySelector('.product-reviews')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`fas fa-star ${index < rating ? 'filled' : 'empty'}`}
      />
    ));
  };

  const renderPaginationButtons = () => {
    if (!reviewsData || reviewsData.totalPages <= 1) return null;

    const buttons = [];
    const maxVisiblePages = 5;
    const totalPages = Math.min(reviewsData.totalPages, 10); // Limit to 10 pages as requested
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      buttons.push(
        <button
          key="prev"
          className="pagination-btn prev-btn"
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
      );
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      buttons.push(
        <button
          key="next"
          className="pagination-btn next-btn"
          onClick={() => handlePageChange(currentPage + 1)}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="loading-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reviews-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>Error Loading Reviews</h3>
        <p>{error}</p>
        <button onClick={() => loadReviews(currentPage)} className="retry-btn">
          <i className="fas fa-retry"></i>
          Try Again
        </button>
      </div>
    );
  }

  const hasReviews = reviewsData && reviewsData.reviews.length > 0;

  return (
    <div className="product-reviews">
      {/* Reviews Header */}
      <div className="reviews-header">
        <h2>Reviews for this item</h2>
        <div className="reviews-summary">
          <div className="overall-rating">
            <div className="rating-stars">
              {renderStars(Math.round(parseFloat(reviewsData.averageRating)))}
              <span className="rating-number">{reviewsData.averageRating}</span>
            </div>
            <span className="reviews-count">({reviewsData.totalReviews.toLocaleString()} reviews)</span>
          </div>
          <div className="verified-badge">
            <i className="fas fa-shield-alt"></i>
            <span>All reviews are from verified buyers</span>
          </div>
        </div>
      </div>

      <div className="review-compose">
        {eligibility?.eligible ? (
          <form onSubmit={handleSubmitReview} className="review-form">
            <div>
              <span className="review-form-kicker">Verified buyer review</span>
              <h3>Rate this product</h3>
            </div>
            <div className="star-picker" aria-label="Choose star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={star <= Number(form.rating) ? 'active' : ''}
                  onClick={() => setForm((current) => ({ ...current, rating: star }))}
                  aria-label={`${star} stars`}
                >
                  <i className="fas fa-star"></i>
                </button>
              ))}
            </div>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Short title, e.g. Great quality"
              maxLength={200}
            />
            <textarea
              value={form.comment}
              onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
              placeholder="Write what other importers should know..."
              required
            />
            <button type="submit" disabled={submitting}>
              <i className="fas fa-paper-plane"></i>
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        ) : (
          <div className="review-locked">
            <i className={`fas ${eligibility?.already_reviewed ? 'fa-check-circle' : 'fa-lock'}`}></i>
            <span>{eligibility?.reason || 'Buy this product to unlock verified review.'}</span>
          </div>
        )}
        {submitMessage && <p className="review-submit-message">{submitMessage}</p>}
      </div>

      {/* Individual Reviews */}
      {hasReviews ? (
        <div className="reviews-list">
          {reviewsData.reviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="review-rating">
                <div className="stars">
                  {renderStars(review.rating)}
                  <span className="rating-text">{review.rating}</span>
                </div>
                {review.verifiedPurchase && (
                  <div className="verified-purchase">
                    <i className="fas fa-check-circle"></i>
                    <span>Verified Purchase</span>
                  </div>
                )}
              </div>
              <div className="review-meta">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.user.name}</span>
                  <div className="reviewer-location">
                    <i className="fas fa-globe"></i>
                    <span>{review.user.location}</span>
                  </div>
                </div>
                <span className="review-date">{new Date(review.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
            
            <div className="review-content">
              {review.title && <h4>{review.title}</h4>}
              <p>{review.comment}</p>
            </div>
            
            <div className="review-actions">
              <button className="helpful-btn">
                <i className="fas fa-thumbs-up"></i>
                <span>Helpful ({review.helpful})</span>
              </button>
            </div>
          </div>
          ))}
        </div>
      ) : (
        <div className="no-reviews">
          <i className="fas fa-comment-alt"></i>
          <h3>No reviews yet</h3>
          <p>Verified buyers ke stars yahan show honge.</p>
        </div>
      )}

      {/* Pagination */}
      {reviewsData.totalPages > 1 && (
        <div className="reviews-pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * reviewsPerPage) + 1}-{Math.min(currentPage * reviewsPerPage, reviewsData.totalReviews)} of {reviewsData.totalReviews} reviews
          </div>
          <div className="pagination-controls">
            {renderPaginationButtons()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
