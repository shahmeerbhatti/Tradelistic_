import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const isPublicProductRead = (config) => {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  const hasAuthToken = Boolean(localStorage.getItem('token'));
  return method === 'get' && !hasAuthToken && /^\/products\/(?:\d+\/)?(?:\?.*)?$/.test(url);
};

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !isPublicProductRead(config)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Don't set Content-Type for FormData (multipart/form-data)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/users/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (response.data.access) {
            localStorage.setItem('token', response.data.access);
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials) => {
  try {
    const response = await api.post('/users/login/', credentials);
    if (response.data.access) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_type', response.data.user_type);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('is_superadmin', response.data.is_superadmin || 'false');
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const signup = (userData) => api.post('/users/signup/', userData);  // Fixed the endpoint URL
export const getReviewers = () => api.get('/users/reviewers/');
export const getAllProducts = (params = {}) => api.get('/products/', { params });
export const getMyStoreProducts = () => api.get('/products/my_store_products/');
export const getProductById = (id) => api.get(`/products/${id}/`);
export const addProduct = (productData) => {
  const config = {
    headers: {
      'Content-Type': productData instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  };
  return api.post('/products/', productData, config);
};

export const updateProduct = (id, productData) => {
  const config = {
    headers: {
      'Content-Type': productData instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  };
  return api.put(`/products/${id}/`, productData, config);
};

export const deleteProduct = (id) => api.delete(`/products/${id}/`);
export const toggleProductStatus = (id) => api.patch(`/products/${id}/toggle_status/`);
export const getSubcategories = (category) => api.get(`/products/subcategories/?category=${category}`);
export const aiAutofillProduct = (productData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };
  return api.post('/products/ai_autofill/', productData, config);
};
export const aiCreateProduct = (productData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };
  return api.post('/products/ai_create_product/', productData, config);
};

// Store API functions
export const checkStore = () => api.get('/stores/check_store/');
export const createStore = (storeData) => {
  const config = {
    headers: {
      'Content-Type': storeData instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  };
  return api.post('/stores/', storeData, config);
};
export const getStore = () => api.get('/stores/');
export const updateStore = (id, storeData) => {
  const config = {
    headers: {
      'Content-Type': storeData instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  };
  return api.put(`/stores/${id}/`, storeData, config);
};
export const getPublicStore = (storeId) => api.get(`/stores/${storeId}/public_view/`);

// Transaction API functions
export const createSale = (saleData) => {
  const productId = saleData.product_id;
  return api.post(`/products/${productId}/create_sale/`, saleData);
};
export const checkReviewEligibility = (saleId, productId) => 
  api.get(`/transactions/reviews/check_review_eligibility/?sale_id=${saleId}&product_id=${productId}`);
export const checkProductReviewEligibility = (productId) =>
  api.get(`/products/${productId}/review_eligibility/`);
export const createReview = (reviewData) => {
  // Use the product submit_review endpoint instead
  const productId = reviewData.product_id;
  return api.post(`/products/${productId}/submit_review/`, reviewData);
};

// Product Reviews API function
export const getProductReviews = (productId, page = 1, limit = 5) => 
  api.get(`/products/${productId}/reviews/?page=${page}&limit=${limit}`);

// Exporter Dashboard API function
export const getExporterMetrics = () => api.get('/products/exporter_metrics/');
export const getAnalyticsDetails = () => api.get('/products/analytics_details/');

// Favorites API functions
export const addToFavorites = (productId) => api.post(`/products/${productId}/add_favorite/`);
export const removeFromFavorites = (productId) => api.post(`/products/${productId}/remove_favorite/`);
export const getUserFavorites = () => api.get('/products/my_favorites/');

// Cart API functions
export const addToCart = (productId, quantity = 1) => api.post(`/products/${productId}/add_to_cart/`, { quantity });
export const getCart = () => api.get('/products/get_cart/');
export const updateCartItem = (itemId, quantity) => api.post('/products/update_cart_item/', { item_id: itemId, quantity });
export const removeFromCart = (itemId) => api.post('/products/remove_from_cart/', { item_id: itemId });
export const clearCart = () => api.post('/products/clear_cart/');
export const checkout = (paymentData = {}) => api.post('/products/checkout/', paymentData);

// Offers and notifications
export const makeOffer = (productId, offerData) => api.post(`/products/${productId}/make_offer/`, offerData);
export const getOffers = (params = {}) => api.get('/products/offers/', { params });
export const respondOffer = (offerData) => api.post('/products/respond_offer/', offerData);
export const respondImporterOffer = (offerData) => api.post('/products/respond_importer_offer/', offerData);
export const payOffer = (paymentData) => api.post('/products/pay_offer/', paymentData);
export const getNotifications = (params = {}) => api.get('/products/notifications/', { params });
export const markNotificationRead = (notificationId = 'all') => api.post('/products/mark_notification_read/', { notification_id: notificationId });

// Recommendations API
export const getRecommendations = () => api.get('/products/recommendations/');

// Exporter Guide API
export const getExportGuideCountries = () => api.get('/exporter-guides/countries');
export const getExportGuide = (exporterCountryCode) => api.get(`/exporter-guides/${exporterCountryCode}`);
export const getExportGuideReadiness = (exporterCountryCode) => api.get(`/exporter-guides/${exporterCountryCode}/readiness`);

// Super Admin API functions
export const getAdminDashboard = () => api.get('/users/admin/dashboard/');
export const getAdminUsers = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  return api.get(`/users/admin/users/?${params.toString()}`);
};
export const toggleUserStatus = (userId) => api.patch(`/users/admin/users/${userId}/toggle-status/`);
export const getPendingExporters = () => api.get('/users/admin/pending-exporters/');
export const approveExporter = (userId) => api.post(`/users/admin/approve-exporter/${userId}/`);
export const rejectExporter = (userId) => api.post(`/users/admin/reject-exporter/${userId}/`);

// Admin Transaction & Analytics API
export const getAdminTransactions = () => api.get('/transactions/admin/sales/');
export const getTransactionAnalytics = () => api.get('/transactions/admin/analytics/');

// Admin Store Management API
export const toggleStoreStatus = (storeId) => api.patch(`/stores/admin/${storeId}/toggle-status/`);

export default api;
