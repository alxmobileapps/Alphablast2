import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface ThinkingRobotProps {
  possibleWords: string[];
  onDismiss: () => void;
}

export const ThinkingRobot: React.FC<ThinkingRobotProps> = ({
  possibleWords,
  onDismiss,
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Cycle through the possible candidate words if multiple exist
  useEffect(() => {
    if (possibleWords.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % possibleWords.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [possibleWords]);

  // Auto-dismiss the temporary suggestion toast after 6.5 seconds
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 6000);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 6500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const activeWord = possibleWords[currentWordIndex] || (possibleWords[0] ?? 'WORD');

  return (
    <div
      id="thinking-suggestion-toast"
      className={`select-none transition-all duration-400 ease-out flex items-center justify-center ${
        isFadingOut
          ? 'opacity-0 scale-95'
          : 'opacity-100 scale-100 animate-scale-in'
      }`}
    >
      {/* Sleek Floating Clue Toast displayed cleanly between board and power-ups */}
      <div className="flex items-center gap-2 px-3.5 py-1 bg-gradient-to-r from-[#0C2158]/95 via-[#1E3A8A]/95 to-[#0C2158]/95 backdrop-blur-md text-white border-2 border-cyan-400/90 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_16px_rgba(34,211,238,0.5)]">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-bounce shrink-0" />
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-300 shrink-0">
          CLUE:
        </span>
        <div
          key={activeWord}
          className="font-mono text-xs sm:text-sm font-black text-white tracking-widest bg-cyan-950/90 px-3 py-0.5 rounded-full border-2 border-cyan-400 shadow-inner animate-clue-word-blink animate-clue-pop flex items-center gap-1"
        >
          <span>{activeWord}</span>
        </div>
        {possibleWords.length > 1 && (
          <span className="text-[9px] font-bold text-cyan-300/80 shrink-0">
            ({currentWordIndex + 1}/{possibleWords.length})
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="ml-0.5 w-4.5 h-4.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer"
          title="Dismiss suggestion"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
