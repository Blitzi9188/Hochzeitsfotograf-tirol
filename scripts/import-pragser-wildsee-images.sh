#!/bin/bash
# Import + Komprimierung: Regenhochzeit Pragser Wildsee
DEST="$(dirname "$0")/../assets/uploads"
SRC="/Volumes/2026 I/Elopement/05.06 Jenny + Matt/Blog"

if [ ! -d "$SRC" ]; then
  echo "❌ Quelle nicht gefunden: $SRC"
  echo "Bitte sicherstellen, dass die externe Festplatte '2026 I' angeschlossen ist."
  exit 1
fi

echo "▶ Starte Komprimierung (82% JPEG, max. 2000px)..."
COUNT=0
for i in $(seq 1 74); do
  FILE="$SRC/Blitzkneisser-Mountain-Elopement-Dolomites-BLOG-$i.jpg"
  [ -f "$FILE" ] || continue
  OUT="$DEST/Blitzkneisser-Rainy-Wedding-Pragser-Wildsee-$i.jpg"
  sips -s format jpeg -s formatOptions 82 --resampleWidth 2000 "$FILE" --out "$OUT" > /dev/null 2>&1
  COUNT=$((COUNT+1))
  echo "  ✓ Bild $i"
done

echo ""
echo "✅ Fertig: $COUNT Bilder kopiert und komprimiert nach:"
echo "   $DEST"
echo ""
echo "Jetzt in der Website-Repo committen:"
echo "  cd \"$(dirname "$0")/..\""
echo "  git commit -am \"Neuer Journal-Eintrag: Regenhochzeit Pragser Wildsee\""
echo "  git push origin main"
