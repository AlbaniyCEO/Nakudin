# Nakudin Marketplace

Verified online marketplace where every shop works like a social media profile — shops have followers, products get likes and comments, and sellers connect via WhatsApp.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nakudin run dev` — run the frontend (port 21551)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Wouter (routing)
- API: Express 5
- Auth: Firebase Auth (frontend) + REST token verification (backend)
- DB: PostgreSQL + Drizzle ORM
- Images: Cloudinary (signed uploads)
- Payments: Paystack (subscription webhooks)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/index.ts` — Drizzle DB schema
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/` — auth + error middleware
- `artifacts/nakudin/src/pages/` — frontend pages
- `artifacts/nakudin/src/lib/firebase.ts` — Firebase config
- `artifacts/nakudin/src/lib/firestore.ts` — Firestore helpers

## Architecture decisions

- Firebase Auth for authentication — tokens verified server-side via Firebase REST API (no firebase-admin SDK needed)
- Cloudinary for image uploads — signed upload flow via `/api/cloudinary/signature` endpoint
- Paystack for subscriptions — webhook-based subscription status updates
- Social graph (follows, likes, comments) stored in PostgreSQL, not Firestore
- Trend score computed on product upserts to power the feed algorithm

## Product

- Shops as social profiles: follow shops, get feeds of new products from followed shops
- Product feed with location-aware sorting and category filters
- Like, comment, and WhatsApp-click tracking on products
- Shop analytics: views, likes, WhatsApp clicks, follower growth
- Seller dashboard: manage products, view analytics, handle subscription
- Admin panel: verify shops, manage reports, moderate content
- Paystack subscription billing with trial/active/grace/locked states

## Required Environment Variables

- `VITE_FIREBASE_API_KEY` — Firebase Web API key
- `VITE_FIREBASE_AUTH_DOMAIN` — e.g. `your-project.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID` — Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` — e.g. `your-project.appspot.com`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` — Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` — Firebase app ID
- `VITE_PAYSTACK_PUBLIC_KEY` — Paystack public key (`pk_live_...`)
- `PAYSTACK_SECRET_KEY` — Paystack secret key (`sk_live_...`)
- `VITE_CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET` — Cloudinary unsigned upload preset
- `VITE_CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret (server-side only)
- `DATABASE_URL` — Postgres connection string (auto-set by Replit)

## Gotchas

- After any change to `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using updated types
- Firebase token verification uses the REST API (`identitytoolkit.googleapis.com`) — the backend needs `VITE_FIREBASE_API_KEY` or `FIREBASE_API_KEY` set
- Cloudinary route exports from `routes/cloudinary.ts` must be registered in `routes/index.ts`
- Always run `pnpm --filter @workspace/db run push` after schema changes in development

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
