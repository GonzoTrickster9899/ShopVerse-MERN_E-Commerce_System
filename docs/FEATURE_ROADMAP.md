# ShopVerse phased roadmap

This roadmap is grounded in the current repository and in the implementation requirements supplied for the ShopVerse upgrade. The repository did not contain a separate, more detailed prompt pack, so phases after Phase 0 are proposed work packages. Complete and review each phase independently; do not start the next phase until it is requested.

## Phase 0 — Current-state review and Vercel deployment foundation

**Status:** Implemented in this change; requires Dashboard Preview validation before deployment is considered verified.

- Document the actual frontend routes, API routes, models, roles, integrations, gaps, and scripts.
- Split Express app export from local listener side effects while retaining `npm start` and `npm run dev`.
- Reuse MongoDB connections across warm serverless invocations and return generic readiness health status.
- Stop serving the frontend build and local uploads from the API deployment.
- Require a production API URL at frontend build time and configure a CRA deep-link fallback.
- Add dashboard-only Vercel setup, environment matrix, smoke checks, and rollback notes.

## Phase 1 — Authorization and account-data boundaries

- Audit every authenticated read and mutation for ownership, role, and resource-existence checks in the backend.
- Address order tracking and seller product ownership gaps found in the current code.
- Define consistent 401/403/404/409/validation errors; avoid changing safe response contracts without updating callers.
- Add targeted authorization regression tests, including cross-customer order, notification, review, wishlist, and seller-product attempts.
- Preserve existing accounts and token/password data; document any index or backfill needs before migration.

## Phase 2 — Catalog persistence and uploads

- Configure a real persistent media provider (Cloudinary or another approved provider) using server-only credentials.
- Keep local disk uploads limited to development; reject production uploads clearly until the provider is configured.
- Validate product/category data and seller ownership on the server; preserve current catalog endpoints and page behavior.
- Add upload/provider tests and an orphan-media cleanup plan before changing existing image references.

## Phase 3 — Checkout and order integrity

- Validate item IDs, positive bounded quantities, variants, address data, shipping method, and coupon inputs on the backend.
- Recompute all prices, variant modifiers, discounts, tax, shipping, and totals from server-side product/configuration data.
- Resolve tax, currency, shipping, return, COD, pickup, and other business policies from operator decisions; do not invent them.
- Use MongoDB transactions when the deployment topology supports them and conditional atomic inventory/coupon writes for race-sensitive behavior. Do not degrade to partial checkout if required transaction semantics are unavailable.
- Document replica-set/Atlas requirements, migration/backfill strategy, rollback, and idempotency behavior.
- Add tests for forged totals/prices, inventory races, coupon limits, duplicate requests, cancellation, and rollback.

## Phase 4 — Verified payments

- Keep unavailable providers unavailable until credentials, callback/webhook verification, and end-to-end tests exist.
- Remove client-authoritative paid flags; treat signed provider webhooks or server-side provider retrieval as payment evidence.
- Verify order ownership, method, amount, currency, status, and idempotency on provider operations.
- Reconcile payment and order status transitions; never infer online payment from shipment status.
- Document provider secrets, webhook endpoints, Preview/Production separation, and refund handling.

## Phase 5 — Reviews, wishlist, notifications, and email

- Audit resource ownership and input validation across these APIs.
- Enforce verified-purchase and review policy consistently; add unique/atomic protections for votes and reports.
- Keep email delivery optional and report provider failures without leaking addresses, tokens, or secrets.
- Add tests for cross-user data isolation and status notification regressions.

## Phase 6 — Operational readiness and production promotion

- Add durable automated coverage for API contracts and security/regression scenarios.
- Review rate limits, logging, health/readiness semantics, Vercel function limits, database connectivity, and provider callbacks.
- Promote only after Preview acceptance evidence and operator confirmation of Production secrets and database access.
- Keep a tested Dashboard rollback target and migration rollback/backfill plan.
