#!/usr/bin/env python3
import os
import re

BASE_DIR = "/Users/blitzkneisser/Library/CloudStorage/Dropbox/HP NEU/Hochzeitsfotograf NEU/Neuer Versuch"
ROOT_INDEX = os.path.join(BASE_DIR, "index.html")
SKIP_PREFIX = os.path.join(BASE_DIR, "github-preview")

NEW_FOOTER = '''  <footer class="py-10 px-6 md:px-12 border-t border-brand-border text-[10px] md:text-xs text-brand-muted tracking-[0.2em] uppercase font-medium bg-brand-bg">
    <div class="mx-auto max-w-[120rem] flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div id="footerBrandText">© 2026 Blitzkneisser – Innsbruck, Tirol</div>
      <div class="flex flex-wrap gap-5 md:gap-10">
        <a href="https://instagram.com/blitzkneisser" target="_blank" rel="noreferrer" class="hover:text-brand-text transition-colors duration-300" id="footerInstagramLink">Instagram</a>
        <a href="/contact/" class="hover:text-brand-text transition-colors duration-300" id="footerContactLink">Kontakt</a>
        <a href="/journal/" class="hover:text-brand-text transition-colors duration-300" id="footerJournalLink">Journal</a>
        <a href="/dsgvo/" class="hover:text-brand-text transition-colors duration-300">DSGVO</a>
        <a href="/impressum/" class="hover:text-brand-text transition-colors duration-300">Impressum</a>
        <a href="/agb/" class="hover:text-brand-text transition-colors duration-300">AGB</a>
      </div>
    </div>
    <div id="footerInstagramFeed" class="footer-instagram-feed"></div>
  </footer>'''

NEW_BACK_TO_TOP = '''  <div class="floating-lang-toggle" id="floatingBackToTop" aria-label="Nach oben scrollen" role="button" tabindex="0" onclick="window.scrollTo({top:0,behavior:'smooth'})" onkeydown="if(event.key==='Enter')window.scrollTo({top:0,behavior:'smooth'})">
    <span class="back-to-top-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 13V3M8 3L3 8M8 3L13 8" stroke="#1B1A18" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    <button type="button" data-lang-button="de" aria-pressed="true" style="display:none">DE</button>
    <button type="button" data-lang-button="en" aria-pressed="false" style="display:none">EN</button>
  </div>'''

CSS_ADDITION = '''
      .floating-lang-toggle {
        width: 2.75rem !important;
        height: 2.75rem !important;
        padding: 0 !important;
        justify-content: center !important;
      }

      .floating-lang-toggle button[data-lang-button] {
        display: none !important;
      }'''

NEW_NAV_LANG = '''      .nav-menu-panel .nav-lang-toggle {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 0.5rem;
      }'''


def apply_replacement_1(content):
    """Replace footer containing footerBrandText."""
    def replacer(m):
        if 'footerBrandText' in m.group(0):
            return NEW_FOOTER
        return m.group(0)
    new_content = re.sub(r'<footer[^>]*>.*?</footer>', replacer, content, flags=re.DOTALL)
    return new_content, new_content != content


def apply_replacement_2(content):
    """Replace floating lang toggle with back-to-top."""
    # Match the old lang toggle with flexible whitespace
    pattern = (
        r'<div\s+class="floating-lang-toggle"\s+id="floatingLangToggle"\s+aria-label="Sprache wechseln">\s*'
        r'<button\s+type="button"\s+data-lang-button="de"\s+aria-pressed="true">DE</button>\s*'
        r'<button\s+type="button"\s+data-lang-button="en"\s+aria-pressed="false">EN</button>\s*'
        r'</div>'
    )
    new_content = re.sub(pattern, NEW_BACK_TO_TOP, content, flags=re.DOTALL)
    return new_content, new_content != content


def apply_replacement_3(content):
    """Add CSS rules for square back-to-top button inside @media (max-width: 767px)."""
    # Check if already present
    if 'width: 2.75rem !important' in content or '.back-to-top-icon' in content:
        return content, False

    # Find the @media (max-width: 767px) block and within it find .floating-lang-toggle { ... }
    # We need to insert the new CSS right after the closing brace of that rule
    # Strategy: find the media block, then find the .floating-lang-toggle rule inside it
    media_pattern = r'(@media\s*\(\s*max-width\s*:\s*767px\s*\)\s*\{)(.*?)(\}[ \t]*(?=\s*(?:@|</style>|\Z)))'

    def media_replacer(m):
        media_open = m.group(1)
        media_body = m.group(2)
        media_close = m.group(3)

        # Find .floating-lang-toggle { ... } inside media body
        toggle_pattern = r'(\.floating-lang-toggle\s*\{[^}]*\})'
        def toggle_replacer(tm):
            rule = tm.group(1)
            return rule + CSS_ADDITION
        new_media_body, count = re.subn(toggle_pattern, toggle_replacer, media_body, count=1)
        if count > 0:
            return media_open + new_media_body + media_close
        return m.group(0)

    new_content, count = re.subn(media_pattern, media_replacer, content, flags=re.DOTALL)
    return new_content, count > 0 and new_content != content


def apply_replacement_4(content):
    """Replace nav-lang-toggle display:none with flex display."""
    old = r'\.nav-menu-panel\s+\.nav-lang-toggle\s*\{\s*display:\s*none;\s*\}'
    if not re.search(old, content):
        return content, False
    new_content = re.sub(old, NEW_NAV_LANG, content)
    return new_content, new_content != content


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original
    applied = []

    content, changed = apply_replacement_1(content)
    if changed:
        applied.append('R1: footer')

    content, changed = apply_replacement_2(content)
    if changed:
        applied.append('R2: lang-toggle→back-to-top')

    content, changed = apply_replacement_3(content)
    if changed:
        applied.append('R3: CSS square button')

    content, changed = apply_replacement_4(content)
    if changed:
        applied.append('R4: nav-lang-toggle flex')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    return applied


def main():
    results = []
    for dirpath, dirnames, filenames in os.walk(BASE_DIR):
        # Skip github-preview
        if dirpath.startswith(SKIP_PREFIX):
            dirnames.clear()
            continue
        # Remove github-preview from subdirs traversal
        dirnames[:] = [d for d in dirnames if os.path.join(dirpath, d) != SKIP_PREFIX]

        for filename in filenames:
            if filename != 'index.html':
                continue
            filepath = os.path.join(dirpath, filename)
            # Skip root index.html
            if filepath == ROOT_INDEX:
                continue
            applied = process_file(filepath)
            rel = os.path.relpath(filepath, BASE_DIR)
            results.append((rel, applied))

    print(f"\nProcessed {len(results)} files:\n")
    changed_count = 0
    for rel, applied in sorted(results):
        if applied:
            changed_count += 1
            print(f"  CHANGED  {rel}")
            for r in applied:
                print(f"           - {r}")
        else:
            print(f"  no-op    {rel}")
    print(f"\nTotal changed: {changed_count}/{len(results)}")


if __name__ == '__main__':
    main()
