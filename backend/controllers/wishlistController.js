const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errorHandler');

// @desc    Get wishlist
// @route   GET /api/wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'wishlist',
    select: 'name slug price compareAtPrice images ratings numReviews stock',
    match: { isActive: true },
  });

  res.status(200).json({ success: true, wishlist: user.wishlist });
});

// @desc    Add to wishlist
// @route   POST /api/wishlist/:productId
exports.addToWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.wishlist.includes(req.params.productId)) {
    return next(new AppError('Product already in wishlist', 400));
  }

  user.wishlist.push(req.params.productId);
  await user.save();

  res.status(200).json({ success: true, wishlistCount: user.wishlist.length, message: 'Added to wishlist' });
});

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:productId
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();

  res.status(200).json({ success: true, wishlistCount: user.wishlist.length, message: 'Removed from wishlist' });
});

// @desc    Check if in wishlist
// @route   GET /api/wishlist/check/:productId
exports.checkWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const isInWishlist = user.wishlist.includes(req.params.productId);
  res.status(200).json({ success: true, isInWishlist });
});
