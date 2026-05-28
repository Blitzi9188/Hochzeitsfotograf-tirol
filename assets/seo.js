(() => {
  const SITE_URL = "https://www.hochzeitsfotograf.tirol";

  const ensureMeta = (selector, attrs = {}) => {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      document.head.appendChild(node);
    }
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  const ensureLink = (rel, hreflang = "") => {
    let selector = `link[rel="${rel}"]`;
    if (hreflang) selector += `[hreflang="${hreflang}"]`;
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("link");
      node.setAttribute("rel", rel);
      if (hreflang) node.setAttribute("hreflang", hreflang);
      document.head.appendChild(node);
    }
    return node;
  };

  const normalizePath = (pathname) => {
    let clean = pathname || "/";
    if (clean.endsWith("/index.html")) clean = clean.slice(0, -10) || "/";
    if (!clean.startsWith("/")) clean = `/${clean}`;
    if (!/\.[a-z0-9]+$/i.test(clean) && !clean.endsWith("/")) clean = `${clean}/`;
    return clean;
  };

  const lang = new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "de";
  const normalizedPath = normalizePath(window.location.pathname);
  const deUrl = `${SITE_URL}${normalizedPath}`;
  const enUrl = `${SITE_URL}${normalizedPath}${normalizedPath.includes("?") ? "&" : "?"}lang=en`;
  const canonicalUrl = lang === "en" ? enUrl : deUrl;

  const canonical = ensureLink("canonical");
  canonical.setAttribute("href", canonicalUrl);

  const altDe = ensureLink("alternate", "de");
  altDe.setAttribute("href", deUrl);
  const altEn = ensureLink("alternate", "en");
  altEn.setAttribute("href", enUrl);
  const altDefault = ensureLink("alternate", "x-default");
  altDefault.setAttribute("href", deUrl);

  ensureMeta('meta[name="robots"]', {
    name: "robots",
    content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
  });
  ensureMeta('meta[property="og:url"]', {
    property: "og:url",
    content: canonicalUrl
  });
  ensureMeta('meta[property="og:site_name"]', {
    property: "og:site_name",
    content: "Blitzkneisser Photography"
  });
})();
