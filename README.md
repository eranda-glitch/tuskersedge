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

## Before launch

- Confirm the production domain in `sitemap.xml`, `robots.txt`, and page canonical tags.
- Replace the development admin password and rotate credentials that were ever included in an archive.
- Review Privacy Policy, Terms, cancellation, refund, registration, and business-address wording.
- Run a full enquiry and email-delivery test from the deployed domain.
