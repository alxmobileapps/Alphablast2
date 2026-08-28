import React from 'react';

interface AlphaBlastLogoProps {
  className?: string;
}

export const AlphaBlastLogo: React.FC<AlphaBlastLogoProps> = ({ className = 'w-full max-w-[310px] sm:max-w-[340px] max-h-[110px] sm:max-h-[120px] h-auto' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="20 35 960 430"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-[0_12px_24px_rgba(2,132,199,0.45)]"
      >
        <defs>
          {/* Ambient Background Glows */}
          <radialGradient id="bgGlowLeft" cx="30%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#0077B6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#03045E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bgGlowRight" cx="70%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF9E00" stopOpacity="0.7" />
            <stop offset="40%" stopColor="#FF5400" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9D0208" stopOpacity="0" />
          </radialGradient>

          {/* Alpha Chrome Gradients */}
          <linearGradient id="alphaFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#E2F1FF" />
            <stop offset="60%" stopColor="#90CAFF" />
            <stop offset="100%" stopColor="#4A90E2" />
          </linearGradient>
          <linearGradient id="alpha3D" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0B1947" />
          </linearGradient>
          <linearGradient id="alphaBevel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
          </linearGradient>

          {/* Blast Fiery Golden Gradients */}
          <linearGradient id="blastFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF9A6" />
            <stop offset="30%" stopColor="#FFDD00" />
            <stop offset="70%" stopColor="#FFAA00" />
            <stop offset="100%" stopColor="#FF7700" />
          </linearGradient>
          <linearGradient id="blast3D" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C82000" />
            <stop offset="100%" stopColor="#660000" />
          </linearGradient>
          <linearGradient id="blastOutline" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE57F" />
            <stop offset="100%" stopColor="#B31A00" />
          </linearGradient>

          {/* Letter Tiles Gradients */}
          {/* Tile A: Blue */}
          <linearGradient id="tileBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          {/* Tile L: Purple */}
          <linearGradient id="tilePurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7E22CE" />
          </linearGradient>
          {/* Tile P: Orange */}
          <linearGradient id="tileOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          {/* Tile H: Pink */}
          <linearGradient id="tilePink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#BE185D" />
          </linearGradient>
          {/* Tile B: Green */}
          <linearGradient id="tileGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          {/* Tile Z: Violet */}
          <linearGradient id="tileViolet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>

          {/* Filters for Glow and Depth */}
          <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowOrange" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Cosmic Background Lighting */}
        <rect x="0" y="0" width="1000" height="500" fill="#030A1D" rx="28" />
        <circle cx="320" cy="250" r="280" fill="url(#bgGlowLeft)" />
        <circle cx="700" cy="250" r="280" fill="url(#bgGlowRight)" />

        {/* LEFT CYAN/BLUE ENERGY BURST RAYS */}
        <g opacity="0.4">
          <path d="M 280 250 L 50 120 L 70 90 Z" fill="#00D4FF" />
          <path d="M 280 250 L 80 200 L 60 170 Z" fill="#38BDF8" />
          <path d="M 280 250 L 50 320 L 70 350 Z" fill="#0284C7" />
          <path d="M 280 250 L 140 420 L 170 440 Z" fill="#00E5FF" />
          <path d="M 280 250 L 220 70 L 250 50 Z" fill="#38BDF8" />
        </g>

        {/* RIGHT FIERY EXPLOSION BURST STAR (Behind 'Blast') */}
        <g filter="url(#glowOrange)">
          {/* Layer 1: Deep Red Explosion Spikes */}
          <polygon
            points="700,60 740,190 890,120 780,230 960,250 790,290 920,390 750,330 720,460 670,340 560,430 630,300 480,270 630,220 540,110 660,180"
            fill="#D00000"
            opacity="0.8"
          />
          {/* Layer 2: Bright Orange Explosion Spikes */}
          <polygon
            points="700,90 735,200 860,145 770,235 920,255 775,285 880,370 740,320 710,430 675,330 585,400 640,295 510,270 640,225 565,135 670,190"
            fill="#FF5400"
          />
          {/* Layer 3: Vibrant Golden-Yellow Core Starburst */}
          <polygon
            points="700,120 730,210 820,170 760,240 870,255 765,280 840,345 735,310 705,395 680,320 610,370 650,290 550,270 650,235 590,165 675,200"
            fill="#FFDD00"
          />
          {/* Center White Core Burst */}
          <ellipse cx="710" cy="260" rx="90" ry="60" fill="#FFFBEA" opacity="0.9" filter="url(#glowOrange)" />
        </g>

        {/* FLOATING 3D LETTER TILES */}
        {/* Tile 1: [A] - Blue (Top Left) */}
        <g transform="translate(110, 70) rotate(-12)">
          {/* Outer Frame Shadow & Glow */}
          <rect x="0" y="8" width="105" height="105" rx="26" fill="#0B1E4A" />
          {/* 3D Base */}
          <rect x="0" y="4" width="105" height="105" rx="26" fill="#0284C7" />
          {/* Glossy Front Face */}
          <rect x="0" y="0" width="105" height="105" rx="26" fill="url(#tileBlue)" stroke="#BAE6FD" strokeWidth="4" />
          {/* Gloss Highlight */}
          <path d="M 12 12 Q 52 8 93 12 Q 88 35 17 35 Z" fill="#FFFFFF" fillOpacity="0.45" />
          {/* Letter 'A' */}
          <text
            x="52"
            y="76"
            fontSize="68"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            fill="#FFFFFF"
            textAnchor="middle"
            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))"
          >
            A
          </text>
        </g>

        {/* Tile 2: [L] - Purple (Top Center) */}
        <g transform="translate(395, 45) rotate(6)">
          <rect x="0" y="8" width="95" height="95" rx="24" fill="#3B0764" />
          <rect x="0" y="4" width="95" height="95" rx="24" fill="#7E22CE" />
          <rect x="0" y="0" width="95" height="95" rx="24" fill="url(#tilePurple)" stroke="#E9D5FF" strokeWidth="4" />
          <path d="M 10 10 Q 48 8 85 10 Q 80 30 15 30 Z" fill="#FFFFFF" fillOpacity="0.4" />
          <text
            x="48"
            y="69"
            fontSize="62"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            fill="#FFFFFF"
            textAnchor="middle"
            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))"
          >
            L
          </text>
        </g>

        {/* Tile 3: [P] - Orange (Top Right) */}
        <g transform="translate(815, 60) rotate(14)">
          <rect x="0" y="8" width="105" height="105" rx="26" fill="#7C2D12" />
          <rect x="0" y="4" width="105" height="105" rx="26" fill="#C2410C" />
          <rect x="0" y="0" width="105" height="105" rx="26" fill="url(#tileOrange)" stroke="#FED7AA" strokeWidth="4" />
          <path d="M 12 12 Q 52 8 93 12 Q 88 35 17 35 Z" fill="#FFFFFF" fillOpacity="0.45" />
          <text
            x="52"
            y="76"
            fontSize="68"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            fill="#FFFFFF"
            textAnchor="middle"
            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))"
          >
            P
          </text>
        </g>

        {/* Tile 4: [H] - Pink (Bottom Left) */}
        <g transform="translate(160, 345) rotate(-8)">
          <rect x="0" y="8" width="95" height="95" rx="24" fill="#500724" />
          <rect x="0" y="4" width="95" height="95" rx="24" fill="#9D174D" />
          <rect x="0" y="0" width="95" height="95" rx="24" fill="url(#tilePink)" stroke="#FBCFE8" strokeWidth="4" />
          <path d="M 10 10 Q 48 8 85 10 Q 80 30 15 30 Z" fill="#FFFFFF" fillOpacity="0.4" />
          <text
            x="48"
            y="69"
            fontSize="62"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            fill="#FFFFFF"
            textAnchor="middle"
            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))"
          >
            H
          </text>
        </g>

        {/* Tile 5: [B] - Green (Bottom Center) */}
        <g transform="translate(420, 360) rotate(8)">
          <rect x="0" y="8" width="105" height="105" rx="26" fill="#052E16" />
          <rect x="0" y="4" width="105" height="105" rx="26" fill="#15803D" />
          <rect x="0" y="0" width="105" height="105" rx="26" fill="url(#tileGreen)" stroke="#BBF7D0" strokeWidth="4" />
          <path d="M 12 12 Q 52 8 93 12 Q 88 35 17 35 Z" fill="#FFFFFF" fillOpacity="0.45" />
          <text
            x="52"
            y="76"
            fontSize="68"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            fill="#FFFFFF"
            textAnchor="middle"
            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))"
          >
            B
          </text>
        </g>

        {/* Tile 6: [Z] - Violet (Bottom Right) */}
        <g transform="translate(755, 345) rotate(12)">
          <rect x="0" y="8" width="100" height="100" rx="25" fill="#2E1065" />
          <rect x="0" y="4" width="100" height="100" rx="25" fill="#6B21A8" />
          <rect x="0" y="0" width="100" height="100" rx="25" fill="url(#tileViolet)" stroke="#DDD6FE" strokeWidth="4" />
          <path d="M 10 10 Q 50 8 90 10 Q 85 32 15 32 Z" fill="#FFFFFF" fillOpacity="0.4" />
          <text
            x="50"
            y="72"
            fontSize="64"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            fill="#FFFFFF"
            textAnchor="middle"
            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))"
          >
            Z
          </text>
        </g>

        {/* FLOATING CRYSTAL DIAMOND SHARDS */}
        {/* Blue Crystals Left */}
        <polygon points="90,240 75,255 90,270 105,255" fill="#00F0FF" opacity="0.9" />
        <polygon points="310,120 300,130 310,140 320,130" fill="#70D6FF" opacity="0.85" />
        <polygon points="325,370 310,390 325,410 340,390" fill="#00D4FF" opacity="0.9" />
        {/* Amber Crystals Right */}
        <polygon points="650,85 640,95 650,105 660,95" fill="#FFDD00" opacity="0.95" />
        <polygon points="805,175 795,185 805,195 815,185" fill="#FFAA00" opacity="0.85" />
        <polygon points="895,385 875,400 895,415 915,400" fill="#FFD000" opacity="0.9" />

        {/* ======================================================== */}
        {/* MAIN TITLE: "AlphaBlast" AS ONE HORIZONTAL SINGLE WORD   */}
        {/* ======================================================== */}
        <g id="main-title-group" transform="skewX(-6)">
          {/* --- LAYER 1: DEEP SHADOW / BASE BACKDROP --- */}
          <text
            x="490"
            y="298"
            fontSize="158"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            letterSpacing="-2"
            textAnchor="middle"
            fill="#030816"
            stroke="#030816"
            strokeWidth="38"
            strokeLinejoin="round"
          >
            AlphaBlast
          </text>

          {/* --- LAYER 2: 3D EXTRUSION & BEVEL OUTLINE --- */}
          {/* Alpha 3D Dark Blue Base */}
          <text
            x="490"
            y="288"
            fontSize="158"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            letterSpacing="-2"
            textAnchor="middle"
            fill="#0B1A48"
            stroke="#0284C7"
            strokeWidth="24"
            strokeLinejoin="round"
          >
            <tspan fill="url(#alpha3D)" stroke="#0284C7">
              Alpha
            </tspan>
            <tspan fill="url(#blast3D)" stroke="#B91C1C">
              Blast
            </tspan>
          </text>

          {/* --- LAYER 3: THICK SOLID RIM --- */}
          <text
            x="490"
            y="278"
            fontSize="158"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            letterSpacing="-2"
            textAnchor="middle"
            strokeLinejoin="round"
          >
            <tspan fill="#0C256B" stroke="#00D4FF" strokeWidth="12">
              Alpha
            </tspan>
            <tspan fill="#991B1B" stroke="#FFDD00" strokeWidth="12">
              Blast
            </tspan>
          </text>

          {/* --- LAYER 4: VIBRANT GLOSSY FRONT FACES --- */}
          <text
            x="490"
            y="274"
            fontSize="158"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            letterSpacing="-2"
            textAnchor="middle"
            strokeLinejoin="round"
          >
            {/* 'Alpha' in Crisp Chrome Metallic White/Ice-Blue */}
            <tspan fill="url(#alphaFront)" stroke="#FFFFFF" strokeWidth="3">
              Alpha
            </tspan>
            {/* 'Blast' in Vibrant 3D Fiery Golden Explosion */}
            <tspan fill="url(#blastFront)" stroke="#FFF9A6" strokeWidth="3">
              Blast
            </tspan>
          </text>

          {/* --- SPECULAR CHROME HIGHLIGHTS --- */}
          {/* Top Edge Specular White Highlight Bar */}
          <path
            d="M 125 210 Q 300 200 480 208 Q 470 220 135 224 Z"
            fill="#FFFFFF"
            fillOpacity="0.45"
          />
          <path
            d="M 515 210 Q 690 198 860 208 Q 850 220 525 224 Z"
            fill="#FFFFFF"
            fillOpacity="0.45"
          />
        </g>

        {/* 4-POINT SPARKLE STARS */}
        <g fill="#FFFFFF">
          {/* Sparkle on 'A' */}
          <polygon points="120,185 124,195 134,199 124,203 120,213 116,203 106,199 116,195" />
          {/* Sparkle on 'Alpha' top */}
          <polygon points="265,160 268,168 276,171 268,174 265,182 262,174 254,171 262,168" />
          {/* Sparkle on 'Blast' 'B' */}
          <polygon points="530,170 535,182 547,187 535,192 530,204 525,192 513,187 525,182" fill="#FFFBEA" />
          {/* Sparkle on 'Blast' 't' */}
          <polygon points="860,205 864,213 872,216 864,219 860,227 856,219 848,216 856,213" fill="#FFDD00" />
        </g>
      </svg>
    </div>
  );
};
