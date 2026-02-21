const express = require('express');
const router = express.Router();
const {
  createStripeIntent, confirmPayment, createPayPalOrder,
  capturePayPalPayment, stripeWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/confirm', protect, confirmPayment);
router.post('/paypal/create', protect, createPayPalOrder);
router.post('/paypal/capture', protect, capturePayPalPayment);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
