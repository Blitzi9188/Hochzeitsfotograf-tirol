import fs from "node:fs";
import path from "node:path";

const root = "/Users/blitzkneisser/Library/CloudStorage/Dropbox/HP NEU/Hochzeitsfotograf NEU/Neuer Versuch";
const guidesDir = path.join(root, "guides");
const placeholdersDir = path.join(root, "assets", "guide-placeholders");
const translationCachePath = path.join(root, "scripts", ".guide-translation-cache.json");
const baseGuidePath = path.join(guidesDir, "best-time-for-a-dolomites-elopement", "index.html");
const baseGuideHtml = fs.readFileSync(baseGuidePath, "utf8");
const baseTitleTag = baseGuideHtml.match(/<title>[\s\S]*?<\/title>/)?.[0];
const baseDescriptionTag = baseGuideHtml.match(/<meta\s*\n\s*name="description"[\s\S]*?\n\s*>/)?.[0];

const pageDataStart = baseGuideHtml.indexOf("    const pageData = {");
const pageDataEnd = baseGuideHtml.indexOf("\n\n    const params = new URLSearchParams");
if (pageDataStart === -1 || pageDataEnd === -1) {
  throw new Error("Could not locate pageData block in base guide template.");
}
if (!baseTitleTag || !baseDescriptionTag) {
  throw new Error("Could not locate title or description template in base guide.");
}

const templateBeforeData = baseGuideHtml.slice(0, pageDataStart);
const templateAfterData = baseGuideHtml.slice(pageDataEnd);

const replaceOnce = (input, pattern, replacement) => input.replace(pattern, replacement);

const translationCache = fs.existsSync(translationCachePath)
  ? JSON.parse(fs.readFileSync(translationCachePath, "utf8"))
  : {};

const protectedTerms = [
  "Lake Como",
  "Lago di Braies",
  "Seceda",
  "Cadini di Misurina",
  "Tre Cime",
  "Alpe di Siusi",
  "Lago di Sorapis",
  "Val di Funes",
  "Cortina d’Ampezzo",
  "Val Gardena",
  "Pragser Wildsee",
  "Seiser Alm",
  "Lake Braies"
];

const germanReplacements = [
  ["Durchbrennen", "Elopement"],
  ["durchzubrennen", "zu elopen"],
  ["Leitfaden", "Guide"],
  ["Führung", "Guide"],
  ["Planungsleitfaden", "Planungs-Guide"],
  ["Lageführer", "Location Guide"],
  ["Fakten zum Leitfaden", "Guide-Fakten"],
  ["Weitere Anleitungen", "Weitere Guides"],
  ["Beste Zeit für einen Dolomites Elopement", "Beste Zeit für ein Dolomiten-Elopement"],
  ["Dolomites Elopement Guide", "Dolomiten-Elopement Guide"],
  ["Dolomites wedding", "Dolomiten-Hochzeit"],
  ["Lake Como wedding", "Lake-Como-Hochzeit"],
  ["North Tyrol", "Nordtirol"],
  ["South Tyrol", "Südtirol"],
  ["Tyrol", "Tirol"],
  ["Dolomites", "Dolomiten"],
  ["Austria", "Österreich"],
  ["Italy", "Italien"],
  ["Lake Braies", "Lago di Braies"],
  ["Beginnen Sie mit der Planung", "Planung starten"],
  ["Planen Sie", "Plant"],
  ["Sie", "ihr"],
  ["Ihnen", "euch"],
  ["Ihre", "eure"],
  ["Ihr", "euer"],
  ["Fragen Sie jetzt an", "Termin anfragen"],
  ["Jetzt anfragen", "Termin anfragen"],
  ["Fakten zum Guide", "Guide-Fakten"],
  ["Eine kleine Philosophie", "Ein leiser Einstieg"],
  ["Crowd-Level", "Crowd Level"],
  ["Massenrealität", "Crowd Reality"],
  ["Zugriffsschwierigkeit", "Zugang"],
  ["Am besten für", "Ideal für"],
  ["Beste Standorte", "Die schönsten Orte"],
  ["Heben und gehen", "Lift und kurzer Fußweg"],
  ["Der Maßstab ist offensichtlich. Die Ruhe ist es oft nicht.", "Die Größe ist offensichtlich. Die Ruhe oft nicht."],
  ["Paare zieht es in den ruhigen Maßstab", "Paare, die sich nach Ruhe und Weite sehnen"],
  ["Der Dolomiten", "die Dolomiten"],
  ["im Dolomiten", "in den Dolomiten"],
  ["ein Dolomiten Elopement", "ein Dolomiten-Elopement"],
  ["Dolomiten Elopement", "Dolomiten-Elopement"],
  ["Dolomiten wedding", "Dolomiten-Hochzeit"],
  ["Read the season guide", "Saison-Guide lesen"],
  ["Read the Lago di Braies guide", "Lago-di-Braies-Guide lesen"],
  ["Read the Seceda guide", "Seceda-Guide lesen"],
  ["Read the Cadini guide", "Cadini-Guide lesen"],
  ["Read the Tre Cime guide", "Tre-Cime-Guide lesen"],
  ["Read the Alpe di Siusi guide", "Alpe-di-Siusi-Guide lesen"],
  ["Read the Lago di Sorapis guide", "Lago-di-Sorapis-Guide lesen"],
  ["Read the Val di Funes guide", "Val-di-Funes-Guide lesen"],
  ["Read the Cortina guide", "Cortina-Guide lesen"],
  ["Read the lake guide", "Lake-Guide lesen"],
  ["Read the helicopter guide", "Helikopter-Guide lesen"],
  ["Read the multi-day guide", "Mehrtages-Guide lesen"],
  ["Read the styling guide", "Styling-Guide lesen"],
  ["Read the main guide", "Hauptguide lesen"],
  ["See weather & backup planning", "Weather-&-Backup-Guide lesen"],
  ["Entdecken ihr die besten Standorte", "Entdeckt die schönsten Orte"],
  ["Lesen ihr den ", "Lest den "],
  ["Lesen ihr die ", "Lest die "],
  ["Lesen ihr das ", "Lest das "],
  ["Lassen ihr uns etwas gestalten, das sich für ihr ruhig, persönlich und zutiefst treu anfühlt.", "Lasst uns etwas gestalten, das sich ruhig, persönlich und zutiefst wahr anfühlt."],
  ["Wenn sich dieser Guide bereits so anfühlt, wie ihr sich den Tag wünschen, helfe ich euch gerne dabei, dieses Gefühl in etwas Ruhiges, Filmisches und wirklich Eigenes in den Bergen zu verwandeln.", "Wenn sich dieser Guide bereits nah an dem anfühlt, was ihr euch wünscht, helfe ich euch gern dabei, dieses Gefühl in etwas Ruhiges, Filmisches und wirklich Eigenes in den Bergen zu verwandeln."],
  ["Wählen ihr ", "Wählt "],
  ["Lassen ihr ", "Lasst "],
  ["Beginnen ihr ", "Beginnt "],
  ["Gönnen ihr sich", "Gönnt euch"],
  ["wenn ihr sich", "wenn ihr euch"],
  ["wie ihr sich", "wie ihr euch"],
  ["die Art von Tag passt, die ihr sich tatsächlich wünschen", "die Art von Tag passt, die ihr euch tatsächlich wünscht"],
  ["die Art von Privatsphäre, die ihr sich wünschen", "die Art von Privatsphäre, die ihr euch wünscht"],
  ["wie ruhig, dramatisch, zugänglich oder wetterflexibel ihr sich den Tag wünschen", "wie ruhig, dramatisch, zugänglich oder wetterflexibel ihr euch den Tag wünscht"],
  ["Der Winter kann unvergesslich werden, wenn ihr sich eine ruhigere Gefühlswelt wünschen und bereit sind für eine andere Art der Planung.", "Der Winter kann unvergesslich werden, wenn ihr euch eine ruhigere Gefühlswelt wünscht und bereit seid für eine andere Art der Planung."],
  ["Paare werden von der Atmosphäre angezogen", "Paare, die Atmosphäre lieben"],
  ["Es hilft euch, ein Gefühl auszuwählen.", "Er hilft euch, ein Gefühl zu wählen."],
  ["Wählt die zweite Staffel", "Wählt dann die Jahreszeit"],
  ["Plant es, kämpfen ihr nicht dagegen", "Plant dafür, statt dagegen anzukämpfen"],
  ["Lassen ihr Platz im Plan", "Lasst Platz im Ablauf"],
  ["Wählen ihr zuerst die Stimmung", "Wählt zuerst das Gefühl"],
  ["Ein Sonnenaufgang, der ihr erschöpft, ist nicht immer besser als ein Sonnenuntergang, bei dem ihr sich präsent fühlen.", "Ein Sonnenaufgang, der euch erschöpft, ist nicht automatisch besser als ein Sonnenuntergang, bei dem ihr euch wirklich präsent fühlen könnt."],
  ["Wählen ihr die Version des Tages, die ihr beim Erleben noch genießen können.", "Wählt die Tageszeit, die ihr auch im Erleben wirklich genießen könnt."],
  ["Wählen ihr Kleidung, die sich gut bewegen lässt.", "Wählt Kleidung, in der ihr euch gut bewegen könnt."],
  ["Wählen ihr geeignete Bergschuhe.", "Wählt verlässliche Bergschuhe."],
  ["Wählen ihr nach Möglichkeit einen Wochentag.", "Wenn möglich, wählt einen Wochentag."],
  ["Wählen ihr diesen Ort nur, wenn sich die Route auch sinnvoll anfühlt.", "Wählt diesen Ort nur, wenn sich die Route auch wirklich richtig anfühlt."],
  ["Wählen ihr berühmte Orte sorgfältig und nicht ängstlich aus.", "Wählt ikonische Orte bewusst und ohne Angst."],
  ["Beginnt ihr mit dem gewünschten Gefühl, nicht mit dem Ort.", "Beginnt mit dem Gefühl, nicht mit dem Ort."],
  ["Danach grenzen ihr den Ort ein, bauen den Zugang und die Zeitleiste rund um das Licht auf und fügen schließlich die Details hinzu: wo ihr übernachten, was ihr anziehen, wie viel Spazierengehen sinnvoll ist und ob der Tag ruhig oder abenteuerlich sein soll.", "Danach grenzt ihr den Ort ein, baut Zugang und Tagesrhythmus rund um das Licht auf und ergänzt erst dann die Details: wo ihr übernachtet, was ihr tragt, wie viel Weg für euch stimmig ist und ob sich der Tag ruhig oder abenteuerlich anfühlen soll."]
  ,["Der See funktioniert am besten, wenn die Anstrengung zu der Art von Tag passt, die ihr sich tatsächlich wünschen.", "Der See funktioniert am besten, wenn die Anstrengung zu der Art von Tag passt, die ihr euch tatsächlich wünscht."]
  ,["Wählen ihr, was ihr tatsächlich betreten können.", "Wählt, was ihr tatsächlich tragen und darin auch gehen könnt."]
  ,["Wenn Intimität wichtig ist, bauen ihr auf die ruhigsten Stunden auf und bewegen ihr sich, bevor der Strom zunimmt.", "Wenn Intimität wichtig ist, setzt auf die ruhigsten Stunden und bewegt euch, bevor der Strom zunimmt."]
];

const shouldSkipTranslation = (key) => new Set([
  "slug",
  "href",
  "image",
  "icon",
  "linkHref",
  "layout",
  "seasonOrder"
]).has(key);

const protectText = (text) => {
  const replacements = [];
  let output = text;
  protectedTerms
    .sort((a, b) => b.length - a.length)
    .forEach((term, index) => {
      const token = `__TERM_${index}__`;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "g");
      if (regex.test(output)) {
        output = output.replace(regex, token);
        replacements.push([token, term]);
      }
    });
  return { output, replacements };
};

const restoreProtectedText = (text, replacements) =>
  replacements.reduce((acc, [token, term]) => acc.replaceAll(token, term), text);

const polishGerman = (text) => {
  let output = text;
  for (const [from, to] of germanReplacements) {
    output = output.replaceAll(from, to);
  }
  const regexReplacements = [
    [/\bWischen ihr\b/g, "Wischt"],
    [/\bÜberprüfen ihr\b/g, "Prüft"],
    [/\bBleiben ihr\b/g, "Bleibt"],
    [/\bNutzen ihr\b/g, "Nutzt"],
    [/\bBehalten ihr\b/g, "Behaltet"],
    [/\bVerlassen ihr\b/g, "Verlasst"],
    [/\bVerwenden ihr\b/g, "Verwendet"],
    [/\bHalten ihr\b/g, "Haltet"],
    [/\bDenken ihr\b/g, "Denkt"],
    [/\bLieben ihr\b/g, "Liebt"],
    [/\bSeien ihr\b/g, "Seid"],
    [/\bMischen ihr\b/g, "Mischt"],
    [/\bVergessen ihr\b/g, "Vergesst"],
    [/\bBauen ihr\b/g, "Baut"],
    [/\bArbeiten ihr\b/g, "Arbeitet"],
    [/\bBenutzen ihr\b/g, "Nutzt"],
    [/\bFangen ihr\b/g, "Fangt"],
    [/\bPlanen ihr\b/g, "Plant"],
    [/\bihrhe\b/g, "eure"],
    [/\bihr entfalten sich\b/g, "sie entfalten sich"],
    [/\bihr fühlen sich\b/g, "sie fühlen sich"],
    [/\bihr sind\b/g, "sie sind"],
    [/\bihr haben\b/g, "ihr habt"],
    [/\bihr können\b/g, "ihr könnt"],
    [/\bihr werden\b/g, "ihr werdet"],
    [/\bihr gehen\b/g, "ihr geht"],
    [/\bihr ankommen\b/g, "ihr ankommt"],
    [/\bihr meinen\b/g, "ihr meint"],
    [/\bihr wünschen\b/g, "ihr wünscht"],
    [/\bihr möchten\b/g, "ihr möchtet"],
    [/\bihr lieben\b/g, "ihr liebt"],
    [/\bihr brauchen\b/g, "ihr braucht"],
    [/\bihr sollten\b/g, "ihr solltet"],
    [/\bihr vertrauen\b/g, "ihr vertraut"],
    [/\bihr schätzen\b/g, "ihr schätzt"],
    [/wenn ihr mehr Ruhe und eine sanftere Atmosphäre wünschen/gi, "wenn ihr euch mehr Ruhe und eine sanftere Atmosphäre wünscht"],
    [/wenn ihr einen völlig unbegrenzten Zeitrahmen wünschen/gi, "wenn ihr euch einen völlig offenen Zeitrahmen wünscht"],
    [/wenn ihr Offenheit mehr schätzen als behagliche Wärme/gi, "wenn ihr Offenheit mehr schätzt als behagliche Wärme"],
    [/wenn ihr euch eine ruhigere Gefühlswelt wünschen und bereit sind/gi, "wenn ihr euch eine ruhigere Gefühlswelt wünscht und bereit seid"],
    [/wenn ihr möchten, dass sich der See ruhig/gi, "wenn ihr möchtet, dass sich der See ruhig"],
    [/wenn ihr einen entspannten, gastfreundlichen Tag wünschen/gi, "wenn ihr euch einen entspannten, gastfreundlichen Tag wünscht"],
    [/wenn ihr etwas Weicheres, Leiseres und weniger Exponiertes wünschen/gi, "wenn ihr euch etwas Weicheres, Leiseres und weniger Exponiertes wünscht"],
    [/wenn ihr eine klassische, unverwechselbare Dolomitenlandschaft wünschen/gi, "wenn ihr euch eine klassische, unverwechselbare Dolomitenlandschaft wünscht"],
    [/wenn ihr mehr Platz wünschen/gi, "wenn ihr euch mehr Raum wünscht"],
    [/wenn ihr beim Erleben noch genießen können/gi, "die ihr auch im Erleben wirklich genießen könnt"],
    [/die ihr an diesem Tag spüren werden/gi, "die ihr an diesem Tag spüren werdet"],
    [/Einige Teile fühlen sich öffentlich an, andere sind viel persönlicher, je nachdem, wohin ihr gehen\./gi, "Einige Teile fühlen sich öffentlicher an, andere deutlich persönlicher, je nachdem, wohin ihr geht."],
    [/Da ihr nicht mehr zum ersten Mal ankommen, fühlt sich/gi, "Da ihr nicht mehr zum ersten Mal ankommt, fühlt sich"],
    [/Das richtige Kleid macht nicht nur Fotos gut\. Damit können ihr/gi, "Das richtige Kleid sieht nicht nur gut aus. Darin könnt ihr"],
    [/Denken ihr im Voraus über die erste Stunde des Tages nach\./gi, "Denkt früh über die erste Stunde des Tages nach."],
    [/Eine zweite Option ist am hilfreichsten, wenn ihr sie bereits lieben\./gi, "Eine zweite Option ist am hilfreichsten, wenn ihr sie bereits liebt."],
    [/Lieben ihr die Alternative, bevor ihr sie brauchen\./gi, "Liebt die Alternative, bevor ihr sie braucht."],
    [/Es kann sein, dass ihr zu spät ankommen\./gi, "Es kann sein, dass ihr zu spät ankommt."],
    [/Nicht schwer, aber ihr sollten damit rechnen/gi, "Nicht schwer, aber ihr solltet damit rechnen"],
    [/Verwenden ihr es als Orientierung, nicht als Urteil\./gi, "Verwendet es als Orientierung, nicht als Urteil."],
    [/Wählt die Version des Tages, die ihr beim Erleben noch genießen können\./gi, "Wählt die Version des Tages, die ihr auch im Erleben wirklich genießen könnt."],
    [/\s{2,}/g, " "]
  ];
  for (const [pattern, replacement] of regexReplacements) {
    output = output.replace(pattern, replacement);
  }
  return output;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const translateText = async (text) => {
  if (!text || !text.trim()) return text;
  if (translationCache[text]) return polishGerman(translationCache[text]);

  const { output, replacements } = protectText(text);
  const endpoint = new URL("https://translate.googleapis.com/translate_a/single");
  endpoint.searchParams.set("client", "gtx");
  endpoint.searchParams.set("sl", "en");
  endpoint.searchParams.set("tl", "de");
  endpoint.searchParams.set("dt", "t");
  endpoint.searchParams.set("q", output);

  let translated = text;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      translated = polishGerman(restoreProtectedText(
        data?.[0]?.map((chunk) => chunk?.[0] ?? "").join("") ?? text,
        replacements
      ));
      break;
    } catch (error) {
      lastError = error;
      await sleep(300 * (attempt + 1));
    }
  }

  if (lastError && translated === text) {
    console.warn(`Translation fallback used for: ${text.slice(0, 80)}`);
  }

  translationCache[text] = translated;
  return translated;
};

const localizeValue = async (value, key = "") => {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => localizeValue(item)));
  }
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value).map(async ([childKey, childValue]) => {
        if (shouldSkipTranslation(childKey)) {
          return [childKey, childValue];
        }
        return [childKey, await localizeValue(childValue, childKey)];
      })
    );
    return Object.fromEntries(entries);
  }
  if (typeof value === "string") {
    if (shouldSkipTranslation(key) || value.startsWith("/") || value.startsWith("http")) {
      return value;
    }
    return translateText(value);
  }
  return value;
};

const localizePage = async (page) => ({
  de: await localizeValue(page),
  en: page
});

const makePlaceholderSvg = (label, subtitle) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="960" viewBox="0 0 1600 960" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="960" fill="#F7F3ED"/>
  <rect x="58" y="58" width="1484" height="844" rx="0" fill="url(#paint0_linear)"/>
  <path d="M0 724C213 666 314 614 420 556C531 496 616 418 719 418C837 418 883 482 981 482C1094 482 1205 373 1361 373C1452 373 1517 396 1600 443V960H0V724Z" fill="#E9E0D5"/>
  <path d="M0 804C192 754 319 706 454 625C565 559 657 531 755 531C847 531 936 568 1048 568C1168 568 1275 505 1386 505C1470 505 1547 530 1600 560V960H0V804Z" fill="#DDD2C4"/>
  <path d="M0 848C171 788 311 748 436 690C575 626 658 596 781 596C887 596 980 622 1086 622C1202 622 1327 579 1449 579C1526 579 1572 588 1600 599V960H0V848Z" fill="#D2C5B4"/>
  <circle cx="800" cy="480" r="232" fill="white" fill-opacity="0.35"/>
  <path d="M142 798C282 730 355 660 481 560C553 503 637 452 741 452C839 452 923 497 1032 497C1142 497 1238 420 1358 420" stroke="#C8BAA6" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="7 10"/>
  <path d="M197 708C294 653 389 622 517 556C627 500 717 500 835 500C933 500 1047 527 1162 500C1261 477 1332 431 1423 397" stroke="#C8BAA6" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="7 10"/>
  <text x="92" y="116" fill="#8A837A" font-family="Inter, Arial, sans-serif" font-size="20" letter-spacing="6" text-transform="uppercase">${label}</text>
  <text x="92" y="170" fill="#1B1A18" font-family="Georgia, 'Times New Roman', serif" font-size="68">${subtitle}</text>
  <text x="92" y="860" fill="#8A837A" font-family="Inter, Arial, sans-serif" font-size="18" letter-spacing="5" text-transform="uppercase">Replace with your final image</text>
  <defs>
    <linearGradient id="paint0_linear" x1="800" y1="58" x2="800" y2="902" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FBF8F3"/>
      <stop offset="1" stop-color="#EEE4D7"/>
    </linearGradient>
  </defs>
</svg>
`;

const placeholderFiles = {
  IMAGE_PLACEHOLDER_LAGO_DI_BRAIES: ["Lago di Braies", "Quiet Water & First Light"],
  IMAGE_PLACEHOLDER_SECEDA: ["Seceda", "Ridgelines & Open Sky"],
  IMAGE_PLACEHOLDER_CADINI: ["Cadini di Misurina", "Cinematic Peaks & Edges"],
  IMAGE_PLACEHOLDER_TRE_CIME: ["Tre Cime", "Iconic Forms & High Light"],
  IMAGE_PLACEHOLDER_HELICOPTER: ["Helicopter Elopement", "Remote Views & Quiet Access"],
  IMAGE_PLACEHOLDER_COUPLE_SUNRISE: ["Sunrise Elopement", "Soft First Light"],
  IMAGE_PLACEHOLDER_WINTER_ELOPEMENT: ["Winter Elopement", "Snow, Silence & Texture"],
  IMAGE_PLACEHOLDER_ALPE_DI_SIUSI: ["Alpe di Siusi", "Wide Meadows & Easy Space"],
  IMAGE_PLACEHOLDER_LAGO_DI_SORAPIS: ["Lago di Sorapis", "Turquoise Water & Hike"],
  IMAGE_PLACEHOLDER_VAL_DI_FUNES: ["Val di Funes", "Quiet Valley & Church Views"],
  IMAGE_PLACEHOLDER_CORTINA: ["Cortina d’Ampezzo", "Dolomite Town & Peaks"],
  IMAGE_PLACEHOLDER_DOLOMITES_GUIDE: ["Dolomites Elopement Guide", "Thoughtful Planning in the Mountains"],
  IMAGE_PLACEHOLDER_WEATHER: ["Weather Planning", "Fog, Wind & Flexibility"],
  IMAGE_PLACEHOLDER_STYLE: ["Mountain Styling", "Layers, Movement & Warmth"],
  IMAGE_PLACEHOLDER_MULTI_DAY: ["Multi-Day Experience", "Slow Rhythms & More Time"]
};

fs.mkdirSync(placeholdersDir, { recursive: true });
for (const [fileName, [label, subtitle]] of Object.entries(placeholderFiles)) {
  fs.writeFileSync(
    path.join(placeholdersDir, `${fileName}.svg`),
    makePlaceholderSvg(label, subtitle),
    "utf8"
  );
}

const placeholder = (name) => `/assets/guide-placeholders/${name}.svg`;

const fact = (label, value, icon) => ({ label, value, icon });

const relatedGuides = (currentSlug) => {
  const all = [
    {
      label: "Dolomites",
      title: "Dolomites Elopement Guide",
      copy: "A calm starting point for locations, weather, permits and the overall rhythm of the mountains.",
      href: "/guides/dolomites-elopement-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_DOLOMITES_GUIDE")
    },
    {
      label: "Locations",
      title: "Best Dolomites Elopement Locations",
      copy: "A quieter overview of places like Lago di Braies, Seceda, Tre Cime and Cadini di Misurina.",
      href: "/guides/best-dolomites-elopement-locations/",
      image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME")
    },
    {
      label: "Locations",
      title: "Lago di Braies Guide",
      copy: "Still water, first light and honest notes on when this iconic lake truly feels quiet.",
      href: "/guides/lago-di-braies-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES")
    },
    {
      label: "Locations",
      title: "Seceda Guide",
      copy: "Open ridgelines, wind, lift access and the calmer hours that make Seceda feel personal.",
      href: "/guides/seceda-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_SECEDA")
    },
    {
      label: "Locations",
      title: "Cadini di Misurina Guide",
      copy: "Cinematic peaks, sunrise access and practical notes for one of the most dramatic settings.",
      href: "/guides/cadini-di-misurina-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_CADINI")
    },
    {
      label: "Locations",
      title: "Tre Cime Wedding Guide",
      copy: "A guide to timing, access and crowd rhythm around one of the most iconic Dolomites landscapes.",
      href: "/guides/tre-cime-wedding-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME")
    },
    {
      label: "Locations",
      title: "Val di Funes Guide",
      copy: "A quieter valley perspective with softer light, gentler access and pastoral mountain atmosphere.",
      href: "/guides/val-di-funes-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_VAL_DI_FUNES")
    },
    {
      label: "Locations",
      title: "Cortina d’Ampezzo Guide",
      copy: "Mountain atmosphere with a little more ease, comfort and flexibility around the day.",
      href: "/guides/cortina-dampezzo-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_CORTINA")
    },
    {
      label: "Planning",
      title: "Best Time for a Dolomites Elopement",
      copy: "A calm guide to seasons, weather, light and when the mountains may feel most like you.",
      href: "/guides/best-time-for-a-dolomites-elopement/",
      image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE")
    },
    {
      label: "Planning",
      title: "Sunrise vs Sunset in the Mountains",
      copy: "A thoughtful comparison of first light, later evenings, crowd rhythm and real mountain timing.",
      href: "/guides/sunrise-vs-sunset-dolomites/",
      image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE")
    },
    {
      label: "Planning",
      title: "Weather & Backup Planning",
      copy: "Honest notes on fog, rain, wind, storms and what flexible planning really means in the mountains.",
      href: "/guides/weather-and-backup-planning/",
      image: placeholder("IMAGE_PLACEHOLDER_WEATHER")
    },
    {
      label: "Planning",
      title: "What to Wear in the Mountains",
      copy: "Layers, styling, movement and practical notes for wind, cold and height.",
      href: "/guides/what-to-wear-in-the-mountains/",
      image: placeholder("IMAGE_PLACEHOLDER_STYLE")
    },
    {
      label: "Planning",
      title: "Helicopter Elopement Guide",
      copy: "Remote access, privacy, weather flexibility and how a helicopter experience really works.",
      href: "/guides/helicopter-elopement-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER")
    },
    {
      label: "Planning",
      title: "Multi-Day Elopement Guide",
      copy: "Two-day rhythms, rifugio stays and a slower experience for couples who want more time.",
      href: "/guides/multi-day-elopement-guide/",
      image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY")
    }
  ];
  return all.filter((item) => !item.href.includes(`/${currentSlug}/`));
};

const sharedFinal = {
  eyebrow: "Planning with intention",
  title: "Let’s shape something that feels quiet, personal and deeply true to you.",
  copy: "If this guide already feels close to the way you want the day to move, I would love to help you turn that feeling into something calm, cinematic and genuinely your own in the mountains.",
  cta: "Inquire Now"
};

const sharedFaqIntro = "A few of the questions couples often ask once the dream begins feeling more real, and the mountains stop being only an idea.";

const pages = [
  {
    slug: "dolomites-elopement-guide",
    title: "Dolomites Elopement Guide | Planning an Intentional Mountain Wedding",
    description: "A calm editorial Dolomites Elopement Guide with locations, seasons, weather, permits, symbolic ceremonies and thoughtful planning notes.",
    hero: {
      eyebrow: "Planning Guide",
      title: "Dolomites Elopement Guide",
      copy: "A thoughtful starting point for couples planning an intentional wedding or elopement in the Dolomites, with honest notes on place, weather, timing and the quiet details that change everything.",
      cta: "Start Planning",
      image: placeholder("IMAGE_PLACEHOLDER_DOLOMITES_GUIDE"),
      imageAlt: "Placeholder image for Dolomites Elopement Guide hero"
    },
    utility: {
      reading: "Guide",
      focus: "For couples planning a Dolomites Elopement or intimate mountain wedding",
      navOverview: "Guide Facts",
      navSeasons: "Planning Blocks",
      navPhilosophy: "Intro",
      navVisual: "More Guides",
      navFaq: "FAQ"
    },
    overview: {
      eyebrow: "Guide Facts",
      copy: "The Dolomites reward beautiful ideas, but even more than that, they reward thoughtful planning. Light, access, weather and crowd rhythm all shape how the day actually feels.",
      items: [
        fact("Best Season Window", "June to early October", "calendar"),
        fact("Most Useful Light", "Sunrise & late evening", "sun"),
        fact("Weather Mood", "Fast-changing, often cinematic", "cloud"),
        fact("Crowd Reality", "Early timing matters", "crowd"),
        fact("Ideal For", "Couples drawn to quiet scale", "guests")
      ]
    },
    philosophy: {
      eyebrow: "A calm beginning",
      title: "The mountains do not need much from you, only honesty.",
      copy: "Some places in the Dolomites look effortless in photographs, but the real magic often comes from careful timing, quiet light and knowing when the mountains feel calm. A good guide does not only help you choose a view. It helps you choose a feeling."
    },
    sections: {
      seasonOrder: ["intro", "locations", "best-time", "weather", "permits", "ceremony", "helicopter", "steps"],
      seasons: {
        intro: {
          layout: "image-left",
          image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"),
          imageAlt: "Placeholder image for a couple at sunrise in the Dolomites",
          title: "Why the Dolomites feel so different",
          intro: "The scale is obvious. The quiet often is not.",
          copy: "What makes a Dolomites Elopement special is not only the view, but the way the landscape changes the pace of the day. You feel distances differently here. Light arrives earlier on the peaks, weather asks for softness and even iconic places can feel intimate if the timing is right.",
          points: [
            "Large landscapes, but often deeply personal moments",
            "Strong light shifts between sunrise, fog and late evening",
            "A region where planning and atmosphere are closely connected"
          ],
          facts: [
            fact("Best For", "Elopements, intimate weddings, multi-day experiences", "guests"),
            fact("Main Regions", "South Tyrol, Cortina, Braies, Val Gardena", "path"),
            fact("Tone", "Cinematic, spacious, emotional", "wind")
          ],
          note: "The best Dolomites wedding days rarely feel rushed. They unfold.",
          meta: "Scale • rhythm • mountain light"
        },
        locations: {
          layout: "image-right",
          image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME"),
          imageAlt: "Placeholder image for iconic Dolomites ridges",
          title: "Best locations",
          intro: "Different landscapes carry very different moods.",
          copy: "Lago di Braies feels quiet, reflective and precise in early light. Seceda feels expansive and almost surreal. Cadini di Misurina is more dramatic and raw. Tre Cime is iconic and open. Alpe di Siusi can feel softer and more generous. The best location is rarely the most famous one. It is the one that fits how you want the day to move.",
          points: [
            "Water and stillness: Lago di Braies",
            "Open ridgelines: Seceda",
            "Drama and edge: Cadini di Misurina",
            "Iconic forms: Tre Cime",
            "Soft meadow atmosphere: Alpe di Siusi"
          ],
          facts: [
            fact("Crowd Reality", "Iconic spots need early timing", "crowd"),
            fact("Access", "Varies from easy to hike-based", "path"),
            fact("Best Light", "Usually sunrise, sometimes late evening", "sunrise")
          ],
          linkLabel: "Explore the best locations",
          linkHref: "/guides/best-dolomites-elopement-locations/",
          meta: "Location first • timing second • story always"
        },
        "best-time": {
          layout: "image-left",
          image: "/assets/uploads/Blitzkneisser-Dolomites-Elopement-Wedding-236.jpg",
          imageAlt: "Existing image showing mountain couple light in the Dolomites",
          title: "Best time to visit",
          intro: "Each season changes access, light and the emotional tone of the day.",
          copy: "For many couples, June through early October gives the most stable balance between access and atmosphere. September often feels especially complete: softer light, quieter mornings and less pressure in the landscape. Autumn adds colder air, golden larches and more cinematic stillness. Winter can be magical, but it asks for a different kind of flexibility.",
          facts: [
            fact("Most Balanced", "September", "calendar"),
            fact("Most Cinematic", "Late autumn & early winter", "wind"),
            fact("Most Accessible", "High summer", "path")
          ],
          linkLabel: "Read the season guide",
          linkHref: "/guides/best-time-for-a-dolomites-elopement/",
          meta: "Season shapes mood"
        },
        weather: {
          layout: "image-right",
          image: placeholder("IMAGE_PLACEHOLDER_WEATHER"),
          imageAlt: "Placeholder image for weather and mountain fog planning",
          title: "Weather",
          intro: "Mountain weather is part of the story, not the thing that ruins it.",
          copy: "The Dolomites can change quickly. Warm mornings can turn into wind, clear valleys into fog, blue skies into afternoon storms. That is why the strongest planning is never rigid. It leaves room for movement, alternate viewpoints and a version of the day that still feels beautiful if the original idea changes.",
          points: [
            "Afternoon storms are common in summer",
            "Fog often creates intimacy rather than disappointment",
            "Flexible timing matters more than perfect forecasts"
          ],
          facts: [
            fact("Summer Pattern", "Clearer mornings, risk of storms later", "cloud"),
            fact("Autumn Pattern", "Colder air, mist, clearer structure", "wind"),
            fact("Planning Style", "Soft route, backup options, open timeline", "path")
          ],
          linkLabel: "See weather & backup planning",
          linkHref: "/guides/weather-and-backup-planning/",
          meta: "Weather as atmosphere"
        },
        permits: {
          layout: "image-left",
          image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"),
          imageAlt: "Placeholder image for access and permit notes around a lake",
          title: "Permits and access",
          intro: "Beautiful places in the Dolomites often come with practical layers.",
          copy: "Not every location needs a permit, but many popular places have access rules, parking limitations, toll roads, gondola schedules or sunrise restrictions that matter. Lago di Braies, Tre Cime and other well-known spots each work differently. The most helpful planning often happens long before the day, while the landscape is still only an idea.",
          facts: [
            fact("Always Check", "Road access, lift times, local regulations", "key"),
            fact("Popular Spots", "Often stricter around summer weekends", "crowd"),
            fact("Best Approach", "Verify rules close to the date", "calendar")
          ],
          note: "The logistics do not need to dominate the day, but they should never surprise it.",
          meta: "Permits • timing • access"
        },
        ceremony: {
          layout: "image-right",
          image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"),
          imageAlt: "Placeholder image for symbolic mountain ceremony",
          title: "Symbolic vs legal ceremony",
          intro: "Most mountain couples choose a day that feels personal first, official second.",
          copy: "A symbolic ceremony gives you freedom in timing, location and emotional pace. It allows sunrise, remote views, weather flexibility and the ability to keep the experience intimate. A legal ceremony in Italy or Austria is possible, but it often comes with paperwork, scheduling and practical limits that many couples prefer to separate from the mountain day itself.",
          facts: [
            fact("Most Common", "Legal at home, symbolic in the mountains", "guests"),
            fact("Why", "More freedom in place and timing", "sunrise"),
            fact("Best For", "Couples wanting intimacy over administration", "key")
          ],
          meta: "Officiality vs emotional freedom"
        },
        helicopter: {
          layout: "image-left",
          image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"),
          imageAlt: "Placeholder image for helicopter elopement planning",
          title: "Helicopter option",
          intro: "For some couples, privacy means going further than the road allows.",
          copy: "A helicopter experience can open landscapes that feel more remote, more private and less shaped by crowds. It is never necessary, but it can be powerful when weather, budget and your kind of celebration genuinely support it. The strongest helicopter elopements never feel flashy. They feel spacious, quiet and deeply intentional.",
          facts: [
            fact("Best For", "Remote moments, proposals, privacy", "wind"),
            fact("Needs", "Weather flexibility and trusted local partners", "cloud"),
            fact("Works Best", "As a natural extension of the experience", "sun")
          ],
          linkLabel: "Read the helicopter guide",
          linkHref: "/guides/helicopter-elopement-guide/",
          meta: "Remote • quiet • weather-led"
        },
        steps: {
          layout: "image-right",
          image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"),
          imageAlt: "Placeholder image for multi-step elopement planning",
          title: "Planning steps",
          intro: "A mountain wedding becomes easier once the order of decisions is clear.",
          copy: "Start with the feeling you want, not the location. Then choose the season that supports it. After that, narrow down the place, build the access and timeline around light and finally add the details: where to stay, what to wear, how much walking makes sense and whether the day wants to be quiet or adventurous.",
          points: [
            "Choose the mood first",
            "Choose the season second",
            "Then build place, timing and logistics around that"
          ],
          facts: [
            fact("First Step", "Feeling and atmosphere", "guests"),
            fact("Second Step", "Season and light", "calendar"),
            fact("Third Step", "Access, route, clothing, backup", "path")
          ],
          meta: "Feeling → season → location → day"
        }
      }
    },
    planning: {
      eyebrow: "Planning Notes",
      title: "The practical details that quietly shape the whole experience.",
      intro: "What couples usually need most is not more inspiration, but a calmer way to make good decisions once the mountains become real.",
      items: [
        { label: "Crowd management", title: "Choose famous places carefully, not fearfully.", copy: "There is nothing wrong with iconic locations, but they behave differently depending on weekday, season and exact start time. The same place can feel private at sunrise and public by mid-morning.", meta: "Timing matters more than popularity alone." },
        { label: "Parking & transfers", title: "Think through the first hour of the day in advance.", copy: "Parking closures, shuttle systems, toll roads and gondola times are often the least glamorous part of planning, but they decide whether the day begins calmly or already under pressure.", meta: "A calm start protects the rest of the day." },
        { label: "Guests", title: "Not every beautiful place is the right place with family.", copy: "If parents or older guests are joining, softer access, shorter walking times and more protected weather options often create a far better experience than chasing the most dramatic ridge.", meta: "Comfort and beauty can live together." },
        { label: "Backup thinking", title: "A second option is most helpful when you already love it.", copy: "The strongest backup plans never feel like compromises. They feel like another honest version of the same day, just with different light or different weather around it.", meta: "Love the alternative before you need it." }
      ]
    },
    faq: {
      title: "Questions that often come up before a Dolomites Elopement becomes real.",
      intro: sharedFaqIntro,
      items: [
        { q: "Do we need permits for a Dolomites Elopement?", a: "Sometimes yes, sometimes no. It depends entirely on the exact place, season, parking rules, lift access and whether the location sits inside a protected area or has sunrise restrictions. It is something worth checking early rather than assuming." },
        { q: "Is a symbolic ceremony more practical than a legal one?", a: "For most couples, yes. A symbolic ceremony allows far more freedom in timing, weather flexibility and location choice. Many couples prefer to keep the legal part separate so the mountain day can stay spacious and personal." },
        { q: "Can we bring guests and still keep the day intimate?", a: "Absolutely, but the place and the season matter more once guests are involved. Access, temperatures, parking and walking time all become part of the emotional experience, not just the logistics." },
        { q: "How early do we really need to start?", a: "At iconic places, often earlier than you expect. Sunrise can completely change the atmosphere at locations like Lago di Braies, Seceda or Tre Cime. At quieter locations, there can be more flexibility." },
        { q: "Is a helicopter experience necessary for privacy?", a: "No. Many deeply private moments happen without one. But for some couples, a helicopter creates access, calm and scale in a way that feels uniquely fitting, especially for proposals or very remote experiences." },
        { q: "How far in advance should we begin planning?", a: "If you want flexibility with season, location, accommodation and travel, beginning early is always helpful. It gives you better choices and a calmer pace." }
      ]
    }
  }
];

const locationPages = [
  {
    slug: "lago-di-braies-guide",
    title: "Lago di Braies Guide | Quiet Water, Sunrise and Crowd Reality",
    description: "A calm planning guide to Lago di Braies for elopements and intimate weddings, from sunrise reality to parking, boats and crowd management.",
    hero: {
      eyebrow: "Location Guide",
      title: "Lago di Braies Guide",
      copy: "For couples drawn to reflective water, colder morning air and a place that feels quiet only when you understand its rhythm.",
      cta: "Start Planning",
      image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"),
      imageAlt: "Placeholder image for Lago di Braies"
    },
    utility: { reading: "Guide", focus: "For calm mornings at Lago di Braies", navOverview: "Guide Facts", navSeasons: "Location Notes", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "Lago di Braies is one of the most iconic locations in the Dolomites. The lake is beautiful, but the quiet version of it only appears with thoughtful timing.", items: [fact("Best Light", "Sunrise", "sun"), fact("Crowd Level", "High later in the day", "crowd"), fact("Access", "Easy, but regulated", "path"), fact("Best For", "Reflective, intimate mornings", "guests"), fact("Season", "Late spring to autumn", "calendar")] },
    philosophy: { eyebrow: "A first note", title: "This place is beautiful because it feels still, not because it is famous.", copy: "Lago di Braies can feel almost surreal in the first light of day. But that feeling arrives through timing, patience and knowing how quickly the lake changes once visitors begin to fill it." },
    sections: {
      seasonOrder: ["special", "time", "sunrise", "boathouse", "crowds", "access", "weather", "spots"],
      seasons: {
        special: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"), imageAlt: "Placeholder image for Lago di Braies lake", title: "Why Lago di Braies feels so special", intro: "The lake holds a kind of quiet symmetry that feels almost unreal when it is empty.", copy: "What draws many couples here is not only the water itself, but the way the mountains, boathouse and early air all meet in a very precise stillness. It can feel reflective, intimate and almost cinematic when the lake is calm.", facts: [fact("Mood", "Reflective and still", "wind"), fact("Best For", "Quiet mornings and intimate portraits", "guests"), fact("Visual Strength", "Water, boathouse, symmetry", "sunrise")], meta: "Reflection • stillness • soft structure" },
        time: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for early light at a lake", title: "Best time of day", intro: "The emotional difference between early morning and mid-day here is enormous.", copy: "If you want the lake to feel quiet, structured and open, sunrise is usually the strongest choice. Later in the morning the landscape stays beautiful, but the experience can become far more public and less intimate.", facts: [fact("Best Time", "Before and around sunrise", "calendar"), fact("Later Day", "Much busier and louder", "crowd"), fact("Best Light", "Soft first light", "sun")] },
        sunrise: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for sunrise at a mountain lake", title: "Sunrise reality", intro: "Sunrise here is not a romantic extra. It is often the reason the place works at all.", copy: "For an elopement at Lago di Braies, sunrise changes almost everything: parking, sound, crowd level and the emotional temperature of the day. If still water and private space matter to you, this is usually the most honest way to experience the lake.", facts: [fact("Why Sunrise", "Silence, softer access, calmer water", "sunrise"), fact("Reality", "Requires an early, intentional start", "calendar"), fact("Worth It", "Usually yes for couples prioritising intimacy", "guests")] },
        boathouse: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"), imageAlt: "Placeholder image for lake boathouse experience", title: "Boat house and lake experience", intro: "The boathouse is part of the visual identity of the place, but it is only one part of the experience.", copy: "Some couples are drawn to the wooden boats and the quiet line of the shore. It can work beautifully, but only if the timing stays calm and expectations are realistic. The most beautiful moments often happen around the boathouse, not only in it.", facts: [fact("Visual Highlight", "Wooden boats & still shoreline", "sun"), fact("Best Mood", "Early, calm and lightly foggy", "cloud"), fact("Approach", "Use it as part of the story, not the whole story", "wind")] },
        crowds: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"), imageAlt: "Placeholder image for crowd management at a lake", title: "Crowd reality", intro: "This is one of the places where timing matters more than almost anything else.", copy: "Lago di Braies can feel genuinely calm at sunrise and very public not long after. Weekdays help, shoulder season helps and a route that includes quieter stretches away from the obvious spot helps most of all.", facts: [fact("Weekends", "Busiest", "crowd"), fact("Best Strategy", "Weekday sunrise", "calendar"), fact("Quietest Feeling", "Before visitor flow builds", "sunrise")] },
        access: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"), imageAlt: "Placeholder image for parking and access at a lake", title: "Access and parking", intro: "Easy access is part of the appeal, but it also changes how many people can reach it.", copy: "Lago di Braies is relatively simple compared with many mountain locations, which makes it accessible for guests and easier logistically, but also more popular. Parking systems and local access rules should always be checked close to the date.", facts: [fact("Difficulty", "Easy", "path"), fact("Parking", "Important to verify ahead of time", "key"), fact("Guest Friendly", "Yes, more than many ridge locations", "guests")] },
        weather: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for lake weather", title: "Weather notes", intro: "Fog and low cloud often suit this place better than clear harsh light.", copy: "Because the lake is defined by reflection and quiet, slightly overcast or misty mornings can feel especially strong. Wind affects the water surface quickly, so the calmest conditions often arrive early.", facts: [fact("Fog", "Often beautiful here", "cloud"), fact("Wind", "Changes the water quickly", "wind"), fact("Best Mood", "Soft cloud or first light", "sun")] },
        spots: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"), imageAlt: "Placeholder image for best photo spots around Lago di Braies", title: "Best photo spots", intro: "The obvious view is only one piece of the story.", copy: "The shore near the boathouse is iconic, but quieter edges of the lake often carry the stronger feeling. Walking a little farther along the water usually opens calmer backgrounds and gives the place more breathing room.", facts: [fact("Iconic Spot", "Boathouse", "sun"), fact("Quieter Spot", "Farther edges of the lake", "path"), fact("Best Approach", "Mix the obvious with the quieter surroundings", "wind")] }
      }
    },
    planning: { eyebrow: "Planning Notes", title: "What usually helps most at Lago di Braies.", intro: "The lake is simple in some ways, but it rewards couples who plan for rhythm rather than only for the image.", items: [{ label: "Timing", title: "Choose a weekday if you can.", copy: "Even one calendar decision can change how public the lake feels.", meta: "Weekday sunrise is usually strongest." }, { label: "Guests", title: "This is one of the easier mountain locations with family.", copy: "Because access is softer, it works well if you want guests included without a hike-heavy day.", meta: "Accessible and visually strong." }, { label: "Backup", title: "Have a second nearby route in mind.", copy: "If wind, rain or crowds shift the plan, a short alternative walk around the lake can preserve the same mood.", meta: "Small backups work well here." }, { label: "Local Tip", title: "Do not stay only at the main viewpoint.", copy: "The most personal moments often happen once you move a little farther away from the obvious frame.", meta: "Walk just a little farther." }] },
    faq: { title: "Questions couples often ask about Lago di Braies.", intro: sharedFaqIntro, items: [{ q: "Is Lago di Braies too crowded for an elopement?", a: "It can be if you arrive too late. Sunrise and weekdays usually make the largest difference." }, { q: "Is the lake good for guests?", a: "Yes. Compared with many Dolomites locations, it is far easier to access." }, { q: "Does fog ruin the lake?", a: "Usually not. Fog often makes the mood quieter and more cinematic." }, { q: "Is the boathouse necessary?", a: "No. It is beautiful, but the shoreline and quieter edges often hold the stronger feeling." }] }
  },
  {
    slug: "seceda-guide",
    title: "Seceda Guide | Sunrise, Access and the Iconic Ridgeline",
    description: "A calm planning guide to Seceda for elopements and weddings, from lift timing and weather to sunrise, wind and crowd reality.",
    hero: { eyebrow: "Location Guide", title: "Seceda Guide", copy: "For couples drawn to open ridgelines, mountain air and one of the most iconic silhouettes in the Dolomites.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_SECEDA"), imageAlt: "Placeholder image for Seceda" },
    utility: { reading: "Guide", focus: "For expansive views around Seceda and Val Gardena", navOverview: "Guide Facts", navSeasons: "Location Notes", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "Seceda is iconic for a reason, but the experience there depends heavily on wind, timing and how you want the day to feel once you arrive high above Val Gardena.", items: [fact("Best Time", "Summer to early autumn", "calendar"), fact("Best Light", "Sunrise or late evening", "sun"), fact("Crowd Level", "Medium to high later in the day", "crowd"), fact("Access", "Lift-led, some walking", "path"), fact("Best For", "Wide, open mountain feeling", "guests")] },
    philosophy: { eyebrow: "A first note", title: "Seceda feels iconic because it opens all at once.", copy: "The ridgeline does not arrive gently. It appears with scale, air and a feeling of openness that can feel almost surreal. That is exactly why calm timing matters." },
    sections: { seasonOrder: ["special", "time", "sunrise", "access", "crowds", "weather", "spots"], seasons: {
      special: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_SECEDA"), imageAlt: "Placeholder image for Seceda ridgeline", title: "Why Seceda is iconic", intro: "It feels larger than photographs usually suggest.", copy: "Seceda is one of the places couples imagine when they think of a Dolomites Elopement: dramatic ridges, soft meadows and enormous open space. What makes it work best is not only the ridgeline itself, but the sense of air and movement around it.", facts: [fact("Visual Mood", "Open, airy and cinematic", "wind"), fact("Best For", "Couples wanting scale without a technical hike", "guests"), fact("Tone", "Iconic but still soft in the right light", "sun")] },
      time: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_SECEDA"), imageAlt: "Placeholder image for evening light on ridgelines", title: "Best time", intro: "The right light changes Seceda from beautiful to unforgettable.", copy: "Early morning gives the clearest sense of stillness. Later evening can also feel beautiful if the weather stays soft. Midday is often visually flatter and emotionally busier.", facts: [fact("Best", "Sunrise", "sunrise"), fact("Also Works", "Late evening in soft weather", "sun"), fact("Avoid", "Busy midday windows if you want privacy", "crowd")] },
      sunrise: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for sunrise above the ridgeline", title: "Sunrise vs sunset", intro: "Seceda is one of the places where sunrise often feels more personal than sunset.", copy: "At sunrise the ridgeline feels quieter and the light arrives with more softness. Sunset can be warmer, but often feels more public, especially in high season. If you are choosing between the two, sunrise usually offers the calmer experience.", facts: [fact("Sunrise", "Quieter and more atmospheric", "sunrise"), fact("Sunset", "Warmer but often busier", "sun"), fact("Best For", "Couples prioritising quiet", "guests")] },
      access: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_SECEDA"), imageAlt: "Placeholder image for mountain lift and walking access", title: "Lift and access notes", intro: "Seceda is easier than it looks, but still needs to be planned.", copy: "The lift makes this landscape accessible, but you are still working with operating times, weather and short walking sections once you arrive. That makes it ideal for couples wanting scale without an advanced hike, but less ideal if you want a completely unrestricted timeline.", facts: [fact("Main Access", "Lift plus walking", "path"), fact("Guest Friendly", "Moderately, depending on mobility", "guests"), fact("Check", "Lift schedule and weather", "key")] },
      crowds: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_SECEDA"), imageAlt: "Placeholder image for people flow on ridgeline", title: "Crowd reality", intro: "This is not usually a lonely place once the day is fully awake.", copy: "Seceda can feel genuinely open and quiet very early, then far more shared later. If privacy matters, timing and route choice matter more here than the visual drama alone.", facts: [fact("Quietest", "Early start", "calendar"), fact("Busiest", "Late morning through afternoon", "crowd"), fact("Best Strategy", "Use quieter edges beyond the main viewpoint", "path")] },
      weather: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for wind and weather in high terrain", title: "Weather and wind", intro: "Wind shapes this place just as much as light does.", copy: "Because Seceda is so open, wind can change the experience quickly. Clear skies can feel incredible, but mist, moving cloud and shifting weather can also give the ridgeline a stronger editorial mood. The key is dressing for it and leaving a little softness in the timeline.", facts: [fact("Main Factor", "Wind exposure", "wind"), fact("Weather Mood", "Fast-changing, often dramatic", "cloud"), fact("Best Response", "Layers and flexible timing", "path")] },
      spots: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_SECEDA"), imageAlt: "Placeholder image for photo spots near Seceda", title: "Best photo spots", intro: "The main view is only the start of what this area can offer.", copy: "The most obvious ridge frame is beautiful, but quieter paths, meadow edges and moments when the landscape opens behind you often create the strongest images. A little movement away from the main look changes the whole feeling.", facts: [fact("Hero View", "Main ridgeline", "sun"), fact("Quieter Frames", "Meadow edges and secondary paths", "path"), fact("Best Mood", "Early and airy", "wind")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually matters most at Seceda.", intro: "This location rewards couples who think about timing, wind and how much openness they truly want.", items: [{ label: "Wind", title: "Choose clothing that can move well.", copy: "Seceda can feel exposed, and garments that fight the wind often create tension instead of ease.", meta: "Movement matters here." }, { label: "Lift Timing", title: "Let access shape the day honestly.", copy: "Because the lift matters, the timeline should stay realistic and not pretend the mountain is available at every hour.", meta: "Work with the mountain, not against it." }, { label: "Crowds", title: "Do not leave the main viewpoint too late.", copy: "If intimacy matters, build around the quietest hours and move before the flow grows.", meta: "Early is often strongest." }, { label: "Guests", title: "Useful if you want big views without a long hike.", copy: "Seceda can work beautifully for couples who want dramatic space without a difficult trail day.", meta: "High reward, manageable effort." }] },
    faq: { title: "Questions couples often ask about Seceda.", intro: sharedFaqIntro, items: [{ q: "Is sunrise better than sunset at Seceda?", a: "Usually yes if you want more quiet and a softer atmosphere." }, { q: "Do we need to hike a lot?", a: "Not heavily, but you should expect some walking once the lift has brought you up." }, { q: "Is Seceda too windy for a dress?", a: "It can be windy, which is why fabric choice and layers matter." }, { q: "Can it work with guests?", a: "Sometimes yes, especially if the group is comfortable with mountain access and some walking." }] }
  },
  {
    slug: "cadini-di-misurina-guide",
    title: "Cadini di Misurina Guide | Cinematic Peaks, Access and Safety",
    description: "A calm guide to Cadini di Misurina for elopements, with sunrise, hiking access, weather, safety notes and helicopter considerations.",
    hero: { eyebrow: "Location Guide", title: "Cadini di Misurina Guide", copy: "For couples drawn to sharp mountain forms, cinematic edges and a place that feels wilder than it looks from a single famous frame.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_CADINI"), imageAlt: "Placeholder image for Cadini di Misurina" },
    utility: { reading: "Guide", focus: "For dramatic ridgelines around Cadini di Misurina", navOverview: "Guide Facts", navSeasons: "Location Notes", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "Cadini is one of the most cinematic places in the Dolomites, but it is also one of the locations where reality on the ground matters just as much as the viewpoint itself.", items: [fact("Best Time", "Summer to early autumn", "calendar"), fact("Best Light", "Sunrise", "sunrise"), fact("Access", "Hike-based", "path"), fact("Crowd Level", "Moderate at the famous viewpoint", "crowd"), fact("Best For", "Couples comfortable with mountain exposure", "guests")] },
    philosophy: { eyebrow: "A first note", title: "Cadini feels cinematic because it is narrow, high and slightly raw.", copy: "This location carries a sharper energy than softer alpine meadows or lake landscapes. It rewards couples who love strong lines, open edges and a day that feels a little more adventurous." },
    sections: { seasonOrder: ["special", "time", "access", "sunrise", "helicopter", "weather", "safety"], seasons: {
      special: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_CADINI"), imageAlt: "Placeholder image for Cadini peaks", title: "Why Cadini feels cinematic", intro: "The view is dramatic, but the atmosphere is what makes it stay with you.", copy: "Cadini di Misurina feels more sculptural than many other Dolomites locations. The peaks rise in a way that feels sharper, more graphic and often more emotionally intense. In the right light, the whole place feels almost unreal.", facts: [fact("Mood", "Dramatic and graphic", "wind"), fact("Best For", "Editorial, adventurous couples", "guests"), fact("Visual Strength", "Sharp forms and open depth", "sun")] },
      time: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_CADINI"), imageAlt: "Placeholder image for time of day in Cadini", title: "Best time", intro: "Cadini is strongest when the light is soft and the trails are still quiet.", copy: "Sunrise is usually the most meaningful time here because the viewpoint feels calmer and the lines of the peaks stay gentler. Later in the day, both light and people can flatten the feeling.", facts: [fact("Best", "Sunrise", "sunrise"), fact("Also Good", "Very calm late evening", "sun"), fact("Avoid", "Crowded late morning windows", "crowd")] },
      access: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_CADINI"), imageAlt: "Placeholder image for hike access", title: "Access and hiking difficulty", intro: "This is not a complicated expedition, but it is not a soft access location either.", copy: "Cadini requires more awareness than places reached directly by lift or lakefront path. The route is manageable for many couples, but it still asks for stable footing, realistic timing and respect for the terrain.", facts: [fact("Difficulty", "Moderate", "path"), fact("Best For", "Comfortable walkers", "guests"), fact("Needs", "Good shoes and steady pacing", "key")] },
      sunrise: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for sunrise in Cadini", title: "Sunrise option", intro: "Cadini is one of the places where sunrise often changes everything.", copy: "The famous viewpoint feels calmer, more dimensional and less shared in the first light. If you want Cadini to feel spacious rather than exposed, this is usually the strongest way to experience it.", facts: [fact("Why Sunrise", "Soft light and fewer people", "sunrise"), fact("Reality", "Needs an early, committed start", "calendar"), fact("Worth It", "Very often", "sun")] },
      helicopter: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"), imageAlt: "Placeholder image for helicopter access and remote views", title: "Helicopter option", intro: "For some couples, Cadini works beautifully as part of a broader remote experience.", copy: "A helicopter does not replace the mountain character here, but it can become part of a larger day that includes more privacy, more scale or a different emotional rhythm. It only works well when it feels integrated, not performative.", facts: [fact("Best For", "Remote extensions and private scale", "wind"), fact("Needs", "Weather and local partners", "cloud"), fact("Tone", "Intentional, not theatrical", "guests")] },
      weather: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for fog and wind in exposed terrain", title: "Weather notes", intro: "Cloud, wind and visibility matter more here than in softer, lower locations.", copy: "Cadini can feel extraordinary in moving cloud or light fog, but poor visibility and stronger wind can also change how exposed the viewpoint feels. A calm weather window is often worth waiting for.", facts: [fact("Main Factors", "Wind and visibility", "wind"), fact("Best Mood", "Soft cloud, early light", "cloud"), fact("Planning Style", "Keep the timing flexible", "calendar")] },
      safety: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_CADINI"), imageAlt: "Placeholder image for mountain safety notes", title: "Safety notes", intro: "A strong day here comes from calm decisions, not rushing the viewpoint.", copy: "Cadini is one of the locations where pace and awareness really matter. Good shoes, steady movement, space on the path and a realistic understanding of energy all matter more than forcing a dramatic moment too quickly.", facts: [fact("Most Important", "Calm pacing", "path"), fact("Bring", "Proper shoes and layers", "key"), fact("Best Practice", "Treat the terrain with respect", "guests")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually matters most at Cadini.", intro: "This location is often less about adding more ideas and more about keeping the experience clear, safe and beautifully paced.", items: [{ label: "Energy", title: "Keep the morning simple.", copy: "Cadini usually works best when the day starts cleanly and without too many extra moves before the viewpoint.", meta: "Less rushing, more presence." }, { label: "Shoes", title: "Choose proper mountain shoes.", copy: "This is not the place to compromise on footing just to protect a look.", meta: "Comfort and safety first." }, { label: "Light", title: "Give yourself sunrise if possible.", copy: "It changes both the shape of the light and the emotional space around the viewpoint.", meta: "Early helps in every direction." }, { label: "Weather", title: "Accept when the mountain wants a softer plan.", copy: "Not every weather window is right for exposed terrain. A calmer alternative is always better than forcing the view.", meta: "Conditions decide the tone." }] },
    faq: { title: "Questions couples often ask about Cadini.", intro: sharedFaqIntro, items: [{ q: "Is Cadini difficult to reach?", a: "It is more hike-based than places like Lago di Braies, but manageable for many couples who are comfortable walking in the mountains." }, { q: "Is sunrise worth it here?", a: "Very often yes. The viewpoint usually feels calmer and more dimensional in the first light." }, { q: "Is Cadini safe for a wedding day?", a: "Yes, if the terrain is treated honestly, the pace stays calm and conditions are respected." }, { q: "Can a helicopter be part of the experience?", a: "Yes, especially as part of a broader remote day, but only if weather and trusted local logistics support it." }] }
  }
];

const additionalPages = [
  {
    slug: "best-time-for-a-dolomites-elopement",
    title: "Best Time for a Dolomites Elopement | Seasons, Light and Planning",
    description: "A calm editorial guide to the best time for a Dolomites Elopement, from seasons and weather to light, crowd rhythm and practical planning.",
    hero: { eyebrow: "Planning Guide", title: "Best Time for a Dolomites Elopement", copy: "The Dolomites change with the seasons in a way that shapes not only the view, but the whole emotional pace of the day. This guide helps you understand which light, temperature and rhythm may feel most like you.", cta: "Start Planning", image: "/assets/uploads/Blitzkneisser-Dolomites-Elopement-Wedding-236.jpg", imageAlt: "Existing image for best time in the Dolomites" },
    utility: { reading: "Guide", focus: "For couples planning around season, light and atmosphere", navOverview: "Guide Facts", navSeasons: "Seasons", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "The season shapes far more than the light. It changes access, crowds, weather windows and how quietly the mountains may hold your day.", items: [fact("Best Months", "June through early October", "calendar"), fact("Most Beautiful Light", "Sunrise and late evening", "sun"), fact("Weather Mood", "Fast-changing, soft and dramatic", "cloud"), fact("Crowd Level", "Low to medium if timed well", "crowd"), fact("Ideal For", "Couples drawn to atmosphere", "guests")] },
    philosophy: { eyebrow: "A small philosophy", title: "Every season has its own feeling", copy: "There is no perfect season for a Dolomites Elopement, only the one that feels most like you. Some couples want cold air and silence, others warmth, movement and longer evenings. The best choice is almost always the one that already feels honest before the day begins." },
    sections: {
      seasonOrder: ["spring", "summer", "autumn", "winter"],
      seasons: {
        spring: { layout: "image-left", image: "/assets/uploads/Blitzkneisser-Dolomites-Elopement-Wedding-154.jpg", imageAlt: "Existing image for early season in the Dolomites", title: "Spring in the Dolomites", intro: "Early season feels like the mountains opening quietly again.", copy: "Late spring and early summer bring fresher air, green meadows and a more spacious feeling on the trails. It can be one of the softest times for a Dolomites Elopement if you value openness more than settled warmth.", points: ["Fresh meadows and quieter starts", "Longer light, but still cooler mornings", "A softer emotional tone than high summer"], facts: [fact("Temperature", "8–18 °C", "cloud"), fact("Best For", "Open, fresh mountain days", "guests"), fact("Crowds", "Lower than peak summer", "crowd")], note: "This season often feels light and almost weightless.", meta: "Open • fresh • soft" },
        summer: { layout: "image-right", image: "/assets/uploads/Blitzkneisser-Dolomites-Elopement-Lago-di-Braies-1.jpg", imageAlt: "Existing image for summer morning in the Dolomites", title: "Summer in the Dolomites", intro: "Summer feels generous, warm and full of movement.", copy: "This is the easiest season for access and often the simplest for guests, but it also asks for more care with timing. Early starts, quieter weekdays and thoughtful routes matter most here.", points: ["Best overall access", "Warm evenings and long light", "More public at iconic locations"], facts: [fact("Temperature", "14–25 °C", "cloud"), fact("Best For", "Ease, guests, longer days", "guests"), fact("Crowds", "Higher at famous places", "crowd")], note: "September often feels like the quietest version of summer.", meta: "Warm • open • accessible" },
        autumn: { layout: "image-left", image: "/assets/uploads/Blitzkneisser-Dolomites-Elopement-Wedding-195.jpg", imageAlt: "Existing image for autumn in the Dolomites", title: "Autumn in the Dolomites", intro: "Autumn feels colder, quieter and more cinematic all at once.", copy: "Golden larches, colder air and the possibility of first snow make autumn one of the most emotionally layered times for a Dolomites wedding. It often feels slower, more precise and more atmospheric.", points: ["Golden larches and colder air", "Quieter mountains", "Possibility of first snow"], facts: [fact("Temperature", "3–14 °C", "cloud"), fact("Best For", "Cinematic, quieter days", "wind"), fact("Crowds", "Often lower on weekdays", "crowd")], note: "For many couples, this is the most atmospheric season of all.", meta: "Golden • quiet • cinematic" },
        winter: { layout: "image-right", image: "/assets/uploads/Blitzkneisser-Dolomites-Elopement-Wedding-219.jpg", imageAlt: "Existing winter image in the Dolomites", title: "Winter in the Dolomites", intro: "Winter carries a kind of silence that makes everything feel more private.", copy: "Snow, fog and very short light windows change the day completely. Winter can be unforgettable if you want a quieter emotional world and are ready for a different kind of planning.", points: ["Snow and stillness", "Shorter light windows", "Much more weather-led planning"], facts: [fact("Temperature", "-8 to 4 °C", "cloud"), fact("Best For", "Intimate, reduced experiences", "guests"), fact("Access", "Limited compared with summer", "path")], note: "Winter is rarely the easiest season, but often the most intimate.", meta: "Snow • silence • intimacy" }
      }
    },
    planning: { eyebrow: "Planning Notes", title: "What the season changes once the day becomes real.", intro: "Once the mountains stop being only an idea, the season begins shaping almost everything: access, guests, weather flexibility and what kind of quiet the day can hold.", items: [{ label: "Crowds", title: "The same place can feel entirely different by season.", copy: "An iconic view in September sunrise light and that same view in a high-summer midday window are emotionally not the same location.", meta: "Season changes the social atmosphere too." }, { label: "Access", title: "Season and logistics are always linked.", copy: "Some roads, lifts and walking routes feel simple in summer and far more restricted in winter or shoulder months.", meta: "Access is never separate from timing." }, { label: "Guests", title: "Comfort matters more in colder seasons.", copy: "If guests are joining, warmth, driving time, walking distance and weather exposure all need more attention as the season narrows.", meta: "Good planning protects intimacy." }, { label: "Light", title: "Choose the season for the feeling, not only the view.", copy: "Every season offers beautiful mountains. What changes is how the air, silence and timing feel once you are inside the landscape.", meta: "Atmosphere should lead the choice." }] },
    faq: { title: "Questions couples often ask when choosing a season.", intro: sharedFaqIntro, items: [{ q: "When is the best time for a Dolomites Elopement?", a: "For many couples, June through early October offers the most balanced mix of access and atmosphere, with September often feeling especially strong." }, { q: "Is summer always the best choice?", a: "Not always. Summer is easier, but spring and autumn often feel quieter and more cinematic." }, { q: "Can we elope in winter?", a: "Yes, but it requires more weather flexibility and a different expectation around access and light." }, { q: "Is sunrise more important in some seasons?", a: "Yes. In summer especially, sunrise can completely change crowd levels and the emotional tone of the day." }] }
  },
  {
    slug: "best-dolomites-elopement-locations",
    title: "Best Dolomites Elopement Locations | Places, Access and Mood",
    description: "A curated guide to the best Dolomites Elopement locations, with mood, crowd reality, access notes and the best time for each place.",
    hero: { eyebrow: "Location Guide", title: "Best Dolomites Elopement Locations", copy: "A thoughtful overview of some of the strongest places in the Dolomites for couples choosing between water, meadows, ridgelines, iconic peaks and quieter valleys.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_DOLOMITES_GUIDE"), imageAlt: "Placeholder image for the best Dolomites elopement locations" },
    utility: { reading: "Guide", focus: "For couples choosing between the most meaningful mountain locations", navOverview: "Guide Facts", navSeasons: "Locations", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "No location is simply better than another. The right place depends on how quiet, dramatic, accessible or weather-flexible you need the day to feel.", items: [fact("Best For", "Comparing mood and access", "guests"), fact("Main Choice", "Quiet vs iconic", "wind"), fact("Crowd Reality", "Timing changes everything", "crowd"), fact("Access", "From easy to hike-based", "path"), fact("Best Light", "Usually sunrise", "sunrise")] },
    philosophy: { eyebrow: "A calm introduction", title: "The right place is usually the one that matches your rhythm, not only your mood board.", copy: "Some locations are instantly famous. Others stay with you because of how they feel in real life: softer, quieter or less public than the iconic headline spots. The strongest choice is the one that supports both your story and the way you actually want to move through the day." },
    sections: { seasonOrder: ["braies", "seceda", "cadini", "trecime", "funes", "cortina"], seasons: {
      braies: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"), imageAlt: "Placeholder image for Lago di Braies", title: "Lago di Braies", copy: "Quiet, reflective and precise in the first light. Perfect for couples drawn to water, colder air and a still, almost mirrored mood.", facts: [fact("Best Time", "Late spring through autumn", "calendar"), fact("Crowd Level", "High later in the day", "crowd"), fact("Access Difficulty", "Easy", "path"), fact("Best For", "Reflective mornings, guests, stillness", "guests"), fact("Light", "Sunrise", "sunrise")], linkLabel: "Read the Lago di Braies guide", linkHref: "/guides/lago-di-braies-guide/" },
      seceda: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_SECEDA"), imageAlt: "Placeholder image for Seceda", title: "Seceda", copy: "Open ridgelines, generous space and an iconic silhouette that feels especially strong for couples wanting scale without a fully remote hike.", facts: [fact("Best Time", "Summer to early autumn", "calendar"), fact("Crowd Level", "Medium to high later in the day", "crowd"), fact("Access Difficulty", "Lift plus walking", "path"), fact("Best For", "Wide, open mountain feeling", "guests"), fact("Light", "Sunrise or late evening", "sun")], linkLabel: "Read the Seceda guide", linkHref: "/guides/seceda-guide/" },
      cadini: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_CADINI"), imageAlt: "Placeholder image for Cadini di Misurina", title: "Cadini di Misurina", copy: "Dramatic and graphic, with a stronger sense of exposure and mountain edge. Ideal for couples wanting a wilder, more cinematic frame.", facts: [fact("Best Time", "Summer to early autumn", "calendar"), fact("Crowd Level", "Moderate at the famous viewpoint", "crowd"), fact("Access Difficulty", "Moderate hike", "path"), fact("Best For", "Adventurous editorial couples", "guests"), fact("Light", "Sunrise", "sunrise")], linkLabel: "Read the Cadini guide", linkHref: "/guides/cadini-di-misurina-guide/" },
      trecime: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME"), imageAlt: "Placeholder image for Tre Cime", title: "Tre Cime", copy: "Iconic, open and instantly recognisable. Strong for couples who want classic Dolomites scale and are happy to work carefully around access and timing.", facts: [fact("Best Time", "Summer into autumn", "calendar"), fact("Crowd Level", "High at key viewpoints", "crowd"), fact("Access Difficulty", "Road access plus walking", "path"), fact("Best For", "Classic Dolomites atmosphere", "guests"), fact("Light", "Sunrise", "sunrise")], linkLabel: "Read the Tre Cime guide", linkHref: "/guides/tre-cime-wedding-guide/" },
      funes: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_VAL_DI_FUNES"), imageAlt: "Placeholder image for Val di Funes", title: "Val di Funes", copy: "Quieter valley moods, pastoral structure and a softer editorial feeling. Strong for couples who want atmosphere without needing the sharpest peaks around them.", facts: [fact("Best Time", "Summer to autumn", "calendar"), fact("Crowd Level", "Medium", "crowd"), fact("Access Difficulty", "Easy to moderate", "path"), fact("Best For", "Quiet valley atmosphere", "guests"), fact("Light", "Morning and soft evening", "sun")], linkLabel: "Read the Val di Funes guide", linkHref: "/guides/val-di-funes-guide/" },
      cortina: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_CORTINA"), imageAlt: "Placeholder image for Cortina d’Ampezzo", title: "Cortina d’Ampezzo", copy: "A different side of the Dolomites: elegant, more connected to town life and useful for couples wanting a gentler balance between mountain access and comfort.", facts: [fact("Best Time", "Year-round depending on style", "calendar"), fact("Crowd Level", "Variable", "crowd"), fact("Access Difficulty", "Easy to moderate", "path"), fact("Best For", "Comfort, style and broader access", "guests"), fact("Light", "Morning or late afternoon", "sun")], linkLabel: "Read the Cortina guide", linkHref: "/guides/cortina-dampezzo-guide/" }
    } },
    planning: { eyebrow: "Planning Notes", title: "How to choose between these locations.", intro: "The strongest location is not only beautiful in photographs. It should feel right for your light, guests, access needs, weather tolerance and the kind of privacy you hope for.", items: [{ label: "Water vs ridgeline", title: "Choose what the day should feel like before choosing what it should look like.", copy: "Lakes slow the day down. Ridges usually make it feel larger and more exposed. Valleys often feel softer and more pastoral.", meta: "Mood before postcard." }, { label: "Guests", title: "Access matters far more once family is involved.", copy: "A dramatic place loses its calm quickly if the logistics feel too hard for the people you love most.", meta: "Ease protects intimacy." }, { label: "Weather", title: "Some locations stay beautiful in fog better than others.", copy: "Lakes and valleys often hold mist beautifully, while exposed ridges can become more weather-sensitive.", meta: "Weather changes place, not only mood." }, { label: "Crowds", title: "Iconic usually means visible.", copy: "If privacy matters most, choose quieter timing or a less obvious place rather than forcing intimacy into a crowded window.", meta: "Quiet is often designed, not found." }] },
    faq: { title: "Questions couples often ask while choosing a location.", intro: sharedFaqIntro, items: [{ q: "Which Dolomites location is best for guests?", a: "Usually the more accessible places such as Lago di Braies, Alpe di Siusi or some areas around Cortina." }, { q: "Which location feels most iconic?", a: "Tre Cime, Seceda and Cadini are some of the most recognisable." }, { q: "Which location feels quietest?", a: "That depends on timing, but valleys and less famous meadow landscapes often hold quiet more easily." }, { q: "Do we need different planning for each location?", a: "Yes. Access, parking, walking time, weather exposure and crowd rhythm all change from place to place." }] }
  },
  {
    slug: "helicopter-elopement-guide",
    title: "Helicopter Elopement Guide | Remote Views, Privacy and Planning",
    description: "A calm editorial guide to planning a helicopter elopement in the Dolomites or Tyrol, with weather, privacy, cost notes and timing considerations.",
    hero: { eyebrow: "Planning Guide", title: "Helicopter Elopement Guide", copy: "A quiet look at what a helicopter elopement can offer when privacy, remote landscapes and weather-led planning are all part of the experience.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"), imageAlt: "Placeholder image for a helicopter elopement" },
    utility: { reading: "Guide", focus: "For remote mountain experiences and helicopter elopements", navOverview: "Guide Facts", navSeasons: "Planning Blocks", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "A helicopter is never necessary, but for some couples it becomes the most natural way to protect privacy, compress travel or reach a more remote emotional atmosphere.", items: [fact("Best For", "Privacy and remote feeling", "guests"), fact("Needs", "Weather flexibility", "cloud"), fact("Works Best", "With intentional planning", "calendar"), fact("Access Benefit", "Crowd-free possibilities", "path"), fact("Tone", "Quiet, not performative", "wind")] },
    philosophy: { eyebrow: "A first note", title: "The strongest helicopter experiences feel spacious, not flashy.", copy: "A helicopter should never feel like an effect added on top. It works best when it simply becomes the quietest way to move through a day that already wants to feel remote, slow and private." },
    sections: { seasonOrder: ["why", "locations", "flow", "weather", "cost", "privacy", "bestfor"], seasons: {
      why: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"), imageAlt: "Placeholder image for helicopter route over the mountains", title: "Why choose a helicopter elopement", intro: "Sometimes privacy is not about being far away in every sense, but about leaving the obvious routes behind.", copy: "A helicopter can open landscapes that would otherwise take too long to reach, or feel too exposed once you arrive. For some couples it creates a stronger sense of freedom, especially when time, weather or a proposal element matters.", facts: [fact("Best For", "Remote moments and fewer crowds", "wind"), fact("Emotional Strength", "Scale with privacy", "guests"), fact("Planning Need", "A calm, flexible schedule", "calendar")] },
      locations: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME"), imageAlt: "Placeholder image for remote alpine viewpoints", title: "Best locations", intro: "Not every landscape needs a helicopter. The best ones are the places where access changes the feeling most.", copy: "Remote ridges, quieter high meadows and landscapes that become difficult or crowded by land often benefit most. In some cases the flight itself becomes part of the atmosphere, not only the way to arrive.", facts: [fact("Strong Regions", "Dolomites, South Tyrol, North Tyrol", "path"), fact("Best Mood", "Quiet, weather-led, spacious", "wind"), fact("Ideal For", "Proposals, elopements, private vows", "guests")] },
      flow: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"), imageAlt: "Placeholder image for how the helicopter experience flows", title: "How the experience works", intro: "The day usually becomes simpler once the helicopter part is woven in gently.", copy: "The strongest helicopter elopements do not build everything around the flight. They place it carefully inside the wider rhythm: perhaps an intimate morning, a remote landing, private vows, then softer time later in the day on the ground.", facts: [fact("Best Rhythm", "Flight as one chapter, not the whole story", "sun"), fact("Useful For", "Private vows or remote portraits", "guests"), fact("Timing", "Depends entirely on weather", "cloud")] },
      weather: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for weather-led flight planning", title: "Weather flexibility", intro: "Weather decides more here than almost anywhere else.", copy: "A helicopter day only works when the timeline leaves room for conditions. Cloud, wind and visibility all matter. That does not make the day fragile. It simply means the plan should stay honest and flexible from the beginning.", facts: [fact("Main Factors", "Wind, visibility, cloud", "cloud"), fact("Best Planning", "Hold space around the flight window", "calendar"), fact("Backup", "Ground-based alternative always helps", "path")] },
      cost: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"), imageAlt: "Placeholder image for planning costs", title: "Costs and planning notes", intro: "A helicopter experience is usually less about luxury for its own sake and more about what kind of access it quietly solves.", copy: "Costs vary widely depending on route, region, timing and provider. The most useful way to think about it is not as an extra effect, but as a planning decision: whether it supports privacy, time and atmosphere enough to be worth it for your day.", facts: [fact("Approach", "Treat costs as part of experience design", "key"), fact("Worth It For", "Couples prioritising privacy or time", "guests"), fact("Always Check", "Local regulations and conditions", "calendar")] },
      privacy: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"), imageAlt: "Placeholder image for private remote atmosphere", title: "Privacy and crowd-free experience", intro: "The strongest reason for a helicopter is often the quiet it creates, not the spectacle.", copy: "For proposals, private vows or couples who feel most themselves without an audience, the emotional value of privacy can be far more important than the visual novelty of the flight itself.", facts: [fact("Best For", "Private, uninterrupted moments", "guests"), fact("Main Benefit", "Distance from crowds", "crowd"), fact("Tone", "Quiet and intentional", "wind")] },
      bestfor: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"), imageAlt: "Placeholder image for proposal and elopement use", title: "Best for proposals and elopements", intro: "The more personal and compact the experience, the more naturally a helicopter can fit.", copy: "Small elopements, proposals and multi-day mountain experiences often hold the helicopter option most gracefully. It becomes one chapter in a wider story, not the whole purpose of it.", facts: [fact("Most Natural Fit", "Proposals and intimate elopements", "guests"), fact("Can Work For", "Multi-day experiences too", "calendar"), fact("Best When", "The flight deepens the mood, not distracts from it", "sun")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually matters most with helicopters.", intro: "The success of a helicopter day lives in restraint, trust and flexibility rather than in trying to over-design every minute.", items: [{ label: "Weather", title: "Leave real space around the flight window.", copy: "A rushed helicopter plan almost always feels worse than a flexible one.", meta: "Flexibility protects calm." }, { label: "Ground backup", title: "Always love the grounded version too.", copy: "If the weather shifts, you still want the day to feel intentional, not like a compromise.", meta: "Backup should feel beautiful too." }, { label: "Purpose", title: "Know why the helicopter belongs.", copy: "Privacy, remote access and emotional quiet are stronger reasons than spectacle alone.", meta: "Purpose shapes the tone." }, { label: "Pacing", title: "Do not let the flight swallow the whole day.", copy: "The most memorable helicopter experiences feel integrated into a wider rhythm, not isolated from it.", meta: "Keep one coherent story." }] },
    faq: { title: "Questions couples often ask about helicopter elopements.", intro: sharedFaqIntro, items: [{ q: "Is a helicopter elopement only for very large budgets?", a: "Not always, but it is a meaningful planning decision and should be weighed against what it brings emotionally and logistically." }, { q: "What if the weather changes?", a: "Weather flexibility is essential. A grounded backup plan is part of a strong helicopter day." }, { q: "Does it feel too showy?", a: "It can if it is approached as spectacle. It feels strongest when it is used quietly and intentionally." }, { q: "Is it good for proposals?", a: "Often yes, especially if privacy and a strong sense of place matter to you." }] }
  },
  {
    slug: "sunrise-vs-sunset-dolomites",
    title: "Sunrise vs Sunset in the Dolomites | Light, Crowds and Timing",
    description: "A calm guide to choosing sunrise or sunset in the Dolomites, with crowd comparison, light quality, timeline ideas and location notes.",
    hero: { eyebrow: "Planning Guide", title: "Sunrise vs Sunset in the Dolomites", copy: "A thoughtful comparison for couples choosing between first light in the mountains and the slower warmth of late evening.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for sunrise versus sunset in the mountains" },
    utility: { reading: "Guide", focus: "For couples choosing the light and rhythm of the day", navOverview: "Guide Facts", navSeasons: "Guide Sections", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "In the Dolomites, choosing sunrise or sunset is rarely only about preference. It shapes access, crowd levels, temperature, energy and how private the day can feel.", items: [fact("Best For Privacy", "Usually sunrise", "sunrise"), fact("Warmest Mood", "Usually sunset", "sun"), fact("Crowds", "Lower early, higher later", "crowd"), fact("Energy Need", "Higher at sunrise", "guests"), fact("Best For", "Couples choosing between stillness and ease", "calendar")] },
    philosophy: { eyebrow: "A first note", title: "Neither is always better. They simply carry different truths.", copy: "Sunrise often creates stillness and space. Sunset often creates warmth and softness. The better choice is the one that fits your energy, your location and the kind of emotional pace you want the day to hold." },
    sections: { seasonOrder: ["why", "sunset", "crowds", "light", "timelines", "recommendations"], seasons: {
      why: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for sunrise in the Dolomites", title: "Why sunrise is usually best", intro: "At iconic Dolomites locations, sunrise often changes everything.", copy: "Fewer people, cooler air, softer light and calmer access all tend to align in the first hours of the day. Places like Lago di Braies, Seceda or Tre Cime often feel much more personal at sunrise than later on.", facts: [fact("Best For", "Privacy and stillness", "guests"), fact("Light", "Soft and dimensional", "sunrise"), fact("Crowds", "Lowest", "crowd")] },
      sunset: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_SECEDA"), imageAlt: "Placeholder image for late evening mountain light", title: "When sunset works better", intro: "Sunset can be the kinder choice if you want warmth and a more spacious emotional pace.", copy: "Some locations become beautiful in the late glow of evening, especially meadow landscapes or lake settings where the feeling matters more than total privacy. Sunset can also help if a very early start would drain rather than support the day.", facts: [fact("Best For", "Warmth and slower pacing", "sun"), fact("Works Well At", "Meadows, lakes, gentler landscapes", "path"), fact("Tradeoff", "Often more people", "crowd")] },
      crowds: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"), imageAlt: "Placeholder image for crowd comparison", title: "Crowd comparison", intro: "This is often the deciding factor, even more than aesthetics.", copy: "If the location is famous, sunrise almost always wins for privacy. If the location is quieter or less obvious, sunset can feel just as beautiful without the same pressure.", facts: [fact("Iconic Spots", "Choose sunrise if you want space", "crowd"), fact("Quieter Spots", "Sunset can work beautifully", "sun"), fact("Main Question", "How private does the day need to feel?", "guests")] },
      light: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for mountain light quality", title: "Light quality", intro: "Morning and evening are not interchangeable in the mountains.", copy: "Sunrise light often feels clearer, finer and more dimensional. Sunset light feels warmer, slower and more enveloping. Both can be beautiful, but they carry different emotional temperatures.", facts: [fact("Sunrise Light", "Clear, soft, spacious", "sunrise"), fact("Sunset Light", "Warm, slow, golden", "sun"), fact("Best Choice", "Depends on the mood you want", "wind")] },
      timelines: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"), imageAlt: "Placeholder image for timeline examples", title: "Timeline examples", intro: "The right light also changes how the whole day is built.", copy: "A sunrise day often begins with getting ready in darkness and opening into quiet. A sunset day often holds more breathing room earlier on, then gathers warmth as the light deepens. Neither is better. They are simply different emotional arcs.", facts: [fact("Sunrise Day", "Earlier, quieter, more compact", "calendar"), fact("Sunset Day", "Slower start, warmer finish", "sun"), fact("Best Fit", "Energy and location dependent", "guests")] },
      recommendations: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME"), imageAlt: "Placeholder image for location recommendations by light", title: "Location recommendations", intro: "Some places ask for sunrise. Others leave more room for choice.", copy: "Lago di Braies, Seceda and Tre Cime usually benefit most from sunrise. Softer valleys, meadows and some lakeside or lower-access locations can work beautifully at sunset if the crowd pressure is lower.", facts: [fact("Best at Sunrise", "Lago di Braies, Seceda, Tre Cime", "sunrise"), fact("More Flexible", "Meadows and quieter valleys", "sun"), fact("Best Rule", "Match light to location, not only preference", "path")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually decides between sunrise and sunset.", intro: "Most couples begin by imagining a picture. The stronger decision usually comes from energy, privacy and how the landscape behaves at that hour.", items: [{ label: "Energy", title: "Choose the version of the day you can still enjoy while living it.", copy: "A sunrise that leaves you exhausted is not always better than a sunset that lets you feel present.", meta: "Emotion first, not only aesthetics." }, { label: "Privacy", title: "For iconic places, sunrise usually protects the experience.", copy: "If the place is famous, dawn often gives you the calmest version of it.", meta: "Privacy changes the whole mood." }, { label: "Location", title: "Some places are more flexible than others.", copy: "Quiet meadows and lesser-known areas often allow more freedom with timing than headline locations.", meta: "Not every place needs dawn." }, { label: "Guests", title: "Sunset can be kinder once family is involved.", copy: "A very early start is not always the right emotional choice if others are part of the day.", meta: "Gentleness is also good planning." }] },
    faq: { title: "Questions couples often ask when choosing the light.", intro: sharedFaqIntro, items: [{ q: "Is sunrise always better in the Dolomites?", a: "Not always, but it is often better at the most iconic locations because of crowd levels and softer air." }, { q: "Can sunset still feel private?", a: "Yes, especially at quieter locations or outside the busiest season." }, { q: "Which has the more cinematic light?", a: "Both can. Sunrise is usually clearer and softer, sunset warmer and more enveloping." }, { q: "What if we are not morning people?", a: "Then sunset may honestly be the stronger choice, especially if the place allows it without too much crowd pressure." }] }
  },
  {
    slug: "weather-and-backup-planning",
    title: "Weather & Backup Planning Guide | Mountain Conditions with Calm",
    description: "A calm guide to weather and backup planning for Dolomites elopements, covering fog, rain, wind, flexible timelines and what couples should bring.",
    hero: { eyebrow: "Planning Guide", title: "Weather & Backup Planning Guide", copy: "A calm way to think about mountain weather, flexible timelines and why some of the most meaningful days are the ones that never tried to force perfect conditions.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for mountain weather and fog" },
    utility: { reading: "Guide", focus: "For weather-led planning in the Dolomites and Tyrol", navOverview: "Guide Facts", navSeasons: "Guide Sections", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "Weather in the mountains is not a side note. It shapes visibility, mood, access, energy and the way the whole day needs to move.", items: [fact("Main Reality", "Weather changes fast", "cloud"), fact("Best Strategy", "Flexible timing", "calendar"), fact("Crowd Effect", "Bad forecasts can quiet famous places", "crowd"), fact("Need", "Layers and backup spots", "path"), fact("Best For", "Couples wanting calmer expectations", "guests")] },
    philosophy: { eyebrow: "A first note", title: "The strongest plan is often the one that can bend without losing itself.", copy: "Mountain weather is not there to be controlled. It is there to be respected and, when possible, woven into the experience instead of treated as the thing standing in the way of it." },
    sections: { seasonOrder: ["reality", "rain", "backup", "timelines", "bring", "experience"], seasons: {
      reality: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for mountain weather reality", title: "Mountain weather reality", intro: "The forecast is useful, but it is never the whole story.", copy: "In the Dolomites, conditions can change quickly between valley, lift station and ridge. A weather plan needs to respond to place, not only to numbers on a screen.", facts: [fact("Main Shift", "Wind, cloud, visibility", "cloud"), fact("Why It Matters", "Access and mood both change", "path"), fact("Best Response", "Leave room in the plan", "calendar")] },
      rain: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for rain and fog in the mountains", title: "Rain, fog, wind and storms", intro: "Each kind of weather changes the emotional tone differently.", copy: "Fog often creates intimacy. Rain can soften everything. Wind adds movement, but can also make exposed places feel harder. Storm risk matters most in summer afternoons, which is one reason early starts work so well in the mountains.", facts: [fact("Fog", "Often deeply atmospheric", "cloud"), fact("Wind", "Most relevant on ridges", "wind"), fact("Storm Risk", "Higher in summer afternoons", "calendar")] },
      backup: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_LAGO_DI_BRAIES"), imageAlt: "Placeholder image for backup locations", title: "Backup locations", intro: "A backup only works when you already believe in it.", copy: "The best backup locations are not random compromises. They are softer, lower, more protected places that still feel like part of the same day. Lakes, valleys and gentler meadows often hold weather beautifully.", facts: [fact("Best Backup Type", "Lower, sheltered, still atmospheric", "path"), fact("Why It Works", "Keeps the story coherent", "guests"), fact("Avoid", "Treating backup as a last-minute panic move", "key")] },
      timelines: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"), imageAlt: "Placeholder image for flexible timelines", title: "Flexible timelines", intro: "Mountain planning works best when it breathes.", copy: "If the timeline is too rigid, weather immediately becomes stressful. If it leaves room for an earlier start, a delayed drive or a softer route, weather becomes part of the day's rhythm instead of its enemy.", facts: [fact("Best Shape", "Soft and flexible", "calendar"), fact("Useful Choice", "Fewer fixed moments", "guests"), fact("Result", "More calm when conditions shift", "wind")] },
      bring: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_STYLE"), imageAlt: "Placeholder image for layers and things to bring", title: "What couples should bring", intro: "A few practical things change the whole quality of the experience.", copy: "Layers, proper shoes, something warm for pauses and a willingness to move with the weather all matter more than couples often expect. In the mountains, comfort supports presence.", facts: [fact("Always Bring", "Layers and proper shoes", "key"), fact("Helpful", "Warmth for pauses", "wind"), fact("Best Mindset", "Prepared but soft", "guests")] },
      experience: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for local experience in changing conditions", title: "Why local experience matters", intro: "Knowing a place in changing weather often matters more than knowing it in perfect light.", copy: "A location can feel completely different in fog than in sun. Local experience helps because it knows which places still hold beauty, access and calm once the forecast stops looking ideal.", facts: [fact("Most Valuable", "Knowing how places behave in change", "path"), fact("Why", "Backups feel intentional", "key"), fact("Result", "More trust, less panic", "guests")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually helps most when weather is part of the story.", intro: "A better weather plan is almost never more control. It is better expectations, stronger alternatives and a calmer pace.", items: [{ label: "Forecast", title: "Use it as guidance, not a verdict.", copy: "Mountain forecasts help, but they are only one layer of the real conditions you will feel on the day.", meta: "Useful, but never absolute." }, { label: "Backups", title: "Choose them early and love them honestly.", copy: "A backup works only if it already feels like a meaningful choice.", meta: "Emotion still matters." }, { label: "Timing", title: "Earlier often means calmer.", copy: "Many summer weather concerns are softened by simply starting earlier.", meta: "Morning gives options." }, { label: "Trust", title: "A weather-shaped day can be more memorable than a perfect one.", copy: "Fog, wind and moving cloud often create the most cinematic emotional texture of all.", meta: "Weather can deepen the story." }] },
    faq: { title: "Questions couples often ask about mountain weather.", intro: sharedFaqIntro, items: [{ q: "What if it rains on the wedding day?", a: "Rain can still create a beautiful, intimate atmosphere, especially if the plan includes softer or more sheltered options." }, { q: "Is fog bad for photos?", a: "Usually not. Fog often adds mood, depth and quiet rather than taking something away." }, { q: "Should we build a backup timeline?", a: "Yes, a softer alternate route or timing window is almost always helpful." }, { q: "Do we need special clothing for mountain weather?", a: "Layers and proper shoes matter far more than couples often expect." }] }
  },
  {
    slug: "what-to-wear-in-the-mountains",
    title: "What to Wear in the Mountains | Styling for Wind, Light and Movement",
    description: "A calm guide to what to wear for a mountain elopement, from dresses and shoes to layers, winter outfits and guest notes.",
    hero: { eyebrow: "Planning Guide", title: "What to Wear in the Mountains", copy: "A thoughtful styling guide for couples who want to look beautiful in the mountains without feeling disconnected from weather, movement and the real rhythm of the day.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_STYLE"), imageAlt: "Placeholder image for mountain elopement clothing" },
    utility: { reading: "Guide", focus: "For movement, weather and quiet mountain styling", navOverview: "Guide Facts", navSeasons: "Guide Sections", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "Mountain styling works best when beauty and practicality stop feeling like opposites. The goal is not only to look good in the landscape, but to still feel like yourself while moving through it.", items: [fact("Most Important", "Layers and movement", "wind"), fact("Footwear", "Shoes you can actually use", "path"), fact("Main Challenge", "Cold mornings and wind", "cloud"), fact("Best For", "Editorial but honest styling", "guests"), fact("Good Mindset", "Comfort supports presence", "sun")] },
    philosophy: { eyebrow: "A first note", title: "The best styling is the kind that lets the day stay real.", copy: "Clothing in the mountains does not need to fight the weather to feel beautiful. It often becomes more beautiful once it works with movement, wind and temperature instead of pretending those things are not there." },
    sections: { seasonOrder: ["dress", "shoes", "layers", "winter", "wind", "hiking", "guests"], seasons: {
      dress: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_STYLE"), imageAlt: "Placeholder image for wedding dress styling", title: "Wedding dress tips", intro: "The mountains reward fabrics that move rather than freeze.", copy: "Lighter, more fluid materials often feel especially beautiful outdoors. The right dress does not only photograph well. It lets you walk, sit, breathe and still feel like yourself in changing weather.", facts: [fact("Best Fabrics", "Movement-friendly and soft", "wind"), fact("Best For", "Ease and natural shape", "guests"), fact("Avoid", "Very rigid styling if movement matters", "key")] },
      shoes: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_STYLE"), imageAlt: "Placeholder image for mountain footwear", title: "Shoes", intro: "Good shoes protect the whole emotional quality of the day.", copy: "Footwear should never be treated as an afterthought in the mountains. Even a small path, wet grass or a windy ridge changes how the body feels. Comfortable shoes almost always create more elegance than shoes that need constant managing.", facts: [fact("Best Choice", "Shoes you trust", "path"), fact("Main Goal", "Stability and comfort", "guests"), fact("Why", "Comfort changes posture and ease", "wind")] },
      layers: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_STYLE"), imageAlt: "Placeholder image for layering in the mountains", title: "Layers", intro: "Layers are often the difference between enduring a day and enjoying it.", copy: "Cold mornings, changing weather and pauses between locations make layering essential. A beautiful shawl, jacket or knit can protect the atmosphere of the day rather than interrupt it.", facts: [fact("Always Useful", "A warm layer between moments", "key"), fact("Best For", "Morning starts and shoulder seasons", "cloud"), fact("Visual Benefit", "Adds softness and depth", "sun")] },
      winter: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_WINTER_ELOPEMENT"), imageAlt: "Placeholder image for winter mountain outfits", title: "Winter outfits", intro: "Winter styling works best when warmth is built into the beauty from the beginning.", copy: "Trying to style winter like summer usually creates discomfort. Strong winter outfits use structure, texture and intentional layering so the day can stay still and graceful even in snow or colder air.", facts: [fact("Main Need", "Warmth without stiffness", "cloud"), fact("Best Look", "Textural, layered, calm", "wind"), fact("Always Bring", "Hand warmers and serious outer layers", "key")] },
      wind: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_STYLE"), imageAlt: "Placeholder image for wind and cold styling", title: "Wind and cold", intro: "Wind changes more than the temperature. It changes how everything sits and moves.", copy: "What photographs beautifully in still air may feel frustrating in exposed weather. Fabrics, hair choices, jackets and the willingness to adapt all matter much more than couples often expect.", facts: [fact("Most Affected", "Hair, fabric movement, comfort", "wind"), fact("Best Response", "Plan for it, do not fight it", "key"), fact("Useful Choice", "Softer styling with flexibility", "guests")] },
      hiking: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_STYLE"), imageAlt: "Placeholder image for hiking-friendly mountain styling", title: "Hiking-friendly styling", intro: "A mountain day can still feel editorial without pretending the mountain is not there.", copy: "For hike-based locations, clothing should let you move without constant correction. That often means balancing form and function, then changing details only when it feels natural to do so.", facts: [fact("Best For", "Remote and walking-based days", "path"), fact("Main Goal", "Freedom of movement", "guests"), fact("Look", "Quietly editorial, not overly precious", "sun")] },
      guests: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_STYLE"), imageAlt: "Placeholder image for guest outfit notes", title: "Guest outfit notes", intro: "If guests are joining, styling becomes part of the shared comfort of the day.", copy: "A simple note about layers, walking shoes and changing temperatures can help everyone feel calmer and more prepared. Comfortable guests create a softer atmosphere for the whole experience.", facts: [fact("Best Advice", "Layers and practical shoes", "key"), fact("Why It Matters", "Comfort shapes the whole tone", "guests"), fact("Works Well", "A calm dress code note in advance", "calendar")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What styling usually needs most in the mountains.", intro: "The strongest mountain styling supports presence first. Once that is true, it almost always looks better too.", items: [{ label: "Movement", title: "Choose what you can actually walk in.", copy: "Ease in the body is visible in every frame.", meta: "Comfort is visual." }, { label: "Warmth", title: "Build warmth in before you need it.", copy: "Cold affects expression, pace and how much you can enjoy the landscape.", meta: "Planning warmth protects joy." }, { label: "Wind", title: "Treat wind like part of the design.", copy: "The best outfits do not collapse once the air begins to move.", meta: "Work with movement." }, { label: "Guests", title: "Help others prepare too.", copy: "A simple note about shoes and layers makes the whole day feel easier for everyone.", meta: "Shared comfort changes the atmosphere." }] },
    faq: { title: "Questions couples often ask about styling in the mountains.", intro: sharedFaqIntro, items: [{ q: "Can we still wear formal clothing in the mountains?", a: "Absolutely, as long as it still allows movement, warmth and some flexibility with the terrain." }, { q: "Do we really need proper shoes?", a: "In most mountain locations, yes. Even a beautiful path can feel very different in real weather." }, { q: "What should we bring for cold mornings?", a: "Layers, outerwear and something warm for pauses between moments make a huge difference." }, { q: "Should guests receive outfit guidance too?", a: "Yes, especially if the location includes uneven ground, wind or lower temperatures." }] }
  },
  {
    slug: "multi-day-elopement-guide",
    title: "Multi-Day Elopement Guide | More Time, More Quiet, More Story",
    description: "A calm guide to multi-day elopements in the Dolomites, with example timelines, rifugio stays, sunrise moments and helicopter add-ons.",
    hero: { eyebrow: "Planning Guide", title: "Multi-Day Elopement Guide", copy: "For couples who want something slower than a single photoshoot and spacious enough to hold hiking, quiet mornings, rest and the feeling of staying in the mountains long enough to truly arrive.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"), imageAlt: "Placeholder image for a multi-day elopement experience" },
    utility: { reading: "Guide", focus: "For couples wanting more time than a single day can hold", navOverview: "Guide Facts", navSeasons: "Guide Sections", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "A multi-day mountain experience creates room: for changing weather, for slower pacing, for a sunrise that does not feel rushed and for a wedding day that feels like more than a schedule.", items: [fact("Best For", "Couples wanting depth and space", "guests"), fact("Strong Add-On", "Sunrise and rifugio stays", "sunrise"), fact("Weather Benefit", "More flexibility", "cloud"), fact("Mood", "Slow, cinematic, deeply personal", "wind"), fact("Can Include", "Helicopter or hike elements", "path")] },
    philosophy: { eyebrow: "A first note", title: "More time often means more truth.", copy: "When the day is not forced to hold everything at once, couples usually relax into the mountains differently. The experience becomes less about fitting a story into one day and more about letting it unfold honestly." },
    sections: { seasonOrder: ["why", "dayone", "daytwo", "hiking", "rifugio", "sunrise", "helicopter", "bestfor"], seasons: {
      why: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"), imageAlt: "Placeholder image for a multi-day mountain experience", title: "Why choose a multi-day experience", intro: "Some wedding stories simply need more than one weather window and one emotional pace.", copy: "A multi-day Dolomites Elopement gives you room for different kinds of light, slower transitions and more honest energy. It can hold a quiet arrival, a warm evening, a sunrise, a hike and a ceremony without forcing them into the same breath.", facts: [fact("Best For", "Couples who value space over compression", "guests"), fact("Main Benefit", "More atmosphere, less rush", "wind"), fact("Often Includes", "Travel, staying overnight, different locations", "calendar")] },
      dayone: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"), imageAlt: "Placeholder image for day one of a multi-day elopement", title: "Day 1 example", intro: "The first day often works best as arrival rather than peak moment.", copy: "A gentle travel day, a quiet evening walk, time to settle and perhaps a dinner or warm portrait session can soften the whole experience. Day one does not need to be the dramatic one to matter deeply.", facts: [fact("Best Mood", "Arrival and soft connection", "sun"), fact("Useful For", "Travel, rest, evening portraits", "calendar"), fact("Why", "It removes pressure from the ceremony day", "guests")] },
      daytwo: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for sunrise on day two", title: "Day 2 example", intro: "The second day can hold the strongest light because the body is already there.", copy: "This might be the ceremony sunrise, a private vow exchange, a hike or the main couple session. Because you are no longer arriving for the first time, the whole day usually feels more grounded and less hurried.", facts: [fact("Best Mood", "Intentional and spacious", "sunrise"), fact("Useful For", "Sunrise ceremony or main portraits", "guests"), fact("Why", "You are already emotionally settled", "wind")] },
      hiking: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"), imageAlt: "Placeholder image for a hiking elopement route", title: "Hiking elopement option", intro: "A multi-day structure makes hiking feel more realistic and less compressed.", copy: "When hiking is part of the story, more time changes everything. The path can become part of the atmosphere instead of a rushed transition between locations.", facts: [fact("Best For", "Couples who love movement", "path"), fact("Main Benefit", "Less pressure on pace", "guests"), fact("Mood", "Adventure without hurry", "wind")] },
      rifugio: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"), imageAlt: "Placeholder image for a rifugio stay", title: "Rifugio stay", intro: "A mountain hut stay can make the experience feel quieter and more immersive.", copy: "Sleeping closer to the landscape changes how the next morning begins. Instead of driving up from below, the day starts already inside the mountains, which can shift the emotional tone in a very beautiful way.", facts: [fact("Best For", "Immersive mountain feeling", "path"), fact("Mood", "Quiet, sheltered, atmospheric", "wind"), fact("Useful For", "Sunrise without long transfers", "sunrise")] },
      sunrise: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for sunrise ceremony planning", title: "Sunrise ceremony", intro: "More time makes an early morning feel generous instead of abrupt.", copy: "A sunrise ceremony is often strongest when the day before has already slowed everything down. It stops feeling like an alarm clock decision and starts feeling like part of a larger emotional arc.", facts: [fact("Best For", "Quiet, private ceremonies", "sunrise"), fact("Main Benefit", "Calm early energy", "guests"), fact("Works Best", "Inside a slower multi-day flow", "calendar")] },
      helicopter: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_HELICOPTER"), imageAlt: "Placeholder image for helicopter add-on", title: "Helicopter add-on", intro: "If a helicopter belongs anywhere naturally, it is often inside a multi-day experience.", copy: "More time gives the flight space to feel integrated rather than abrupt. It can become one chapter in a longer mountain story instead of trying to carry the whole weight of the day by itself.", facts: [fact("Best For", "One remote chapter of a wider experience", "wind"), fact("Needs", "Weather flexibility", "cloud"), fact("Tone", "Integrated, not isolated", "calendar")] },
      bestfor: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_MULTI_DAY"), imageAlt: "Placeholder image for couples wanting more than a photoshoot", title: "Best for couples who want more than a photoshoot", intro: "This format is often about depth more than about volume.", copy: "A multi-day experience is strongest for couples who want to feel the mountains, not only see them. It creates room for connection, weather, travel, rest and the kind of quiet that cannot be rushed into a single day.", facts: [fact("Best For", "Depth and emotional rhythm", "guests"), fact("Not About", "Doing more for the sake of more", "key"), fact("Most Useful For", "Couples who want the day to breathe", "wind")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually matters most in a multi-day structure.", intro: "More time does not mean adding everything. It means choosing a rhythm that can actually hold what matters.", items: [{ label: "Pacing", title: "Protect one slow chapter in each day.", copy: "The beauty of multi-day experiences comes from room, not activity alone.", meta: "Space is part of the design." }, { label: "Weather", title: "Use the extra time to create flexibility.", copy: "A wider schedule gives you a gentler response when conditions shift.", meta: "Time is one of the best backups." }, { label: "Rest", title: "Do not underestimate sleep and travel ease.", copy: "Good rest changes the emotional texture of every sunrise and every hike.", meta: "Energy shapes presence." }, { label: "Story", title: "Let each day have a different role.", copy: "Arrival, ceremony, hike, portrait time and private quiet do not all need to happen at once.", meta: "One story, several chapters." }] },
    faq: { title: "Questions couples often ask about multi-day elopements.", intro: sharedFaqIntro, items: [{ q: "Why choose more than one day?", a: "Because it creates space for weather, rest, travel, sunrise light and emotional ease." }, { q: "Can hiking fit better into a multi-day format?", a: "Very often yes. More time allows the path to feel like part of the experience rather than a rushed transition." }, { q: "Is a rifugio stay worth it?", a: "It can be incredibly atmospheric if you want to wake up already inside the mountains." }, { q: "Can we add a helicopter to a multi-day experience?", a: "Yes, and it often fits more naturally there than in a single compressed day." }] }
  },
  {
    slug: "tre-cime-wedding-guide",
    title: "Tre Cime Wedding Guide | Iconic Peaks, Timing and Access",
    description: "A calm guide to Tre Cime for weddings and elopements, with sunrise timing, crowd reality, access notes and the emotional feel of the location.",
    hero: { eyebrow: "Location Guide", title: "Tre Cime Wedding Guide", copy: "For couples drawn to one of the most iconic mountain forms in the Dolomites and willing to shape the day carefully around access, timing and openness.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME"), imageAlt: "Placeholder image for Tre Cime" },
    utility: { reading: "Guide", focus: "For iconic peaks and classic Dolomites scale", navOverview: "Guide Facts", navSeasons: "Location Notes", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "Tre Cime is one of the most recognisable places in the Dolomites. Its power comes from scale and form, but that also means timing and crowd awareness matter greatly.", items: [fact("Best Time", "Summer to early autumn", "calendar"), fact("Best Light", "Sunrise", "sunrise"), fact("Crowd Level", "High at key viewpoints", "crowd"), fact("Access", "Road plus walking", "path"), fact("Best For", "Classic dramatic Dolomites feeling", "guests")] },
    philosophy: { eyebrow: "A first note", title: "Tre Cime feels memorable because the scale is immediate and unmistakable.", copy: "This is one of the places where the classic Dolomites feeling appears almost instantly. The challenge is not beauty. It is protecting intimacy inside a place many people already know." },
    sections: { seasonOrder: ["special", "time", "access", "crowds", "weather"], seasons: {
      special: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME"), imageAlt: "Placeholder image for Tre Cime landscape", title: "Why Tre Cime stays iconic", intro: "Some landscapes feel famous. Tre Cime still manages to feel grander than expectation.", copy: "The shapes are strong, the horizon feels open and the place carries a very classic Dolomites atmosphere. That makes it powerful for couples wanting an unmistakable mountain setting.", facts: [fact("Mood", "Iconic and expansive", "wind"), fact("Best For", "Classic mountain feeling", "guests"), fact("Visual Strength", "Recognisable peaks and open sky", "sun")] },
      time: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_COUPLE_SUNRISE"), imageAlt: "Placeholder image for sunrise near Tre Cime", title: "Best time", intro: "Tre Cime usually works best when the day is still quiet.", copy: "Sunrise often creates the strongest emotional contrast here, with less pressure from other visitors and softer light across the peaks. Later hours still look beautiful, but they feel far more public.", facts: [fact("Best", "Sunrise", "sunrise"), fact("Avoid", "Busy daytime windows", "crowd"), fact("Best Mood", "Open and calm", "sun")] },
      access: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME"), imageAlt: "Placeholder image for road access and walking", title: "Access", intro: "Tre Cime is relatively achievable, but not frictionless.", copy: "Road access makes the area reachable, yet timing, parking and walking distances still shape the day. Planning ahead matters more than the map may initially suggest.", facts: [fact("Main Access", "Road with walking segments", "path"), fact("Check", "Road and parking systems", "key"), fact("Best For", "Couples comfortable with some movement", "guests")] },
      crowds: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_TRE_CIME"), imageAlt: "Placeholder image for crowd reality at iconic peaks", title: "Crowd reality", intro: "Tre Cime is one of the places where iconic beauty and public visibility often arrive together.", copy: "If you want this landscape to feel personal, sunrise and shoulder timing become especially helpful. The peaks stay the same, but the emotional texture of the experience changes completely.", facts: [fact("Quietest", "Early morning", "calendar"), fact("Busiest", "Later day and weekends", "crowd"), fact("Best Strategy", "Choose calm windows intentionally", "path")] },
      weather: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for weather at Tre Cime", title: "Weather notes", intro: "Tre Cime stays powerful in many conditions, but visibility matters.", copy: "Low cloud can still feel atmospheric here, but full visibility strengthens the scale of the place. Wind and temperature shifts remain part of the experience, especially outside the height of summer.", facts: [fact("Best Mood", "Clear or softly clouded", "cloud"), fact("Main Factors", "Visibility and wind", "wind"), fact("Plan", "Leave room around the best light", "calendar")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually matters most at Tre Cime.", intro: "This is one of the places where a simple plan and strong timing usually create the best version of the day.", items: [{ label: "Timing", title: "Start early if privacy matters.", copy: "The difference between sunrise and later day is often dramatic here.", meta: "Early changes everything." }, { label: "Access", title: "Treat the route as part of planning.", copy: "Road access, parking and walking distance all shape the first emotional hour of the day.", meta: "Logistics affect calm." }, { label: "Guests", title: "Be realistic with group comfort.", copy: "Tre Cime can work with guests, but only when the pace and access are honestly considered.", meta: "Comfort supports presence." }, { label: "Weather", title: "Choose the weather window, not only the peak.", copy: "The strongest day comes from conditions that fit the experience, not from forcing the location at all costs.", meta: "Conditions decide the tone." }] },
    faq: { title: "Questions couples often ask about Tre Cime.", intro: sharedFaqIntro, items: [{ q: "Is Tre Cime worth it for a wedding day?", a: "Yes, especially if you want a classic, unmistakably Dolomites landscape." }, { q: "Is sunrise important here?", a: "Usually yes if you want more quiet and less public visibility." }, { q: "Can it work with guests?", a: "It can, but the route and walking expectations should be considered honestly." }, { q: "Does weather matter more here than at a lake?", a: "Yes, visibility and openness shape the feeling strongly." }] }
  },


  {
    slug: "val-di-funes-guide",
    title: "Val di Funes Guide | Quiet Valley Atmosphere and Mountain Light",
    description: "A calm guide to Val di Funes for elopements, with soft valley mood, access notes, light and why it feels different from the more iconic peaks.",
    hero: { eyebrow: "Location Guide", title: "Val di Funes Guide", copy: "For couples drawn to quieter valley landscapes, church views, meadows and a more pastoral side of the Dolomites that still feels deeply cinematic.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_VAL_DI_FUNES"), imageAlt: "Placeholder image for Val di Funes" },
    utility: { reading: "Guide", focus: "For quieter valley moods in the Dolomites", navOverview: "Guide Facts", navSeasons: "Location Notes", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "Val di Funes offers a softer emotional pace than many iconic ridge locations. It works especially well for couples who want atmosphere without the day feeling too exposed.", items: [fact("Best Time", "Summer to autumn", "calendar"), fact("Best Light", "Morning and soft evening", "sun"), fact("Crowd Level", "Medium", "crowd"), fact("Access", "Easy to moderate", "path"), fact("Best For", "Quiet pastoral atmosphere", "guests")] },
    philosophy: { eyebrow: "A first note", title: "Val di Funes feels quieter because it speaks more softly.", copy: "The beauty here is less about one overwhelming ridgeline and more about how valley, light, pasture and distance begin to settle together." },
    sections: { seasonOrder: ["special", "time", "access", "crowds", "weather"], seasons: {
      special: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_VAL_DI_FUNES"), imageAlt: "Placeholder image for Val di Funes valley", title: "Why Val di Funes feels different", intro: "It trades spectacle for atmosphere in a very beautiful way.", copy: "This valley often feels softer, more pastoral and less dramatic than the headline locations. That is exactly what makes it meaningful for many couples.", facts: [fact("Mood", "Pastoral and calm", "wind"), fact("Best For", "Couples wanting softness", "guests"), fact("Visual Strength", "Valley depth and church views", "sun")] },
      time: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_VAL_DI_FUNES"), imageAlt: "Placeholder image for light in the valley", title: "Best time", intro: "This landscape is more forgiving than the iconic sunrise-only spots.", copy: "Morning and late day can both feel strong, depending on the exact scene you want. The valley light often has a gentle quality that works outside the strictest sunrise window.", facts: [fact("Most Flexible", "Morning and evening", "sun"), fact("Why", "Softer terrain and broader mood", "wind"), fact("Best For", "Couples wanting less pressure", "guests")] },
      access: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_VAL_DI_FUNES"), imageAlt: "Placeholder image for access in the valley", title: "Access notes", intro: "This is often easier to live than the more exposed locations.", copy: "Access is usually simpler, which makes Val di Funes more useful for guests or for days that need a calmer emotional start.", facts: [fact("Difficulty", "Easy to moderate", "path"), fact("Guest Friendly", "Yes", "guests"), fact("Best Use", "Calmer editorial mountain days", "calendar")] },
      crowds: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_VAL_DI_FUNES"), imageAlt: "Placeholder image for crowd rhythm in a valley", title: "Crowd reality", intro: "This is usually gentler than the most famous ridges, but timing still matters.", copy: "Certain viewpoints can still attract attention, yet the valley overall often feels less concentrated and easier to move through quietly.", facts: [fact("General Feel", "Less concentrated than icon spots", "crowd"), fact("Quietest", "Early and shoulder season", "calendar"), fact("Best Strategy", "Use quieter edges, not only headline views", "path")] },
      weather: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for fog and valley atmosphere", title: "Weather notes", intro: "Mist and changing weather often feel especially beautiful here.", copy: "Because the landscape is gentler and more layered, cloud and fog can add a lot of emotional depth without taking away the sense of place.", facts: [fact("Best Mood", "Mist, soft cloud, quiet light", "cloud"), fact("Main Strength", "Weather often adds atmosphere", "wind"), fact("Best For", "Couples open to cinematic softness", "guests")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually matters most in Val di Funes.", intro: "This location often works best when you lean into its softness instead of trying to force more spectacle out of it.", items: [{ label: "Mood", title: "Let the valley stay gentle.", copy: "The strength of this place is atmosphere, not dramatic effort.", meta: "Softness is the point." }, { label: "Guests", title: "A useful option for more inclusive days.", copy: "Its easier access can make it more comfortable for a broader group.", meta: "Calm can be practical too." }, { label: "Weather", title: "Do not fear mist here.", copy: "Fog and low cloud often deepen the valley beautifully.", meta: "Weather often helps." }, { label: "Light", title: "You have more flexibility than at headline ridges.", copy: "Morning is still beautiful, but the landscape can also hold quieter evening light well.", meta: "Less pressure on timing." }] },
    faq: { title: "Questions couples often ask about Val di Funes.", intro: sharedFaqIntro, items: [{ q: "Is Val di Funes a good alternative to the iconic ridges?", a: "Yes, especially if you want something softer, quieter and less exposed." }, { q: "Is it guest friendly?", a: "Often yes, especially compared with more hike-based locations." }, { q: "Does it need sunrise?", a: "Not as strictly as some iconic locations. It can hold gentle light at different times." }, { q: "Can mist still work beautifully?", a: "Very often yes. It can be one of the strongest parts of the valley mood." }] }
  },
  {
    slug: "cortina-dampezzo-guide",
    title: "Cortina d’Ampezzo Guide | Elegance, Access and Dolomite Atmosphere",
    description: "A calm guide to Cortina d’Ampezzo for weddings and elopements, with mountain access, softer comfort and location flexibility.",
    hero: { eyebrow: "Location Guide", title: "Cortina d’Ampezzo Guide", copy: "For couples who want a Dolomites wedding or elopement with mountain atmosphere, but also a little more ease, elegance and connection to town comfort.", cta: "Start Planning", image: placeholder("IMAGE_PLACEHOLDER_CORTINA"), imageAlt: "Placeholder image for Cortina d’Ampezzo" },
    utility: { reading: "Guide", focus: "For mountain atmosphere with a softer comfort base", navOverview: "Guide Facts", navSeasons: "Location Notes", navPhilosophy: "Intro", navVisual: "More Guides", navFaq: "FAQ" },
    overview: { eyebrow: "Guide Facts", copy: "Cortina offers a different kind of Dolomites experience: still beautiful, still dramatic, but with more ease around accommodation, comfort and the broader rhythm of the day.", items: [fact("Best Time", "Year-round depending on style", "calendar"), fact("Best Light", "Morning and late afternoon", "sun"), fact("Crowd Level", "Variable", "crowd"), fact("Access", "Easy to moderate", "path"), fact("Best For", "Couples wanting comfort with mountain atmosphere", "guests")] },
    philosophy: { eyebrow: "A first note", title: "Cortina feels different because it lets the mountains and comfort sit close together.", copy: "For some couples that balance is exactly right. The day can still feel cinematic, but without needing every chapter to happen deep inside a remote landscape." },
    sections: { seasonOrder: ["special", "time", "access", "crowds", "weather"], seasons: {
      special: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_CORTINA"), imageAlt: "Placeholder image for Cortina and surrounding peaks", title: "Why Cortina feels special", intro: "It carries more elegance and infrastructure than many other Dolomites bases.", copy: "Cortina can support a mountain wedding that still feels polished and easy, especially when couples want to stay close to beautiful accommodation, good food and more flexible movement.", facts: [fact("Mood", "Elegant and atmospheric", "sun"), fact("Best For", "Comfort plus mountain feeling", "guests"), fact("Visual Strength", "Town base with strong nearby landscapes", "path")] },
      time: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_CORTINA"), imageAlt: "Placeholder image for mountain town light", title: "Best time", intro: "Cortina is one of the more flexible regions in terms of tone and timing.", copy: "Different nearby spots behave differently, which gives more range in how the day can be built. Morning and later afternoon often feel especially good depending on the exact landscape chosen.", facts: [fact("Most Flexible", "Morning to late afternoon", "calendar"), fact("Why", "Varied surrounding locations", "path"), fact("Best For", "Couples wanting options", "guests")] },
      access: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_CORTINA"), imageAlt: "Placeholder image for access and accommodation", title: "Access and comfort", intro: "This is often where Cortina becomes very useful.", copy: "With stronger infrastructure and easier access to town comforts, Cortina can simplify accommodation, dinner plans and guest logistics while still keeping the mountains close.", facts: [fact("Difficulty", "Easy to moderate", "path"), fact("Guest Friendly", "Often yes", "guests"), fact("Useful For", "Couples wanting smoother logistics", "calendar")] },
      crowds: { layout: "image-right", image: placeholder("IMAGE_PLACEHOLDER_CORTINA"), imageAlt: "Placeholder image for crowd rhythm around a mountain town", title: "Crowd reality", intro: "Some parts feel public, others much more personal depending on where you go.", copy: "Because Cortina is a broader region rather than one single viewpoint, the experience can be shaped more intentionally. Choosing the right place matters more than treating the whole area as one mood.", facts: [fact("Variable", "Depends on exact location", "crowd"), fact("Best Strategy", "Stay specific, not generic", "path"), fact("Quietest", "Less obvious surrounding locations", "calendar")] },
      weather: { layout: "image-left", image: placeholder("IMAGE_PLACEHOLDER_WEATHER"), imageAlt: "Placeholder image for changing weather near Cortina", title: "Weather notes", intro: "The mix of town base and mountain access can help weather feel less limiting.", copy: "Having more sheltered options, closer comforts and multiple nearby landscapes can make weather planning softer and more resilient than in a fully remote structure.", facts: [fact("Best Benefit", "More flexibility in shifting weather", "cloud"), fact("Useful For", "Couples wanting more backup choices", "calendar"), fact("Mood", "Still cinematic, but less exposed", "wind")] }
    } },
    planning: { eyebrow: "Planning Notes", title: "What usually matters most around Cortina.", intro: "This region works best when you use its flexibility intentionally rather than treating it like one single iconic viewpoint.", items: [{ label: "Place Choice", title: "Stay specific about which landscape you mean.", copy: "The Cortina area can hold very different moods depending on where you go.", meta: "One region, many atmospheres." }, { label: "Guests", title: "A strong option if comfort matters.", copy: "Accommodation and town access can make the whole day easier for a wider group.", meta: "Ease supports calm." }, { label: "Weather", title: "Use the range of nearby options.", copy: "That variety often becomes the biggest planning strength of the area.", meta: "Flexibility without losing beauty." }, { label: "Mood", title: "Let it be elegant if that is what feels true.", copy: "Cortina does not need to be forced into rugged adventure to feel meaningful.", meta: "Quiet elegance belongs here too." }] },
    faq: { title: "Questions couples often ask about Cortina.", intro: sharedFaqIntro, items: [{ q: "Is Cortina good for a wedding with guests?", a: "Often yes, because comfort, accommodation and logistics are easier to manage." }, { q: "Does Cortina still feel cinematic enough for an elopement?", a: "Absolutely. The nearby landscapes can still feel deeply atmospheric and beautiful." }, { q: "Is it less remote than Seceda or Cadini?", a: "Yes, and for many couples that is actually part of the appeal." }, { q: "Can weather planning be easier here?", a: "It often can be, because the region gives you more nearby options." }] }
  }
];

pages.push(...locationPages, ...additionalPages);

for (const page of pages) {
  page.related = {
    eyebrow: "Related Guides",
    hint: "Swipe left or right to explore more guides.",
    items: relatedGuides(page.slug)
  };
  page.final = sharedFinal;
}

const buildHtml = async (page) => {
  const localizedPage = await localizePage(page);
  const pageDataBlock = `    const pageData = ${JSON.stringify(localizedPage, null, 6)};`;
  let html = `${templateBeforeData}${pageDataBlock}${templateAfterData}`;
  html = html.replace(baseTitleTag, `<title>${page.title}</title>`);
  html = html.replace(baseDescriptionTag, `<meta\n    name="description"\n    content="${page.description.replace(/"/g, "&quot;")}"\n  >`);
  html = replaceOnce(html, /<h1 class="hero-title" data-i18n="hero.title">[\s\S]*?<\/h1>/, `<h1 class="hero-title" data-i18n="hero.title">${page.hero.title}</h1>`);
  html = replaceOnce(html, /<p class="hero-copy" data-i18n="hero.copy">[\s\S]*?<\/p>/, `<p class="hero-copy" data-i18n="hero.copy">${page.hero.copy}</p>`);
  html = replaceOnce(html, /<span class="eyebrow" data-i18n="hero.eyebrow">[\s\S]*?<\/span>/, `<span class="eyebrow" data-i18n="hero.eyebrow">${page.hero.eyebrow}</span>`);
  html = replaceOnce(html, /<img id="heroImage" src="[\s\S]*?" alt="[\s\S]*?" loading="eager" fetchpriority="high">/, `<img id="heroImage" src="${page.hero.image}" alt="${page.hero.imageAlt}" loading="eager" fetchpriority="high">`);
  return html;
};

for (const page of pages) {
  const dir = path.join(guidesDir, page.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), await buildHtml(page), "utf8");
}

fs.writeFileSync(translationCachePath, JSON.stringify(translationCache, null, 2), "utf8");

console.log(`Built ${pages.length} guide pages with German and English content.`);
