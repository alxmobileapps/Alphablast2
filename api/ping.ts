import type { IncomingMessage, ServerResponse } from 'http';

// Diagnostic-only function: zero imports besides Node's own built-in http
// types (erased at compile time -- nothing to load at runtime), zero
// dependency on express, '@google/genai', or anything in this project.
//
// If alphablast.site/api/ping ALSO returns 500 FUNCTION_INVOCATION_FAILED,
// the problem isn't in this project's code at all -- something about how
// this Vercel project/account is set up is breaking every Function,
// regardless of what's inside it. If /api/ping WORKS while /api/health
// (in api/index.ts) still doesn't, the problem is specific to that
// function -- most likely express or the local themeDictionaries.ts
// import not bundling cleanly.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  (res as any).statusCode = 200;
  (res as any).setHeader('Content-Type', 'application/json');
  (res as any).end(JSON.stringify({ ping: 'ok' }));
}
