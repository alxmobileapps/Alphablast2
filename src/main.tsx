import {StrictMode, Component, type ErrorInfo, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {perfMark} from './utils/perfDebug';

/**
 * Mark the page when it's running inside the Android app (Capacitor
 * WebView) so index.css can turn off effects that only misrender there.
 * See the `html.native-app` rule in index.css for why. Done before the
 * first render so the class is in place before anything paints.
 */
try {
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    document.documentElement.classList.add('native-app');
  }
} catch {
  // never let this block the app from starting
}

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

/**
 * DIAGNOSTIC: log every WebView visibility/lifecycle transition.
 *
 * The crash catcher above found nothing in the video that showed the
 * clearest freeze yet: from ~11s to ~21s almost the entire app UI (board,
 * header, this very perf overlay) went blank white, while the native
 * bottom banner ad kept showing and rotating the whole time. That banner
 * is a SEPARATE native Android view drawn outside this WebView (see
 * BottomBannerAd.tsx) — it staying up the entire time proves the freeze
 * is confined to THIS WebView's own content, not the whole app/Activity
 * restarting.
 *
 * That still leaves two very different explanations that look identical
 * in a video, but are NOT identical in code:
 *  1. The JS/React app is still alive underneath (main thread stalled,
 *     or just not getting a chance to paint) — resolveBoard's own marks
 *     would still be mid-flight, and this exact rolling perfMark buffer
 *     (an in-memory JS array) would survive untouched.
 *  2. The WebView itself got backgrounded, reloaded, or otherwise torn
 *     down and recreated by Android (e.g. under memory pressure) — which
 *     would silently wipe this whole JS context, including this buffer,
 *     with no error to catch, since nothing "threw" — the page just
 *     started over.
 *
 * These events are the direct, standard way to tell those apart:
 * visibilitychange / pagehide / pageshow fire on ordinary tab/Activity
 * backgrounding; freeze / resume are the Page Lifecycle API Chromium
 * (and Android WebView) uses specifically for a backgrounded page being
 * frozen or discarded. If none of these fire during a future freeze,
 * that rules out backgrounding/reload as the cause and points back at a
 * pure main-thread stall.
 */
function logLifecycleEvent(name: string) {
  try {
    perfMark(`LIFECYCLE: ${name} (visibilityState=${document.visibilityState})`);
  } catch {
    // never let the diagnostic itself throw
  }
}

document.addEventListener('visibilitychange', () => logLifecycleEvent('visibilitychange'));
window.addEventListener('pagehide', (e) => logLifecycleEvent(`pagehide (persisted=${e.persisted})`));
window.addEventListener('pageshow', (e) => logLifecycleEvent(`pageshow (persisted=${e.persisted})`));
document.addEventListener('freeze', () => logLifecycleEvent('freeze'));
document.addEventListener('resume', () => logLifecycleEvent('resume'));
window.addEventListener('blur', () => logLifecycleEvent('window blur'));
window.addEventListener('focus', () => logLifecycleEvent('window focus'));

/**
 * DIAGNOSTIC: requestAnimationFrame heartbeat.
 *
 * Complements the lifecycle listeners above. If NONE of those fire during
 * a future freeze, that rules out the page being backgrounded/reloaded —
 * but it still doesn't say whether the render loop itself stalled (the
 * browser stopped being able to paint at all) or whether frames kept
 * ticking normally while some other layer (e.g. resolveBoard's own
 * synchronous work) just didn't produce a visible update. rAF only runs
 * when the browser is actually about to paint a frame, so a gap here is
 * direct evidence of a real rendering-pipeline stall, not just "JS was
 * busy". Only logs when a gap is actually large, so this can't itself
 * flood the small rolling perfMark buffer on a normal 60fps device.
 */
let lastRafTime = performance.now();
function rafHeartbeat(now: number) {
  const gap = now - lastRafTime;
  if (gap > 500) {
    try {
      perfMark(`RAF HEARTBEAT GAP: ${gap.toFixed(0)}ms between animation frames`);
    } catch {
      // never let the diagnostic itself throw
    }
  }
  lastRafTime = now;
  requestAnimationFrame(rafHeartbeat);
}
requestAnimationFrame(rafHeartbeat);

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
