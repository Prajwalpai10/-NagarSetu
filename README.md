<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8d8ace38-69b8-4a58-98d3-33a667952ad6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Local Account Persistence

The API stores user records, including their existing bcrypt password hashes, in
`.data/users.json` by default. The file is loaded before demo accounts are seeded
and is created automatically when a user is added or updated. Set
`USER_STORE_FILE` to use a different file path. Keep this file private and do not
commit it; `.data/` is ignored by Git.

This file-backed store is intended for a single local API process. Use a
database-backed store for production or multi-instance deployments.

## Complaint Data and Photo Attachments

Complaint creation, status history, endorsements, and attachment metadata are
served by the authenticated API. In local development complaints are stored in
`.data/complaints.json`; attachment metadata is stored in
`.data/attachments.json` and image bytes in `.data/uploads/`. These paths can be
changed with `COMPLAINT_STORE_FILE`, `ATTACHMENT_METADATA_FILE`, and
`UPLOAD_DIR`. The local file stores are intended for one API process.

For production or multiple API instances, configure `MONGODB_URI` and
`MONGODB_DB_NAME` for users, sessions, complaints, and attachment metadata, and
configure an S3-compatible `S3_BUCKET` (plus endpoint and credentials when
required) for uploaded images. Production startup fails if MongoDB or the
durable object-store configuration is missing. Keep local data directories and
credentials private and include them in the deployment's backup plan.

Citizen uploads accept JPEG, PNG, and WebP images up to 5 MB each. Uploads are
retrieved through authenticated `/api/uploads/...` URLs; complaint ownership or
authorized operational access is checked before returning an image.

### Citizen complaint locations

The Citizen report form uses Photon’s public geocoding API for address
suggestions and reverse geocoding. Search text and coordinates selected for
reverse geocoding are sent from the browser to `photon.komoot.io`; browser
geolocation is requested only after the citizen selects “Use Current Location”
and requires browser permission (and HTTPS outside localhost). Citizens must
review and explicitly confirm the address and map pin before submitting.

Photon’s public demo service can throttle requests and provides no production
availability guarantee. For a public or high-volume deployment, use an
approved geocoding service or operate a suitable provider, and review its
privacy, attribution, and usage requirements before launch.

### Department and officer assignment management

Departments are persisted in `.data/departments.json` during local development
and in MongoDB's `departments` collection when MongoDB is configured. An
administrator can create departments and activate or deactivate them in Admin
Portal → User Management, then explicitly assign existing officer accounts to
active departments there. The existing officer account, credentials, and
complaints are preserved. Previously stored officer department names are
registered as legacy departments on startup; legacy officers without a
department ID must be explicitly assigned by an administrator before they are
eligible for complaint assignment.

Non-production server startup safely adds missing default civic departments for
roads, water, electricity, solid waste, stormwater/drainage, and parks. Existing
records are not overwritten, and these defaults do not create officer accounts
or assignments. Configure real officer membership in the Departments & Officers
screen before assigning complaints.

The assignment screen lists all active departments, including departments with
no officers, and offers only active officers who belong to the selected
department. The API validates department status and officer membership before
saving an assignment. The Operations bulk-routing control also uses active
department IDs from the same registry.

Older browser-only complaint records remain in that browser's local storage and
are not automatically promoted to the shared database. Do not clear browser
storage when migrating an installation; export and migrate those records using
an explicit, reviewed migration process before retiring the old client.

### Operational dashboard data boundary

The Command Center and Officer Dashboard headline complaint counts use the
records visible to the signed-in user through the API. Their zone/agency/period
controls do not filter those totals. Hotspot analytics, department scorecards,
escalation examples, sample routing queues, crew rosters, maps/heatmaps, and
agency broadcasts are demonstrations unless explicitly identified as API-backed;
they are not live city statistics or dispatch integrations. Dispatch, agency
broadcast, statutory penalty, private officer-note, and crew-GPS integrations
are not configured by this project.

### Migrating browser complaint exports

Keep the original browser export and upload directory unchanged until the
migration is applied and the imported complaints and photos have been verified.
The migration tools support local file storage in development and MongoDB/S3 in
production. They do not create citizen accounts: each complaint and attachment
must be assigned to an existing active citizen account.

1. Export the browser's complaint records to a JSON array. Review the export
   locally; do not place personal data in a repository or public location.
2. If records refer to uploaded photos, prepare a private attachment manifest
   that maps each managed image key to its owner and complaint IDs. For example:

   ```json
   [
     {
       "key": "550e8400-e29b-41d4-a716-446655440000.jpg",
       "ownerEmail": "citizen@example.invalid",
       "complaintIds": ["CMP-2025-00001"]
     }
   ]
   ```

   The corresponding original file must exist directly inside the supplied
   source upload directory. The manifest supports only UUID-named `.jpg`,
   `.png`, and `.webp` image files. Review non-managed photo URLs separately;
   the complaint importer intentionally refuses to import them.
3. Set `.env` for the intended destination. Run a dry run first:

   ```sh
   npm run migrate:attachments -- --manifest <private-manifest.json> --source-dir <old-upload-directory>
   npm run migrate:complaints -- --file <browser-export.json> --citizen-email <existing-citizen-email>
   ```

   The attachment dry run validates ownership, image contents, and complaint
   references without writing. Apply attachments first so the complaint
   importer can verify ownership of each photo:

   ```sh
   npm run migrate:attachments -- --manifest <private-manifest.json> --source-dir <old-upload-directory> --apply
   npm run migrate:complaints -- --file <browser-export.json> --citizen-email <existing-citizen-email> --apply
   ```

   Complaint imports preserve complaint IDs, associate them with the selected
   existing citizen, reject conflicting IDs, and safely skip records bearing
   the import marker when rerun. Attachment imports verify destination bytes
   and metadata and safely accept an identical prior import. Source exports,
   manifests, and source images are never deleted or modified. Keep them
   private until citizen access and officer authorization have been checked.

### Production configuration and deployment readiness

Copy `.env.example` to `.env` and set values using the deployment platform's
secret manager; the example contains placeholders and development seed
credentials, not production-ready secrets. Production requires:

- `NODE_ENV=production`, `PORT`, a unique random `SESSION_SECRET` (at least 32
  characters), explicit HTTPS frontend origins in `ALLOWED_ORIGINS`, and an
  accurate `TRUST_PROXY_HOPS` value for the HTTPS reverse proxy.
- `MONGODB_URI`, `MONGODB_DB_NAME`, and optionally
  `MONGODB_SERVER_SELECTION_TIMEOUT_MS`. MongoDB must be reachable and backed
  up. The API verifies the database and creates indexes before listening.
- `S3_BUCKET` and the appropriate `S3_REGION`, `S3_ENDPOINT`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_FORCE_PATH_STYLE`
  settings for the selected S3-compatible service. The API verifies bucket
  access at startup; its identity must have the required bucket-check and
  object read/write permissions.
- `SESSION_COOKIE_SAME_SITE` (default `strict`), and optionally
  `SESSION_COOKIE_DOMAIN` when the deployment's same-site frontend/API cookie
  design requires it. Use `VITE_API_BASE_URL` only when building a frontend
  that calls a separately hosted API; configure the matching CORS origin.
- `GEMINI_API_KEY` only if the deployed AI-assisted feature is enabled.
  `SEED_DEMO_ACCOUNTS` must not be enabled in a production deployment.

Build the frontend with `npm run build` and serve the API with
`npm run server:start`. Configure HTTPS termination, same-site secure session
cookies, backups, monitoring, and the health endpoint (`/api/health`) in the
hosting environment. The frontend/API URL and CORS settings must refer to the
actual deployed origins.

**Deployment is not complete or verified:** this repository has not been
connected to production MongoDB, an S3-compatible account, DNS, HTTPS hosting,
or a public site. No public deployment or external service credentials have
been tested.

## Running the API

Copy `.env.example` to `.env`, set a unique `SESSION_SECRET`, then run the
frontend with `npm run dev` and the API in a separate terminal with
`npm run server:dev`. The Vite development server proxies `/api` requests to
the API. For production, build with `npm run build` and run `npm run server:start`
with `NODE_ENV=production`, MongoDB, an S3-compatible bucket, and the relevant
allowed origin configured.
