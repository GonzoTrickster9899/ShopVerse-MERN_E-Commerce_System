const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 200 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: [true, 'Description is required'], maxlength: 5000 },
    shortDescription: { type: String, maxlength: 500 },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    images: [
      {
        public_id: String,
        url: { type: String, required: true },
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: { type: String, trim: true, index: true },
    tags: [{ type: String, trim: true }],
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    variants: [
      {
        name: { type: String, required: true },
        options: [
          {
            label: String,
            value: String,
            priceModifier: { type: Number, default: 0 },
            stock: { type: Number, default: 0 },
            sku: String,
          },
        ],
      },
    ],
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    sku: { type: String, unique: true, sparse: true },
    weight: { type: Number, min: 0 },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' },
    },
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDigital: { type: Boolean, default: false },
    seoTitle: String,
    seoDescription: String,
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'free', 'heavy'],
      default: 'standard',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for search and filtering
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
productSchema.index({ price: 1, ratings: -1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ totalSold: -1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Virtual for in stock status
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Virtual for low stock
productSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Generate slug before saving
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  next();
});

// Virtual populate reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});

module.exports = mongoose.model('Product', productSchema);
