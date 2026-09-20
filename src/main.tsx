import {StrictMode, Component, type ErrorInfo, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {perfMark} from './utils/perfDebug';

/**
 * DIAGNOSTIC: catch every uncaught JS error / unhandled promise rejection
 * and every React render crash, and log it into the same on-screen perfMark
 * overlay already used to chase the round-completion white-screen freeze.
 *
 * The last few videos showed something stranger than a slow render: the
 * ENTIRE screen (including this app's own perf overlay, which is
 * independent React state) went from "modal visible with correct data" to
 * "100% blank white, nothing at all" within a couple of seconds, then
 * stayed that way for ~10s before an ad appeared. A slow paint or a
 * main-thread stall would leave the LAST painted frame on screen, not wipe
 * it — but an uncaught exception during a React render with no error
 * boundary unmounts the WHOLE tree in React 18, which would look exactly
 * like this (and would also make the perf overlay itself vanish, since
 * it's unmounted along with everything else). The user has no way to open
 * DevTools/logcat, so up to now a crash like that would be invisible.
 *
 * This can't rescue a render that already crashed (the ErrorBoundary below
 * does that part), but window.onerror / unhandledrejection catch errors
 * thrown OUTSIDE of React's render (e.g. inside a rAF callback, a
 * setTimeout, a native-bridge plugin callback) that React never sees at
 * all — and log them where a screenshot/video can actually show them.
 */
window.addEventListener('error', (event) => {
  try {
    perfMark(`UNCAUGHT ERROR: ${event.message} (${event.filename}:${event.lineno})`);
  } catch {
    // never let the diagnostic itself throw
  }
});

window.addEventListener('unhandledrejection', (event) => {
  try {
    const reason = event.reason;
    const message =
      reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
    perfMark(`UNHANDLED PROMISE REJECTION: ${message}`);
  } catch {
    // never let the diagnostic itself throw
  }
});

interface CrashBoundaryState {
  error: Error | null;
}

/**
 * Last-resort React error boundary around the whole app. Without this, an
 * uncaught error during ANY component's render unmounts everything (React
 * 18 default behavior) — the user just sees a blank white screen with no
 * indication anything went wrong. This at least keeps the crash's message
 * visible on screen (and logs it to the perf overlay, though the overlay
 * itself is unmounted along with everything else it was a sibling of, so
 * the fallback UI below shows it directly too, as a second guarantee).
 */
class CrashBoundary extends Component<{children: ReactNode}, CrashBoundaryState> {
  state: CrashBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): CrashBoundaryState {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      perfMark(`REACT RENDER CRASH: ${error.name}: ${error.message}`);
    } catch {
      // never let the diagnostic itself throw
    }
    console.error('[CrashBoundary] React render crash:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#071330',
            color: '#FF5C5C',
            fontFamily: 'monospace',
            fontSize: 13,
            padding: 16,
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            zIndex: 9999999,
          }}
        >
          {'REACT RENDER CRASH (diagnostic build)\n\n'}
          {this.state.error.name}: {this.state.error.message}
          {'\n\n'}
          {this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CrashBoundary>
      <App />
    </CrashBoundary>
  </StrictMode>,
);
