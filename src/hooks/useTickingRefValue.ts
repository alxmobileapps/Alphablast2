import { useEffect, useReducer } from 'react';

/**
 * Reads a ref's current numeric value and re-renders THIS component only
 * (never its parent or siblings) once a second while `isActive` is true.
 *
 * Why this exists: App.tsx's timer-mode round countdown used to live as
 * App-level state (`timerSecondsRemaining`), decremented via
 * `setTimerSecondsRemaining` inside a `setInterval(..., 1000)`. Every one of
 * those per-second `setState` calls re-rendered the ENTIRE App component
 * tree -- including every prop App passes to every child -- once a second
 * for the whole duration of a timer-mode custom-game round. GameBoard,
 * TopInfoBar and Header are all guarded with custom React.memo comparators
 * that skip re-rendering on an App-level re-render they don't care about
 * (see the comments on those memos), so they don't actually repaint from
 * this -- but the underlying per-second App-level re-render was still real,
 * recomputing App's ~3000-line render body and diffing every non-memoized
 * child (WordHistory, PowerUpBar) in full, once a second, for as long as a
 * timer-mode round was in progress. On a mid/low-end Android WebView that
 * recurring main-thread work is exactly the kind of thing that can show up
 * as a visible stutter/flicker on whatever special-effect CSS animation
 * happens to be mid-frame when it lands.
 *
 * The fix: App now decrements a plain ref (`timerSecondsRemainingRef`)
 * every second instead of calling setState, so App itself no longer
 * re-renders on every tick -- only once when a round actually starts
 * (reset to the full duration) or ends (timer hits 0). The two places that
 * display the live countdown (WordHistory's badge, PowerUpBar's badge) use
 * this hook to independently re-render THEMSELVES once a second by reading
 * the ref directly, completely decoupled from App/GameBoard/TopInfoBar/
 * Header's render cycles.
 */
export function useTickingRefValue(ref: { current: number }, isActive: boolean): number {
  const [, forceRerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(forceRerender, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  return ref.current;
}
