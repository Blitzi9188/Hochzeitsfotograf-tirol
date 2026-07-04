#!/bin/bash
# Komprimierung: Heli-Elopement Brixen | Jasmi & Dominik | 06.06.2026
SRC='/Volumes/2026 I/Shooting/06.06 Jasmi & Dominik | Heli Brixen/BLOG'
DEST="$(dirname "$0")/../assets/uploads"

if [ ! -d "$SRC" ]; then
  echo "❌ Quelle nicht gefunden: $SRC"
  echo "Bitte sicherstellen, dass die externe Festplatte '2026 I' angeschlossen ist."
  exit 1
fi

echo "▶ Starte Komprimierung (75% JPEG, max. 1200px)..."
COUNT=0
for i in $(seq 1 46); do
  FILE="$SRC/Blitzkneisser-Mountain-Elopement-Dolomites-BLOG-$i-2.jpg"
  [ -f "$FILE" ] || continue
  OUT="$DEST/Blitzkneisser-Heli-Elopement-Brixen-Dolomites-$i.jpg"
  sips -s format jpeg -s formatOptions 75 --resampleLongSide 1200 "$FILE" --out "$OUT" > /dev/null 2>&1
  COUNT=$((COUNT+1))
  echo "  ✓ Bild $i"
done

echo ""
echo "✅ Fertig: $COUNT Bilder komprimiert nach:"
echo "   $DEST"
