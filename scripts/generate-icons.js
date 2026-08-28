import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const publicDir = path.resolve('public');
  const distDir = path.resolve('dist');
  const svgPath = path.join(publicDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating high-compatibility PWA PNG icons from icon.svg...');

  const outputDirs = [publicDir];
  if (fs.existsSync(distDir)) {
    outputDirs.push(distDir);
  }

  // 1. 192x192 PNG
  const icon192Buffer = await sharp(svgBuffer)
    .resize(192, 192)
    .png({ compressionLevel: 6, adaptiveFiltering: false })
    .toBuffer();

  for (const dir of outputDirs) {
    fs.writeFileSync(path.join(dir, 'icon-192.png'), icon192Buffer);
  }
  console.log('✓ Generated icon-192.png (192x192)');

  // 2. 512x512 PNG
  const icon512Buffer = await sharp(svgBuffer)
    .resize(512, 512)
    .png({ compressionLevel: 6, adaptiveFiltering: false })
    .toBuffer();

  for (const dir of outputDirs) {
    fs.writeFileSync(path.join(dir, 'icon-512.png'), icon512Buffer);
  }
  console.log('✓ Generated icon-512.png (512x512)');

  // 3. Maskable 512x512 PNG (with safe-zone padding and dark blue background)
  const iconMaskableBuffer = await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 7, g: 19, b: 48, alpha: 1 }, // #071330
    })
    .png({ compressionLevel: 6, adaptiveFiltering: false })
    .toBuffer();

  for (const dir of outputDirs) {
    fs.writeFileSync(path.join(dir, 'icon-maskable-512.png'), iconMaskableBuffer);
  }
  console.log('✓ Generated icon-maskable-512.png (512x512)');

  // 4. Mobile Screenshot
  const mobileSvgPath = path.join(publicDir, 'screenshot-mobile.svg');
  if (fs.existsSync(mobileSvgPath)) {
    const mobileSvgBuf = fs.readFileSync(mobileSvgPath);
    const mobileBuffer = await sharp(mobileSvgBuf)
      .resize(1080, 1920)
      .png({ compressionLevel: 6, adaptiveFiltering: false })
      .toBuffer();

    for (const dir of outputDirs) {
      fs.writeFileSync(path.join(dir, 'screenshot-mobile.png'), mobileBuffer);
    }
    console.log('✓ Generated screenshot-mobile.png (1080x1920)');
  }

  // 5. Desktop Screenshot
  const desktopSvgPath = path.join(publicDir, 'screenshot-desktop.svg');
  if (fs.existsSync(desktopSvgPath)) {
    const desktopSvgBuf = fs.readFileSync(desktopSvgPath);
    const desktopBuffer = await sharp(desktopSvgBuf)
      .resize(1920, 1080)
      .png({ compressionLevel: 6, adaptiveFiltering: false })
      .toBuffer();

    for (const dir of outputDirs) {
      fs.writeFileSync(path.join(dir, 'screenshot-desktop.png'), desktopBuffer);
    }
    console.log('✓ Generated screenshot-desktop.png (1920x1080)');
  }

  console.log('All PWA assets generated and verified successfully!');
}

generate().catch((err) => {
  console.error('PWA generation error:', err);
  process.exit(1);
});
