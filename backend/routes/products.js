const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, getProductById, getRelatedProducts,
  getFeaturedProducts, getTopRatedProducts, getBrands, getPriceRange,
  compareProducts, createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/top-rated', getTopRatedProducts);
router.get('/brands', getBrands);
router.get('/price-range', getPriceRange);
router.post('/compare', compareProducts);
router.get('/id/:id', getProductById);
router.get('/:id/related', getRelatedProducts);
router.get('/:slug', getProduct);

// Admin routes
router.post('/', protect, authorize('admin', 'seller'), upload.array('images', 10), createProduct);
router.put('/:id', protect, authorize('admin', 'seller'), upload.array('images', 10), updateProduct);
router.delete('/:id', protect, authorize('admin', 'seller'), deleteProduct);

module.exports = router;
