import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp } from '../server-api';

// Renamed from api/[...path].ts (Next.js-style bracket catch-all filename)
// to this: api/index.ts, paired with an explicit vercel.json rewrite that
// sends every /api/* request here ("/api/(.*)" -> "/api" -- see
// vercel.json). Two earlier targeted fixes (adding this function at all,
// then deferring the '@google/genai' import) still left alphablast.site/
// api/health returning 500 FUNCTION_INVOCATION_FAILED, even though that
// route does nothing but return a static JSON object and has zero
// dependency on Gemini. That rules out both previous suspects.
//
// api/[...path].ts's bracket syntax is a routing convention Vercel
// supports, but Vercel's own documented recipe for running an Express app
// as a Function uses exactly this shape instead: a plain api/index.ts
// default-exporting the app, reached via an explicit rewrite rather than
// relying on automatic dynamic-segment routing picking it up. Switching
// to the officially documented shape removes one more variable. See
// api/ping.ts (new, zero dependencies at all) for an isolation test that
// tells us whether the problem is specific to this function or to
// anything running as a Function on this project at all.
const app = createApiApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as any, res as any);
}
