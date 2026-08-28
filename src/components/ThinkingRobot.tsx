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
    }, 2000);

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
      className={`select-none transition-all duration-300 ease-out flex items-center justify-center ${
        isFadingOut
          ? 'opacity-0 scale-95'
          : 'opacity-100 scale-100 animate-scale-in'
      }`}
    >
      {/* Floating Yellow Clue Pill with 80% opacity background & glowing accent */}
      <div className="flex items-center gap-1.5 px-3 py-0.5 bg-yellow-500/80 backdrop-blur-xs text-yellow-100 border border-yellow-300/80 rounded-full animate-clue-glow hover:bg-yellow-500/90 transition-all shadow-md">
        <Sparkles className="w-3 h-3 text-yellow-200 animate-clue-sparkle shrink-0" />
        <span
          key={activeWord}
          className="font-mono text-[11px] sm:text-xs font-black tracking-wider uppercase text-yellow-100 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-clue-pop"
        >
          Clue: {activeWord}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="ml-0.5 w-3.5 h-3.5 rounded-full hover:bg-yellow-600/50 text-yellow-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Dismiss clue"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

