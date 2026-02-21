const Category = require('../models/Category');
const Product = require('../models/Product');
const { AppError, asyncHandler } = require('../utils/errorHandler');

// @desc    Get all categories
// @route   GET /api/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate({ path: 'subcategories', match: { isActive: true } })
    .sort({ sortOrder: 1, name: 1 });

  // Build tree structure
  const rootCategories = categories.filter((cat) => !cat.parent);

  res.status(200).json({ success: true, categories: rootCategories });
});

// @desc    Get all categories flat
// @route   GET /api/categories/all
exports.getAllCategoriesFlat = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, categories });
});

// @desc    Get category by slug
// @route   GET /api/categories/:slug
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate({ path: 'subcategories', match: { isActive: true } });

  if (!category) return next(new AppError('Category not found', 404));

  // Get product count
  const productCount = await Product.countDocuments({ category: category._id, isActive: true });

  res.status(200).json({ success: true, category, productCount });
});

// @desc    Create category (Admin)
// @route   POST /api/categories
exports.createCategory = asyncHandler(async (req, res) => {
  if (req.body.parent) {
    const parentCat = await Category.findById(req.body.parent);
    if (parentCat) req.body.level = parentCat.level + 1;
  }

  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category, message: 'Category created' });
});

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) return next(new AppError('Category not found', 404));

  res.status(200).json({ success: true, category, message: 'Category updated' });
});

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));

  // Check for products in this category
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return next(new AppError(`Cannot delete: ${productCount} products in this category`, 400));
  }

  // Check for subcategories
  const subCount = await Category.countDocuments({ parent: category._id });
  if (subCount > 0) {
    return next(new AppError('Cannot delete: category has subcategories', 400));
  }

  category.isActive = false;
  await category.save();

  res.status(200).json({ success: true, message: 'Category deleted' });
});
