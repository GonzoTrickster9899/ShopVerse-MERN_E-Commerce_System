class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Text search
  search() {
    if (this.queryString.keyword) {
      this.query = this.query.find({
        $text: { $search: this.queryString.keyword },
      });
    }
    return this;
  }

  // Filter by various fields
  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['keyword', 'page', 'limit', 'sort', 'fields'];
    excludeFields.forEach((field) => delete queryObj[field]);

    // Category filter
    if (queryObj.category) {
      this.query = this.query.find({ category: queryObj.category });
      delete queryObj.category;
    }

    // Brand filter
    if (queryObj.brand) {
      this.query = this.query.find({ brand: { $in: queryObj.brand.split(',') } });
      delete queryObj.brand;
    }

    // Rating filter
    if (queryObj.rating) {
      this.query = this.query.find({ ratings: { $gte: Number(queryObj.rating) } });
      delete queryObj.rating;
    }

    // Price range filter
    if (queryObj.minPrice || queryObj.maxPrice) {
      const priceFilter = {};
      if (queryObj.minPrice) priceFilter.$gte = Number(queryObj.minPrice);
      if (queryObj.maxPrice) priceFilter.$lte = Number(queryObj.maxPrice);
      this.query = this.query.find({ price: priceFilter });
      delete queryObj.minPrice;
      delete queryObj.maxPrice;
    }

    // In stock filter
    if (queryObj.inStock === 'true') {
      this.query = this.query.find({ stock: { $gt: 0 } });
      delete queryObj.inStock;
    }

    // Featured filter
    if (queryObj.isFeatured) {
      this.query = this.query.find({ isFeatured: queryObj.isFeatured === 'true' });
      delete queryObj.isFeatured;
    }

    // Tags filter
    if (queryObj.tags) {
      this.query = this.query.find({ tags: { $in: queryObj.tags.split(',') } });
      delete queryObj.tags;
    }

    // Active products only (default)
    if (!queryObj.hasOwnProperty('isActive')) {
      this.query = this.query.find({ isActive: true });
    }

    return this;
  }

  // Sort
  sort() {
    if (this.queryString.sort) {
      const sortMapping = {
        'price_asc': { price: 1 },
        'price_desc': { price: -1 },
        'newest': { createdAt: -1 },
        'oldest': { createdAt: 1 },
        'popularity': { totalSold: -1 },
        'rating': { ratings: -1 },
        'name_asc': { name: 1 },
        'name_desc': { name: -1 },
      };
      const sortBy = sortMapping[this.queryString.sort] || { createdAt: -1 };
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort({ createdAt: -1 });
    }
    return this;
  }

  // Field selection
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  // Pagination
  paginate() {
    const page = Math.max(1, parseInt(this.queryString.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(this.queryString.limit) || 12));
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = APIFeatures;
