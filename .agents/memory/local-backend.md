---
name: Local backend architecture
description: Express+PostgreSQL replaces Base44 — how the local stack is structured and what to watch for.
---

# Local Backend Architecture

## Stack
- Express.js server on port 3001 (`server/index.js`)
- Replit PostgreSQL via `pg` pool (`server/db.js`)
- Vite dev server on port 5000 proxies `/api` and `/uploads` → `localhost:3001`
- Workflow: `node server/index.js & vite --port 5000 --host 0.0.0.0`

## API Client
`src/api/localClient.js` exports `base44` object with the same interface as Base44 SDK:
- `base44.entities.X.list(sort, limit)` → GET /api/entity?_sort=...&_limit=...
- `base44.entities.X.filter(where)` → GET /api/entity?camelCaseKey=value
- `base44.entities.X.create(data)` → POST /api/entity
- `base44.entities.X.update(id, data)` → PUT /api/entity/:id
- `base44.entities.X.delete(id)` → DELETE /api/entity/:id
- `base44.functions.createStripeSession(data)` → POST /api/stripe/create-session
- `base44.integrations.Core.UploadFile({file})` → POST /api/upload
- `base44.auth.*` → stubs (no-op / rejected promise)

`src/api/base44Client.js` is now just: `export { base44 } from './localClient.js';`

## Field name mapping (camelCase ↔ snake_case)
All SELECT queries use SQL aliases to return camelCase directly:
- `order_num AS "order"`, `file_url AS "fileUrl"`, `is_booked AS "isBooked"`, etc.
- Filter params from frontend (camelCase) are mapped per-entity in Express route handlers.

## Sort conventions
- `'order'` → ORDER BY order_num ASC
- `'-date'` → ORDER BY date DESC
- `'-created_date'` → ORDER BY created_at DESC

## AuthContext
AuthContext.jsx uses Base44 SDK auth which fails (500) since we intercept at `/api/apps`.
This is handled gracefully: `authError` type 'unknown' falls through to render Routes normally.
Admin panel uses its own sessionStorage-based auth (no dependency on Base44 auth).

## Admin password
Default: `NorbertAdmin2024!` (can be changed via AdminSettings table, key: `adminPassword`)
Admin URL: `/management-dashboard-secure-nr7x912`

## Stripe
- Webhook: POST /api/stripe/webhook (raw body before express.json())
- Session: POST /api/stripe/create-session (uses STRIPE_SECRET_KEY env var)
- Uses `Origin` header from browser for success/cancel redirect URLs

**Why:** User needed full local operation on Replit without any Base44 dependency.
