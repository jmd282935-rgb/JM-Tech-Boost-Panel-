# JM Tech Tools
A Manifest V3 browser extension with Cloudflare Worker API, D1 licensing, remote configuration, release metadata, and protected admin dashboard.

## Included
- Premium extension popup with license activation
- Worker API: health, config, license activation/validation, release info
- Protected admin dashboard: create/revoke licenses, edit remote config, publish release metadata
- D1 schema, Wrangler config, GitHub Actions deployment

## Configure
1. Set the exact D1 database ID in `cloudflare/wrangler.toml`.
2. Add GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and a long random `ADMIN_TOKEN`.
3. Push to main or manually run the deployment workflow.

Open `https://<worker-domain>/admin/` and enter the private ADMIN_TOKEN. Keep all tokens and license keys out of source control.

## Local development
`npm install`, `npm run db:migrate:local`, `npm run dev`.

Load the `extension/` folder as an unpacked Manifest V3 extension in a compatible Chromium browser. Set the Worker API URL in `extension/popup.js`.

The JM Tech Tools platform foundation is included. Tool-specific modules/actions are not fabricated; implement them when their exact requirements are specified.
