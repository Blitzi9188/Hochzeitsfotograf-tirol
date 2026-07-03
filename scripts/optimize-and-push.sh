#!/bin/bash
# Optimiert alle Pragser Wildsee Bilder und pusht alles zu GitHub

REPO="/Users/blitzkneisser/Library/CloudStorage/Dropbox/HP NEU/Hochzeitsfotograf NEU/Neuer Versuch"
UPLOADS="$REPO/assets/uploads"

echo "▶ Schritt 1: Bilder auf 1200px / 75% JPEG re-komprimieren..."
COUNT=0
for i in $(seq 5 74); do
  FILE="$UPLOADS/Blitzkneisser-Rainy-Wedding-Pragser-Wildsee-$i.jpg"
  [ -f "$FILE" ] || continue
  sips -s format jpeg -s formatOptions 75 --resampleLongSide 1200 "$FILE" --out "$FILE" > /dev/null 2>&1
  COUNT=$((COUNT+1))
  printf "  ✓ Bild %d\n" "$i"
done
echo "  → $COUNT Bilder optimiert"
echo ""

echo "▶ Schritt 2: Git – alles stagen und pushen..."
cd "$REPO"
git fsmonitor--daemon stop 2>/dev/null || true
git add -A
git status

echo ""
echo "▶ Schritt 3: Commit..."
git commit -m "Performance: Bilder 1200px + Lazy Loading Gallery"

echo ""
echo "▶ Schritt 4: Push zu GitHub → Railway..."
git push origin main

echo ""
echo "✅ Fertig! Railway deployt jetzt automatisch (~2 Minuten)."
echo "   Live: https://hochzeitsfotograf.tirol/journal/regenhochzeit-am-pragser-wildsee/"
