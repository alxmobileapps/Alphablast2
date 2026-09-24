import { tinyValue } from './_lib/tiny.ts';

// The full fix (adding .ts extensions everywhere) was merged and deployed,
// but alphablast.site/api/health still 500s. Before assuming the theory
// itself is wrong, isolating it again cleanly: this is the exact same
// api/ping-tiny.ts test from before, with ONE change -- the import now
// has the '.ts' extension, exactly like the applied fix.
//
// If alphablast.site/api/ping-ext works, the extension theory holds and
// something ELSE (on top of it) is still broken in server-api.ts /
// api/index.ts specifically. If it ALSO still fails, the extension theory
// itself was wrong and we need a different explanation entirely.
export default function handler(req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ pingExt: 'ok', tinyValue }));
}
