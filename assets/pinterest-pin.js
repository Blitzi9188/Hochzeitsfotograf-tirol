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
        top: 0.7rem;
        left: 0.7rem;
        z-index: 8;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        /* !important: sonst streckt ".cluster-grid a { width:100% }" den Button ueber das ganze Bild */
        width: 1.75rem !important;
        height: 1.75rem !important;
        max-width: 1.75rem;
        max-height: 1.75rem;
        padding: 0;
        border: 0;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.82);
        -webkit-backdrop-filter: blur(6px) saturate(120%);
        backdrop-filter: blur(6px) saturate(120%);
        text-decoration: none;
        line-height: 0;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
        opacity: 0;
        transform: translateY(-2px) scale(0.94);
        transition: opacity 0.28s ease, transform 0.28s ease, background 0.2s ease, box-shadow 0.2s ease;
      }

      .pin-badge svg {
        width: 0.9rem;
        height: 0.9rem;
        display: block;
        fill: #e60023;
        transition: fill 0.2s ease;
      }

      .pin-badge:hover {
        background: #ffffff;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
      }

      .pin-badge:hover svg {
        fill: #bd001d;
      }

      .pin-host:hover .pin-badge,
      .pin-host:focus-within .pin-badge {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      @media (hover: none) {
        .pin-badge {
          opacity: 0.8;
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
    badge.innerHTML = '<svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.378-.293 1.194-.333 1.361-.052.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12C24 5.372 18.627 0 12 0z"/></svg>';
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
