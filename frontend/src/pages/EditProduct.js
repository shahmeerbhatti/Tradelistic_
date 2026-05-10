import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById, updateProduct } from '../services/api';
import { CATEGORY_OPTIONS, SUBCATEGORY_OPTIONS } from '../utils/categoryConstants';
import '../styles/EditProduct.css';

const MAX_PRODUCT_IMAGES = 5;

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: [],
    category: 'others',
    subcategory: '',
  });
  const [originalImages, setOriginalImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [mainImage, setMainImage] = useState({ type: 'existing', index: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  useEffect(() => {
    document.title = 'Edit Product - Tradelistic';
    
    const fetchProduct = async () => {
      try {
        const userType = localStorage.getItem('user_type');
        if (!userType || userType !== 'exporter') {
          navigate('/login');
          return;
        }

        const response = await getProductById(id);
        const product = response.data;
        
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          images: [],
          category: product.category,
          subcategory: product.subcategory || '',
        });

        // Set available subcategories based on product category
        setAvailableSubcategories(SUBCATEGORY_OPTIONS[product.category] || []);

        // Set up existing images
        const productImages = product.images || [];
        const hasMainImageInGallery = product.image_url && productImages.some((img) => (img.image_url || img.image) === product.image_url);
        const existingImages = product.image_url && !hasMainImageInGallery
          ? [{ id: null, image_url: product.image_url, image: product.image_url, isMainOnly: true }, ...productImages]
          : productImages;
        setOriginalImages(existingImages);
        
        // Create previews for existing images
        const previews = existingImages.map(img => img.image_url || img.image);
        setImagePreviews(previews);
        const mainIndex = Math.max(0, existingImages.findIndex((img) => (img.image_url || img.image) === product.image_url));
        setMainImage({ type: 'existing', index: mainIndex === -1 ? 0 : mainIndex });

      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product data');
      } finally {
        setFetchingProduct(false);
      }
    };

    if (id) {
      fetchProduct();
    }

    return () => {
      document.title = 'Tradelistic';
      // Cleanup image previews
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [navigate, id]);

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      const selectedFiles = Array.from(e.target.files);
      const availableSlots = MAX_PRODUCT_IMAGES - imagePreviews.length;

      if (availableSlots <= 0) {
        setError(`You can upload up to ${MAX_PRODUCT_IMAGES} product images.`);
        e.target.value = '';
        return;
      }

      const files = selectedFiles.slice(0, availableSlots);
      if (selectedFiles.length > availableSlots) {
        setError(`Only ${availableSlots} more image${availableSlots === 1 ? '' : 's'} can be added. Maximum is ${MAX_PRODUCT_IMAGES}.`);
      } else {
        setError('');
      }
      
      // Create new previews for new files
      const newPreviews = files.map(file => URL.createObjectURL(file));
      
      // Append new previews without losing previously added new images.
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...files]
      }));
      if (!imagePreviews.length) {
        setMainImage({ type: 'new', index: 0 });
      }
      e.target.value = '';
    } else if (e.target.name === 'category') {
      // When category changes, update available subcategories and reset subcategory
      const newCategory = e.target.value;
      setFormData(prev => ({
        ...prev,
        category: newCategory,
        subcategory: '', // Reset subcategory
      }));
      setAvailableSubcategories(SUBCATEGORY_OPTIONS[newCategory] || []);
    } else {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    }
  };

  const removeImage = (index) => {
    const isOriginalImage = index < originalImages.length;
    
    if (isOriginalImage) {
      // Remove from original images
      const newOriginalImages = originalImages.filter((_, i) => i !== index);
      setOriginalImages(newOriginalImages);
      if (mainImage.type === 'existing') {
        if (mainImage.index === index) setMainImage(newOriginalImages.length ? { type: 'existing', index: 0 } : { type: 'new', index: 0 });
        else if (mainImage.index > index) setMainImage({ type: 'existing', index: mainImage.index - 1 });
      }
    } else {
      // Remove from new images
      const newImageIndex = index - originalImages.length;
      const newImages = Array.from(formData.images).filter((_, i) => i !== newImageIndex);
      setFormData(prev => ({ ...prev, images: newImages }));
      if (mainImage.type === 'new') {
        if (mainImage.index === newImageIndex) setMainImage(originalImages.length ? { type: 'existing', index: 0 } : { type: 'new', index: 0 });
        else if (mainImage.index > newImageIndex) setMainImage({ type: 'new', index: mainImage.index - 1 });
      }
    }
    
    // Update previews
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name.trim() || !formData.description.trim() || !formData.price) {
        throw new Error('Please fill in all required fields');
      }

      if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
        throw new Error('Please enter a valid price');
      }

      if (imagePreviews.length > MAX_PRODUCT_IMAGES) {
        throw new Error(`You can upload up to ${MAX_PRODUCT_IMAGES} product images.`);
      }

      // Create FormData for multipart request
      const productData = new FormData();
      productData.append('name', formData.name.trim());
      productData.append('description', formData.description.trim());
      productData.append('price', parseFloat(formData.price));
      productData.append('category', formData.category);
      productData.append('subcategory', formData.subcategory);

      // Add new images
      formData.images.forEach((image, index) => {
        productData.append(`image_${index}`, image);
      });

      // Keep track of original images to preserve
      const keepImageIds = originalImages.map(img => img.id);
      productData.append('keep_image_ids', JSON.stringify(keepImageIds));
      if (originalImages.some((img) => img.isMainOnly)) {
        productData.append('keep_legacy_main_image', '1');
      }
      if (mainImage.type === 'existing') {
        const selected = originalImages[mainImage.index];
        if (selected?.id) {
          productData.append('main_image_id', selected.id);
        } else if (selected?.isMainOnly) {
          productData.append('main_legacy_image', '1');
        }
      } else {
        productData.append('main_new_image_index', mainImage.index);
      }

      await updateProduct(id, productData);
      
      // Redirect back to exporter store
      navigate('/exporter-store');
      
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStore = () => {
    navigate('/exporter-store');
  };

  if (fetchingProduct) {
    return (
      <div className="edit-product-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Back Button - Top Left Corner */}
      <button onClick={handleBackToStore} className="back-btn-corner">
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="edit-product-container">
        <div className="edit-product-card">
          <div className="edit-product-left">
            <div className="edit-product-header">
              <h2>Edit Product</h2>
              <p>Update your product information and images</p>
            </div>

            <form onSubmit={handleSubmit} className="edit-product-form">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-control"
                  rows="4"
                  placeholder="Describe your product"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (USD) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subcategory">Subcategory *</label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select a subcategory</option>
                  {availableSubcategories.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="images">Product Images</label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  onChange={handleChange}
                  className="form-control"
                  multiple
                  accept="image/*"
                />
                <small className="form-text">Add new images (existing images will be preserved)</small>
                <small className="form-text">{imagePreviews.length}/{MAX_PRODUCT_IMAGES} images selected</small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleBackToStore} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Update Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="edit-product-right">
            <div className="preview-section">
              <h3>Current Images</h3>
              {imagePreviews.length > 0 ? (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className={`image-preview ${mainImage.type === (index < originalImages.length ? 'existing' : 'new') && mainImage.index === (index < originalImages.length ? index : index - originalImages.length) ? 'main-selected' : ''}`}>
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => setMainImage(index < originalImages.length ? { type: 'existing', index } : { type: 'new', index: index - originalImages.length })}
                        className="main-image-btn"
                        title="Make main image"
                      >
                        <i className="fas fa-star"></i>
                        Main
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image-btn"
                        title="Remove image"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      {index < originalImages.length && (
                        <span className="image-label">Original</span>
                      )}
                      {mainImage.type === (index < originalImages.length ? 'existing' : 'new') && mainImage.index === (index < originalImages.length ? index : index - originalImages.length) && (
                        <span className="main-image-label">Main image</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-images">
                  <i className="fas fa-images"></i>
                  <p>No images selected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProduct;
