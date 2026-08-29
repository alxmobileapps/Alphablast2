import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, X } from 'lucide-react';

interface LifelinePromptToastProps {
  onDismiss: () => void;
}

export const LifelinePromptToast: React.FC<LifelinePromptToastProps> = ({ onDismiss }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 3-second total presentation matching the lifelines shine and zoom-in
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2750);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      id="lifeline-suggestion-toast"
      className={`select-none transition-all duration-200 ease-out flex items-center justify-center ${
        isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-scale-in'
      }`}
    >
      <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 border-2 border-white rounded-full shadow-[0_0_22px_rgba(245,158,11,0.85)] animate-pulse hover:brightness-105 transition-all">
        <Sparkles className="w-3.5 h-3.5 text-amber-950 animate-spin-slow shrink-0" />
        <span className="font-sans text-[11px] sm:text-xs font-black tracking-wide uppercase drop-shadow-xs whitespace-nowrap">
          You can use your lifelines!
        </span>
        <Zap className="w-3.5 h-3.5 text-amber-900 animate-bounce shrink-0 fill-amber-900" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="ml-0.5 w-4 h-4 rounded-full hover:bg-amber-600/30 text-amber-950 flex items-center justify-center transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
