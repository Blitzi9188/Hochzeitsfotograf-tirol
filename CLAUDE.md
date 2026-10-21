# PROJEKT-IDENTITÄT — ZUERST LESEN, NAMEN SIND IRREFÜHREND

## Verbindliche Zuordnung
- Website:  hochzeitsfotograf.tirol  (Deutsch, Tirol/Innsbruck Hochzeitsfotograf)
- Git-Repo: Hochzeitsfotograf-tirol.git
- Ordner:   …/Dropbox/Neuer Versuch
- Typ:      Node.js, plain HTML (mit /assets/seo.js) — nur bestätigen, nicht darauf verlassen

## Harte Regel — vor JEDER Änderung
1. `git remote -v` ausführen. Die URL MUSS `Hochzeitsfotograf-tirol` enthalten.
   Erscheint `blitzkneisser-hub` → FALSCHES Repo → SOFORT STOPP, nichts ändern, nachfragen.
2. Canonical / SITE_URL / hreflang / og:url zeigen hier IMMER auf https://hochzeitsfotograf.tirol — NIE auf blitzkneisser.com. (Ausnahme: die E-Mail foto@blitzkneisser.com im JSON-LD ist korrekt.)
3. Verlass dich NIE auf Ordner- oder Repo-Namen. Nur `git remote -v` + diese Datei zählen.

---

# CLAUDE.md — hochzeitsfotograf.tirol

## Graphify — Strenger Modus

Für dieses Projekt existiert eine Graphify-Karte unter `graphify-out/`. Regel: Bei jeder Frage zur Codebase-Struktur, Dateibeziehungen oder Architektur zuerst `graphify-out/GRAPH_REPORT.md` lesen oder `/graphify query "..."` ausführen — niemals aus dem Gedächtnis antworten, wenn die Karte vorhanden ist.

## Hosting — aktueller Stand (Oktober 2026)

> ⚠️ **Die Website läuft LIVE über C2H.at (Plesk, hinter Cloudflare) — NICHT mehr über Railway.**

### Was gilt:
- **Live-Server:** C2H.at (Plesk), Domain `hochzeitsfotograf.tirol` via Cloudflare
- **Kein Auto-Deploy eingerichtet:** Ein `git push` deployt NICHTS automatisch nach C2H. Änderungen sind erst live, wenn der C2H-Deploy-Mechanismus (SFTP/rsync oder Plesk-Node-App) eingerichtet und konfiguriert ist. Die Zugangsdaten dafür kommen von C2H und werden nachgereicht.
- **railway.json / netlify.toml im Repo:** Veraltete Altlasten — beschreiben NICHT den aktuellen Live-Weg, nicht löschen, aber ignorieren.

### ⚠️ Railway NICHT abschalten (solange Server-Funktionen noch dort laufen):
Dieses Projekt ist eine **Node.js-App mit Server-Teil** (`server.js`, CMS-API, Kontaktformular, Uploads). Diese Server-Funktionen laufen derzeit noch über Railway. Railway darf erst abgeschaltet werden, wenn die gesamte App inklusive Kontaktformular und Uploads nachweislich auf C2H läuft und getestet ist.

### Referenzen:
- **GitHub:** https://github.com/Blitzi9188/Hochzeitsfotograf-tirol.git
- **Live site:** https://hochzeitsfotograf.tirol

### Technische Beobachtung (Live-Check 21.10.2026) — bitte vor dem C2H-Umzug klären
Beim Live-Abgleich ergaben sich Punkte, die zur obigen Zuordnung noch verifiziert werden sollten:
- **`blitzkneisser.com`** antwortet über `server: nginx` und liefert **genau diese Node-App aus** (server-seitig injiziertes `window.__HOMEPAGE_BOOTSTRAP__` / `__SITE_ORIGIN__`), Canonical = `https://blitzkneisser.com/`.
- **`hochzeitsfotograf.tirol`** antwortet über `server: cloudflare` und zeigt **eine andere Seite** (kein `__HOMEPAGE_BOOTSTRAP__`, separate Vite-SPA).
- Im Repo setzt `server.js` (Commit `cd311b3`, 07.10.2026) `SITE_ORIGIN = "https://hochzeitsfotograf.tirol"`, **live sendet `blitzkneisser.com` jedoch weiterhin `blitzkneisser.com`** als Origin/Canonical.
- **Konsequenz:** Welche Domain genau auf C2H und welche (noch) auf Railway bzw. Cloudflare läuft, ist vor dem Umzug zu bestätigen — sonst drohen falsche Canonicals. Dieser Hinweis ändert nichts an den obigen Deploy-Regeln, er markiert nur offenen Klärungsbedarf.

## Project Overview

Wedding photography website for Blitzkneisser. Node.js server with file-based CMS (no database). Content is edited via JSON/Markdown files.

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

> ⚠️ **VERALTET — beschreibt den alten Railway-Weg, NICHT den aktuellen Live-Weg.** Maßgeblich ist oben „## Hosting — aktueller Stand": Live läuft über **C2H.at (Plesk, hinter Cloudflare)**, und es ist **kein Auto-Deploy** eingerichtet — ein `git push` bringt derzeit NICHTS automatisch online, bis der C2H-Deploy (SFTP/rsync oder Plesk-Node-App) konfiguriert ist (Zugangsdaten kommen von C2H). Railway nicht abschalten, solange Server-Teil/Kontaktformular noch dort laufen.

```bash
git add index.html content/homepage/de.json content/homepage/en.json
git commit -m "Your message"
git push origin main
```

Railway detects the push and auto-deploys within ~2 minutes. *(Historischer Railway-Flow — aktuell NICHT der Live-Weg, siehe Warnung oben.)*

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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
