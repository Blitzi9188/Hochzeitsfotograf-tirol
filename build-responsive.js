'use strict';
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const UPLOADS = path.join(process.cwd(), 'assets', 'uploads');
const widths = (process.argv[2] || '400,800,1200').split(',').map(Number);
const listFile = process.argv[3];
const files = fs.readFileSync(listFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
(async () => {
  let made = 0, skipped = 0, miss = 0;
  for (const file of files) {
    const abs = path.join(UPLOADS, file);
    if (!fs.existsSync(abs)) { console.log('FEHLT:', file); miss++; continue; }
    const base = file.replace(/\.[^.]+$/, '');
    const meta = await sharp(abs).metadata();
    for (const w of widths) {
      if (meta.width && w > meta.width) continue;
      for (const t of [{e:'avif',o:{quality:82}},{e:'webp',o:{quality:82}},{e:'jpg',o:{quality:82,mozjpeg:true}}]) {
        const out = path.join(UPLOADS, `${base}-${w}w.${t.e}`);
        if (fs.existsSync(out)) { skipped++; continue; }
        let p = sharp(abs).resize({ width: w, withoutEnlargement: true });
        p = t.e==='avif'?p.avif(t.o):t.e==='webp'?p.webp(t.o):p.jpeg(t.o);
        await p.toFile(out); made++;
      }
    }
    process.stdout.write('.');
  }
  console.log(`\nerzeugt: ${made}, uebersprungen: ${skipped}, fehlend: ${miss}`);
})().catch(e => { console.error(e); process.exit(1); });
