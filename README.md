# 🛍️ ShopVerse — MERN E-Commerce System

A full-featured e-commerce platform built with the **MERN Stack** (MongoDB, Express.js, React, Node.js). Includes customer authentication, product browsing with advanced filters, shopping cart, multi-payment checkout, order management, reviews, wishlists, notifications, and an admin panel.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Environment Variables](#environment-variables)
7. [Database Seeding](#database-seeding)
8. [Running the Application](#running-the-application)
9. [API Documentation](#api-documentation)
10. [Payment Integration](#payment-integration)
11. [Deployment (Production)](#deployment-production)
12. [Test Accounts](#test-accounts)

---

## ✨ Features

### 🔐 Authentication & Profile
- User registration (email, phone)
- Login / Logout with JWT tokens
- Forgot / Reset password (email-based)
- Email verification tokens
- Profile management (name, phone, avatar)
- Multiple shipping addresses with default selection
- Account dashboard
- Account lockout after 5 failed attempts

### 🔍 Product Browsing
- Browse by category (hierarchical with subcategories)
- Full-text search (keyword, multi-field)
- Filtering: price range, category, ratings, brand, stock, tags
- Sorting: price (asc/desc), popularity, newest, rating
- Product comparison (2-4 products)
- Pagination with configurable page size

### 📦 Product Details
- Image gallery with thumbnail navigation
- Full description & short description
- Specifications table
- Stock availability & low-stock indicator
- Prices with discount display & percentage
- Variants (color, size, etc.) with per-variant stock
- Ratings & reviews section
- Related products

### ❤️ Wishlist & Favorites
- Add/remove from wishlist
- View wishlist page
- Persistent wishlist (server-side for logged-in users)

### 🛒 Shopping Cart
- Add/remove products with quantity control
- Persistent cart (localStorage)
- Apply coupon codes (percentage & fixed)
- Real-time shipping fee calculation
- Order summary with subtotal, tax, discount, shipping, total

### 💳 Checkout
- Guest checkout & registered checkout
- Billing & shipping address forms
- Auto-fill from saved addresses
- Shipping method selection (standard, express, overnight, pickup)
- Payment method selection

### 💰 Payment Integration
- Cash on Delivery (COD)
- Stripe (credit/debit cards) — webhook-ready
- PayPal — order creation & capture flow
- GCash placeholder
- Extensible payment gateway architecture

### 📦 Order Management
- Order placement with automatic number generation
- Order tracking with status timeline
- Order history with filtering
- Cancel orders (before shipping)
- Return/refund requests (within 7-day window)
- Status history log

### ⭐ Reviews & Ratings
- Star rating (1-5)
- Written reviews with titles
- Verified purchase badges
- Helpful vote system
- Report inappropriate reviews
- Auto-calculate product average ratings

### 🔔 Notifications
- In-app notification center
- Order status update notifications
- Mark as read / mark all read
- Email notifications (order confirmation, shipping, etc.)
- Extensible for SMS and push

### 🛡️ Admin Features
- Product CRUD with image uploads
- Category management
- Order status updates
- Revenue statistics
- Coupon management

---

## 🛠️ Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 18, React Router 6, Axios, CSS3         |
| Backend   | Node.js, Express.js 4                         |
| Database  | MongoDB with Mongoose 8                       |
| Auth      | JWT (JSON Web Tokens), bcrypt                 |
| Payments  | Stripe, PayPal (extensible)                   |
| Email     | Nodemailer                                    |
| Upload    | Multer (local), Cloudinary (production)       |
| Security  | Helmet, CORS, Rate Limiting, Input Validation |

---

## 📁 Project Structure

```
ecommerce-mern/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Auth & profile
│   │   ├── productController.js  # Product CRUD & search
│   │   ├── categoryController.js # Category management
│   │   ├── orderController.js    # Orders & checkout
│   │   ├── reviewController.js   # Reviews & ratings
│   │   ├── wishlistController.js # Wishlist
│   │   ├── notificationController.js
│   │   └── paymentController.js  # Stripe/PayPal
│   ├── middleware/
│   │   ├── auth.js               # JWT & role middleware
│   │   └── upload.js             # File upload config
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Product.js            # Product schema
│   │   ├── Category.js           # Category schema
│   │   ├── Order.js              # Order schema
│   │   ├── Review.js             # Review schema
│   │   ├── Coupon.js             # Coupon schema
│   │   └── Notification.js       # Notification schema
│   ├── routes/                   # Express route files
│   ├── utils/
│   │   ├── errorHandler.js       # Error handling
│   │   ├── email.js              # Email templates
│   │   ├── apiFeatures.js        # Filter/sort/paginate
│   │   └── seeder.js             # Database seeder
│   ├── server.js                 # Express app entry
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/Utilities.js    # Toast, Stars, Spinner
│   │   │   ├── layout/Layout.js       # Header, Footer
│   │   │   └── products/ProductCard.js
│   │   ├── context/
│   │   │   ├── AuthContext.js    # Authentication state
│   │   │   └── CartContext.js    # Shopping cart state
│   │   ├── services/
│   │   │   └── api.js            # Axios API client
│   │   ├── App.js                # Routes & all pages
│   │   ├── index.js
│   │   └── index.css             # Global styles
│   └── package.json
└── README.md
```

---

## 📋 Prerequisites

Make sure you have these installed:

- **Node.js** >= 18.x — [Download](https://nodejs.org/)
- **MongoDB** >= 6.0 — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- **npm** >= 9.x (comes with Node.js)
- **Git** (optional)

---

## 🚀 Installation & Setup

### Step 1: Clone / Download the Project

```bash
# If using git
git clone <your-repo-url>
cd ecommerce-mern

# Or extract the ZIP and cd into the folder
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 4: Configure Environment Variables

```bash
cd ../backend
cp .env.example .env
```

Edit `.env` with your actual values (see section below).

---

## 🔑 Environment Variables

Edit `backend/.env`:

```env
# Required
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/shopverse
JWT_SECRET=your_super_secret_key_min_32_chars_long
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
CLIENT_URL=http://localhost:3000

# Email (optional in dev - logs to console)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@shopverse.com
FROM_NAME=ShopVerse

# Stripe (optional - for card payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (optional)
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
```

**For Gmail SMTP:** Enable 2FA on your Google account, then create an [App Password](https://myaccount.google.com/apppasswords).

**For Stripe:** Get test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).

---

## 🌱 Database Seeding

Seed the database with sample data (categories, products, users, coupons):

```bash
cd backend
npm run seed
```

This creates:
- **Admin:** `admin@shopverse.com` / `admin123456`
- **User:** `juan@test.com` / `test123456`
- 6 categories + 5 subcategories
- 12 sample products (electronics, fashion, beauty, etc.)
- 3 coupon codes: `WELCOME10`, `SAVE500`, `FREESHIP`

---

## ▶️ Running the Application

### Development Mode (2 terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# React app opens at http://localhost:3000
```

### Quick Start (both at once)

Install `concurrently` in root:
```bash
npm install -g concurrently

# From project root
concurrently "cd backend && npm run dev" "cd frontend && npm start"
```

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

### Authentication
| Method | Endpoint                      | Description            | Auth |
|--------|-------------------------------|------------------------|------|
| POST   | /auth/register                | Register new user      | No   |
| POST   | /auth/login                   | Login                  | No   |
| POST   | /auth/logout                  | Logout                 | Yes  |
| GET    | /auth/me                      | Get current user       | Yes  |
| PUT    | /auth/update-profile          | Update profile         | Yes  |
| PUT    | /auth/update-password         | Change password        | Yes  |
| POST   | /auth/forgot-password         | Request reset email    | No   |
| PUT    | /auth/reset-password/:token   | Reset password         | No   |
| GET    | /auth/verify-email/:token     | Verify email           | No   |
| POST   | /auth/addresses               | Add address            | Yes  |
| PUT    | /auth/addresses/:id           | Update address         | Yes  |
| DELETE | /auth/addresses/:id           | Delete address         | Yes  |

### Products
| Method | Endpoint                  | Description               | Auth  |
|--------|---------------------------|---------------------------|-------|
| GET    | /products                 | List with filters/search  | No    |
| GET    | /products/featured        | Featured products         | No    |
| GET    | /products/top-rated       | Top rated products        | No    |
| GET    | /products/brands          | Get brand list            | No    |
| GET    | /products/price-range     | Get min/max prices        | No    |
| POST   | /products/compare         | Compare products          | No    |
| GET    | /products/:slug           | Get by slug               | No    |
| GET    | /products/id/:id          | Get by ID                 | No    |
| GET    | /products/:id/related     | Related products          | No    |
| POST   | /products                 | Create (admin)            | Admin |
| PUT    | /products/:id             | Update (admin)            | Admin |
| DELETE | /products/:id             | Soft delete (admin)       | Admin |

**Query Parameters for GET /products:**
- `keyword` — full-text search
- `category` — category ID
- `brand` — brand name(s), comma-separated
- `minPrice`, `maxPrice` — price range
- `rating` — minimum rating
- `inStock` — `true` for in-stock only
- `isFeatured` — `true` for featured
- `sort` — `price_asc`, `price_desc`, `newest`, `popularity`, `rating`
- `page`, `limit` — pagination

### Categories
| Method | Endpoint          | Description         | Auth  |
|--------|-------------------|---------------------|-------|
| GET    | /categories       | Tree structure      | No    |
| GET    | /categories/all   | Flat list           | No    |
| GET    | /categories/:slug | By slug             | No    |
| POST   | /categories       | Create (admin)      | Admin |
| PUT    | /categories/:id   | Update (admin)      | Admin |
| DELETE | /categories/:id   | Delete (admin)      | Admin |

### Orders
| Method | Endpoint                | Description              | Auth     |
|--------|-------------------------|--------------------------|----------|
| POST   | /orders                 | Create order             | Optional |
| GET    | /orders/my-orders       | My orders                | Yes      |
| GET    | /orders/shipping-rates  | Get shipping options     | No       |
| POST   | /orders/apply-coupon    | Validate & apply coupon  | Optional |
| GET    | /orders/:id             | Get order details        | Yes      |
| PUT    | /orders/:id/cancel      | Cancel order             | Yes      |
| PUT    | /orders/:id/return      | Request return           | Yes      |
| GET    | /orders/:id/tracking    | Tracking info            | Yes      |
| GET    | /orders/admin/all       | All orders (admin)       | Admin    |
| PUT    | /orders/:id/status      | Update status (admin)    | Admin    |

### Reviews
| Method | Endpoint                    | Description            | Auth |
|--------|-----------------------------|------------------------|------|
| GET    | /reviews/product/:productId | Product reviews        | No   |
| POST   | /reviews                    | Create review          | Yes  |
| PUT    | /reviews/:id                | Update review          | Yes  |
| DELETE | /reviews/:id                | Delete review          | Yes  |
| PUT    | /reviews/:id/helpful        | Toggle helpful vote    | Yes  |
| POST   | /reviews/:id/report         | Report review          | Yes  |

### Wishlist
| Method | Endpoint                  | Description    | Auth |
|--------|---------------------------|----------------|------|
| GET    | /wishlist                 | Get wishlist   | Yes  |
| POST   | /wishlist/:productId      | Add item       | Yes  |
| DELETE | /wishlist/:productId      | Remove item    | Yes  |

### Notifications
| Method | Endpoint                  | Description      | Auth |
|--------|---------------------------|------------------|------|
| GET    | /notifications            | Get all          | Yes  |
| PUT    | /notifications/read-all   | Mark all read    | Yes  |
| PUT    | /notifications/:id/read   | Mark one read    | Yes  |
| DELETE | /notifications/:id        | Delete           | Yes  |

### Payments
| Method | Endpoint                      | Description          | Auth |
|--------|-------------------------------|----------------------|------|
| POST   | /payments/stripe/create-intent| Stripe payment       | Yes  |
| POST   | /payments/confirm             | Confirm payment      | Yes  |
| POST   | /payments/paypal/create       | PayPal order         | Yes  |
| POST   | /payments/paypal/capture      | PayPal capture       | Yes  |

---

## 💳 Payment Integration

### Stripe Setup
1. Create account at [stripe.com](https://stripe.com)
2. Get test API keys from Dashboard → Developers → API Keys
3. Add `STRIPE_SECRET_KEY` to `.env`
4. For webhooks: `stripe listen --forward-to localhost:5000/api/payments/stripe/webhook`

### PayPal Setup
1. Create app at [developer.paypal.com](https://developer.paypal.com)
2. Get Client ID and Secret
3. Add to `.env`

### GCash / Other E-Wallets
The payment controller is designed to be extensible. Add new payment methods by:
1. Adding the method to the Order model's `paymentMethod` enum
2. Creating a handler in `paymentController.js`
3. Adding the route in `routes/payments.js`
4. Adding the option in the frontend checkout

---

## 🚀 Deployment (Production)
Please contact me for deployment details.

---

## 🧪 Test Accounts

| Role  | Email                  | Password      |
|-------|------------------------|---------------|
| Admin | admin@shopverse.com    | admin123456   |
| User  | juan@test.com          | test123456    |

### Test Coupon Codes
| Code       | Type       | Value  | Min Order |
|------------|------------|--------|-----------|
| WELCOME10  | 10% off    | 10%    | ₱1,000    |
| SAVE500    | Fixed ₱500 | ₱500   | ₱5,000    |
| FREESHIP   | Fixed ₱100 | ₱100   | ₱2,000    |

## ☕ Donate

If you found this project helpful or want to support my work, feel free to buy me a coffee!

<a href="https://www.buymeacoffee.com/gonzotrickster9899" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using the MERN Stack
