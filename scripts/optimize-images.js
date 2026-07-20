#!/usr/bin/env node
// One-time image optimization script — generates WebP + responsive srcset variants
// Run: node scripts/optimize-images.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const UPLOADS = path.join(__dirname, '..', 'assets', 'uploads');

// Hero: generate 800w, 1200w, 2000w WebP + JPEG
const HERO = {
  src: 'Blitzkneisser-Mountain-Elopement-Sunrise-Dolomites-208.jpg',
  widths: [800, 1200, 2000],
};

// Above-fold / LCP-relevant images that need WebP variants for srcset
const PRIORITY_IMAGES = [
  'hubschrauber-hochzeit-drei-zinnen-paar.jpg',
  'standesamt-hochzeit-innsbruck-nordkette-paar.jpg',
  // Lago uses .webp already
];

async function convertHero() {
  const src = path.join(UPLOADS, HERO.src);
  const base = HERO.src.replace(/\.[^.]+$/, '');

  for (const w of HERO.widths) {
    // WebP
    const outWebP = path.join(UPLOADS, `${base}-${w}w.webp`);
    if (!fs.existsSync(outWebP)) {
      await sharp(src).resize(w).webp({ quality: 82 }).toFile(outWebP);
      const sz = (fs.statSync(outWebP).size / 1024).toFixed(0);
      console.log(`✓ ${path.basename(outWebP)} — ${sz} KB`);
    } else {
      console.log(`· ${path.basename(outWebP)} already exists`);
    }
    // JPEG fallback
    const outJpg = path.join(UPLOADS, `${base}-${w}w.jpg`);
    if (!fs.existsSync(outJpg)) {
      await sharp(src).resize(w).jpeg({ quality: 82, progressive: true }).toFile(outJpg);
      const sz = (fs.statSync(outJpg).size / 1024).toFixed(0);
      console.log(`✓ ${path.basename(outJpg)} — ${sz} KB`);
    } else {
      console.log(`· ${path.basename(outJpg)} already exists`);
    }
  }
}

async function convertPriority() {
  for (const img of PRIORITY_IMAGES) {
    const src = path.join(UPLOADS, img);
    if (!fs.existsSync(src)) { console.log(`⚠ not found: ${img}`); continue; }
    const base = img.replace(/\.[^.]+$/, '');
    // Single 800w WebP for mobile performance
    const outWebP = path.join(UPLOADS, `${base}-800w.webp`);
    if (!fs.existsSync(outWebP)) {
      await sharp(src).resize(800).webp({ quality: 80 }).toFile(outWebP);
      const sz = (fs.statSync(outWebP).size / 1024).toFixed(0);
      console.log(`✓ ${path.basename(outWebP)} — ${sz} KB`);
    } else {
      console.log(`· ${path.basename(outWebP)} already exists`);
    }
  }
}

async function getDimensions(file) {
  const p = path.join(UPLOADS, file);
  if (!fs.existsSync(p)) return null;
  const meta = await sharp(p).metadata();
  return { width: meta.width, height: meta.height };
}

(async () => {
  console.log('\n=== Hero image ===');
  await convertHero();
  console.log('\n=== Priority images ===');
  await convertPriority();

  // Print sizes for key images to confirm targets met
  console.log('\n=== Size check ===');
  const check = [
    'Blitzkneisser-Mountain-Elopement-Sunrise-Dolomites-208-800w.webp',
    'Blitzkneisser-Mountain-Elopement-Sunrise-Dolomites-208-1200w.webp',
    'Blitzkneisser-Mountain-Elopement-Sunrise-Dolomites-208-2000w.webp',
    'Blitzkneisser-Mountain-Elopement-Sunrise-Dolomites-208.jpg',
  ];
  for (const f of check) {
    const p = path.join(UPLOADS, f);
    if (fs.existsSync(p)) {
      const sz = (fs.statSync(p).size / 1024).toFixed(0);
      const meta = await sharp(p).metadata();
      console.log(`${f}: ${sz} KB (${meta.width}×${meta.height})`);
    }
  }
  console.log('\nDone.');
})();
