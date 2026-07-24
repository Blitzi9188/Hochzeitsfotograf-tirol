# CLAUDE.md — hochzeitsfotograf.tirol

## Project Overview

Wedding photography website for Blitzkneisser. Node.js server with file-based CMS (no database). Content is edited via JSON/Markdown files. Deployed on Railway via GitHub.

**Live site:** https://hochzeitsfotograf.tirol  
**GitHub:** https://github.com/Blitzi9188/Hochzeitsfotograf-tirol.git  
**Branch:** `main` → Railway auto-deploys on push

---

## Local Development

```bash
npm run dev        # Start server on port 8001
```

- Homepage: http://localhost:8001
- Admin CMS: http://localhost:8001/admin/

---

## Architecture

### Server (`server.js`)
- Serves `index.html` as a template
- Injects `window.__HOMEPAGE_BOOTSTRAP__` with data from `content/homepage/de.json` (or `en.json`)
- Handles content API endpoints for the admin UI
- Respects `process.env.PORT` (Railway sets this automatically)

### Content (File-Based CMS)
All editable content lives in `content/`:

| File | Purpose |
|------|---------|
| `content/homepage/de.json` | DE homepage content (hero, portfolio, etc.) |
| `content/homepage/en.json` | EN homepage content |
| `content/journal/*.md` | Journal/blog posts |
| `content/archive/*.md` | Archive entries |
| `content/images/*.md` | Image metadata + SEO alt text |

**To change hero image:** Edit `heroImages[0].image` in `content/homepage/de.json` and `en.json`.  
**Hero text** in `index.html` (`data-i18n` attributes) is static HTML — NOT processed by client-side JS. Edit directly in the HTML.

### CSS
Tailwind CSS is **pre-compiled** — do NOT run `tailwind` CLI manually.
- Config: `tailwind.home.config.js`
- Output: `assets/home.css` (committed, pre-built)
- To rebuild: `npm run build:css` (if available) or use the config file

### JavaScript
- `assets/footer-settings.js` — nav, footer, Instagram feed, language switching
- `assets/seo.js` — SEO meta tags (canonical, hreflang, og:url)
- Hero images are rendered client-side from `__HOMEPAGE_BOOTSTRAP__.heroImages[]`

### Portfolio Mosaic
Images are set directly in `index.html` (the `portfolioGallery` array in JSON is empty — HTML is the source of truth for mosaic images).

---

## Deployment

```bash
git add index.html content/homepage/de.json content/homepage/en.json
git commit -m "Your message"
git push origin main
```

Railway detects the push and auto-deploys within ~2 minutes.

### Railway Environment Variables
- `ADMIN_TOKEN` — **required** shared secret for the admin/CMS API (`X-Admin-Token` header). Without it the admin API is locked to localhost only (safe, but unusable remotely). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
- `DATA_ROOT=/data` — persistent storage for CMS uploads (set in Railway Volume)
- `RESEND_API_KEY` — for contact form emails
- `RESEND_FROM` — sender email
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — if payment features used

---

## Design Direction

- **Style:** Editorial, clean, minimal — maximally bright/white, black text
- **No beige backgrounds** — use `bg-white` not `bg-brand-surface` (which is `#EFE8DE`)
- **Brand colors** (defined in CSS):
  - `text-brand-text` = dark/black
  - `text-brand-muted` = muted gray
  - `border-brand-border` = subtle border
  - `bg-white` = pure white (preferred over brand-surface)
- **Fonts:** Playfair Display (headings), system sans-serif (body)

---

## Key Files

```
index.html                    ← Main homepage template (edit here for layout/HTML changes)
server.js                     ← Node.js server + content API
content/homepage/de.json      ← DE content (hero images, copy)
content/homepage/en.json      ← EN content
assets/home.css               ← Pre-compiled Tailwind CSS
assets/footer-settings.js     ← Nav + footer JS
assets/seo.js                 ← SEO JS
admin/index.html              ← Local CMS admin UI
railway.json                  ← Railway deployment config
package.json                  ← npm scripts
```

---

## Common Tasks

**Change hero image:**
1. Edit `content/homepage/de.json` → `heroImages[0].image`
2. Edit `content/homepage/en.json` → same field
3. Update `og:image` meta and `<link rel="preload">` in `index.html`
4. Commit + push

**Change hero text:**  
Edit the `<h1>` and eyebrow `<span>` directly in `index.html` (data-i18n attributes are decorative only)

**Add journal post:**  
Create a new `.md` file in `content/journal/` following the existing format

**Change portfolio mosaic images:**  
Edit `<img src="...">` tags directly in `index.html` in the portfolio section
