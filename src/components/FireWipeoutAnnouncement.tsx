import React from 'react';
import { Flame } from 'lucide-react';

export const FireWipeoutAnnouncement: React.FC = () => {
  const words = [
    { text: 'FIRE', color: 'from-yellow-200 via-amber-300 to-orange-500' },
    { text: 'WIPE', color: 'from-amber-200 via-orange-400 to-red-500' },
    { text: 'OUT!!!', color: 'from-yellow-100 via-orange-300 to-red-600' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-none z-50 w-full max-w-md px-4 mx-auto animate-fire-text-pop">
      {/* High-Contrast Container Box with Clear Margins & Fiery Border */}
      <div className="relative w-full bg-[#0a0f1d]/95 rounded-2xl border-2 sm:border-3 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.85),0_0_80px_rgba(239,68,68,0.5),inset_0_0_20px_rgba(249,115,22,0.25)] px-4 py-4 sm:px-6 sm:py-5 flex flex-col items-center justify-center overflow-hidden">
        
        {/* Top LONG WORD ALERT! Badge (Steady, No Blinking) */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 px-3 py-0.5 rounded-full bg-red-600/60 border border-red-400/80 text-yellow-300 font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.7)] z-20">
          <Flame className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-widest font-black">LONG WORD ALERT!</span>
          <Flame className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
        </div>

        {/* Main "FIRE WIPE OUT!!!" Letter Container (Solid & Clear, No Blinking) */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-1 relative z-20 w-full pt-1 pb-1">
          {words.map((w, wIdx) => (
            <div key={wIdx} className="flex items-center gap-0.5 sm:gap-1">
              {w.text.split('').map((char, cIdx) => (
                <div
                  key={cIdx}
                  className="relative flex flex-col items-center justify-center"
                >
                  <span
                    className={`font-futuristic font-black text-2xl sm:text-4xl md:text-5xl tracking-wider text-transparent bg-clip-text bg-gradient-to-t ${w.color} uppercase relative z-20 select-none`}
                    style={{
                      textShadow: '0 0 16px rgba(249,115,22,0.9), 0 0 25px rgba(239,68,68,0.8)',
                    }}
                  >
                    {char}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


