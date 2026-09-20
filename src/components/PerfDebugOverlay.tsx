import React, { useEffect, useState } from 'react';
import { getPerfEntries, subscribePerf } from '../utils/perfDebug';

/**
 * Always-visible, tiny timing log in the top-left corner — see
 * utils/perfDebug.ts for why this exists. Pointer-events are disabled so
 * it never blocks taps on anything underneath it. Temporary diagnostic
 * overlay; remove once the round-transition freeze is found.
 */
export const PerfDebugOverlay: React.FC = () => {
  const [, forceRender] = useState(0);

  useEffect(() => subscribePerf(() => forceRender((n) => n + 1)), []);

  const entries = getPerfEntries();
  if (entries.length === 0) return null;

  // Show newest-first, and cap the box's on-screen height so it stays a
  // small corner readout even though the underlying buffer (perfDebug.ts)
  // keeps up to 30 entries. Because newest is on top, anything clipped by
  // the height cap is always the OLDEST/least-relevant entry, never the
  // freshest mark that a screenshot/video is trying to capture.
  const newestFirst = [...entries].reverse();

  return (
    <div
      style={{
        position: 'fixed',
        top: 4,
        left: 4,
        zIndex: 999999,
        background: 'rgba(0,0,0,0.8)',
        color: '#7CFC7C',
        fontSize: 10,
        lineHeight: '13px',
        fontFamily: 'monospace',
        padding: '5px 7px',
        borderRadius: 6,
        maxWidth: 230,
        maxHeight: 170,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {newestFirst.map((e, i) => (
        <div
          key={i}
          style={{
            color: e.deltaMs > 300 ? '#FF5C5C' : e.deltaMs > 80 ? '#FFD75C' : '#7CFC7C',
            fontWeight: e.deltaMs > 300 ? 700 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {/* ms FIRST, not last: whiteSpace:nowrap + overflow:hidden clips
              from the right, so a long label used to eat the "NNNms" that
              was the whole point of this overlay — every screenshot/video
              so far has had the actual timing numbers cut off. Putting the
              number at the front guarantees it's always visible even when
              the label itself gets truncated. */}
          {e.deltaMs.toFixed(0)}ms — {e.label}
        </div>
      ))}
    </div>
  );
};
