import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Stars, formatPrice, toast } from '../common/Utilities';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

  return (
    <div className="card product-card">
      <Link to={`/product/${product.slug}`}>
        <div className="image-wrap">
          <img src={product.images?.[0]?.url || 'https://placehold.co/300x300/1a1a2e/555?text=No+Image'} alt={product.name} />
          {discount > 0 && <span className="discount-badge">-{discount}%</span>}
        </div>
      </Link>
      <div className="card-body">
        {product.brand && <div className="brand">{product.brand}</div>}
        <Link to={`/product/${product.slug}`}><div className="product-name">{product.name}</div></Link>
        <div className="price-row">
          <span className="price">{formatPrice(product.price)}</span>
          {product.compareAtPrice > product.price && <span className="old-price">{formatPrice(product.compareAtPrice)}</span>}
        </div>
        <div className="rating" style={{ marginBottom: 12 }}>
          <Stars rating={product.ratings} />
          <span className="rating-count">({product.numReviews})</span>
        </div>
        <button className="btn btn-primary btn-sm btn-block" onClick={(e) => { e.preventDefault(); addItem(product); toast.success('Added to cart!'); }}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
