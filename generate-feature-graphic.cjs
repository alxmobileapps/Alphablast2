const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="40%" stop-color="#1e1b4b" />
      <stop offset="80%" stop-color="#311042" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>

    <radialGradient id="glowCenter" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.45" />
      <stop offset="60%" stop-color="#ec4899" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="glowLeft" cx="20%" cy="40%" r="40%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="glowRight" cx="80%" cy="60%" r="40%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="35%" stop-color="#a855f7" />
      <stop offset="70%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <linearGradient id="tileGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="tileGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#be185d" />
    </linearGradient>
    <linearGradient id="tileGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="tileGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="tileGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#6d28d9" />
    </linearGradient>

    <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background Layer -->
  <rect width="1024" height="500" fill="url(#bgGrad)" />
  <rect width="1024" height="500" fill="url(#glowCenter)" />
  <rect width="1024" height="500" fill="url(#glowLeft)" />
  <rect width="1024" height="500" fill="url(#glowRight)" />

  <!-- Background Star & Particle Sparkles -->
  <g fill="#fff" opacity="0.5">
    <circle cx="120" cy="80" r="3" />
    <circle cx="280" cy="60" r="2" />
    <circle cx="890" cy="90" r="3.5" />
    <circle cx="940" cy="220" r="2" />
    <circle cx="150" cy="420" r="2.5" />
    <circle cx="820" cy="440" r="3" />
    <circle cx="512" cy="70" r="2" />
    <circle cx="430" cy="430" r="1.5" />
  </g>
  <!-- Diamond Stars -->
  <g fill="#fef08a" opacity="0.8">
    <polygon points="200,120 204,130 214,134 204,138 200,148 196,138 186,134 196,130" />
    <polygon points="860,140 864,150 874,154 864,158 860,168 856,158 846,154 856,150" />
    <polygon points="110,320 113,328 121,331 113,334 110,342 107,334 99,331 107,328" />
    <polygon points="910,360 914,370 924,374 914,378 910,388 906,378 896,374 906,370" />
  </g>

  <!-- Floating Left Letter Tiles -->
  <!-- Tile W -->
  <g transform="translate(90, 160) rotate(-14)" filter="url(#shadow3D)">
    <rect width="76" height="76" rx="16" fill="url(#tileGrad1)" stroke="#93c5fd" stroke-width="2" />
    <text x="38" y="52" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle">W</text>
    <text x="62" y="66" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#bfdbfe" text-anchor="middle">4</text>
  </g>
  <!-- Tile O -->
  <g transform="translate(195, 235) rotate(12)" filter="url(#shadow3D)">
    <rect width="72" height="72" rx="15" fill="url(#tileGrad2)" stroke="#fbcfe8" stroke-width="2" />
    <text x="36" y="49" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle">O</text>
    <text x="58" y="62" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#fce7f3" text-anchor="middle">1</text>
  </g>
  <!-- Tile R -->
  <g transform="translate(75, 285) rotate(-6)" filter="url(#shadow3D)">
    <rect width="68" height="68" rx="14" fill="url(#tileGrad4)" stroke="#fde68a" stroke-width="2" />
    <text x="34" y="47" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="40" fill="#ffffff" text-anchor="middle">R</text>
    <text x="55" y="59" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#fef3c7" text-anchor="middle">1</text>
  </g>

  <!-- Floating Right Letter Tiles -->
  <!-- Tile B -->
  <g transform="translate(840, 160) rotate(16)" filter="url(#shadow3D)">
    <rect width="76" height="76" rx="16" fill="url(#tileGrad5)" stroke="#ddd6fe" stroke-width="2" />
    <text x="38" y="52" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle">B</text>
    <text x="62" y="66" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#ede9fe" text-anchor="middle">3</text>
  </g>
  <!-- Tile L -->
  <g transform="translate(740, 240) rotate(-10)" filter="url(#shadow3D)">
    <rect width="72" height="72" rx="15" fill="url(#tileGrad3)" stroke="#a7f3d0" stroke-width="2" />
    <text x="36" y="50" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle">L</text>
    <text x="58" y="63" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#d1fae5" text-anchor="middle">1</text>
  </g>
  <!-- Tile A -->
  <g transform="translate(860, 290) rotate(8)" filter="url(#shadow3D)">
    <rect width="68" height="68" rx="14" fill="url(#tileGrad2)" stroke="#fbcfe8" stroke-width="2" />
    <text x="34" y="47" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="40" fill="#ffffff" text-anchor="middle">A</text>
    <text x="55" y="59" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#fce7f3" text-anchor="middle">1</text>
  </g>

  <!-- CENTER TITLE BLOCK -->
  <!-- Back shadow -->
  <text x="512" y="215" font-family="Impact, Arial Black, system-ui, sans-serif" font-weight="900" font-size="88" letter-spacing="4" fill="#000" opacity="0.7" text-anchor="middle" filter="url(#shadow3D)">ALPHABLAST</text>
  
  <!-- Crisp Foreground Title -->
  <text x="512" y="215" font-family="Impact, Arial Black, system-ui, sans-serif" font-weight="900" font-size="88" letter-spacing="4" fill="url(#titleGrad)" stroke="#ffffff" stroke-width="2" text-anchor="middle">ALPHABLAST</text>

  <!-- Subtitle Ribbon -->
  <g transform="translate(262, 245)">
    <rect width="500" height="42" rx="21" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1.5" />
    <text x="250" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="19" letter-spacing="3" fill="#f8fafc" text-anchor="middle">CASCADING WORD PUZZLE</text>
  </g>

  <!-- Feature Pill Badges at Bottom -->
  <!-- Badge 1 -->
  <g transform="translate(142, 330)">
    <rect width="160" height="44" rx="22" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5" />
    <text x="80" y="28" font-family="system-ui, sans-serif" font-weight="700" font-size="15" fill="#ffffff" text-anchor="middle">✨ 100+ Themes</text>
  </g>
  <!-- Badge 2 -->
  <g transform="translate(322, 330)">
    <rect width="180" height="44" rx="22" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5" />
    <text x="90" y="28" font-family="system-ui, sans-serif" font-weight="700" font-size="15" fill="#ffffff" text-anchor="middle">🤖 AI-Powered Words</text>
  </g>
  <!-- Badge 3 -->
  <g transform="translate(522, 330)">
    <rect width="180" height="44" rx="22" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5" />
    <text x="90" y="28" font-family="system-ui, sans-serif" font-weight="700" font-size="15" fill="#ffffff" text-anchor="middle">⚡ Cascading Combos</text>
  </g>
  <!-- Badge 4 -->
  <g transform="translate(722, 330)">
    <rect width="160" height="44" rx="22" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5" />
    <text x="80" y="28" font-family="system-ui, sans-serif" font-weight="700" font-size="15" fill="#ffffff" text-anchor="middle">🏆 Multiplayer 1v1</text>
  </g>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: 1024,
  },
});

const pngData = resvg.render();
const pngBuffer = pngData.asPng();

fs.writeFileSync(path.join(process.cwd(), 'public', 'feature-graphic-1024x500.png'), pngBuffer);
fs.writeFileSync(path.join(process.cwd(), 'public', 'feature-graphic.png'), pngBuffer);
if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
  fs.mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
}
fs.writeFileSync(path.join(process.cwd(), 'dist', 'feature-graphic-1024x500.png'), pngBuffer);
fs.writeFileSync(path.join(process.cwd(), 'dist', 'feature-graphic.png'), pngBuffer);

// Save SVG as well for direct vector access
fs.writeFileSync(path.join(process.cwd(), 'public', 'feature-graphic.svg'), svg);

console.log('PNG successfully created! Dimensions: 1024 x 500 px. Buffer size:', pngBuffer.length);
