import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ==========
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  addAddress: (data) => api.post('/auth/addresses', data),
  updateAddress: (id, data) => api.put(`/auth/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
};

// ========== PRODUCTS ==========
export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (slug) => api.get(`/products/${slug}`),
  getProductById: (id) => api.get(`/products/id/${id}`),
  getRelatedProducts: (id) => api.get(`/products/${id}/related`),
  getFeaturedProducts: () => api.get('/products/featured'),
  getTopRated: () => api.get('/products/top-rated'),
  getBrands: (params) => api.get('/products/brands', { params }),
  getPriceRange: (params) => api.get('/products/price-range', { params }),
  compareProducts: (productIds) => api.post('/products/compare', { productIds }),
};

// ========== CATEGORIES ==========
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  getAllFlat: () => api.get('/categories/all'),
  getCategory: (slug) => api.get(`/categories/${slug}`),
};

// ========== ORDERS ==========
export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, data) => api.put(`/orders/${id}/cancel`, data),
  requestReturn: (id, data) => api.put(`/orders/${id}/return`, data),
  getTracking: (id) => api.get(`/orders/${id}/tracking`),
  getShippingRates: () => api.get('/orders/shipping-rates'),
  applyCoupon: (data) => api.post('/orders/apply-coupon', data),
};

// ========== REVIEWS ==========
export const reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (data) => api.post('/reviews', data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.put(`/reviews/${id}/helpful`),
  reportReview: (id, data) => api.post(`/reviews/${id}/report`, data),
};

// ========== WISHLIST ==========
export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (productId) => api.post(`/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  checkWishlist: (productId) => api.get(`/wishlist/check/${productId}`),
};

// ========== NOTIFICATIONS ==========
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// ========== PAYMENTS ==========
export const paymentAPI = {
  createStripeIntent: (data) => api.post('/payments/stripe/create-intent', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),
};

export default api;
