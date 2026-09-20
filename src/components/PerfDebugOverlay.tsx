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
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {entries.map((e, i) => (
        <div
          key={i}
          style={{
            color: e.deltaMs > 300 ? '#FF5C5C' : e.deltaMs > 80 ? '#FFD75C' : '#7CFC7C',
            fontWeight: e.deltaMs > 300 ? 700 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {e.label}: {e.deltaMs.toFixed(0)}ms
        </div>
      ))}
    </div>
  );
};
