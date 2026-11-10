# JM Tech Tools

Premium browser-extension toolkit with a Cloudflare Worker API and D1-backed licensing/configuration.

## Project layout
- `extension/` — browser extension (Manifest V3) starter
- `worker/` — Cloudflare Worker API
- `migrations/` — D1 SQL migrations
- `cloudflare/wrangler.toml` — Worker and D1 configuration

## Setup
1. Install Node.js 20+.
2. Run `npm install`.
3. Replace the placeholder D1 database ID in `cloudflare/wrangler.toml` with the verified ID from Cloudflare.
4. Run `npm run db:migrate:local` then `npm run dev`.

## GitHub Actions deployment
Add repository Actions secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The deploy workflow runs D1 migrations and deploys the Worker after checking that the D1 ID is configured.

## Security
Never commit API tokens, passwords, private keys, or license secrets. Keep secrets in GitHub Actions or Cloudflare secrets.

## Current scope
This is the secure starter foundation. The original Boost/Campaign extension source must be added and reviewed before those features can be integrated or claimed as working.
