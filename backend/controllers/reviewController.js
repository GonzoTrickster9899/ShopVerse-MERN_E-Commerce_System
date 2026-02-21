const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { AppError, asyncHandler } = require('../utils/errorHandler');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
exports.getProductReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { product: req.params.productId, isApproved: true };
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1 },
    lowest: { rating: 1 },
    helpful: { helpfulCount: -1 },
  };
  const sort = sortOptions[req.query.sort] || sortOptions.newest;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  // Rating distribution
  const distribution = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  const ratingDistribution = {};
  for (let i = 5; i >= 1; i--) {
    const found = distribution.find((d) => d._id === i);
    ratingDistribution[i] = found ? found.count : 0;
  }

  res.status(200).json({
    success: true,
    reviews,
    totalReviews: total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    ratingDistribution,
  });
});

// @desc    Create review
// @route   POST /api/reviews
exports.createReview = asyncHandler(async (req, res, next) => {
  const { product: productId, rating, title, comment } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) return next(new AppError('Product not found', 404));

  // Check if already reviewed
  const existingReview = await Review.findOne({ user: req.user.id, product: productId });
  if (existingReview) return next(new AppError('You have already reviewed this product', 400));

  // Check if verified purchase
  const hasPurchased = await Order.findOne({
    user: req.user.id,
    'items.product': productId,
    status: 'delivered',
  });

  const reviewData = {
    user: req.user.id,
    product: productId,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!hasPurchased,
  };

  // Handle image uploads
  if (req.files && req.files.length > 0) {
    reviewData.images = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      public_id: file.filename,
    }));
  }

  const review = await Review.create(reviewData);
  await review.populate('user', 'firstName lastName avatar');

  res.status(201).json({ success: true, review, message: 'Review submitted' });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));
  if (review.user.toString() !== req.user.id) return next(new AppError('Not authorized', 403));

  const { rating, title, comment } = req.body;
  review.rating = rating || review.rating;
  review.title = title || review.title;
  review.comment = comment || review.comment;

  await review.save();
  await review.populate('user', 'firstName lastName avatar');

  res.status(200).json({ success: true, review, message: 'Review updated' });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 403));
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: 'Review deleted' });
});

// @desc    Mark review helpful
// @route   PUT /api/reviews/:id/helpful
exports.markHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));

  const alreadyVoted = review.helpfulVoters.includes(req.user.id);
  if (alreadyVoted) {
    review.helpfulVoters.pull(req.user.id);
    review.helpfulCount -= 1;
  } else {
    review.helpfulVoters.push(req.user.id);
    review.helpfulCount += 1;
  }

  await review.save();

  res.status(200).json({ success: true, helpfulCount: review.helpfulCount });
});

// @desc    Report review
// @route   POST /api/reviews/:id/report
exports.reportReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));

  const alreadyReported = review.reportReasons.find(
    (r) => r.user.toString() === req.user.id
  );
  if (alreadyReported) return next(new AppError('You already reported this review', 400));

  review.reportReasons.push({
    user: req.user.id,
    reason: req.body.reason,
  });

  if (review.reportReasons.length >= 3) {
    review.isReported = true;
    review.isApproved = false;
  }

  await review.save();

  res.status(200).json({ success: true, message: 'Review reported' });
});
