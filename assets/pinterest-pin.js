(() => {
  const STYLE_ID = "pinterest-pin-style";
  const isJournalOverviewPage = () => {
    const path = window.location.pathname || "";
    return path === "/journal/" || path === "/journal/index.html" || /\/journal\/?$/.test(path);
  };

  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .pin-host {
        position: relative;
      }

      .pin-badge {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        z-index: 8;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.1rem 0.2rem;
        border: 0;
        background: transparent;
        text-decoration: none;
        font-size: 0.6rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        line-height: 1;
        color: #e60023;
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.35);
        opacity: 0;
        transform: translateY(-6px);
        transition: opacity 0.25s ease, transform 0.25s ease, color 0.25s ease;
      }

      .pin-badge:hover {
        color: #bd001d;
      }

      .pin-host:hover .pin-badge,
      .pin-host:focus-within .pin-badge {
        opacity: 1;
        transform: translateY(0);
      }

      @media (hover: none) {
        .pin-badge {
          opacity: 0.96;
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const isPinCandidate = (img) => {
    if (!img || !img.getAttribute("src")) return false;
    if (img.closest("nav, .floating-lang-toggle, .mobile-menu-toggle")) return false;
    if (img.closest("[data-no-pin]")) return false;
    if (img.closest("#footerInstagramFeed")) return false;
    if (isJournalOverviewPage()) return false;
    if (img.closest(".archive-item") && !img.closest(".cluster-grid, .portfolio-mosaic-grid")) return false;
    if (img.id === "playerPoster") return false;
    if (img.classList.contains("rounded-full")) return false;

    const src = img.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) return false;

    const width = img.clientWidth || img.naturalWidth || 0;
    const height = img.clientHeight || img.naturalHeight || 0;
    if (width < 120 || height < 120) return false;

    return true;
  };

  const findHost = (img) => {
    return img.closest(".image-hover-container, .visual-container, .review-card, figure, article") || img.parentElement;
  };

  const absoluteUrl = (value) => {
    try {
      return new URL(value, window.location.origin).toString();
    } catch {
      return value;
    }
  };

  const buildPinterestUrl = (img) => {
    const params = new URLSearchParams({
      url: window.location.href,
      media: absoluteUrl(img.currentSrc || img.src),
      description: img.getAttribute("alt") || document.title || "Blitzkneisser Photography"
    });
    return `https://www.pinterest.com/pin/create/button/?${params.toString()}`;
  };

  const attachPinBadge = (img) => {
    if (!img) return;
    if (!img.complete || !img.naturalWidth) {
      img.addEventListener("load", () => attachPinBadge(img), { once: true });
      return;
    }
    if (!isPinCandidate(img)) return;
    const host = findHost(img);
    if (!host || host.querySelector(".pin-badge")) return;

    host.classList.add("pin-host");
    const badge = document.createElement("a");
    badge.className = "pin-badge";
    badge.href = buildPinterestUrl(img);
    badge.target = "_blank";
    badge.rel = "noopener noreferrer";
    badge.setAttribute("aria-label", "Auf Pinterest merken");
    badge.title = "Auf Pinterest merken";
    badge.textContent = "Pin it";
    badge.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    host.appendChild(badge);
  };

  const initPinterestPins = (scope = document) => {
    ensureStyles();
    scope.querySelectorAll("img").forEach(attachPinBadge);
  };

  document.addEventListener("DOMContentLoaded", () => {
    initPinterestPins();
    window.addEventListener("load", () => initPinterestPins(), { once: true });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.tagName === "IMG") {
            attachPinBadge(node);
            return;
          }
          initPinterestPins(node);
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
