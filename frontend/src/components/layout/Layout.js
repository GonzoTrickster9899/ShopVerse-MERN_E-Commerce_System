import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export function Header() {
  const { isAuthenticated, user } = useAuth();
  const { cartCount } = useCart();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/shop?keyword=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">Shop<span>Verse</span></Link>
        <nav className="nav-links">
          <Link to="/shop">Shop</Link>
          <Link to="/shop?isFeatured=true">Featured</Link>
          <Link to="/shop?sort=newest">New Arrivals</Link>
        </nav>
        <form className="search-bar" onSubmit={handleSearch}>
          <span>🔍</span>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </form>
        <div className="header-actions">
          {isAuthenticated && <Link to="/wishlist" className="icon-btn" title="Wishlist">♡</Link>}
          <Link to="/cart" className="icon-btn" title="Cart">
            🛒{cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/notifications" className="icon-btn" title="Notifications">🔔</Link>
              <Link to="/profile" className="icon-btn" title="Account" style={{ fontSize: 14, fontWeight: 600 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: 16 }}>Shop<span>Verse</span></div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 300 }}>
              Your Marketplace, Redefined. Discover amazing products at unbeatable prices with free shipping on orders over ₱2,000.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <div className="footer-links">
              <Link to="/shop">All Products</Link>
              <Link to="/shop?isFeatured=true">Featured</Link>
              <Link to="/shop?sort=newest">New Arrivals</Link>
              <Link to="/shop?sort=popularity">Best Sellers</Link>
            </div>
          </div>
          <div>
            <h4>Account</h4>
            <div className="footer-links">
              <Link to="/profile">My Account</Link>
              <Link to="/orders">Orders</Link>
              <Link to="/wishlist">Wishlist</Link>
              <Link to="/cart">Cart</Link>
            </div>
          </div>
          <div>
            <h4>Support</h4>
            <div className="footer-links">
              <a href="#">Help Center</a>
              <a href="#">Shipping Info</a>
              <a href="#">Returns & Refunds</a>
              <a href="#">Contact Us</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ShopVerse. All rights reserved.</span>
          <span>Built with MERN Stack</span>
        </div>
      </div>
    </footer>
  );
}
