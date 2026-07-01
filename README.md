# Telnyx Admin

A Next.js (App Router, SSR) admin console for a Telnyx messaging profile: view
messaging profiles and numbers, browse SMS/MMS conversations, and send messages.
Message history is built from Telnyx **webhooks** persisted in **MongoDB**
(Telnyx has no "list all messages" API). Deploys to **Vercel**.

## Stack
- Next.js 15 (App Router, server components / SSR)
- MongoDB (native driver, connection cached for serverless)
- Telnyx REST v2 (`fetch`), Ed25519 webhook verification via `node:crypto`

## Setup

1. Install deps:
   ```bash
   npm install
   ```
2. Copy env and fill in values (all server-only — no `NEXT_PUBLIC_`):
   ```bash
   cp .env.example .env
   ```
   - `TELNYX_API_KEY` — Mission Control > API Keys
   - `TELNYX_PUBLIC_KEY` — Mission Control > Keys & Credentials > Public Key
   - `MONGODB_URI` — your MongoDB Atlas SRV connection string
3. Run:
   ```bash
   npm run dev
   ```

## Webhooks
Point your messaging profile's **Webhook URL** at:
```
https://<your-vercel-domain>/api/webhooks/telnyx
```
In local dev, expose `http://localhost:3000` with a tunnel (ngrok / Cloudflare
Tunnel) and use that URL. Every request is Ed25519-verified with replay
protection before it is stored.

## Routes
- `/` — messaging profiles (live from Telnyx)
- `/numbers` — messaging-enabled phone numbers (live from Telnyx)
- `/conversations` — threads (from MongoDB)
- `/conversations/[contact]` — a thread + reply box
- `POST /api/webhooks/telnyx` — inbound + delivery-status ingest
- `POST /api/messages/send` — send SMS/MMS

## Deploying to Vercel
1. Push to a Git repo and import into Vercel.
2. Add `TELNYX_API_KEY`, `TELNYX_PUBLIC_KEY`, `MONGODB_URI` (and optional
   `MONGODB_DB`, `WEBHOOK_TOLERANCE_SECONDS`) as **Environment Variables**.
3. Allow Vercel egress in MongoDB Atlas Network Access (or use `0.0.0.0/0` for a
   quick start).

## Notes / next steps
- Live updates use `router.refresh()` after sends; Vercel serverless has no
  long-lived sockets, so for real-time inbound add polling or Pusher/Ably.
- The admin routes are currently unauthenticated — add auth (e.g. middleware +
  session/JWT) before exposing publicly.
