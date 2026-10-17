# ShopVerse current state

Review date: 2026-10-17. This document describes the checked-in application source, not services configured in a Vercel account.

## Architecture

- `frontend/` is a React 18 Create React App application using React Router 6, Axios, Context API, React Toastify, React Icons, and CSS.
- `backend/` is a CommonJS Express 4 API using Mongoose 8, JWT/bcryptjs authentication, Multer uploads, Nodemailer, Stripe SDK, and express-rate-limit.
- MongoDB is the application database. There is no Payment model; payment details and flags are embedded in Order.
- `frontend/src/services/api.js` creates one Axios client. `REACT_APP_API_URL` is its API base. In development only, missing configuration falls back to `http://localhost:5000/api`; production builds now stop if it is missing.
- The API CORS origin is `CLIENT_URL` (defaulting to `http://localhost:3000`). The API and web app should be deployed as separate Vercel projects.

## Frontend routes and pages

Routes in `frontend/src/App.js`:

| Path | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/shop` | Product listing/search | Public |
| `/product/:slug` | Product detail | Public |
| `/cart` | Cart | Public, local-storage backed |
| `/checkout` | Checkout | Public, supports guest checkout in current UI |
| `/login` | Login | Public |
| `/register` | Registration | Public |
| `/forgot-password` | Password reset request | Public |
| `/orders` | Order history | Protected in UI |
| `/orders/:id` | Order detail | Protected in UI |
| `/wishlist` | Wishlist | Protected in UI |
| `/notifications` | Notifications | Protected in UI |
| `/profile` | Profile and addresses | Protected in UI |

There are no frontend routes in the current route table for the emailed `/verify-email/:token` and `/reset-password/:token` links. The UI route guard is not a substitute for API authorization.

## Backend API routes

`backend/server.js` mounts routers below `/api`:

| Router | Current endpoints and access behavior |
| --- | --- |
| `/auth` | `POST /register`, `/login`, `/logout`, `/forgot-password`, `/addresses`; `GET /me`, `/verify-email/:token`; `PUT /update-profile`, `/update-password`, `/reset-password/:token`, `/addresses/:addressId`; `DELETE /addresses/:addressId`. Protected handlers use `protect`; login/register have stricter rate limits. |
| `/products` | Public `GET /`, `/featured`, `/top-rated`, `/brands`, `/price-range`, `/id/:id`, `/:id/related`, `/:slug`; public `POST /compare`; `POST /`, `PUT /:id`, `DELETE /:id` require `admin` or `seller`. |
| `/categories` | Public `GET /`, `/all`, `/:slug`; `POST /`, `PUT /:id`, `DELETE /:id` require `admin`. |
| `/orders` | `GET /shipping-rates` is public; `POST /` and `/apply-coupon` use optional auth; `GET /my-orders`, `/:id`, `/:id/tracking`; `PUT /:id/cancel`, `/:id/return` require login; `GET /admin/all` and `PUT /:id/status` require admin. |
| `/payments` | `POST /stripe/create-intent`, `/confirm`, `/paypal/create`, `/paypal/capture` require login; `POST /stripe/webhook` is unauthenticated and verifies Stripe signatures in its handler. |
| `/reviews` | Public `GET /product/:productId`; authenticated `POST /`, `PUT /:id`, `DELETE /:id`, `PUT /:id/helpful`, and `POST /:id/report`. |
| `/wishlist` | Authenticated `GET /`, `/check/:productId`; `POST /:productId`; `DELETE /:productId`. |
| `/notifications` | Authenticated `GET /`; `PUT /read-all`, `/:id/read`; `DELETE /:id`. |
| `/health` | `GET /api/health`; now reports ready only when MongoDB is connected (200), otherwise returns a generic unavailable response (503). |

## Roles and models

- `User.role` is `user`, `admin`, or `seller`, default `user`. `authorize()` checks the role names supplied by each route. Product mutation routes allow sellers, but the controller does not enforce seller ownership of an individual product.
- `User`: credentials, role, avatar, addresses, wishlist, verification/reset tokens and lockout fields.
- `Product`: price, stock, variants, seller, category, images, search/filter fields, ratings and active/featured flags.
- `Category`: hierarchical category data and active/sort fields.
- `Order`: customer or guest fields, line-item snapshots, shipping/billing addresses, payment method/result, money totals, status, paid/delivery/tracking fields and status history.
- `Coupon`: code, value, limits, dates and usage tracking.
- `Review`: product/user/order references, rating/content, approval/report/helpful state; a unique user/product index exists.
- `Notification`: user, message/type/read state and channel flags.

Order status enum is `pending`, `confirmed`, `processing`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`, `returned`, and `refunded`. New orders start `pending`; cancellation changes pending/confirmed orders to cancelled; customer returns change delivered orders to returned; admins can assign any enum value without a transition graph. Admin shipment/delivery updates set `isPaid` and `paidAt`; delivery also sets `isDelivered` and `deliveredAt`. Stripe webhook and the unverified confirm/PayPal capture handlers can set `confirmed` and paid state. There is no separate payment status machine.

## What works and what is partial

- API modules and frontend calls exist for account flows, catalog browsing, cart, coupon application, orders, reviews, wishlist, notifications, and admin screens.
- Order creation obtains the product price from MongoDB and computes totals on the backend. The cart's browser-side totals are presentation only.
- Payment routes are not complete integrations. Checkout currently submits the order and clears the cart without completing Stripe, PayPal, or GCash. PayPal create returns mock data; PayPal capture and `/payments/confirm` can mark orders paid without provider verification. Stripe webhook is the only handler that verifies a Stripe signature, but global JSON parsing runs before the router-level raw parser, so the webhook raw-body path needs verification/fixing before use.
- Order status is changed by an admin handler without transition validation. It sets paid when shipped/delivered, independently of provider confirmation. Cancellation/refund stock changes and checkout stock deductions are not atomic.
- Shipping rates and 12% tax are hardcoded. They need a business decision before being moved or changed.
- Multer writes disk files locally. Production selects memory storage, but current controllers still construct URLs from `file.filename`; Cloudinary is present as a dependency and env examples existed, but no Cloudinary upload path is implemented. Production user-upload flows are not deployment-ready.
- Email sends use Nodemailer SMTP in production; verification/reset URLs use `CLIENT_URL`. Email is not a guaranteed feature until provider settings are supplied and tested.

## MongoDB and deployment lifecycle

`backend/server.js` now exports the Express app and only opens a listener when run directly (`npm start` or `npm run dev`). It no longer serves a frontend build. API requests connect lazily through `config/db.js`; the connection promise is reused by warm function instances, failed initial connections can be retried, and no `process.exit()` is called from the database module. The local process-level unhandled-rejection handler is installed only when the file is the local entry point.

Vercel functions are not durable local file storage. Use a MongoDB deployment that permits connections from Vercel and configure network access accordingly. This project does not use MongoDB transactions yet; the current order flow is not concurrency-safe.

## Scripts and checks in the repository

- Backend: `npm start`, `npm run dev`, and `npm run seed`. There is no backend test or build script.
- Frontend: `npm start`, `npm run build`, and `npm test`. `npm run build` now has a `prebuild` check that requires `REACT_APP_API_URL`.
- No automated test files were present during the Phase 0 review. CRA's test runner is configured but has no repository tests to execute.

## Current risks and follow-up

1. Payment endpoints permit client-driven paid status and mock PayPal success; disable or harden them before accepting online payments.
2. Order tracking only requires a login and currently lacks order ownership/admin checks.
3. Checkout quantity/variant validation, atomic inventory reservation, coupon concurrency, and transaction behavior need a dedicated order-integrity phase.
4. Seller product ownership, profile/address input allowlists, and ownership checks across review/notification resources need a full authorization pass.
5. Production uploads need configured persistent media storage; local `/uploads` is served only outside production.
6. No Vercel deployment has been made or verified as part of this repository work.
