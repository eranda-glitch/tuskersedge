# TuskersEdge Website

The site runs on Node.js, Express, and SQLite. Tours, gallery images, blog records,
district guides, videos, admin sessions, and enquiries are stored in
`data/tuskersedge.db`.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Create `.env` from `.env.example`.
4. Run `npm run admin:reset` after setting a strong admin password.
5. Run `npm run build`.
6. Run `npm start` and open `http://localhost:3000`.

## Required environment variables

- `NODE_ENV=production` in production.
- `PORT=3000` or the port supplied by the host.
- `ADMIN_USER` and a unique `ADMIN_PASSWORD` of at least 12 characters.
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `EMAIL_TO` for notifications.
- `SITE_URL` for the final public domain.

Use a Gmail App Password, not the normal Gmail account password.

## Operations

- `npm run check`: JavaScript syntax checks.
- `npm run build`: compile minified Tailwind CSS.
- `npm run backup`: create a consistent SQLite backup in `backups/`.
- `npm run admin:reset`: update the hashed admin password from `.env` and sign out existing sessions.
- `npm run test:smoke`: verify public pages, APIs, admin login, and private-file blocking.
- `npm run test:browsers`: test desktop/mobile layouts and gallery/date interactions in Edge, Firefox, and WebKit.
- `npm run test:performance`: run Lighthouse performance, accessibility, best-practices, and SEO audits.
- `npm run test:pwa`: verify the installable app manifest, icons, service worker, offline mode, and iPad instructions.
- `npm run test:email`: verify Gmail authentication and send one delivery test.
- `npm run search:verify`: install the Search Console verification token from `.env`.

The built-in analytics counter stores only aggregate daily page/path totals. It uses
no cookies, does not retain IP addresses, and respects browser Do Not Track signals.

The deployment must provide persistent disk storage for `data/tuskersedge.db`,
`data/tuskersedge.db-wal`, and uploaded files in `images/`. Do not deploy to an
ephemeral serverless filesystem unless those paths are moved to managed storage.

## Cloudflare deployment

The repository now includes a Cloudflare Pages Functions adapter. It keeps the
existing browser API paths (`/api/content`, `/api/contact`, `/api/login`, and
the admin API) while storing records in D1. R2 is optional; without R2, the
existing repository images work but new admin image uploads are disabled.

1. Install Wrangler and authenticate: `npm install -g wrangler` then `wrangler login`.
2. Create the D1 resource: `wrangler d1 create tuskersedge`.
3. Copy the returned D1 database ID into `wrangler.jsonc` and set `SITE_URL`.
4. Create the schema: `wrangler d1 execute tuskersedge --remote --file=schema.sql`.
5. Seed the current public content: `npm run d1:seed`, then
   `wrangler d1 execute tuskersedge --remote --file=d1-seed.sql`.
6. Add the `ADMIN_PASSWORD` secret with
   `wrangler pages secret put ADMIN_PASSWORD`.
7. Connect the repository to Cloudflare Pages and deploy with `npm run cf:deploy`.

The D1 resource is persistent; do not commit `.env`, passwords, or
Cloudflare API tokens. Add the custom domain in Cloudflare Pages after the first
successful deployment.

## Before launch

- Confirm the production domain in `sitemap.xml`, `robots.txt`, and page canonical tags.
- Replace the development admin password and rotate credentials that were ever included in an archive.
- Review Privacy Policy, Terms, cancellation, refund, registration, and business-address wording.
- Run a full enquiry and email-delivery test from the deployed domain.
