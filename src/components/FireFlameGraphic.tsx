import React, { useId } from 'react';

interface FireFlameGraphicProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: 'normal' | 'high';
}

export const FireFlameGraphic: React.FC<FireFlameGraphicProps> = ({
  className = '',
  size = 'md',
  intensity = 'high',
}) => {
  const id = useId().replace(/:/g, '');
  const outerGradId = `outerFlameGrad_${id}`;
  const midGradId = `midFlameGrad_${id}`;
  const coreGradId = `coreFlameGrad_${id}`;

  const sizeMap = {
    sm: 'w-7 h-9 sm:w-8 sm:h-10',
    md: 'w-10 h-14',
    lg: 'w-16 h-20',
    xl: 'w-24 h-32',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${currentSize} ${className}`}>
      {/* Outer ambient heat glow — NO blur filter here anymore, and the SVG
          below no longer carries a drop-shadow filter either. The "Fire
          Wipeout" effect mounts SIX of these at once, each with 4 child
          paths that loop an infinite 0.18-0.28s transform animation
          (animate-flame-lick) for the full 2s the effect is shown. A
          filter (blur or drop-shadow) on an element whose content keeps
          changing shape underneath it can't be cached — the browser has to
          re-rasterize the filter every single frame, and with 6 instances x
          multiple animated filtered layers running continuously for 2
          seconds, that's exactly the kind of sustained paint load that
          matches reports of lag + a white flash + lingering flicker right
          when this "long word" effect fires. The gradient fills already
          make the flame read as glowing without an extra filter layer. */}
      <div className="absolute inset-0 bg-radial from-orange-500/60 via-red-600/25 to-transparent rounded-full animate-pulse pointer-events-none" />

      {/* Realistic multi-tiered stylized vector flame graphic */}
      <svg
        viewBox="0 0 100 130"
        className="w-full h-full overflow-visible pointer-events-none"
      >
        <defs>
          <linearGradient id={outerGradId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7F1D1D" />
            <stop offset="35%" stopColor="#DC2626" />
            <stop offset="70%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>

          <linearGradient id={midGradId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="40%" stopColor="#F97316" />
            <stop offset="80%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>

          <linearGradient id={coreGradId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>

        {/* Outer Crimson / Raging Red Flame Tongue */}
        <path
          d="M 50 120 
             C 25 115, 10 95, 12 70 
             C 14 52, 28 42, 34 25 
             C 38 40, 48 48, 50 35 
             C 54 20, 52 5, 50 0 
             C 58 18, 70 32, 72 50 
             C 74 38, 78 30, 84 22 
             C 86 38, 92 65, 86 85 
             C 80 108, 68 120, 50 120 Z"
          fill={`url(#${outerGradId})`}
          className="animate-flame-lick origin-bottom"
        />

        {/* Secondary Swirling Flame Tongue */}
        <path
          d="M 50 115 
             C 30 110, 20 92, 22 72 
             C 24 55, 34 46, 38 32 
             C 42 45, 52 50, 52 38 
             C 56 22, 54 12, 52 8 
             C 60 22, 68 36, 70 52 
             C 72 42, 76 34, 80 28 
             C 82 42, 85 68, 80 84 
             C 74 104, 65 115, 50 115 Z"
          fill={`url(#${midGradId})`}
          className="animate-flame-lick origin-bottom opacity-95"
          style={{ animationDelay: '0.08s', animationDuration: '0.24s' }}
        />

        {/* Blazing Golden Core Flame */}
        <path
          d="M 50 110 
             C 36 106, 30 90, 32 74 
             C 34 60, 42 52, 46 40 
             C 48 50, 54 54, 54 44 
             C 56 32, 55 24, 52 18 
             C 58 28, 64 40, 66 54 
             C 67 46, 70 40, 72 35 
             C 74 46, 76 66, 72 80 
             C 68 96, 60 110, 50 110 Z"
          fill={`url(#${midGradId})`}
          className="animate-flame-lick origin-bottom"
          style={{ animationDelay: '0.14s', animationDuration: '0.22s' }}
        />

        {/* White-Hot Intense Inner Core */}
        <path
          d="M 50 108 
             C 42 105, 38 94, 40 80 
             C 42 70, 47 62, 50 50 
             C 53 62, 58 70, 60 80 
             C 62 94, 58 105, 50 108 Z"
          fill={`url(#${coreGradId})`}
          className="animate-flame-lick origin-bottom"
          style={{ animationDelay: '0.04s', animationDuration: '0.18s' }}
        />

        {/* Flying Sparks / Floating Embers */}
        <circle cx="48" cy="18" r="2.2" fill="#FEF08A" className="animate-ember-float" />
        <circle cx="58" cy="28" r="1.8" fill="#FBBF24" className="animate-ember-float" style={{ animationDelay: '0.1s' }} />
        <circle cx="38" cy="38" r="1.5" fill="#F97316" className="animate-ember-float" style={{ animationDelay: '0.18s' }} />
      </svg>
    </div>
  );
};
