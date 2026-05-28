# Homepage and CMS Structure

This workspace contains a static homepage prototype and a local file-based CMS that can be integrated into an existing Variant-based frontend.

## Files

- `index.html`: bilingual homepage in the existing visual direction
- `admin/index.html`: local admin UI without external CMS dependency
- `admin/config.yml`: existing Decap schema reference
- `admin/local-cms.js`: local editor logic
- `server.js`: local static server and content API
- `content/homepage/*.json`: editable DE/EN homepage content
- `content/journal/*.md`: journal post structure
- `content/archive/*.md`: archive entry structure
- `content/images/*.md`: image metadata with SEO alt text support

## Integration Notes

- Start the local system with `npm run dev`
- Open `/admin/index.html` on port `8001`
- Replace demo contact data and connect the form action to your backend or form provider

## GitHub + Railway Deployment

The project is now prepared to run on Railway.

### What is already configured

- `npm start` runs the production server
- `server.js` respects `process.env.PORT`
- `server.js` can persist CMS content, uploads and runtime files via `DATA_ROOT`
- `railway.json` starts the app with `npm run start`
- `.gitignore` already excludes `.env` and private runtime files

### Recommended publish flow

1. Initialize Git locally if needed:

```bash
git init
git branch -M main
git add .
git commit -m "Prepare site for GitHub and Railway deployment"
```

2. Create a new GitHub repository and connect it:

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

3. In Railway:

- Create a new project
- Choose `Deploy from GitHub repo`
- Select this repository
- Railway will detect the Node app and use `railway.json`
- Add a Railway Volume and mount it, for example at `/data`
- Set `DATA_ROOT=/data` so CMS content, uploads and runtime files are stored persistently

### Railway environment variables

Required for persistent CMS storage on Railway:

- `DATA_ROOT` for example `/data`

Set these in Railway if you use the related features:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DOWNLOAD_BASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM`

or SMTP instead of Resend:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Optional:

- `DOWNLOAD_LINK_HOURS`

### Important note

Do not commit your local `.env` file. Railway environment variables should hold all production secrets.

## Academy Preset Delivery via Stripe

The project now includes a server-side delivery flow for digital Lightroom presets after a Stripe Checkout payment.

### Required environment variables

Use a local `.env` file or your hosting provider environment settings:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DOWNLOAD_BASE_URL`
- `RESEND_API_KEY` and `RESEND_FROM`

or SMTP instead of Resend:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Optional:

- `DOWNLOAD_LINK_HOURS` defaults to `72`

### Bundle storage

Do not place preset files in the public webroot.

Store each digital bundle privately in:

```text
private/downloads/<bundle-id>/
```

Everything in that folder is included in the delivered download. This can be:

- a ready-made zip file
- or individual preset files plus an installation guide PDF

### Academy CMS setup

In the Academy CMS, each preset can now use:

- `Zahlungsmodus` = `Stripe Checkout / Payment Link`
- `Stripe Price ID`
- `Bundle ID`

When `paymentType = stripe` and both `stripePriceId` and `bundleId` are set, the detail page button creates a Stripe Checkout session on the server instead of using a static link.

### Server endpoints

- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/webhook`
- `GET /api/academy/download?token=...`

The webhook verifies the Stripe signature, reads the bundle ID, generates a signed time-limited download link, and sends it to the buyer email address used during checkout.

### Idempotency

Processed Stripe sessions are stored in:

```text
private/runtime/processed-checkout-sessions.json
```

This prevents duplicate delivery emails if Stripe retries the webhook.

### Local Stripe test

1. Start the local server:

```bash
npm run dev
```

2. Forward Stripe webhooks with the Stripe CLI:

```bash
stripe listen --forward-to http://127.0.0.1:8001/api/stripe/webhook
```

3. Copy the returned signing secret into:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. In the Academy CMS set a preset to:

- `paymentType = stripe`
- `stripePriceId = price_...`
- `bundleId = your-private-bundle-folder`

5. Make sure files exist in:

```text
private/downloads/your-private-bundle-folder/
```

6. Open the preset detail page and start checkout.

7. Complete payment with a Stripe test card, for example:

```text
4242 4242 4242 4242
```

8. After `checkout.session.completed`, the buyer receives the email with the secure download link.

### Notes

- Static serving now blocks the `private/` folder.
- Errors are appended to `private/runtime/academy-delivery.log`.
- The implementation supports Stripe for digital preset delivery while keeping WooCommerce and contact-based entries intact.
