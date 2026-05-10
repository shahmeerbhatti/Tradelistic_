import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkStore, deleteProduct, getMyStoreProducts } from '../services/api';
import ExporterHeader from '../components/ExporterHeader';
import '../styles/ExporterStore.css';

const titleCase = (value) => {
  if (!value) return 'Product';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const ExporterStore = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.title = 'My Store - Tradelistic';

    const fetchStoreData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('user_type');

        if (!token || userType !== 'exporter') {
          navigate('/login');
          return;
        }

        const storeResponse = await checkStore();
        if (!storeResponse.data.has_store) {
          navigate('/store-setup');
          return;
        }

        const productsResponse = await getMyStoreProducts();
        setProducts(productsResponse.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Store information could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
    return () => {
      document.title = 'Tradelistic';
    };
  }, [navigate]);

  const stats = useMemo(() => {
    return {
      active: products.filter((product) => product.is_active !== false).length,
      inactive: products.filter((product) => product.is_active === false).length,
      value: products.reduce((sum, product) => sum + Number(product.price || 0), 0),
      categories: new Set(products.map((product) => product.category).filter(Boolean)).size,
    };
  }, [products]);

  const productImage = (product) => {
    if (product.image_url) return product.image_url;
    if (product.all_image_urls?.length) return product.all_image_urls[0];
    if (product.images?.[0]?.image_url) return product.images[0].image_url;
    return '';
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteModal.id);
      setProducts((current) => current.filter((product) => product.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Product could not be deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="exporter-store-shell">
        <ExporterHeader showBackButton currentPage="My Store" />
        <div className="store-page-loader">
          <div className="store-loader-mark">
            <i className="fas fa-store"></i>
          </div>
          <h1>Loading your store</h1>
          <p>Syncing products, images, and seller details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exporter-store-shell">
      <ExporterHeader showBackButton={false} currentPage="My Store" />

      <main className="exporter-store-page">
        {error && (
          <div className="store-alert">
            <i className="fas fa-circle-info"></i>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        <section className="store-stat-grid">
          <article>
            <div className="store-stat-title"><i className="fas fa-box-open"></i><span>Products</span></div>
            <strong>{products.length}</strong>
          </article>
          <article>
            <div className="store-stat-title"><i className="fas fa-circle-check"></i><span>Active</span></div>
            <strong>{stats.active}</strong>
          </article>
          <article>
            <div className="store-stat-title"><i className="fas fa-layer-group"></i><span>Categories</span></div>
            <strong>{stats.categories}</strong>
          </article>
          <article>
            <div className="store-stat-title"><i className="fas fa-dollar-sign"></i><span>Catalog value</span></div>
            <strong>${stats.value.toFixed(2)}</strong>
          </article>
        </section>

        <section className="store-products-board">
          <div className="store-board-head">
            <div>
              <span>Product catalog</span>
              <h2>My products</h2>
            </div>
          </div>

          <div className="store-product-grid">
            <button type="button" className="store-ai-tile" onClick={() => navigate('/add-product')}>
              <span><i className="fas fa-plus"></i></span>
              <strong>Add new product using AI</strong>
              <small>Upload product images and autofill title, description, and category.</small>
            </button>

            {products.map((product) => (
              <article key={product.id} className="store-product-card">
                <button type="button" className="store-product-media" onClick={() => navigate(`/product/${product.id}`)}>
                  {productImage(product) ? <img src={productImage(product)} alt={product.name} /> : <i className="fas fa-box-open"></i>}
                </button>
                <div className="store-product-body">
                  <span className={product.is_active === false ? 'status-chip inactive' : 'status-chip'}>{product.is_active === false ? 'Inactive' : 'Active'}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description || 'No description available.'}</p>
                  <div className="store-product-meta">
                    <strong>${Number(product.price || 0).toFixed(2)}</strong>
                    <small>{titleCase(product.category)}</small>
                  </div>
                </div>
                <div className="store-product-actions">
                  <button type="button" onClick={() => navigate(`/edit-product/${product.id}`)}>Edit</button>
                  <button type="button" onClick={() => navigate(`/product/${product.id}`)}>View</button>
                  <button type="button" className="danger" onClick={() => setDeleteModal(product)}>Delete</button>
                </div>
              </article>
            ))}
          </div>

          {products.length === 0 && (
            <div className="store-empty-copy">
              <h3>No products yet</h3>
              <p>Your first AI-assisted listing will appear here after publishing.</p>
            </div>
          )}
        </section>
      </main>

      {deleteModal && (
        <div className="store-modal-backdrop">
          <div className="store-delete-modal">
            <button type="button" className="store-modal-close" onClick={() => setDeleteModal(null)} disabled={isDeleting}>
              <i className="fas fa-times"></i>
            </button>
            <span>Delete product</span>
            <h2>{deleteModal.name}</h2>
            <p>This product and its images will be removed from the store catalog.</p>
            <div>
              <button type="button" onClick={() => setDeleteModal(null)} disabled={isDeleting}>Cancel</button>
              <button type="button" className="danger" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExporterStore;
