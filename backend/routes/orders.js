const express = require('express');
const router = express.Router();
const {
  createOrder, getOrder, getMyOrders, cancelOrder, requestReturn,
  getOrderTracking, getShippingRates, applyCoupon,
  getAllOrders, updateOrderStatus,
} = require('../controllers/orderController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

router.get('/shipping-rates', getShippingRates);
router.post('/apply-coupon', optionalAuth, applyCoupon);
router.post('/', optionalAuth, createOrder);
router.get('/my-orders', protect, getMyOrders);

// Admin
router.get('/admin/all', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/return', protect, requestReturn);
router.get('/:id/tracking', protect, getOrderTracking);

module.exports = router;
