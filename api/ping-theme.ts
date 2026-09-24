import { matchSmartTheme } from '../src/data/themeDictionaries';

// Third and final isolation step. api/ping.ts (no imports) works.
// api/ping-express.ts (express only, no project files) also works. Only
// api/index.ts -- which additionally imports src/data/themeDictionaries.ts
// (2653 lines of theme word-list data) -- still 500s.
//
// This imports ONLY that file, nothing else (not even express), and calls
// one of its plain functions. If alphablast.site/api/ping-theme ALSO
// 500s, the problem is confirmed to be in themeDictionaries.ts itself --
// most likely it failing to bundle/load in this Vercel project's function
// runtime. If it works, the problem is narrower still: something in how
// server-api.ts combines express + that file + the route handlers.
export default function handler(req: any, res: any) {
  const matched = matchSmartTheme('space');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ pingTheme: 'ok', matchedName: matched?.name || null }));
}
