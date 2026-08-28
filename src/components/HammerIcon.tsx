import React from 'react';

interface HammerIconProps {
  className?: string;
  size?: number | string;
  showBurst?: boolean;
}

/**
 * Custom 3D Casual Game Hammer Icon matching the reference image:
 * Ice-blue stone block hammerhead with bevels and cracks,
 * Steel side plates with rivets,
 * Curved silver collar,
 * Orange/wood handle with brown leather wrapping,
 * Studded steel pommel base,
 * Radiant purple/magenta energy burst shockwave background.
 */
export const HammerIcon: React.FC<HammerIconProps> = ({
  className = 'w-6 h-6',
  showBurst = true,
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none overflow-visible ${className}`}>
      {/* Radiant Purple / Magenta Energy Star Shockwave Burst Background */}
      {showBurst && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-[140%] h-[140%] -translate-x-[15%] -translate-y-[15%] pointer-events-none z-0 opacity-90"
        >
          <defs>
            <radialGradient id="purpleBurstGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#d946ef" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Jagged / spiky cartoon shockwave burst */}
          <path
            d="M 50 8 L 62 25 L 85 18 L 78 38 L 98 50 L 78 62 L 85 82 L 62 75 L 50 92 L 38 75 L 15 82 L 22 62 L 2 50 L 22 38 L 15 18 L 38 25 Z"
            fill="url(#purpleBurstGrad)"
            stroke="#f0abfc"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Energy Sparks / Bokeh */}
          <circle cx="28" cy="22" r="3" fill="#fdf4ff" opacity="0.9" />
          <circle cx="75" cy="30" r="3.5" fill="#f5d0fe" opacity="0.8" />
          <circle cx="30" cy="76" r="3" fill="#e879f9" opacity="0.75" />
          <circle cx="72" cy="74" r="2.5" fill="#fae8ff" opacity="0.9" />
        </svg>
      )}

      {/* 3D Ice-Blue Stone Warhammer Vector */}
      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-md">
        <defs>
          {/* Ice Blue Stone Block Gradient */}
          <linearGradient id="iceStoneTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="40%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
          <linearGradient id="iceStoneFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="iceStoneSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          {/* Steel Reinforcement Plate */}
          <linearGradient id="steelPlate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="40%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Rivet Gradient */}
          <radialGradient id="rivetGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="60%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          {/* Wood Handle */}
          <linearGradient id="woodHandle" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="50%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#7C2D12" />
          </linearGradient>

          {/* Leather Straps */}
          <linearGradient id="leatherStrap" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9A3412" />
            <stop offset="70%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        <g transform="rotate(-25 50 50)">
          {/* 1. Wooden Handle Shaft */}
          <rect
            x="44"
            y="42"
            width="12"
            height="42"
            rx="4"
            fill="url(#woodHandle)"
            stroke="#451A03"
            strokeWidth="1.5"
          />

          {/* Leather Strap Wraps across handle */}
          <path
            d="M 44 48 Q 50 52 56 48 L 56 53 Q 50 57 44 53 Z"
            fill="url(#leatherStrap)"
            stroke="#291102"
            strokeWidth="0.8"
          />
          <path
            d="M 44 57 Q 50 61 56 57 L 56 62 Q 50 66 44 62 Z"
            fill="url(#leatherStrap)"
            stroke="#291102"
            strokeWidth="0.8"
          />
          <path
            d="M 44 66 Q 50 70 56 66 L 56 71 Q 50 75 44 71 Z"
            fill="url(#leatherStrap)"
            stroke="#291102"
            strokeWidth="0.8"
          />
          <path
            d="M 44 75 Q 50 79 56 75 L 56 79 Q 50 83 44 79 Z"
            fill="url(#leatherStrap)"
            stroke="#291102"
            strokeWidth="0.8"
          />

          {/* 2. Heavy Steel Studded Pommel Base at Bottom */}
          <path
            d="M 40 82 L 60 82 L 63 94 Q 50 97 37 94 Z"
            fill="url(#steelPlate)"
            stroke="#0F172A"
            strokeWidth="1.5"
          />
          {/* Pommel Studs */}
          <circle cx="43" cy="88" r="2.2" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.6" />
          <circle cx="50" cy="89" r="2.4" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.6" />
          <circle cx="57" cy="88" r="2.2" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.6" />

          {/* 3. Curved Silver Neck Collar Bracket */}
          <ellipse
            cx="50"
            cy="42"
            rx="9"
            ry="4"
            fill="url(#steelPlate)"
            stroke="#0F172A"
            strokeWidth="1.5"
          />
          <ellipse cx="50" cy="41" rx="7" ry="2.2" fill="#E2E8F0" opacity="0.6" />

          {/* 4. Massive Ice-Blue Stone Rectangular Hammerhead */}
          {/* Main 3D Box Head */}
          {/* Bottom/Front Face */}
          <rect
            x="24"
            y="12"
            width="52"
            height="32"
            rx="5"
            fill="url(#iceStoneFront)"
            stroke="#075985"
            strokeWidth="2"
          />

          {/* 3D Top Bevel Plane */}
          <path
            d="M 28 12 L 36 4 L 72 4 L 76 12 Z"
            fill="url(#iceStoneTop)"
            stroke="#38BDF8"
            strokeWidth="1.2"
          />

          {/* Left Bevel Face */}
          <path
            d="M 24 16 L 28 12 L 76 12 L 72 16 Z"
            fill="#BAE6FD"
            opacity="0.85"
          />

          {/* Right Side 3D Depth */}
          <path
            d="M 72 4 L 80 8 L 80 34 L 76 44 L 76 12 Z"
            fill="url(#iceStoneSide)"
            stroke="#082F49"
            strokeWidth="1"
          />

          {/* Realistic Stone Surface Cracks & Scratches */}
          <path
            d="M 38 8 L 44 14 L 40 22 M 56 6 L 52 14 L 58 20 M 64 26 L 68 34"
            stroke="#E0F2FE"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
          <path
            d="M 35 24 L 42 28 L 38 36"
            stroke="#0369A1"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />

          {/* Specular Highlight Gloss on Top Corner */}
          <path
            d="M 32 10 L 48 5 L 44 9 L 30 14 Z"
            fill="#FFFFFF"
            opacity="0.75"
          />

          {/* 5. Steel Side Reinforcement Plates with Rivets */}
          <rect
            x="20"
            y="20"
            width="8"
            height="18"
            rx="2"
            fill="url(#steelPlate)"
            stroke="#0F172A"
            strokeWidth="1.2"
          />
          <circle cx="24" cy="23" r="1.6" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.5" />
          <circle cx="24" cy="29" r="1.6" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.5" />
          <circle cx="24" cy="35" r="1.6" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.5" />

          {/* Right Plate */}
          <rect
            x="72"
            y="20"
            width="8"
            height="18"
            rx="2"
            fill="url(#steelPlate)"
            stroke="#0F172A"
            strokeWidth="1.2"
          />
          <circle cx="76" cy="23" r="1.6" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.5" />
          <circle cx="76" cy="29" r="1.6" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.5" />
          <circle cx="76" cy="35" r="1.6" fill="url(#rivetGrad)" stroke="#0F172A" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
};
