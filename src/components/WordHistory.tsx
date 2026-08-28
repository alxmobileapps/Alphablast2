import React, { useState } from 'react';
import { Sparkles, Bomb, CreditCard, Flame, CheckCircle2, Info, X, Loader2, BookOpen, Clock, Timer } from 'lucide-react';
import { WordHistoryItem, Category } from '../types';
import { formatPoints } from '../utils/scoring';
import { fetchWordTrivia, AiWordTriviaResponse } from '../utils/geminiService';
import { haptics } from '../utils/haptics';

interface WordHistoryProps {
  history: WordHistoryItem[];
  category: Category;
  categoryProgress: number;
  timerSecondsRemaining?: number;
}

export const WordHistory: React.FC<WordHistoryProps> = ({
  history,
  category,
  categoryProgress,
  timerSecondsRemaining,
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const isTimerMode = category.gameMode === 'timer';
  const progressPercent = Math.min(100, Math.round((categoryProgress / (category.targetCount || 1)) * 100));

  const formatTimer = (seconds?: number) => {
    if (seconds === undefined) return '2:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // AI Trivia Modal State
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [triviaData, setTriviaData] = useState<AiWordTriviaResponse | null>(null);
  const [isLoadingTrivia, setIsLoadingTrivia] = useState(false);
  const [triviaError, setTriviaError] = useState<string | null>(null);

  // Auto-scroll to latest formed word on update
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [history.length]);

  const handleWordClick = async (word: string) => {
    haptics.tap();
    setSelectedWord(word);
    setIsLoadingTrivia(true);
    setTriviaError(null);
    setTriviaData(null);

    try {
      const data = await fetchWordTrivia(word, category.name);
      setTriviaData(data);
    } catch (err: any) {
      setTriviaError(err.message || 'Could not fetch definition at this time.');
    } finally {
      setIsLoadingTrivia(false);
    }
  };

  return (
    <>
      <div
        id="word-history-panel"
        className="w-full max-w-[min(96vw,660px)] mx-auto bg-[#0B1E52]/90 backdrop-blur-md rounded-xl px-2 sm:px-2.5 py-1 sm:py-1 border border-[#193B8A] shadow-[0_4px_16px_rgba(0,0,0,0.3)] flex items-center gap-1.5 sm:gap-2 text-white select-none"
      >
        {/* Left Badges: Combined Category Goal Status or Timer & Formed Words Count */}
        <div className="flex items-center gap-1.5 shrink-0 bg-[#081844] border border-[#1E3A8A] rounded-lg px-1.5 sm:px-2 py-0.5 shadow-inner">
          {isTimerMode ? (
            /* Timer Rush Mode Countdown Badge */
            <div
              id="category-timer-status-badge"
              className={`flex items-center gap-1 border px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-black shadow-xs ${
                (timerSecondsRemaining || 0) <= 20
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-[#0C2158] border-amber-400/40 text-amber-300'
              }`}
              title={`Timer remaining: ${formatTimer(timerSecondsRemaining)}`}
            >
              <Clock className={`w-3 h-3 ${((timerSecondsRemaining || 0) <= 20) ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="font-mono text-xs font-black">
                {formatTimer(timerSecondsRemaining)}
              </span>
            </div>
          ) : (
            /* Category Target Goal Progress (e.g. 0/10) */
            <div
              id="category-target-status-badge"
              className="flex items-center gap-1 bg-[#0C2158] border border-[#1E3A8A] px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-black shadow-xs"
              title={`Category goal: ${categoryProgress} of ${category.targetCount} target words completed`}
            >
              <span className="text-xs">{category.icon}</span>
              <span className="font-mono text-xs font-black text-emerald-400">
                {categoryProgress}/{category.targetCount}
              </span>
              <div className="w-8 sm:w-10 h-1.5 bg-[#081844] rounded-full overflow-hidden p-0.5 border border-[#193B8A]/80 hidden xs:block">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Formed Words Total Count */}
          <div className="flex items-center gap-1">
            <span className="text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-wider text-blue-200 hidden sm:inline">
              WORDS
            </span>
            <span
              className="text-[9.5px] sm:text-[11px] bg-[#059669] text-white font-mono px-1.5 py-0.2 rounded-full font-black shadow-xs"
              title="Total words formed this round"
            >
              {history.length}
            </span>
          </div>
        </div>

        {/* Horizontal Scrollable Word Chips */}
        <div
          ref={scrollContainerRef}
          id="word-history-list"
          className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.2 custom-scrollbar scroll-smooth min-w-0"
        >
          {history.length === 0 ? (
            <div className="flex items-center gap-1.5 text-blue-300/70 text-[11px] font-bold px-1.5 py-0.2">
              <Sparkles className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
              <span className="truncate">Form words on the board to collect them here</span>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => handleWordClick(item.word)}
                title="Click for AI Meaning & Fun Trivia"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black border bg-[#0C2158] hover:bg-[#122E73] border-[#1E3A8A] hover:border-cyan-400 text-white shadow-xs shrink-0 whitespace-nowrap animate-word-pop transition-all active:scale-95 cursor-pointer"
              >
                <span className="font-mono font-black tracking-wide text-cyan-200 uppercase text-xs">
                  {item.word}
                </span>

                {/* Points badge */}
                {item.points ? (
                  <span className="text-[9px] font-mono font-black text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1 py-0.2 rounded">
                    +{formatPoints(item.points)}
                  </span>
                ) : null}

                {/* Special Badge or Target Checkmark */}
                <div className="flex items-center shrink-0">
                  {item.specialCreated === 'bomb' && (
                    <span
                      className="p-0.5 rounded bg-orange-950/80 text-[#FF6B35] border border-orange-500/50"
                      title="4-Letter Bomb"
                    >
                      <Bomb className="w-3 h-3" />
                    </span>
                  )}
                  {item.specialCreated === 'card' && (
                    <span
                      className="p-0.5 rounded bg-purple-950/80 text-[#C084FC] border border-purple-500/50"
                      title="5-Letter Card"
                    >
                      <CreditCard className="w-3 h-3" />
                    </span>
                  )}
                  {item.specialCreated === 'board_clear' && (
                    <span
                      className="p-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-500/50"
                      title="6+ Board Clear"
                    >
                      <Flame className="w-3 h-3" />
                    </span>
                  )}
                  {!item.specialCreated && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* AI Word Meaning & Trivia Popup */}
      {selectedWord && (
        <div
          id="ai-word-trivia-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setSelectedWord(null)}
        >
          <div
            className="bg-gradient-to-br from-[#071330] via-[#0C2158] to-[#172554] border-2 border-cyan-400/80 rounded-3xl p-5 max-w-sm w-full shadow-[0_20px_50px_rgba(2,132,199,0.5)] text-white relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-mono text-xl font-black text-cyan-200 tracking-wider uppercase">
                    {selectedWord}
                  </h3>
                  <p className="text-[10.5px] text-cyan-300/70 font-semibold">
                    Category: {category.name} {category.icon}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedWord(null)}
                className="p-1.5 rounded-xl bg-[#081844] hover:bg-[#10296B] border border-[#1E3A8A] text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            {isLoadingTrivia ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-cyan-300">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="text-xs font-bold">Consulting Gemini AI Dictionary...</span>
              </div>
            ) : triviaError ? (
              <div className="py-4 text-center text-rose-300 text-xs font-medium">
                {triviaError}
              </div>
            ) : triviaData ? (
              <div className="flex flex-col gap-3">
                {/* Definition */}
                <div className="bg-[#081844]/90 border border-cyan-500/30 rounded-2xl p-3 shadow-inner">
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Definition
                  </div>
                  <p className="text-xs text-blue-100 font-medium leading-relaxed">
                    {triviaData.definition}
                  </p>
                </div>

                {/* Fun Fact */}
                <div className="bg-gradient-to-br from-amber-950/60 to-purple-950/60 border border-amber-400/40 rounded-2xl p-3 shadow-inner">
                  <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Fun Trivia Fact
                  </div>
                  <p className="text-xs text-amber-100 font-medium leading-relaxed">
                    {triviaData.funFact}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[#1E3A8A] flex justify-end">
              <button
                onClick={() => setSelectedWord(null)}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};




