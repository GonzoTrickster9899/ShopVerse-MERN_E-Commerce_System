import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { productAPI, categoryAPI, orderAPI, reviewAPI, wishlistAPI, notificationAPI, authAPI } from './services/api';
import { Header, Footer } from './components/layout/Layout';
import { ToastContainer, toast, formatPrice, Stars, Spinner, EmptyState } from './components/common/Utilities';
import ProductCard from './components/products/ProductCard';
import './index.css';

// ===== PROTECTED ROUTE =====
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// ===== HOME PAGE =====
function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoryIcons = ['📱','👗','🏠','⚽','💄','📚','🍔','🎮'];

  useEffect(() => {
    Promise.all([productAPI.getFeaturedProducts(), categoryAPI.getCategories()])
      .then(([f, c]) => { setFeatured(f.data.products || []); setCategories(c.data.categories || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container"><div className="hero-content">
          <span className="hero-label">✨ New Season Collection</span>
          <h1>Discover Products That <em>Define</em> Your Style</h1>
          <p>Explore thousands of curated products from top brands. Free shipping over ₱2,000. Use code WELCOME10 for 10% off.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-primary btn-lg">Shop Now →</Link>
            <Link to="/shop?isFeatured=true" className="btn btn-secondary btn-lg">View Featured</Link>
          </div>
        </div></div>
      </section>
      <section className="section"><div className="container">
        <div className="section-header"><h2 className="section-title">Shop by <span>Category</span></h2><Link to="/shop" className="btn btn-ghost">View All →</Link></div>
        <div className="category-grid">{categories.map((cat, i) => (
          <Link to={`/shop?category=${cat._id}`} key={cat._id} className="category-card"><div className="icon">{categoryIcons[i]||'📦'}</div><div className="name">{cat.name}</div></Link>
        ))}</div>
      </div></section>
      <section className="section"><div className="container">
        <div className="section-header"><h2 className="section-title">Featured <span>Products</span></h2><Link to="/shop?isFeatured=true" className="btn btn-ghost">See All →</Link></div>
        {loading ? <Spinner /> : <div className="product-grid">{featured.slice(0,8).map(p => <ProductCard key={p._id} product={p} />)}</div>}
      </div></section>
      <section className="section" style={{background:'linear-gradient(135deg,rgba(233,69,96,0.1),rgba(83,216,251,0.05))'}}>
        <div className="container" style={{textAlign:'center',padding:'40px 0'}}>
          <h2 className="section-title" style={{marginBottom:16}}>Join <span>ShopVerse</span> Today</h2>
          <p style={{color:'var(--text-secondary)',maxWidth:500,margin:'0 auto 24px'}}>Get exclusive deals, early access to sales, and personalized recommendations.</p>
          <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
        </div>
      </section>
    </>
  );
}

// ===== SHOP PAGE =====
function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword')||'', category: searchParams.get('category')||'',
    minPrice: searchParams.get('minPrice')||'', maxPrice: searchParams.get('maxPrice')||'',
    rating: searchParams.get('rating')||'', sort: searchParams.get('sort')||'newest',
    page: parseInt(searchParams.get('page'))||1,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k,v]) => { if(v) params[k]=v; });
      if(searchParams.get('isFeatured')) params.isFeatured='true';
      const {data} = await productAPI.getProducts(params);
      setProducts(data.products||[]); setTotalPages(data.totalPages||1); setTotalProducts(data.totalProducts||0);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [filters, searchParams]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { categoryAPI.getAllFlat().then(r => setCategories(r.data.categories||[])).catch(()=>{}); }, []);

  const updateFilter = (key, value) => {
    const nf = {...filters, [key]:value, page:1}; setFilters(nf);
    const p = new URLSearchParams();
    Object.entries(nf).forEach(([k,v]) => { if(v) p.set(k,v); });
    setSearchParams(p);
  };

  return (
    <div className="page"><div className="container">
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:700}}>{filters.keyword ? `Results for "${filters.keyword}"` : 'All Products'}</h1>
        <p style={{color:'var(--text-muted)',fontSize:14}}>{totalProducts} products found</p>
      </div>
      <div className="shop-layout">
        <aside className="filters-sidebar">
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:24}}>Filters</h3>
          <div className="filter-group"><h4>Category</h4>
            <label className="filter-option" onClick={()=>updateFilter('category','')}><input type="radio" name="cat" checked={!filters.category} readOnly/> All</label>
            {categories.map(c => <label key={c._id} className="filter-option" onClick={()=>updateFilter('category',c._id)}><input type="radio" name="cat" checked={filters.category===c._id} readOnly/> {c.name}</label>)}
          </div>
          <div className="filter-group"><h4>Price Range</h4>
            <div className="price-range">
              <input type="number" placeholder="Min" value={filters.minPrice} onChange={e=>updateFilter('minPrice',e.target.value)} />
              <span>—</span>
              <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e=>updateFilter('maxPrice',e.target.value)} />
            </div>
          </div>
          <div className="filter-group"><h4>Rating</h4>
            {[4,3,2,1].map(r => <label key={r} className="filter-option" onClick={()=>updateFilter('rating',filters.rating===String(r)?'':String(r))}><input type="radio" name="rating" checked={filters.rating===String(r)} readOnly/><Stars rating={r}/><span>& up</span></label>)}
          </div>
          <button className="btn btn-secondary btn-sm btn-block" onClick={()=>{setFilters({keyword:'',category:'',minPrice:'',maxPrice:'',rating:'',sort:'newest',page:1});setSearchParams({});}}>Clear Filters</button>
        </aside>
        <div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
            {[['newest','Latest'],['price_asc','Price ↑'],['price_desc','Price ↓'],['popularity','Popular'],['rating','Top Rated']].map(([s,l])=>
              <button key={s} className={`btn btn-sm ${filters.sort===s?'btn-primary':'btn-secondary'}`} onClick={()=>updateFilter('sort',s)}>{l}</button>
            )}
          </div>
          {loading ? <Spinner /> : products.length===0 ? <EmptyState icon="🔍" title="No products found" message="Try adjusting your filters" /> : (
            <><div className="product-grid">{products.map(p=><ProductCard key={p._id} product={p}/>)}</div>
            {totalPages>1 && <div className="pagination">{Array.from({length:totalPages},(_,i)=><button key={i+1} className={filters.page===i+1?'active':''} onClick={()=>updateFilter('page',i+1)}>{i+1}</button>)}</div>}</>
          )}
        </div>
      </div>
    </div></div>
  );
}

// ===== PRODUCT DETAIL =====
function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [imgIdx, setImgIdx] = useState(0);
  const [rf, setRf] = useState({ rating:5, title:'', comment:'' });

  useEffect(() => {
    setLoading(true);
    productAPI.getProduct(slug).then(({data}) => {
      setProduct(data.product);
      if(data.product?._id) {
        Promise.all([productAPI.getRelatedProducts(data.product._id), reviewAPI.getProductReviews(data.product._id)])
          .then(([r,rv]) => { setRelated(r.data.products||[]); setReviews(rv.data.reviews||[]); });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  const submitReview = async e => {
    e.preventDefault();
    try {
      await reviewAPI.createReview({ product: product._id, ...rf });
      toast.success('Review submitted!');
      const {data} = await reviewAPI.getProductReviews(product._id);
      setReviews(data.reviews||[]);
      setRf({rating:5,title:'',comment:''});
    } catch(e) { toast.error(e.response?.data?.message||'Failed'); }
  };

  if(loading) return <div className="page"><div className="container"><Spinner/></div></div>;
  if(!product) return <div className="page"><div className="container"><EmptyState title="Product not found"/></div></div>;

  const disc = product.compareAtPrice>product.price ? Math.round(((product.compareAtPrice-product.price)/product.compareAtPrice)*100) : 0;

  return (
    <div className="page"><div className="container">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,marginBottom:60}}>
        <div>
          <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'var(--radius)',overflow:'hidden',aspectRatio:'1',marginBottom:12}}>
            <img src={product.images?.[imgIdx]?.url||'https://placehold.co/600x600/1a1a2e/555'} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          </div>
          {product.images?.length>1 && <div style={{display:'flex',gap:8}}>{product.images.map((img,i)=>
            <button key={i} onClick={()=>setImgIdx(i)} style={{width:72,height:72,borderRadius:8,overflow:'hidden',border:i===imgIdx?'2px solid var(--primary)':'2px solid var(--border)',background:'transparent',padding:0,cursor:'pointer'}}><img src={img.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></button>
          )}</div>}
        </div>
        <div>
          {product.brand && <div style={{fontSize:12,textTransform:'uppercase',letterSpacing:2,color:'var(--secondary)',fontWeight:600,marginBottom:8}}>{product.brand}</div>}
          <h1 style={{fontSize:28,fontWeight:700,marginBottom:12}}>{product.name}</h1>
          <div className="rating" style={{marginBottom:16}}><Stars rating={product.ratings} size={16}/><span className="rating-count" style={{fontSize:14}}>{product.ratings} ({product.numReviews} reviews)</span></div>
          <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:20}}>
            <span style={{fontSize:32,fontWeight:800,color:'var(--primary)'}}>{formatPrice(product.price)}</span>
            {disc>0 && <><span style={{fontSize:18,color:'var(--text-muted)',textDecoration:'line-through'}}>{formatPrice(product.compareAtPrice)}</span><span style={{background:'rgba(233,69,96,0.15)',color:'var(--primary)',padding:'4px 10px',borderRadius:20,fontSize:13,fontWeight:700}}>Save {disc}%</span></>}
          </div>
          <p style={{color:'var(--text-secondary)',lineHeight:1.7,marginBottom:24}}>{product.shortDescription||product.description?.substring(0,200)}</p>
          <div style={{marginBottom:20}}><span style={{color:product.stock>0?'var(--success)':'var(--danger)',fontWeight:600,fontSize:14}}>{product.stock>0?`✓ In Stock (${product.stock})`:'✕ Out of Stock'}</span></div>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:24}}>
            <div className="quantity-control"><button onClick={()=>setQty(Math.max(1,qty-1))}>−</button><span>{qty}</span><button onClick={()=>setQty(Math.min(product.stock,qty+1))}>+</button></div>
            <button className="btn btn-primary btn-lg" onClick={()=>{addItem(product,qty);toast.success('Added to cart!');}} disabled={!product.stock} style={{flex:1}}>🛒 Add to Cart — {formatPrice(product.price*qty)}</button>
          </div>
          {product.specifications?.length>0 && <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'var(--radius)',padding:20}}>
            <h4 style={{fontSize:14,marginBottom:12}}>Key Specifications</h4>
            {product.specifications.slice(0,6).map((s,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:14}}><span style={{color:'var(--text-muted)'}}>{s.key}</span><span style={{fontWeight:600}}>{s.value}</span></div>)}
          </div>}
        </div>
      </div>

      <div className="tabs">{['description','specifications','reviews'].map(t=><button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div>
      <div style={{marginBottom:60}}>
        {tab==='description' && <div style={{color:'var(--text-secondary)',lineHeight:1.8,maxWidth:800}}>{product.description}</div>}
        {tab==='specifications' && product.specifications?.map((s,i)=><div key={i} style={{display:'flex',padding:'12px 0',borderBottom:'1px solid var(--border)',fontSize:14,maxWidth:600}}><span style={{width:200,color:'var(--text-muted)',flexShrink:0}}>{s.key}</span><span style={{fontWeight:500}}>{s.value}</span></div>)}
        {tab==='reviews' && <div>
          {isAuthenticated && <form onSubmit={submitReview} style={{background:'rgba(255,255,255,0.03)',padding:24,borderRadius:'var(--radius)',marginBottom:24}}>
            <h4 style={{marginBottom:16}}>Write a Review</h4>
            <div className="form-group"><label>Rating</label><div style={{display:'flex',gap:8}}>{[1,2,3,4,5].map(r=><button key={r} type="button" onClick={()=>setRf({...rf,rating:r})} style={{fontSize:24,background:'transparent',border:'none',color:r<=rf.rating?'#ffc107':'#444',cursor:'pointer'}}>★</button>)}</div></div>
            <div className="form-group"><label>Title</label><input className="form-control" value={rf.title} onChange={e=>setRf({...rf,title:e.target.value})} placeholder="Brief summary"/></div>
            <div className="form-group"><label>Your Review</label><textarea className="form-control" rows={4} required value={rf.comment} onChange={e=>setRf({...rf,comment:e.target.value})} placeholder="Share your experience..."/></div>
            <button type="submit" className="btn btn-primary">Submit Review</button>
          </form>}
          {reviews.length===0 ? <EmptyState title="No reviews yet" message="Be the first to review"/> : reviews.map(r=>(
            <div key={r._id} className="review-card">
              <div className="review-header">
                <div className="review-avatar">{r.user?.firstName?.[0]||'?'}</div>
                <div className="review-meta"><div className="review-author">{r.user?.firstName} {r.user?.lastName}{r.isVerifiedPurchase && <span className="verified-badge" style={{marginLeft:8}}>✓ Verified</span>}</div><div className="review-date">{new Date(r.createdAt).toLocaleDateString()}</div></div>
                <Stars rating={r.rating}/>
              </div>
              {r.title && <h4 style={{fontSize:15,marginBottom:8}}>{r.title}</h4>}
              <p className="review-body">{r.comment}</p>
            </div>
          ))}
        </div>}
      </div>
      {related.length>0 && <section><h2 className="section-title" style={{marginBottom:24}}>Related <span>Products</span></h2><div className="product-grid">{related.slice(0,4).map(p=><ProductCard key={p._id} product={p}/>)}</div></section>}
    </div></div>
  );
}

// ===== CART PAGE =====
function CartPage() {
  const cart = useCart();
  const {items,cartCount,subtotal,shippingCost,discount,tax,total,removeItem,updateQuantity,coupon,applyCoupon,removeCoupon} = cart;
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleCoupon = async () => {
    if(!code.trim()) return;
    try { const {data}=await orderAPI.applyCoupon({code,orderAmount:subtotal}); applyCoupon(data.coupon); toast.success(`Coupon applied! Save ${formatPrice(data.coupon.discount)}`); }
    catch(e) { toast.error(e.response?.data?.message||'Invalid coupon'); }
  };

  if(!items.length) return <div className="page"><div className="container"><EmptyState icon="🛒" title="Your cart is empty" message="Start shopping to add items" action={<Link to="/shop" className="btn btn-primary">Browse Products</Link>}/></div></div>;

  return (
    <div className="page"><div className="container">
      <h1 style={{fontSize:28,fontWeight:700,marginBottom:32}}>Shopping Cart <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:18}}>({cartCount} items)</span></h1>
      <div className="cart-layout">
        <div>{items.map((item,i)=>(
          <div key={`${item._id}-${i}`} className="cart-item">
            <img src={item.image} alt={item.name}/>
            <div className="cart-item-info">
              <Link to={`/product/${item.slug}`}><h4>{item.name}</h4></Link>
              <div className="price">{formatPrice(item.price)}</div>
              <div style={{display:'flex',alignItems:'center',gap:16,marginTop:8}}>
                <div className="quantity-control"><button onClick={()=>updateQuantity(i,item.quantity-1)}>−</button><span>{item.quantity}</span><button onClick={()=>updateQuantity(i,item.quantity+1)}>+</button></div>
                <span style={{color:'var(--text-muted)',fontSize:14}}>{formatPrice(item.price*item.quantity)}</span>
                <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>{removeItem(i);toast.info('Removed');}}>Remove</button>
              </div>
            </div>
          </div>
        ))}</div>
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="coupon-input"><input className="form-control" placeholder="Coupon code" value={code} onChange={e=>setCode(e.target.value)}/><button className="btn btn-secondary btn-sm" onClick={handleCoupon}>Apply</button></div>
          {coupon && <div style={{display:'flex',justifyContent:'space-between',background:'rgba(0,200,83,0.08)',padding:'8px 12px',borderRadius:8,marginBottom:12,fontSize:13}}><span style={{color:'var(--success)'}}>✓ {coupon.code}</span><button className="btn btn-ghost btn-sm" style={{color:'var(--danger)',padding:'4px 8px'}} onClick={removeCoupon}>×</button></div>}
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          {discount>0 && <div className="summary-row"><span>Discount</span><span className="discount">-{formatPrice(discount)}</span></div>}
          <div className="summary-row"><span>Tax (12%)</span><span>{formatPrice(tax)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>{shippingCost===0?'Free':formatPrice(shippingCost)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
          <button className="btn btn-primary btn-lg btn-block" style={{marginTop:20}} onClick={()=>navigate('/checkout')}>Proceed to Checkout</button>
        </div>
      </div>
    </div></div>
  );
}

// ===== CHECKOUT =====
function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const { items, subtotal, shippingCost, discount, tax, total, coupon, shippingMethod, setShipping, clearCart } = useCart();
  const navigate = useNavigate();
  const [sub, setSub] = useState(false);
  const [form, setForm] = useState({ fullName:user?.firstName?`${user.firstName} ${user.lastName}`:'', phone:user?.phone||'', street:'', city:'', state:'', zipCode:'', country:'Philippines', paymentMethod:'cod', guestEmail:'', guestName:'' });

  useEffect(() => {
    if(user?.addresses?.length) {
      const d = user.addresses.find(a=>a.isDefault)||user.addresses[0];
      setForm(p=>({...p,fullName:d.fullName,phone:d.phone,street:d.street,city:d.city,state:d.state,zipCode:d.zipCode,country:d.country}));
    }
  }, [user]);

  const handleSubmit = async e => {
    e.preventDefault(); if(!items.length) return; setSub(true);
    try {
      const od = { items:items.map(i=>({product:i._id,quantity:i.quantity})), shippingAddress:{fullName:form.fullName,phone:form.phone,street:form.street,city:form.city,state:form.state,zipCode:form.zipCode,country:form.country}, paymentMethod:form.paymentMethod, shippingMethod, couponCode:coupon?.code, ...(isAuthenticated?{}:{guestEmail:form.guestEmail,guestName:form.guestName}) };
      const {data} = await orderAPI.createOrder(od);
      clearCart(); toast.success('Order placed!'); navigate(isAuthenticated?`/orders/${data.order._id}`:'/');
    } catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    setSub(false);
  };

  if(!items.length) return <Navigate to="/cart"/>;
  const u = (f,v)=>setForm(p=>({...p,[f]:v}));

  return (
    <div className="page"><div className="container">
      <h1 style={{fontSize:28,fontWeight:700,marginBottom:32}}>Checkout</h1>
      <form onSubmit={handleSubmit}><div className="checkout-layout">
        <div>
          {!isAuthenticated && <div className="checkout-section"><h3>Contact</h3><div className="form-row"><div className="form-group"><label>Name</label><input className="form-control" required value={form.guestName} onChange={e=>u('guestName',e.target.value)}/></div><div className="form-group"><label>Email</label><input className="form-control" type="email" required value={form.guestEmail} onChange={e=>u('guestEmail',e.target.value)}/></div></div></div>}
          <div className="checkout-section"><h3>Shipping Address</h3>
            <div className="form-row"><div className="form-group"><label>Full Name</label><input className="form-control" required value={form.fullName} onChange={e=>u('fullName',e.target.value)}/></div><div className="form-group"><label>Phone</label><input className="form-control" required value={form.phone} onChange={e=>u('phone',e.target.value)}/></div></div>
            <div className="form-group"><label>Street</label><input className="form-control" required value={form.street} onChange={e=>u('street',e.target.value)}/></div>
            <div className="form-row"><div className="form-group"><label>City</label><input className="form-control" required value={form.city} onChange={e=>u('city',e.target.value)}/></div><div className="form-group"><label>State</label><input className="form-control" required value={form.state} onChange={e=>u('state',e.target.value)}/></div></div>
            <div className="form-row"><div className="form-group"><label>Zip</label><input className="form-control" required value={form.zipCode} onChange={e=>u('zipCode',e.target.value)}/></div><div className="form-group"><label>Country</label><input className="form-control" value={form.country} onChange={e=>u('country',e.target.value)}/></div></div>
          </div>
          <div className="checkout-section"><h3>Shipping Method</h3><div className="shipping-options">
            {[['standard','Standard','5-7 days',100],['express','Express','2-3 days',250],['overnight','Overnight','1 day',500],['pickup','Pickup','2 hours',0]].map(([k,l,d,p])=>
              <label key={k} className={`shipping-option ${shippingMethod===k?'selected':''}`}><input type="radio" name="ship" checked={shippingMethod===k} onChange={()=>setShipping(k)}/><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{l}</div><div style={{color:'var(--text-muted)',fontSize:13}}>{d}</div></div><div style={{fontWeight:700,color:p===0?'var(--success)':'inherit'}}>{p===0?'Free':formatPrice(p)}</div></label>
            )}
          </div></div>
          <div className="checkout-section"><h3>Payment</h3><div className="payment-options">
            {[['cod','Cash on Delivery','💵'],['stripe','Card','💳'],['paypal','PayPal','🅿️'],['gcash','GCash','📱']].map(([k,l,ic])=>
              <label key={k} className={`payment-option ${form.paymentMethod===k?'selected':''}`}><input type="radio" name="pay" checked={form.paymentMethod===k} onChange={()=>u('paymentMethod',k)} style={{display:'none'}}/><span className="icon">{ic}</span>{l}</label>
            )}
          </div></div>
        </div>
        <div><div className="cart-summary"><h3>Order Summary</h3>
          {items.map((item,i)=><div key={i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}><img src={item.image} alt="" style={{width:56,height:56,borderRadius:8,objectFit:'cover'}}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{item.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>Qty: {item.quantity}</div></div><div style={{fontWeight:700,fontSize:14}}>{formatPrice(item.price*item.quantity)}</div></div>)}
          <div style={{marginTop:16}}>
            <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {discount>0 && <div className="summary-row"><span>Discount</span><span className="discount">-{formatPrice(discount)}</span></div>}
            <div className="summary-row"><span>Tax</span><span>{formatPrice(tax)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shippingCost===0?'Free':formatPrice(shippingCost)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" style={{marginTop:20}} disabled={sub}>{sub?'Placing...':` Place Order — ${formatPrice(total)}`}</button>
        </div></div>
      </div></form>
    </div></div>
  );
}

// ===== AUTH PAGES =====
function LoginPage() {
  const {login}=useAuth(); const navigate=useNavigate();
  const [form,setForm]=useState({email:'',password:''}); const [ld,setLd]=useState(false);
  const hs = async e => { e.preventDefault(); setLd(true); try { await login(form); toast.success('Welcome back!'); navigate('/'); } catch(e) { toast.error(e.response?.data?.message||'Login failed'); } setLd(false); };
  return <div className="auth-page"><div className="auth-card"><h2>Welcome Back</h2><p className="subtitle">Sign in to your ShopVerse account</p>
    <form onSubmit={hs}><div className="form-group"><label>Email</label><input className="form-control" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@email.com"/></div>
    <div className="form-group"><label>Password</label><input className="form-control" type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••"/></div>
    <div style={{textAlign:'right',marginBottom:20}}><Link to="/forgot-password" style={{fontSize:13,color:'var(--primary)'}}>Forgot Password?</Link></div>
    <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={ld}>{ld?'Signing in...':'Sign In'}</button></form>
    <div className="auth-divider">or</div>
    <p style={{textAlign:'center',fontSize:14,color:'var(--text-muted)'}}>Don't have an account? <Link to="/register" style={{color:'var(--primary)',fontWeight:600}}>Sign Up</Link></p>
  </div></div>;
}

function RegisterPage() {
  const {register}=useAuth(); const navigate=useNavigate();
  const [form,setForm]=useState({firstName:'',lastName:'',email:'',password:'',phone:''}); const [ld,setLd]=useState(false);
  const hs = async e => { e.preventDefault(); setLd(true); try { await register(form); toast.success('Welcome to ShopVerse!'); navigate('/'); } catch(e) { toast.error(e.response?.data?.message||'Registration failed'); } setLd(false); };
  return <div className="auth-page"><div className="auth-card"><h2>Create Account</h2><p className="subtitle">Join ShopVerse for the best shopping experience</p>
    <form onSubmit={hs}><div className="form-row"><div className="form-group"><label>First Name</label><input className="form-control" required value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/></div>
    <div className="form-group"><label>Last Name</label><input className="form-control" required value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/></div></div>
    <div className="form-group"><label>Email</label><input className="form-control" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
    <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+639171234567"/></div>
    <div className="form-group"><label>Password</label><input className="form-control" type="password" required minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 8 characters"/></div>
    <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={ld}>{ld?'Creating...':'Create Account'}</button></form>
    <div className="auth-divider">or</div>
    <p style={{textAlign:'center',fontSize:14,color:'var(--text-muted)'}}>Already have an account? <Link to="/login" style={{color:'var(--primary)',fontWeight:600}}>Sign In</Link></p>
  </div></div>;
}

function ForgotPasswordPage() {
  const [email,setEmail]=useState(''); const [sent,setSent]=useState(false); const [ld,setLd]=useState(false);
  const hs = async e => { e.preventDefault(); setLd(true); try { await authAPI.forgotPassword({email}); setSent(true); } catch(e) { toast.error('Something went wrong'); } setLd(false); };
  if(sent) return <div className="auth-page"><div className="auth-card" style={{textAlign:'center'}}><h2>Check Your Email</h2><p style={{color:'var(--text-secondary)',marginTop:16}}>If an account exists for {email}, we've sent password reset instructions.</p><Link to="/login" className="btn btn-primary" style={{marginTop:24}}>Back to Login</Link></div></div>;
  return <div className="auth-page"><div className="auth-card"><h2>Forgot Password</h2><p className="subtitle">Enter your email to receive a reset link</p>
    <form onSubmit={hs}><div className="form-group"><label>Email</label><input className="form-control" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>
    <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={ld}>{ld?'Sending...':'Send Reset Link'}</button></form>
    <p style={{textAlign:'center',marginTop:20,fontSize:14}}><Link to="/login" style={{color:'var(--text-muted)'}}>← Back to Login</Link></p>
  </div></div>;
}

// ===== ORDERS =====
function OrdersPage() {
  const [orders,setOrders]=useState([]); const [ld,setLd]=useState(true);
  useEffect(() => { orderAPI.getMyOrders().then(r=>setOrders(r.data.orders||[])).catch(console.error).finally(()=>setLd(false)); }, []);
  const statusClass = s => `order-status status-${s}`;
  if(ld) return <div className="page"><div className="container"><Spinner/></div></div>;
  return <div className="page"><div className="container">
    <h1 style={{fontSize:28,fontWeight:700,marginBottom:32}}>My Orders</h1>
    {!orders.length ? <EmptyState icon="📦" title="No orders yet" message="Your order history will appear here" action={<Link to="/shop" className="btn btn-primary">Start Shopping</Link>}/> :
    orders.map(o=>(
      <Link to={`/orders/${o._id}`} key={o._id} className="order-card">
        <div className="order-header"><span className="order-number">#{o.orderNumber}</span><span className={statusClass(o.status)}>{o.status.replace(/_/g,' ').toUpperCase()}</span></div>
        <div style={{display:'flex',gap:12,marginBottom:12}}>{o.items.slice(0,3).map((item,i)=><img key={i} src={item.image} alt="" style={{width:48,height:48,borderRadius:8,objectFit:'cover'}}/>)}{o.items.length>3 && <span style={{fontSize:13,color:'var(--text-muted)',alignSelf:'center'}}>+{o.items.length-3} more</span>}</div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-muted)'}}><span>{new Date(o.createdAt).toLocaleDateString()}</span><span style={{fontWeight:700,color:'var(--text-primary)'}}>{formatPrice(o.totalPrice)}</span></div>
      </Link>
    ))}
  </div></div>;
}

function OrderDetailPage() {
  const {id}=useParams(); const [order,setOrder]=useState(null); const [ld,setLd]=useState(true);
  useEffect(() => { orderAPI.getOrder(id).then(r=>setOrder(r.data.order)).catch(console.error).finally(()=>setLd(false)); }, [id]);
  const handleCancel = async () => { try { await orderAPI.cancelOrder(id,{reason:'Customer request'}); const {data}=await orderAPI.getOrder(id); setOrder(data.order); toast.success('Order cancelled'); } catch(e) { toast.error(e.response?.data?.message||'Failed'); }};
  if(ld) return <div className="page"><div className="container"><Spinner/></div></div>;
  if(!order) return <div className="page"><div className="container"><EmptyState title="Order not found"/></div></div>;
  const statusSteps = ['pending','confirmed','processing','shipped','delivered'];
  const currentIdx = statusSteps.indexOf(order.status);
  return <div className="page"><div className="container">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:32}}>
      <div><h1 style={{fontSize:28,fontWeight:700}}>Order #{order.orderNumber}</h1><p style={{color:'var(--text-muted)',fontSize:14}}>Placed on {new Date(order.createdAt).toLocaleDateString()}</p></div>
      <span className={`order-status status-${order.status}`} style={{fontSize:14,padding:'8px 20px'}}>{order.status.replace(/_/g,' ').toUpperCase()}</span>
    </div>
    {!['cancelled','refunded','returned'].includes(order.status) && <div style={{marginBottom:40}}>
      <h3 style={{marginBottom:20}}>Order Tracking</h3>
      <div className="tracking-timeline">{statusSteps.map((s,i)=>(
        <div key={s} className={`tracking-step ${i<currentIdx?'completed':i===currentIdx?'active':''}`}><div style={{fontWeight:600,fontSize:14,textTransform:'capitalize'}}>{s.replace(/_/g,' ')}</div>
        {order.statusHistory?.find(h=>h.status===s) && <div style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(order.statusHistory.find(h=>h.status===s).timestamp).toLocaleString()}</div>}</div>
      ))}</div>
    </div>}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:32}}>
      <div className="checkout-section"><h3>Shipping Address</h3><p style={{fontSize:14,color:'var(--text-secondary)',lineHeight:1.7}}>{order.shippingAddress?.fullName}<br/>{order.shippingAddress?.street}<br/>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br/>{order.shippingAddress?.phone}</p></div>
      <div className="checkout-section"><h3>Payment</h3><p style={{fontSize:14,color:'var(--text-secondary)'}}><strong>Method:</strong> {order.paymentMethod?.toUpperCase()}<br/><strong>Status:</strong> {order.isPaid?'Paid':'Pending'}<br/><strong>Shipping:</strong> {order.shippingMethod}</p></div>
    </div>
    <div className="checkout-section"><h3>Items</h3>
      {order.items?.map((item,i)=><div key={i} style={{display:'flex',gap:16,padding:'16px 0',borderBottom:'1px solid var(--border)'}}><img src={item.image} alt="" style={{width:72,height:72,borderRadius:8,objectFit:'cover'}}/><div style={{flex:1}}><div style={{fontWeight:600}}>{item.name}</div><div style={{fontSize:13,color:'var(--text-muted)'}}>Qty: {item.quantity}</div></div><div style={{fontWeight:700}}>{formatPrice(item.price*item.quantity)}</div></div>)}
      <div style={{marginTop:16,maxWidth:300,marginLeft:'auto'}}>
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(order.itemsPrice)}</span></div>
        {order.discountAmount>0 && <div className="summary-row"><span>Discount</span><span className="discount">-{formatPrice(order.discountAmount)}</span></div>}
        <div className="summary-row"><span>Tax</span><span>{formatPrice(order.taxPrice)}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{formatPrice(order.shippingPrice)}</span></div>
        <div className="summary-row total"><span>Total</span><span>{formatPrice(order.totalPrice)}</span></div>
      </div>
    </div>
    {['pending','confirmed'].includes(order.status) && <button className="btn btn-outline" style={{marginTop:20,borderColor:'var(--danger)',color:'var(--danger)'}} onClick={handleCancel}>Cancel Order</button>}
  </div></div>;
}

// ===== WISHLIST =====
function WishlistPage() {
  const [items,setItems]=useState([]); const [ld,setLd]=useState(true);
  useEffect(() => { wishlistAPI.getWishlist().then(r=>setItems(r.data.wishlist||[])).catch(console.error).finally(()=>setLd(false)); }, []);
  const remove = async id => { try { await wishlistAPI.removeFromWishlist(id); setItems(prev=>prev.filter(p=>p._id!==id)); toast.info('Removed from wishlist'); } catch(e){} };
  if(ld) return <div className="page"><div className="container"><Spinner/></div></div>;
  return <div className="page"><div className="container">
    <h1 style={{fontSize:28,fontWeight:700,marginBottom:32}}>My Wishlist ({items.length})</h1>
    {!items.length ? <EmptyState icon="♡" title="Your wishlist is empty" message="Save items you love for later" action={<Link to="/shop" className="btn btn-primary">Browse Products</Link>}/> :
    <div className="product-grid">{items.map(p=><div key={p._id} style={{position:'relative'}}><ProductCard product={p}/><button onClick={()=>remove(p._id)} style={{position:'absolute',top:12,right:12,background:'rgba(255,82,82,0.9)',color:'white',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:14}}>×</button></div>)}</div>}
  </div></div>;
}

// ===== NOTIFICATIONS =====
function NotificationsPage() {
  const [notifs,setNotifs]=useState([]); const [ld,setLd]=useState(true);
  useEffect(() => { notificationAPI.getNotifications().then(r=>setNotifs(r.data.notifications||[])).catch(console.error).finally(()=>setLd(false)); }, []);
  const markRead = async id => { await notificationAPI.markAsRead(id); setNotifs(p=>p.map(n=>n._id===id?{...n,isRead:true}:n)); };
  const markAll = async () => { await notificationAPI.markAllAsRead(); setNotifs(p=>p.map(n=>({...n,isRead:true}))); };
  if(ld) return <div className="page"><div className="container"><Spinner/></div></div>;
  return <div className="page"><div className="container">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:32}}>
      <h1 style={{fontSize:28,fontWeight:700}}>Notifications</h1>
      {notifs.some(n=>!n.isRead) && <button className="btn btn-secondary btn-sm" onClick={markAll}>Mark all read</button>}
    </div>
    {!notifs.length ? <EmptyState icon="🔔" title="No notifications" message="You're all caught up!"/> :
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden'}}>
      {notifs.map(n=><div key={n._id} className={`notification-item ${n.isRead?'':'unread'}`} onClick={()=>markRead(n._id)}>
        <div className={`notification-dot ${n.isRead?'read':''}`}></div>
        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{n.title}</div><div style={{fontSize:13,color:'var(--text-muted)'}}>{n.message}</div><div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>{new Date(n.createdAt).toLocaleString()}</div></div>
      </div>)}
    </div>}
  </div></div>;
}

// ===== PROFILE =====
function ProfilePage() {
  const {user,logout,updateUser}=useAuth(); const navigate=useNavigate();
  const [tab,setTab]=useState('profile');
  const [form,setForm]=useState({firstName:user?.firstName||'',lastName:user?.lastName||'',phone:user?.phone||''});
  const [pwForm,setPwForm]=useState({currentPassword:'',newPassword:''});
  const [addrForm,setAddrForm]=useState({label:'Home',fullName:'',phone:'',street:'',city:'',state:'',zipCode:'',country:'Philippines',isDefault:false});
  const [showAddr,setShowAddr]=useState(false);

  const updateProfile = async e => { e.preventDefault(); try { const {data}=await authAPI.updateProfile(form); updateUser(data.user); toast.success('Profile updated'); } catch(e) { toast.error('Failed'); }};
  const updatePw = async e => { e.preventDefault(); try { await authAPI.updatePassword(pwForm); toast.success('Password updated'); setPwForm({currentPassword:'',newPassword:''}); } catch(e) { toast.error(e.response?.data?.message||'Failed'); }};
  const addAddress = async e => { e.preventDefault(); try { const {data}=await authAPI.addAddress(addrForm); updateUser({...user,addresses:data.addresses}); toast.success('Address added'); setShowAddr(false); setAddrForm({label:'Home',fullName:'',phone:'',street:'',city:'',state:'',zipCode:'',country:'Philippines',isDefault:false}); } catch(e) { toast.error('Failed'); }};
  const delAddress = async id => { try { const {data}=await authAPI.deleteAddress(id); updateUser({...user,addresses:data.addresses}); toast.info('Address removed'); } catch(e){} };
  const handleLogout = async () => { await logout(); navigate('/'); toast.info('Logged out'); };

  return <div className="page"><div className="container">
    <h1 style={{fontSize:28,fontWeight:700,marginBottom:32}}>My Account</h1>
    <div className="profile-layout">
      <div className="profile-sidebar">
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'var(--bg-card)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:24,fontWeight:700,color:'var(--primary)'}}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          <div style={{fontWeight:700}}>{user?.firstName} {user?.lastName}</div>
          <div style={{fontSize:13,color:'var(--text-muted)'}}>{user?.email}</div>
        </div>
        <nav className="profile-nav">
          <button className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}>👤 Profile</button>
          <button className={tab==='addresses'?'active':''} onClick={()=>setTab('addresses')}>📍 Addresses</button>
          <button className={tab==='password'?'active':''} onClick={()=>setTab('password')}>🔒 Password</button>
          <Link to="/orders">📦 Orders</Link>
          <Link to="/wishlist">♡ Wishlist</Link>
          <Link to="/notifications">🔔 Notifications</Link>
          <button onClick={handleLogout} style={{color:'var(--danger)'}}>🚪 Logout</button>
        </nav>
      </div>
      <div>
        {tab==='profile' && <div className="checkout-section"><h3>Profile Information</h3>
          <form onSubmit={updateProfile}>
            <div className="form-row"><div className="form-group"><label>First Name</label><input className="form-control" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/></div>
            <div className="form-group"><label>Last Name</label><input className="form-control" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/></div></div>
            <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div className="form-group"><label>Email</label><input className="form-control" value={user?.email} disabled style={{opacity:0.6}}/></div>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </form>
        </div>}
        {tab==='addresses' && <div className="checkout-section"><h3>Shipping Addresses</h3>
          {user?.addresses?.map(a=><div key={a._id} style={{padding:16,border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',marginBottom:12,display:'flex',justifyContent:'space-between'}}>
            <div><div style={{fontWeight:600,fontSize:14}}>{a.label}{a.isDefault && <span style={{background:'rgba(233,69,96,0.15)',color:'var(--primary)',padding:'2px 8px',borderRadius:12,fontSize:11,marginLeft:8}}>Default</span>}</div>
            <div style={{fontSize:13,color:'var(--text-secondary)',marginTop:4}}>{a.fullName}, {a.street}, {a.city}, {a.state} {a.zipCode}</div></div>
            <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>delAddress(a._id)}>Remove</button>
          </div>)}
          {!showAddr ? <button className="btn btn-secondary" onClick={()=>setShowAddr(true)}>+ Add Address</button> :
          <form onSubmit={addAddress} style={{marginTop:16}}>
            <div className="form-row"><div className="form-group"><label>Label</label><input className="form-control" value={addrForm.label} onChange={e=>setAddrForm({...addrForm,label:e.target.value})}/></div>
            <div className="form-group"><label>Full Name</label><input className="form-control" required value={addrForm.fullName} onChange={e=>setAddrForm({...addrForm,fullName:e.target.value})}/></div></div>
            <div className="form-row"><div className="form-group"><label>Phone</label><input className="form-control" required value={addrForm.phone} onChange={e=>setAddrForm({...addrForm,phone:e.target.value})}/></div>
            <div className="form-group"><label>Street</label><input className="form-control" required value={addrForm.street} onChange={e=>setAddrForm({...addrForm,street:e.target.value})}/></div></div>
            <div className="form-row"><div className="form-group"><label>City</label><input className="form-control" required value={addrForm.city} onChange={e=>setAddrForm({...addrForm,city:e.target.value})}/></div>
            <div className="form-group"><label>State</label><input className="form-control" required value={addrForm.state} onChange={e=>setAddrForm({...addrForm,state:e.target.value})}/></div></div>
            <div className="form-row"><div className="form-group"><label>Zip</label><input className="form-control" required value={addrForm.zipCode} onChange={e=>setAddrForm({...addrForm,zipCode:e.target.value})}/></div>
            <div className="form-group"><label>Country</label><input className="form-control" value={addrForm.country} onChange={e=>setAddrForm({...addrForm,country:e.target.value})}/></div></div>
            <div style={{display:'flex',gap:12}}><button type="submit" className="btn btn-primary">Save Address</button><button type="button" className="btn btn-secondary" onClick={()=>setShowAddr(false)}>Cancel</button></div>
          </form>}
        </div>}
        {tab==='password' && <div className="checkout-section"><h3>Change Password</h3>
          <form onSubmit={updatePw}><div className="form-group"><label>Current Password</label><input className="form-control" type="password" required value={pwForm.currentPassword} onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})}/></div>
          <div className="form-group"><label>New Password</label><input className="form-control" type="password" required minLength={8} value={pwForm.newPassword} onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})}/></div>
          <button type="submit" className="btn btn-primary">Update Password</button></form>
        </div>}
      </div>
    </div>
  </div></div>;
}

// ===== APP =====
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastContainer />
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
