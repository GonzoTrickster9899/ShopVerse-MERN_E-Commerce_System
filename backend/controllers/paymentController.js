const Order = require('../models/Order');
const { AppError, asyncHandler } = require('../utils/errorHandler');

// @desc    Create Stripe payment intent
// @route   POST /api/payments/stripe/create-intent
exports.createStripeIntent = asyncHandler(async (req, res, next) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100), // Stripe uses cents
    currency: 'php',
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
  });

  res.status(200).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
exports.confirmPayment = asyncHandler(async (req, res, next) => {
  const { orderId, paymentId, status } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));

  if (status === 'succeeded') {
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'confirmed';
    order.paymentResult = {
      id: paymentId,
      status: 'completed',
      updateTime: new Date().toISOString(),
    };
    await order.save();
  }

  res.status(200).json({ success: true, order });
});

// @desc    PayPal create order
// @route   POST /api/payments/paypal/create
exports.createPayPalOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));

  // In production, integrate with PayPal SDK
  // For now, return mock data
  res.status(200).json({
    success: true,
    paypalOrderId: `PAYPAL-${order.orderNumber}`,
    approveUrl: `https://www.sandbox.paypal.com/checkoutnow?token=MOCK`,
  });
});

// @desc    PayPal capture payment
// @route   POST /api/payments/paypal/capture
exports.capturePayPalPayment = asyncHandler(async (req, res, next) => {
  const { orderId, paypalOrderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));

  // In production, verify with PayPal API
  order.isPaid = true;
  order.paidAt = new Date();
  order.status = 'confirmed';
  order.paymentResult = {
    id: paypalOrderId,
    status: 'completed',
    updateTime: new Date().toISOString(),
  };
  await order.save();

  res.status(200).json({ success: true, order });
});

// @desc    Stripe webhook handler
// @route   POST /api/payments/stripe/webhook
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const order = await Order.findById(paymentIntent.metadata.orderId);
      if (order) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'confirmed';
        order.paymentResult = {
          id: paymentIntent.id,
          status: 'completed',
          updateTime: new Date().toISOString(),
        };
        await order.save();
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object;
      console.error('Payment failed:', failedIntent.id);
      break;
    }
  }

  res.status(200).json({ received: true });
});
