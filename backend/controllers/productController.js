const Product = require('../models/Product');
const Category = require('../models/Category');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  // Count total matching documents for pagination
  const countQuery = Product.find({ isActive: true });
  
  // Apply same filters for count
  if (req.query.keyword) countQuery.find({ $text: { $search: req.query.keyword } });
  if (req.query.category) countQuery.find({ category: req.query.category });
  if (req.query.brand) countQuery.find({ brand: { $in: req.query.brand.split(',') } });
  if (req.query.rating) countQuery.find({ ratings: { $gte: Number(req.query.rating) } });
  if (req.query.minPrice || req.query.maxPrice) {
    const priceFilter = {};
    if (req.query.minPrice) priceFilter.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) priceFilter.$lte = Number(req.query.maxPrice);
    countQuery.find({ price: priceFilter });
  }
  if (req.query.inStock === 'true') countQuery.find({ stock: { $gt: 0 } });

  const totalProducts = await countQuery.countDocuments();

  const features = new APIFeatures(Product.find(), req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query.populate('category', 'name slug');

  const page = features.page || 1;
  const limit = features.limit || 12;

  res.status(200).json({
    success: true,
    count: products.length,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limit),
    currentPage: page,
    products,
  });
});

// @desc    Get single product by slug
// @route   GET /api/products/:slug
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('seller', 'firstName lastName')
    .populate({
      path: 'reviews',
      match: { isApproved: true },
      populate: { path: 'user', select: 'firstName lastName avatar' },
      options: { sort: { createdAt: -1 }, limit: 10 },
    });

  if (!product) return next(new AppError('Product not found', 404));

  res.status(200).json({ success: true, product });
});

// @desc    Get product by ID
// @route   GET /api/products/id/:id
exports.getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('seller', 'firstName lastName');

  if (!product) return next(new AppError('Product not found', 404));

  res.status(200).json({ success: true, product });
});

// @desc    Get related products
// @route   GET /api/products/:id/related
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(200).json({ success: true, products: [] });

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [
      { category: product.category },
      { brand: product.brand },
      { tags: { $in: product.tags } },
    ],
  })
    .limit(8)
    .populate('category', 'name slug');

  res.status(200).json({ success: true, products: relatedProducts });
});

// @desc    Get featured products
// @route   GET /api/products/featured
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .limit(12)
    .populate('category', 'name slug');

  res.status(200).json({ success: true, products });
});

// @desc    Get top rated products
// @route   GET /api/products/top-rated
exports.getTopRatedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, numReviews: { $gte: 1 } })
    .sort({ ratings: -1 })
    .limit(12)
    .populate('category', 'name slug');

  res.status(200).json({ success: true, products });
});

// @desc    Get product brands for filter
// @route   GET /api/products/brands
exports.getBrands = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;

  const brands = await Product.distinct('brand', { ...filter, isActive: true, brand: { $ne: null } });
  res.status(200).json({ success: true, brands: brands.filter(Boolean).sort() });
});

// @desc    Get price range for filter
// @route   GET /api/products/price-range
exports.getPriceRange = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;

  const result = await Product.aggregate([
    { $match: filter },
    { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
  ]);

  const range = result[0] || { minPrice: 0, maxPrice: 10000 };
  res.status(200).json({ success: true, ...range });
});

// @desc    Compare products
// @route   POST /api/products/compare
exports.compareProducts = asyncHandler(async (req, res, next) => {
  const { productIds } = req.body;
  if (!productIds || productIds.length < 2 || productIds.length > 4) {
    return next(new AppError('Please select 2-4 products to compare', 400));
  }

  const products = await Product.find({ _id: { $in: productIds }, isActive: true })
    .populate('category', 'name');

  res.status(200).json({ success: true, products });
});

// ===== ADMIN ROUTES =====

// @desc    Create product
// @route   POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  req.body.seller = req.user.id;

  // Handle image uploads
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file, index) => ({
      url: `/uploads/${file.filename}`,
      public_id: file.filename,
      isPrimary: index === 0,
    }));
  }

  // Parse specifications and variants if sent as JSON strings
  if (typeof req.body.specifications === 'string') {
    req.body.specifications = JSON.parse(req.body.specifications);
  }
  if (typeof req.body.variants === 'string') {
    req.body.variants = JSON.parse(req.body.variants);
  }
  if (typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags.split(',').map((t) => t.trim());
  }

  const product = await Product.create(req.body);

  res.status(201).json({ success: true, product, message: 'Product created' });
});

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  // Handle new images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      public_id: file.filename,
    }));
    req.body.images = [...(product.images || []), ...newImages];
  }

  if (typeof req.body.specifications === 'string') {
    req.body.specifications = JSON.parse(req.body.specifications);
  }
  if (typeof req.body.variants === 'string') {
    req.body.variants = JSON.parse(req.body.variants);
  }
  if (typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags.split(',').map((t) => t.trim());
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, product, message: 'Product updated' });
});

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  product.isActive = false;
  await product.save();

  res.status(200).json({ success: true, message: 'Product deleted' });
});
