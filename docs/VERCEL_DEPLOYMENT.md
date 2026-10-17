# Vercel Dashboard deployment guide

This setup uses **two Vercel projects connected to the same Git repository**. The React app is the frontend project; the exported Express app is the backend project. No Vercel CLI is required or used.

The API health endpoint is database readiness, not just process liveness: `GET /api/health` returns `200` and `{ "success": true, "status": "ready" }` after MongoDB is connected. If it cannot connect, it returns `503` with a generic message and no connection details.

## 1. Import the frontend project

1. In the Vercel Dashboard, select **Add New → Project** and import the ShopVerse Git repository.
2. Set **Root Directory** to `frontend` and enable **Include files outside the Root Directory** only if Vercel requests it (the frontend is self-contained).
3. Set **Framework Preset** to **Create React App**.
4. Use **Install Command** `npm install` (or the detected default), **Build Command** `npm run build`, and **Output Directory** `build`.
5. Add `REACT_APP_API_URL` in the environment variable section as described below. Its value must be the backend deployment origin plus `/api`, for example `https://<backend-project-domain>/api`.
6. Import the same Git repository again as a second Vercel project for the backend. Do not configure the frontend project to use the repository root.

The frontend's `vercel.json` rewrites unmatched paths to `/index.html`, which allows React Router URLs such as `/orders/123` to load on a fresh browser request. Static assets are still served by Vercel's file routing.

## 2. Import the backend project

1. In the Vercel Dashboard, select **Add New → Project** and import the same Git repository again.
2. Set **Root Directory** to `backend`.
3. Set **Framework Preset** to **Express**. The root `server.js` exports the Express app. It only starts a local listener when executed directly, so Vercel can load it as a function.
4. Leave Build Command and Output Directory at the Express/Vercel detected defaults; there is no backend compilation step. Ensure dependencies install from `backend/package.json`/`backend/package-lock.json`.
5. Add backend variables before exercising API routes. MongoDB is contacted lazily on each cold instance's first API request and its connection is reused by warm instances.
6. Assign a stable production domain to the backend project and use its `/api` URL in the frontend's Production variable.

Vercel's Express framework treats an exported app in `server.js` as one function and sends project requests through that app, so the Express routes keep their existing `/api/...` paths. The expected smoke-test URL is `https://<backend-project-domain>/api/health`.

## 3. Environment variable matrix

Set variables separately on each Vercel project. Select **Preview** and **Production** scopes explicitly. Do not copy real credentials into this repository or into `frontend` variables.

| Project | Variable | Required by current code | Secret? | Preview / Production value |
| --- | --- | --- | --- | --- |
| Frontend | `REACT_APP_API_URL` | Required for production build by the new prebuild check | No; public URL embedded in JS | Full backend origin ending in `/api`; use the matching backend deployment for Preview and stable backend domain for Production |
| Backend | `MONGO_URI` | Required for every database-backed API request and health readiness | **Yes** | MongoDB connection string for that environment; use separate databases/credentials where possible |
| Backend | `JWT_SECRET` | Required to issue and verify tokens | **Yes** | Long random value; use different values in Preview and Production |
| Backend | `CLIENT_URL` | Optional in code, but must be set for deployed CORS and correct verification/reset links | No | Exact frontend origin, including scheme; set to the paired Preview origin and Production domain |
| Backend | `JWT_EXPIRE` | Optional in code, recommended to set so tokens expire | No | JWT duration accepted by `jsonwebtoken`, e.g. `7d`; use the existing business policy |
| Backend | `JWT_COOKIE_EXPIRE` | Optional; code defaults to 7 days | No | Cookie lifetime in days if overriding the default |
| Backend | `MONGODB_DNS_SERVERS` | Optional resolver override | No | Comma-separated DNS resolver IPs only if required by the environment |
| Backend | `MONGO_SERVER_SELECTION_TIMEOUT_MS` | Optional; code defaults to 5000 ms | No | Milliseconds; tune only if there is an operational reason |
| Backend | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Required only for reliable production email sends; email code attempts SMTP in production | `SMTP_PASS` **Yes**; others generally no | Provider-issued SMTP settings. Keep credentials server-side and separate by environment |
| Backend | `FROM_EMAIL`, `FROM_NAME` | Optional sender display values | No | Verified sender identity where required by the email provider |
| Backend | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Required only to invoke existing Stripe routes/webhook; payment flow is incomplete | **Yes** | Provider test keys in Preview and live keys only after the payment phase is verified in Production |

Vercel supplies `NODE_ENV` and the function port; do not set `PORT` for the hosted function. `PORT` and `NODE_ENV` remain useful for local development. PayPal, Cloudinary, and Redis values are not currently read by application code and are intentionally omitted from the example environment files and setup matrix. `backend/.env.example` and `frontend/.env.example` contain placeholders/local defaults only.

## 4. Preview deployment and smoke test

1. Push a branch or open a pull request so Vercel creates Preview deployments for both projects.
2. Set the backend Preview `MONGO_URI`, `JWT_SECRET`, and exact `CLIENT_URL` for the frontend Preview origin. Add SMTP/Stripe variables only if explicitly testing those integrations.
3. Set frontend Preview `REACT_APP_API_URL` to the backend Preview deployment origin plus `/api`.
4. If the Preview URLs change, update the paired origin variables and redeploy both affected Preview projects. Do not use a broad wildcard CORS origin.
5. Open the frontend Preview root URL. Confirm it loads and that browser network requests target the configured backend URL, not localhost.
6. Open `https://<backend-preview-domain>/api/health`. Expect HTTP 200 with `status: "ready"`. If MongoDB is unavailable, expect generic HTTP 503; inspect backend **Deployments → Functions → Logs** and MongoDB network access without copying connection values into logs or chat.
7. Refresh a nested route such as `/shop` or `/orders/123` directly. The response should load the React app; protected routes may then redirect to login.
8. In browser developer tools, verify an API request from the exact frontend Preview origin has the expected CORS response and no CORS error. Verify no request uses `http://localhost:5000`.
9. Review backend function logs for runtime errors. Logs should not contain connection strings, JWT secrets, SMTP passwords, or provider secrets.
10. Do not interpret a successful health check as payment, email, upload, or order-flow verification.

### Payment webhook note

The configured Stripe webhook path is `/api/payments/stripe/webhook`. The current app applies global `express.json()` before mounting the payments router, while that route applies `express.raw()` inside the router. Stripe signature validation requires the original raw request body; this ordering must be fixed and tested in the payment phase before configuring/depending on the webhook. The current generic confirm and PayPal routes are not verified payment integrations. Do not enable live payments based on this deployment foundation.

## 5. Production promotion gate

Do not promote until the operator confirms in the Vercel Dashboard that Production secrets, database connection values, MongoDB network access, and the Production frontend/backend URLs are entered and verified. Also require a passing Preview health check, CORS check, nested-route refresh, and function log review. Online payment and production uploads remain blocked on their separate feature phases.

After the gate is met:

1. Confirm both Preview deployment URLs and code revision are the intended release.
2. Promote the frontend and backend Preview deployments to Production from their Vercel Dashboard deployment pages (or deploy the approved commit to Production via the connected Git branch).
3. Verify the Production frontend URL, backend `/api/health` response, CORS from the Production frontend origin, a nested-route refresh, and backend function logs.
4. Keep the previous known-good frontend and backend Production deployments available until verification is complete.

## 6. Rollback

1. In the Vercel Dashboard, open each affected project's **Deployments** page.
2. Select the last known-good Production deployment and choose **Promote to Production** / **Redeploy** using the Dashboard controls available for that deployment.
3. Roll back the frontend and backend projects as a compatible pair if their API contracts changed.
4. Recheck frontend load, `/api/health`, CORS, and nested-route refresh.
5. If a future phase adds a database migration, follow that phase's documented backfill/rollback procedure; a code rollback does not reverse data changes.

## References

- [Vercel Express framework](https://vercel.com/docs/frameworks/backend/express)
- [Vercel Create React App framework](https://vercel.com/docs/frameworks/frontend/create-react-app)
- [Vercel rewrites](https://vercel.com/docs/routing/rewrites)
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
