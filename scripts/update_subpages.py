#!/usr/bin/env python3
import os, re, glob

BASE = "/Users/blitzkneisser/Library/CloudStorage/Dropbox/HP NEU/Hochzeitsfotograf NEU/Neuer Versuch"
ROOT_INDEX = os.path.join(BASE, "index.html")

NEW_FOOTER = '  <footer class="py-10 px-6 md:px-12 border-t border-brand-border text-[10px] md:text-xs text-brand-muted tracking-[0.2em] uppercase font-medium bg-brand-bg">\n    <div class="mx-auto max-w-[120rem] flex flex-col gap-6 md:flex-row md:items-center md:justify-between">\n      <div id="footerBrandText">\u00a9 2026 Blitzkneisser \u2013 Innsbruck, Tirol</div>\n      <div class="flex flex-wrap gap-5 md:gap-10">\n        <a href="https://instagram.com/blitzkneisser" target="_blank" rel="noreferrer" class="hover:text-brand-text transition-colors duration-300" id="footerInstagramLink">Instagram</a>\n        <a href="/contact/" class="hover:text-brand-text transition-colors duration-300" id="footerContactLink">Kontakt</a>\n        <a href="/journal/" class="hover:text-brand-text transition-colors duration-300" id="footerJournalLink">Journal</a>\n        <a href="/dsgvo/" class="hover:text-brand-text transition-colors duration-300">DSGVO</a>\n        <a href="/impressum/" class="hover:text-brand-text transition-colors duration-300">Impressum</a>\n        <a href="/agb/" class="hover:text-brand-text transition-colors duration-300">AGB</a>\n      </div>\n    </div>\n    <div id="footerInstagramFeed" class="footer-instagram-feed"></div>\n  </footer>'

NEW_BACK_TO_TOP = "  <div class=\"floating-lang-toggle\" id=\"floatingBackToTop\" aria-label=\"Nach oben scrollen\" role=\"button\" tabindex=\"0\" onclick=\"window.scrollTo({top:0,behavior:'smooth'})\" onkeydown=\"if(event.key==='Enter')window.scrollTo({top:0,behavior:'smooth'})\">\n    <span class=\"back-to-top-icon\" aria-hidden=\"true\">\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n        <path d=\"M8 13V3M8 3L3 8M8 3L13 8\" stroke=\"#1B1A18\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n      </svg>\n    </span>\n    <button type=\"button\" data-lang-button=\"de\" aria-pressed=\"true\" style=\"display:none\">DE</button>\n    <button type=\"button\" data-lang-button=\"en\" aria-pressed=\"false\" style=\"display:none\">EN</button>\n  </div>"

EXTRA_TOGGLE_CSS = "\n      .floating-lang-toggle {\n        width: 2.75rem !important;\n        height: 2.75rem !important;\n        padding: 0 !important;\n        justify-content: center !important;\n      }\n\n      .floating-lang-toggle button[data-lang-button] {\n        display: none !important;\n      }"

NEW_NAV_LANG = "      .nav-menu-panel .nav-lang-toggle {\n        display: flex;\n        flex-direction: row;\n        gap: 0.5rem;\n        justify-content: center;\n        margin-top: 0.5rem;\n      }"

all_files = glob.glob(os.path.join(BASE, "**", "index.html"), recursive=True)
subpage_files = [
    f for f in all_files
    if f != ROOT_INDEX and "github-preview" not in f
]

print(f"Processing {len(subpage_files)} subpage files")

t1=t2=t3=t4=0

for filepath in sorted(subpage_files):
    with open(filepath, "r", encoding="utf-8") as fh:
        content = fh.read()

    changed = False

    # Task 1: Replace footer (py-16 class variant)
    footer_pat = re.compile(r'<footer\s+class="py-16 px-6.*?</footer>', re.DOTALL)
    new_c, n = footer_pat.subn(NEW_FOOTER, content)
    if n:
        t1 += 1; content = new_c; changed = True

    # Task 2: Replace floating-lang-toggle div
    old_toggle = '  <div class="floating-lang-toggle" id="floatingLangToggle" aria-label="Sprache wechseln">\n    <button type="button" data-lang-button="de" aria-pressed="true">DE</button>\n    <button type="button" data-lang-button="en" aria-pressed="false">EN</button>\n  </div>'
    if old_toggle in content:
        content = content.replace(old_toggle, NEW_BACK_TO_TOP)
        t2 += 1; changed = True

    # Task 3: Add extra CSS after floating-lang-toggle block (only if not already added)
    if 'width: 2.75rem !important' not in content:
        pat = re.compile(r'(\.floating-lang-toggle\s*\{[^}]*box-shadow:[^}]*\})', re.DOTALL)
        m = pat.search(content)
        if m:
            content = content[:m.end()] + EXTRA_TOGGLE_CSS + content[m.end():]
            t3 += 1; changed = True

    # Task 4: nav-lang-toggle display:none -> display:flex
    old_nav = "      .nav-menu-panel .nav-lang-toggle {\n        display: none;\n      }"
    if old_nav in content:
        content = content.replace(old_nav, NEW_NAV_LANG)
        t4 += 1; changed = True

    if changed:
        with open(filepath, "w", encoding="utf-8") as fh:
            fh.write(content)
        print(f"  Updated: {filepath.replace(BASE,'')}")

print()
print("=== SUMMARY ===")
print(f"Task 1 (footer):           {t1} files")
print(f"Task 2 (back-to-top btn):  {t2} files")
print(f"Task 3 (toggle CSS):       {t3} files")
print(f"Task 4 (nav-lang display): {t4} files")
