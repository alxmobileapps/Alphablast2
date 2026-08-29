import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Lock } from 'lucide-react';
import { enforcePortraitLock } from '../utils/orientation';

export const PortraitLockOverlay: React.FC = () => {
  const [isLandscapeBlocked, setIsLandscapeBlocked] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window === 'undefined') return;

      const isTouchDevice =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;

      const isLandscape = window.innerWidth > window.innerHeight;
      
      // If it's a mobile/tablet touch device in landscape mode, OR screen height is restricted like a rotated phone
      const isMobileLandscape = isLandscape && (isTouchDevice || window.innerHeight <= 600 || window.innerWidth <= 1024);

      // Also check screen.orientation API if available
      const screenType = window.screen?.orientation?.type || '';
      const isScreenOrientationLandscape = screenType.includes('landscape') && isTouchDevice;

      const blocked = isMobileLandscape || isScreenOrientationLandscape;
      setIsLandscapeBlocked(blocked);

      if (blocked) {
        enforcePortraitLock();
      }
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', checkOrientation);
      }
    };
  }, []);

  if (!isLandscapeBlocked) return null;

  return (
    <div
      id="portrait-lock-screen"
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md px-6 text-center text-white select-none animate-in fade-in duration-300"
      style={{ touchAction: 'none' }}
    >
      {/* Animated Phone Rotation Graphic */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Glow */}
        <div className="absolute -inset-4 rounded-full bg-sky-500/20 blur-xl animate-pulse" />

        <div className="relative w-24 h-24 rounded-3xl bg-slate-900 border-2 border-sky-400/40 shadow-2xl flex items-center justify-center">
          <div className="animate-[spin_4s_ease-in-out_infinite] flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-sky-400" />
          </div>
          <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-lg">
            <Lock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Heading */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold tracking-wider uppercase mb-3">
        <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
        Portrait Mode Only
      </div>

      <h2 className="text-2xl font-black text-white tracking-wide mb-2">
        Please Rotate Your Device
      </h2>

      <p className="text-slate-300 text-sm max-w-xs leading-relaxed mb-6">
        AlphaBlast is designed strictly for <strong className="text-sky-300">Portrait View</strong> for the optimal puzzle experience. Please turn your phone upright to continue playing.
      </p>

      {/* Button to re-attempt screen lock */}
      <button
        id="btn-lock-portrait"
        onClick={() => enforcePortraitLock()}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/30 active:scale-95 transition-all flex items-center gap-2"
      >
        <Smartphone className="w-4 h-4" />
        Lock to Portrait
      </button>
    </div>
  );
};
