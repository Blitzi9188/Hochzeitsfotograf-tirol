---
name: blitzkneisser-journal-publish
description: >
  Kompletter Journal-Workflow für hochzeitsfotograf.tirol: Beitrag aus Bildern +
  Stichpunkten erstellen, Bilder nach assets/uploads/ kopieren, lokal im Browser
  zur Kontrolle öffnen, nach Freigabe pushen UND auf den Live-Server stellen
  (Railway-Volume!). Nutzen, wenn Andreas sagt "neues Journal erstellen",
  "neuer Journal-Beitrag", "neuer Post" o. Ä. und Bilder (Ordner/Anhänge) +
  Text/Stichpunkte liefert.
---

# Blitzkneisser Journal: Erstellen → Kontrolle → Live

Du erstellst und veröffentlichst einen Journal-Beitrag für hochzeitsfotograf.tirol
(Blitzkneisser Photography, Andreas Kiss). Der Workflow läuft in 4 Phasen und
stoppt genau EINMAL: nach der lokalen Vorschau zur Freigabe.

## Was Andreas liefert

- **Bilder**: Ordnerpfad (z. B. `Vorab/`), Dropbox-Link oder Anhänge
- **Text oder Stichpunkte**: Paar (oder anonym), Location, Art (Elopement /
  Helikopter / Standesamt / After-Wedding …), Ablauf des Tages
- Fehlt eine Pflichtangabe (Art, Location), kurz nachfragen – sonst loslegen.

## Phase 1 – Beitrag erstellen

### Bilder vorbereiten
1. Bilder ansehen (mindestens 4–6 repräsentative), um den Erzählbogen zu verstehen:
   Ankunft → Höhepunkt → ruhiger Ausklang.
2. Falls die Dateien noch nicht der Namenskonvention folgen, umbenennen:
   `Blitzkneisser-[Thema]-[Location]-[Nr].jpg` (keine Umlaute, Bindestriche).
   Folgen sie ihr bereits (wie in `Vorab/`), Namen unverändert lassen.
3. Alle Bilder nach `assets/uploads/` kopieren.
4. **Featured Image muss Querformat sein** (Hochformat wird im Header hässlich
   beschnitten). Bei Unsicherheit Abmessungen mit `sips -g pixelWidth -g
   pixelHeight` prüfen.

### Markdown-Datei schreiben
Datei: `content/journal/YYYY-MM-DD-[slug].md`. Der Slug ist der Dateiname OHNE
Datumspräfix – so wird er zur URL `/journal/[slug]/`.

**WICHTIG – die echte Struktur:** Der gesamte Inhalt lebt in YAML-Feldern.
Der Markdown-Body unter `---` bleibt LEER. Die Render-Reihenfolge auf der Seite:

1. `title` (H1) + Byline
2. `body` → Einleitungstext (erscheint vor der ersten Galerie)
3. Erste Bilder der `gallery` (ca. 4–6 Einleitungsbilder)
4. `galleryIntroHeading` → Hook-Zwischenüberschrift in GROSSBUCHSTABEN,
   meinungsstark („WARUM DIESER TAG NICHT FÜR ALLE IST")
5. `galleryIntroText` → zweiter Textblock (Haltung/These)
6. Restliche `gallery`-Bilder
7. `galleryOutroHeading` + `galleryOutroText` → Abschluss/CTA mit
   `www.hochzeitsfotograf.tirol/contact/`

Pflichtfelder (alle zweisprachig DE + En-Variante):

```yaml
---
lang: de
title: …                      # + titleEn
author: Blitzkneisser
date: "YYYY-MM-DDTHH:00:00.000Z"
readingTime: ""
seoTitle: … | Blitzkneisser   # ≤60 Zeichen, + seoTitleEn
seoDescription: …             # 150–160 Zeichen, CTA am Ende, + seoDescriptionEn
featuredImage: /assets/uploads/…   # QUERFORMAT!
featuredImageAlt: …           # + featuredImageAltEn
teaserDescription: "…"        # kurz, 1–2 Sätze, + teaserDescriptionEn
body: "…\n\n…"                # mehrzeilig mit \n\n, + bodyEn
galleryIntroHeading: "…"      # + galleryIntroHeadingEn
galleryIntroText: "…\n\n…"    # + galleryIntroTextEn
galleryOutroHeading: "…"      # + galleryOutroHeadingEn
galleryOutroText: "…\n\nwww.hochzeitsfotograf.tirol/contact/"  # + galleryOutroTextEn
showToc: false
gallery:
  - image: /assets/uploads/…
    alt: …        # Deutsch, beschreibend + Keyword (z. B. "– Elopement Fotograf Tirol")
    altEn: …      # WICHTIG: wird automatisch zur Pinterest-Beschreibung!
    link: ""
---
```

### Alt-Texte & Pinterest
- `alt` (DE): beschreibend, keyword-nah, Muster
  „[Motiv] am [Location] – Hochzeitsfotograf Tirol / Elopement Dolomiten".
- `altEn` (EN): **PFLICHT für ausnahmslos JEDES Bild** (jedes gallery-Item UND
  `featuredImageAltEn`). Pinterest-Pins müssen IMMER eine englische
  Beschreibung tragen – egal ob der Besucher die Seite auf Deutsch oder
  Englisch ansieht. Das Template erzwingt das bereits (`pinAlt = altEn || alt`
  – Fallback auf `alt` wäre Deutsch!), deshalb darf `altEn` nie fehlen und nie
  leer sein. Aus `altEn` wird automatisch die Pin-Beschreibung gebaut
  (`altEn` + Titel + „Dolomites mountain elopement photography by
  Blitzkneisser."). Also: englisch, suchstark, natürlich formuliert, pro Bild
  einzigartig.
- KEIN globales `pinDescription`-Feld setzen – es würde alle Bilder mit
  demselben Text überschreiben und die individuellen altEn-Pins deaktivieren.

### Tonfall (House-Style)
Deutsch (Österreich), Paar-Ansprache „ihr/euch", Andreas in Ich-Form. Ruhig,
ehrlich, meinungsstark mit Haltung – kein Kitsch, keine Superlativ-Ketten.
Starker Gegensatz als Hook (Standard-Hochzeit vs. dieser Tag). Länge body +
galleryIntroText zusammen ca. 300–500 Wörter.

## Phase 2 – Lokale Kontrolle (STOPP-Punkt)

1. Dev-Server starten: `preview_start` mit `name: "homepage"` (Port 8001).
2. Browser-Tab öffnen: `http://localhost:8001/journal/[slug]/`
3. Screenshot(s) zeigen: Titel/Hero, body-Text, Hook-Überschrift, Galerien.
4. **WARTEN auf Freigabe von Andreas.** Korrekturen einarbeiten, erneut zeigen.

## Phase 3 – Veröffentlichen (nach Freigabe)

1. Git: `git add content/journal/[datei].md assets/uploads/[bilder]` →
   Commit → `git push origin main`.
2. **Railway-Volume-Falle beachten:** Der Live-Server seedet vom Repo nur
   Dateien, die auf dem Volume (`DATA_ROOT=/data`) noch NICHT existieren.
   - **Neuer Beitrag + neue Bilder:** Git-Push reicht, alles wird geseedet.
     Nach ~2 Min. live verifizieren:
     `curl -sS "https://hochzeitsfotograf.tirol/api/journal-entry?slug=[slug]" | head -c 300`
   - **Bestehende Datei geändert:** Git-Push wirkt NICHT auf den Live-Server.
     Dann Payload für die CMS-API auf den Desktop schreiben:
     ```
     node -e "const fs=require('fs');const c=fs.readFileSync('content/journal/[datei].md','utf8');fs.writeFileSync(process.env.HOME+'/Desktop/journal-payload.json',JSON.stringify({path:'content/journal/[datei].md',content:c}))"
     ```
     und Andreas diesen Befehl selbst ausführen lassen (der Classifier blockiert
     POSTs auf die Produktions-API aus Claude heraus):
     ```
     curl -sS -X POST "https://hochzeitsfotograf.tirol/api/file" -H "Content-Type: application/json" --data-binary @"$HOME/Desktop/journal-payload.json"
     ```
     Erwartete Antwort: `{"ok":true}`. Danach per
     `/api/journal-entry?slug=…` verifizieren.

## Phase 4 – Abschluss-Info an Andreas

- Live-URL nennen: `https://hochzeitsfotograf.tirol/journal/[slug]/`
- CMS-Hinweis: Der Beitrag ist automatisch im Admin-CMS editierbar unter
  `https://hochzeitsfotograf.tirol/admin/` (Datei
  `content/journal/[datei].md`) – dort kann Andreas Tippfehler sofort selbst
  korrigieren; Änderungen sind ohne Deploy live.
- Kurz auflisten: Anzahl Bilder, Featured Image, Slug, was noch offen ist.

## Qualitätscheck vor Phase 2

- Struktur korrekt (Inhalt in YAML-Feldern, Markdown-Body leer)?
- Featured Image Querformat?
- Jedes Bild hat `alt` (DE) UND `altEn` (EN) – `altEn` nirgends leer? Pinterest
  bekommt IMMER Englisch, unabhängig von der Seitensprache.
- Kein globales `pinDescription` gesetzt?
- seoTitle ≤60 Z., seoDescription 150–160 Z., beide zweisprachig?
- Bildreihenfolge folgt der Geschichte (Morgen → Höhepunkt → Abend)?
- Keine erfundenen Fakten (Namen, Orte, Dienstleister)?
