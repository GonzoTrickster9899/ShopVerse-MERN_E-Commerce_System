const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/email');

// Shipping rates
const SHIPPING_RATES = {
  standard: { price: 100, days: '5-7 business days' },
  express: { price: 250, days: '2-3 business days' },
  overnight: { price: 500, days: '1 business day' },
  pickup: { price: 0, days: 'Ready in 2 hours' },
};

const TAX_RATE = 0.12; // 12% VAT

// @desc    Create order
// @route   POST /api/orders
exports.createOrder = asyncHandler(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    shippingMethod = 'standard',
    couponCode,
    notes,
    guestEmail,
    guestName,
  } = req.body;

  if (!items || items.length === 0) return next(new AppError('No order items', 400));

  // Validate and calculate prices
  let itemsPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) return next(new AppError(`Product not found: ${item.product}`, 404));
    if (!product.isActive) return next(new AppError(`Product ${product.name} is no longer available`, 400));
    if (product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400));
    }

    const price = product.price;
    itemsPrice += price * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || '/images/placeholder.png',
      price,
      quantity: item.quantity,
      variant: item.variant,
    });
  }

  // Apply coupon
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) return next(new AppError('Invalid coupon code', 400));

    const validation = coupon.isValid(req.user?.id, itemsPrice);
    if (!validation.valid) return next(new AppError(validation.message, 400));

    discountAmount = coupon.calculateDiscount(itemsPrice);

    // Record coupon usage
    coupon.usedCount += 1;
    coupon.usedBy.push({ user: req.user?.id });
    await coupon.save();
  }

  // Calculate totals
  const shippingPrice = SHIPPING_RATES[shippingMethod]?.price || SHIPPING_RATES.standard.price;
  const taxableAmount = itemsPrice - discountAmount;
  const taxPrice = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const totalPrice = Math.round((taxableAmount + taxPrice + shippingPrice) * 100) / 100;

  // Estimate delivery
  const deliveryDays = shippingMethod === 'express' ? 3 : shippingMethod === 'overnight' ? 1 : 7;
  const estimatedDelivery = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);

  const order = await Order.create({
    user: req.user?.id || undefined,
    guestEmail,
    guestName,
    items: orderItems,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    shippingMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountAmount,
    totalPrice,
    couponCode,
    estimatedDelivery,
    notes,
    isPaid: paymentMethod === 'cod' ? false : false,
    status: 'pending',
  });

  // Update product stock and sold count
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, totalSold: item.quantity },
    });
  }

  // Send confirmation email
  try {
    const userInfo = req.user || { firstName: guestName, email: guestEmail };
    const template = emailTemplates.orderConfirmation(userInfo, order);
    await sendEmail({ to: req.user?.email || guestEmail, ...template });
  } catch (err) {
    console.error('Order email error:', err);
  }

  // Create notification
  if (req.user) {
    await Notification.create({
      user: req.user.id,
      type: 'order_placed',
      title: 'Order Placed Successfully!',
      message: `Your order #${order.orderNumber} has been placed. Total: ₱${totalPrice.toLocaleString()}`,
      data: { orderId: order._id, orderNumber: order.orderNumber },
    });
  }

  res.status(201).json({
    success: true,
    order,
    message: 'Order placed successfully!',
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');

  if (!order) return next(new AppError('Order not found', 404));

  // Ensure user owns the order or is admin
  if (req.user.role !== 'admin' && order.user?._id.toString() !== req.user.id) {
    return next(new AppError('Not authorized to view this order', 403));
  }

  res.status(200).json({ success: true, order });
});

// @desc    Get my orders
// @route   GET /api/orders/my-orders
exports.getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    orders,
    totalOrders: total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  if (order.user?.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 403));
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }

  order.status = 'cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, totalSold: -item.quantity },
    });
  }

  // Notify
  if (order.user) {
    await Notification.create({
      user: order.user,
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} has been cancelled.`,
      data: { orderId: order._id },
    });
  }

  res.status(200).json({ success: true, order, message: 'Order cancelled' });
});

// @desc    Request return/refund
// @route   PUT /api/orders/:id/return
exports.requestReturn = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));
  if (order.user?.toString() !== req.user.id) return next(new AppError('Not authorized', 403));
  if (order.status !== 'delivered') return next(new AppError('Only delivered orders can be returned', 400));

  // Check if within return window (7 days)
  const daysSinceDelivery = (Date.now() - order.deliveredAt) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 7) return next(new AppError('Return window has expired (7 days)', 400));

  order.status = 'returned';
  order.returnReason = req.body.reason;
  await order.save();

  res.status(200).json({ success: true, order, message: 'Return request submitted' });
});

// @desc    Get order tracking
// @route   GET /api/orders/:id/tracking
exports.getOrderTracking = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).select(
    'orderNumber status statusHistory trackingNumber trackingUrl estimatedDelivery shippingMethod'
  );

  if (!order) return next(new AppError('Order not found', 404));

  res.status(200).json({ success: true, tracking: order });
});

// @desc    Get shipping rates
// @route   GET /api/orders/shipping-rates
exports.getShippingRates = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, rates: SHIPPING_RATES });
});

// @desc    Apply coupon
// @route   POST /api/orders/apply-coupon
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { code, orderAmount } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) return next(new AppError('Invalid coupon code', 400));

  const validation = coupon.isValid(req.user?.id, orderAmount);
  if (!validation.valid) return next(new AppError(validation.message, 400));

  const discount = coupon.calculateDiscount(orderAmount);

  res.status(200).json({
    success: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      description: coupon.description,
    },
  });
});

// ===== ADMIN ROUTES =====

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  // Revenue stats
  const stats = await Order.aggregate([
    { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$totalPrice' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    orders,
    totalOrders: total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    stats: stats[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
  });
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  const { status, trackingNumber, trackingUrl, note } = req.body;

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  if (status === 'shipped' || status === 'delivered') {
    order.isPaid = true;
    order.paidAt = order.paidAt || new Date();
  }

  if (status === 'refunded') {
    order.refundAmount = order.totalPrice;
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }
  }

  order.statusHistory.push({
    status,
    note,
    updatedBy: req.user.id,
    timestamp: new Date(),
  });

  await order.save();

  // Send notification
  if (order.user) {
    await Notification.create({
      user: order.user,
      type: `order_${status}`,
      title: `Order ${status.replace(/_/g, ' ')}`,
      message: `Your order #${order.orderNumber} is now ${status.replace(/_/g, ' ')}.`,
      data: { orderId: order._id, orderNumber: order.orderNumber },
    });

    // Send email
    try {
      const User = require('../models/User');
      const user = await User.findById(order.user);
      if (user) {
        const template = emailTemplates.orderStatusUpdate(user, order);
        await sendEmail({ to: user.email, ...template });
      }
    } catch (err) {
      console.error('Status update email error:', err);
    }
  }

  res.status(200).json({ success: true, order, message: `Order status updated to ${status}` });
});
